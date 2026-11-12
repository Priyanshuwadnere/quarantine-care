import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Patient, HistoricalClosedCase, DoctorVisit } from '../types/patient';
import { Bed } from '../types/bed';
import { WaitlistPatient } from '../types/workflow';
import { TemperatureReading, TemperatureEntryInput } from '../types/temperature';
import { User } from '../types/user';
import { generateSeedData } from '../data/seedData';
import { validateTemperature, getTodayReadings } from '../utils/temperature';
import { calculateCureProgress } from '../utils/cureCounter';
import { useAuditStore } from './auditStore';
import { useSettingsStore } from './settingsStore';
import { useSimulationStore } from './simulationStore';

interface PatientStore {
  patients: Patient[];
  beds: Bed[];
  waitlist: WaitlistPatient[];
  historicalClosedCases: HistoricalClosedCase[];

  // Actions
  recordTemperature: (
    input: TemperatureEntryInput,
    user: User
  ) => { success: boolean; message?: string; isDuplicatePrompt?: boolean; existingReading?: TemperatureReading };

  correctTemperature: (
    patientId: string,
    readingId: string,
    newTemp: number,
    reason: string,
    user: User
  ) => { success: boolean; message?: string };

  recordDoctorVisit: (
    patientId: string,
    visitData: { treatmentGiven: string; notes: string; followUpInstructions: string },
    user: User
  ) => { success: boolean; message?: string };

  recordDeath: (
    patientId: string,
    reason: string,
    user: User
  ) => { success: boolean; message?: string };

  correctDeathRecord: (
    patientId: string,
    reason: string,
    user: User
  ) => { success: boolean; message?: string };

  confirmDischarge: (
    patientId: string,
    user: User
  ) => { success: boolean; message?: string };

  deferDischarge: (
    patientId: string,
    reason: string,
    user: User
  ) => { success: boolean; message?: string };

  processDischarge: (
    patientId: string,
    user: User
  ) => { success: boolean; message?: string; freedBedId?: string };

  releaseDeceasedBed: (
    patientId: string,
    user: User
  ) => { success: boolean; message?: string; freedBedId?: string };

  registerAndAdmitPatient: (
    input: { name: string; age: number; gender: 'Male' | 'Female' | 'Other'; contactNumber?: string },
    user: User
  ) => { success: boolean; message?: string; assignedBed?: string; waitlistPosition?: number };

  admitNextWaitlistedPatient: (
    user: User
  ) => { success: boolean; message?: string; admittedPatient?: Patient };

  recalculateAllCureProgress: () => void;
  resetDemoData: () => void;
}

const initialSeed = generateSeedData();

export const usePatientStore = create<PatientStore>()(
  persist(
    (set, get) => ({
      patients: initialSeed.patients,
      beds: initialSeed.beds,
      waitlist: initialSeed.waitlist,
      historicalClosedCases: initialSeed.historicalClosedCases,

      recordTemperature: (input, user) => {
        const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore.getState();
        const { feverThreshold } = useSettingsStore.getState().settings;
        const patient = get().patients.find(p => p.id === input.patientId);

        if (!patient) {
          return { success: false, message: 'Patient not found in system.' };
        }

        if (patient.status === 'discharged') {
          return { success: false, message: 'Discharged patients cannot receive new readings.' };
        }

        if (patient.status === 'deceased') {
          return { success: false, message: 'Cannot record temperature for a deceased patient.' };
        }

        // Validate temperature range & decimals
        const validation = validateTemperature(input.temperature);
        if (!validation.isValid) {
          return { success: false, message: validation.errorMessage };
        }

        // Critical value check
        if (validation.isCritical && !input.confirmedCritical) {
          return {
            success: false,
            message: 'Critical value. Confirm this is correct?',
          };
        }

        // Check for duplicate reading today
        const todayReadings = getTodayReadings(patient.temperatureHistory, currentFacilityDate);
        const hasExisting = todayReadings.length > 0;

        if (hasExisting && !input.duplicateReason) {
          const lastReading = todayReadings[todayReadings.length - 1];
          return {
            success: false,
            isDuplicatePrompt: true,
            existingReading: lastReading,
            message: `A reading of ${lastReading.temperature}°C was already recorded today at ${new Date(lastReading.recordedAt).toLocaleTimeString()} by ${lastReading.recordedBy}. Please provide a reason to save another reading.`,
          };
        }

        if (hasExisting && input.duplicateReason === 'Other' && !input.duplicateReasonText?.trim()) {
          return {
            success: false,
            message: 'Please provide a written explanation for selecting "Other" as duplicate reason.',
          };
        }

        const isFever = input.temperature >= feverThreshold;
        const timestamp = getSimulatedTimestamp();

        const newReading: TemperatureReading = {
          id: `TR-${patient.id}-${Date.now()}`,
          patientId: patient.id,
          temperature: Number(input.temperature.toFixed(1)),
          recordedAt: timestamp,
          facilityDate: currentFacilityDate,
          recordedBy: user.name,
          recorderRole: user.role,
          isFever,
          notes: input.notes,
          isDuplicate: hasExisting,
          duplicateReason: input.duplicateReason,
          duplicateReasonText: input.duplicateReasonText,
          isCritical: validation.isCritical,
        };

        const updatedHistory = [...patient.temperatureHistory, newReading];

        // Recalculate cure progress
        const cureStatus = calculateCureProgress(
          patient.admissionDate,
          updatedHistory,
          currentFacilityDate,
          feverThreshold
        );

        let newStatus = patient.status;
        let eligibilityDate = patient.dischargeEligibilityDate;

        if (cureStatus.isEligible && patient.status === 'admitted') {
          newStatus = 'discharge_eligible';
          eligibilityDate = currentFacilityDate;
        } else if (!cureStatus.isEligible && patient.status === 'discharge_eligible') {
          // If a fever reading resets eligibility
          newStatus = 'admitted';
          eligibilityDate = undefined;
        }

        const updatedPatient: Patient = {
          ...patient,
          status: newStatus,
          temperatureHistory: updatedHistory,
          feverFreeDaysCount: cureStatus.consecutiveFeverFreeDays,
          feverFreeDates: cureStatus.qualifyingDates,
          dischargeEligibilityDate: eligibilityDate,
        };

        // Update state
        set(state => ({
          patients: state.patients.map(p => (p.id === patient.id ? updatedPatient : p)),
        }));

        // Log audit
        useAuditStore.getState().logAction({
          action: hasExisting ? 'DUPLICATE_READING' : 'TEMPERATURE_RECORDING',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: patient.id,
          bedId: patient.bedNumber,
          facilityDate: currentFacilityDate,
          newValue: `${newReading.temperature}°C (${isFever ? 'Fever' : 'Normal'})`,
          reason: input.duplicateReason
            ? `${input.duplicateReason}: ${input.duplicateReasonText || ''}`
            : undefined,
          details: `Recorded by ${user.title}. Status: ${cureStatus.displayProgress}.`,
        });

        return { success: true };
      },

      correctTemperature: (patientId, readingId, newTemp, reason, user) => {
        const { currentFacilityDate } = useSimulationStore.getState();
        const { feverThreshold } = useSettingsStore.getState().settings;

        const patient = get().patients.find(p => p.id === patientId);
        if (!patient) return { success: false, message: 'Patient not found.' };

        const reading = patient.temperatureHistory.find(r => r.id === readingId);
        if (!reading) return { success: false, message: 'Reading not found.' };

        // Nurse 30-minute rule check
        if (user.role === 'nurse') {
          const readingTime = new Date(reading.recordedAt).getTime();
          const now = Date.now();
          // Allow correction for demo if within 30 min or same facility day
          if (reading.facilityDate !== currentFacilityDate && now - readingTime > 30 * 60 * 1000) {
            return {
              success: false,
              message: 'Nurses can only correct their own readings within 30 minutes of recording.',
            };
          }
        }

        const validation = validateTemperature(newTemp);
        if (!validation.isValid) return { success: false, message: validation.errorMessage };

        const previousVal = `${reading.temperature}°C`;
        const updatedReading: TemperatureReading = {
          ...reading,
          temperature: Number(newTemp.toFixed(1)),
          isFever: newTemp >= feverThreshold,
          isCorrected: true,
          originalReadingId: reading.id,
          correctionReason: reason,
          correctedAt: new Date().toISOString(),
          correctedBy: user.name,
        };

        const updatedHistory = patient.temperatureHistory.map(r =>
          r.id === readingId ? updatedReading : r
        );

        const cureStatus = calculateCureProgress(
          patient.admissionDate,
          updatedHistory,
          currentFacilityDate,
          feverThreshold
        );

        const updatedPatient: Patient = {
          ...patient,
          temperatureHistory: updatedHistory,
          feverFreeDaysCount: cureStatus.consecutiveFeverFreeDays,
          feverFreeDates: cureStatus.qualifyingDates,
          status: cureStatus.isEligible ? 'discharge_eligible' : patient.status === 'discharge_eligible' ? 'admitted' : patient.status,
        };

        set(state => ({
          patients: state.patients.map(p => (p.id === patientId ? updatedPatient : p)),
        }));

        useAuditStore.getState().logAction({
          action: 'TEMPERATURE_CORRECTION',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: patient.id,
          bedId: patient.bedNumber,
          facilityDate: currentFacilityDate,
          previousValue: previousVal,
          newValue: `${newTemp}°C`,
          reason,
          details: `Corrected temperature entry for ${patient.name}.`,
        });

        return { success: true };
      },

      recordDoctorVisit: (patientId, visitData, user) => {
        const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore.getState();
        const patient = get().patients.find(p => p.id === patientId);

        if (!patient) return { success: false, message: 'Patient not found.' };

        // Check if today's temperature exists
        const todayReadings = getTodayReadings(patient.temperatureHistory, currentFacilityDate);
        if (todayReadings.length === 0) {
          return {
            success: false,
            message: 'Awaiting temperature. Mark Visited is disabled until today\'s temperature is recorded.',
          };
        }

        // Check if doctor visit already exists today
        const hasDailyVisitToday = patient.doctorVisits.some(
          v => v.facilityDate === currentFacilityDate && v.isDailyVisit
        );

        const newVisit: DoctorVisit = {
          id: `DV-${patient.id}-${Date.now()}`,
          patientId: patient.id,
          doctorId: user.id,
          doctorName: user.name,
          facilityDate: currentFacilityDate,
          visitedAt: getSimulatedTimestamp(),
          treatmentGiven: visitData.treatmentGiven,
          notes: visitData.notes,
          followUpInstructions: visitData.followUpInstructions,
          isDailyVisit: !hasDailyVisitToday, // first visit today counts as the daily visit
        };

        const updatedPatient: Patient = {
          ...patient,
          doctorVisits: [...patient.doctorVisits, newVisit],
        };

        set(state => ({
          patients: state.patients.map(p => (p.id === patientId ? updatedPatient : p)),
        }));

        useAuditStore.getState().logAction({
          action: 'DOCTOR_VISIT',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: patient.id,
          bedId: patient.bedNumber,
          facilityDate: currentFacilityDate,
          details: `Doctor visit conducted by ${user.name}. Treatment: ${visitData.treatmentGiven || 'Routine review'}. Notes added.`,
        });

        return { success: true };
      },

      recordDeath: (patientId, reason, user) => {
        const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore.getState();
        const patient = get().patients.find(p => p.id === patientId);

        if (!patient) return { success: false, message: 'Patient not found.' };

        if (user.role !== 'doctor' && user.role !== 'head_doctor') {
          return { success: false, message: 'Only Doctor or Head Doctor can record a death.' };
        }

        const bedNumber = patient.bedNumber;
        const timestamp = getSimulatedTimestamp();

        const updatedPatient: Patient = {
          ...patient,
          status: 'deceased',
          deathRecord: {
            doctorId: user.id,
            doctorName: user.name,
            recordedAt: timestamp,
            facilityDate: currentFacilityDate,
            confirmed: true,
            notes: reason,
          },
          bedReleaseStatus: 'pending',
        };

        // Update Bed status to 'deceased_awaiting_release'
        const updatedBeds = get().beds.map(b =>
          b.id === bedNumber
            ? { ...b, status: 'deceased_awaiting_release' as Bed['status'], updatedAt: timestamp }
            : b
        );

        set(state => ({
          patients: state.patients.map(p => (p.id === patientId ? updatedPatient : p)),
          beds: updatedBeds,
        }));

        useAuditStore.getState().logAction({
          action: 'DEATH_RECORD',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: patient.id,
          bedId: bedNumber,
          facilityDate: currentFacilityDate,
          reason,
          details: `Patient marked deceased by ${user.name}. Bed ${bedNumber} flagged for Admin decontamination and release.`,
        });

        return { success: true };
      },

      correctDeathRecord: (patientId, reason, user) => {
        const { currentFacilityDate } = useSimulationStore.getState();
        const patient = get().patients.find(p => p.id === patientId);

        if (!patient) return { success: false, message: 'Patient not found.' };

        if (user.role !== 'head_doctor') {
          return { success: false, message: 'Only Head Doctor can correct a death record.' };
        }

        const bedNumber = patient.bedNumber;

        const updatedPatient: Patient = {
          ...patient,
          status: 'admitted',
          deathRecord: patient.deathRecord
            ? {
                ...patient.deathRecord,
                isCorrected: true,
                correctionReason: reason,
                correctedBy: user.name,
                correctedAt: new Date().toISOString(),
              }
            : undefined,
          bedReleaseStatus: 'not_needed',
        };

        const updatedBeds = get().beds.map(b =>
          b.id === bedNumber
            ? { ...b, status: 'occupied' as Bed['status'], updatedAt: new Date().toISOString() }
            : b
        );

        set(state => ({
          patients: state.patients.map(p => (p.id === patientId ? updatedPatient : p)),
          beds: updatedBeds,
        }));

        useAuditStore.getState().logAction({
          action: 'DEATH_CORRECTION',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: patient.id,
          bedId: bedNumber,
          facilityDate: currentFacilityDate,
          reason,
          details: `Death record corrected and reversed by Head Doctor ${user.name}. Patient status reverted to Admitted.`,
        });

        return { success: true };
      },

      confirmDischarge: (patientId, user) => {
        const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore.getState();
        const patient = get().patients.find(p => p.id === patientId);

        if (!patient) return { success: false, message: 'Patient not found.' };

        if (user.role !== 'doctor' && user.role !== 'head_doctor') {
          return { success: false, message: 'Only Doctor or Head Doctor can confirm discharge.' };
        }

        if (patient.status !== 'discharge_eligible' && patient.feverFreeDaysCount < 3) {
          return { success: false, message: 'Only patients who have completed 3 fever-free days can be confirmed for discharge.' };
        }

        const timestamp = getSimulatedTimestamp();

        const updatedPatient: Patient = {
          ...patient,
          status: 'discharge_confirmed',
          dischargeConfirmation: {
            doctorId: user.id,
            doctorName: user.name,
            confirmedAt: timestamp,
          },
          bedReleaseStatus: 'pending',
        };

        const updatedBeds = get().beds.map(b =>
          b.id === patient.bedNumber
            ? { ...b, status: 'pending_release' as Bed['status'], updatedAt: timestamp }
            : b
        );

        set(state => ({
          patients: state.patients.map(p => (p.id === patientId ? updatedPatient : p)),
          beds: updatedBeds,
        }));

        useAuditStore.getState().logAction({
          action: 'DISCHARGE_CONFIRMATION',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: patient.id,
          bedId: patient.bedNumber,
          facilityDate: currentFacilityDate,
          details: `Discharge confirmed by ${user.name}. Sent to Admin discharge queue for bed release.`,
        });

        return { success: true };
      },

      deferDischarge: (patientId, reason, user) => {
        const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore.getState();
        const patient = get().patients.find(p => p.id === patientId);

        if (!patient) return { success: false, message: 'Patient not found.' };

        if (!reason?.trim()) {
          return { success: false, message: 'Mandatory deferral reason is required.' };
        }

        const timestamp = getSimulatedTimestamp();

        const updatedPatient: Patient = {
          ...patient,
          dischargeDeferral: {
            doctorId: user.id,
            doctorName: user.name,
            deferredAt: timestamp,
            reason,
          },
        };

        set(state => ({
          patients: state.patients.map(p => (p.id === patientId ? updatedPatient : p)),
        }));

        useAuditStore.getState().logAction({
          action: 'DISCHARGE_DEFERRAL',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: patient.id,
          bedId: patient.bedNumber,
          facilityDate: currentFacilityDate,
          reason,
          details: `Discharge deferred by ${user.name} for clinical observation.`,
        });

        return { success: true };
      },

      processDischarge: (patientId, user) => {
        const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore.getState();
        const patient = get().patients.find(p => p.id === patientId);

        if (!patient) return { success: false, message: 'Patient not found.' };

        if (user.role !== 'admin') {
          return { success: false, message: 'Only Admin can process discharges and release beds.' };
        }

        if (patient.status !== 'discharge_confirmed') {
          return { success: false, message: 'Discharge must be confirmed by Doctor before Admin can process.' };
        }

        const bedNumber = patient.bedNumber;
        const timestamp = getSimulatedTimestamp();

        const updatedPatient: Patient = {
          ...patient,
          status: 'discharged',
          actualDischargeTime: timestamp,
          bedReleaseStatus: 'released',
          bedNumber: '', // Bed is released
        };

        // Free the bed
        const updatedBeds = get().beds.map(b =>
          b.id === bedNumber
            ? { ...b, status: 'available' as Bed['status'], currentPatientId: undefined, patientName: undefined, updatedAt: timestamp }
            : b
        );

        // Add to historical closed cases
        const newClosedCase: HistoricalClosedCase = {
          id: `CC-${Date.now()}`,
          patientId: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          admissionDate: patient.admissionDate,
          closedDate: currentFacilityDate,
          outcome: 'cured',
          daysInQuarantine: 5,
          finalDoctorName: patient.dischargeConfirmation?.doctorName || 'Attending Physician',
          notes: 'Completed 3 full fever-free days. Successfully cured and discharged.',
        };

        set(state => ({
          patients: state.patients.map(p => (p.id === patientId ? updatedPatient : p)),
          beds: updatedBeds,
          historicalClosedCases: [newClosedCase, ...state.historicalClosedCases],
        }));

        useAuditStore.getState().logAction({
          action: 'DISCHARGE_PROCESSING',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: patient.id,
          bedId: bedNumber,
          facilityDate: currentFacilityDate,
          details: `Discharge processed by Admin. Bed ${bedNumber} released immediately. Case added to closed records.`,
        });

        return { success: true, freedBedId: bedNumber };
      },

      releaseDeceasedBed: (patientId, user) => {
        const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore.getState();
        const patient = get().patients.find(p => p.id === patientId);

        if (!patient) return { success: false, message: 'Patient not found.' };

        if (user.role !== 'admin') {
          return { success: false, message: 'Only Admin can release beds.' };
        }

        const bedNumber = patient.bedNumber;
        const timestamp = getSimulatedTimestamp();

        const updatedPatient: Patient = {
          ...patient,
          bedReleaseStatus: 'released',
          bedNumber: '',
        };

        // Free the bed
        const updatedBeds = get().beds.map(b =>
          b.id === bedNumber
            ? { ...b, status: 'available' as Bed['status'], currentPatientId: undefined, patientName: undefined, updatedAt: timestamp }
            : b
        );

        // Add to historical closed cases
        const newClosedCase: HistoricalClosedCase = {
          id: `CC-DEC-${Date.now()}`,
          patientId: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          admissionDate: patient.admissionDate,
          closedDate: currentFacilityDate,
          outcome: 'deceased',
          daysInQuarantine: 4,
          finalDoctorName: patient.deathRecord?.doctorName || 'Attending Physician',
          notes: patient.deathRecord?.notes || 'Clinical mortality recorded.',
        };

        set(state => ({
          patients: state.patients.map(p => (p.id === patientId ? updatedPatient : p)),
          beds: updatedBeds,
          historicalClosedCases: [newClosedCase, ...state.historicalClosedCases],
        }));

        useAuditStore.getState().logAction({
          action: 'BED_RELEASE',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: patient.id,
          bedId: bedNumber,
          facilityDate: currentFacilityDate,
          details: `Bed ${bedNumber} sanitized and released following mortality protocol. Case added to closed mortality records.`,
        });

        return { success: true, freedBedId: bedNumber };
      },

      registerAndAdmitPatient: (input, user) => {
        const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore.getState();
        const availableBed = get().beds.find(b => b.status === 'available');

        const timestamp = getSimulatedTimestamp();

        if (availableBed) {
          // Admit directly
          const newPatientId = `PT-${Math.floor(Math.random() * 8999 + 1000)}`;
          const newPatient: Patient = {
            id: newPatientId,
            name: input.name.trim(),
            age: input.age,
            gender: input.gender,
            bedNumber: availableBed.id,
            admissionDate: currentFacilityDate,
            admissionTime: timestamp,
            contactNumber: input.contactNumber,
            status: 'admitted',
            temperatureHistory: [],
            doctorVisits: [],
            feverFreeDaysCount: 0,
            feverFreeDates: [],
          };

          const updatedBeds = get().beds.map(b =>
            b.id === availableBed.id
              ? { ...b, status: 'occupied' as Bed['status'], currentPatientId: newPatientId, patientName: input.name, updatedAt: timestamp }
              : b
          );

          set(state => ({
            patients: [...state.patients, newPatient],
            beds: updatedBeds,
          }));

          useAuditStore.getState().logAction({
            action: 'PATIENT_REGISTRATION',
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            patientId: newPatient.id,
            bedId: availableBed.id,
            facilityDate: currentFacilityDate,
            details: `Patient registered and admitted into Bed ${availableBed.id}.`,
          });

          return { success: true, assignedBed: availableBed.id };
        } else {
          // Facility is full! Add to FIFO waitlist
          const waitlistLength = get().waitlist.length;
          const newWaitlistPatient: WaitlistPatient = {
            id: `WL-${String(waitlistLength + 1).padStart(2, '0')}`,
            name: input.name.trim(),
            age: input.age,
            gender: input.gender,
            contactNumber: input.contactNumber,
            addedAt: timestamp,
            addedDate: currentFacilityDate,
            queuePosition: waitlistLength + 1,
            notes: 'Facility at 74/74 full capacity. Placed in triage waitlist.',
          };

          set(state => ({
            waitlist: [...state.waitlist, newWaitlistPatient],
          }));

          useAuditStore.getState().logAction({
            action: 'PATIENT_REGISTRATION',
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            patientId: newWaitlistPatient.id,
            facilityDate: currentFacilityDate,
            details: `Facility at capacity (74/74). ${input.name} added to Waitlist at position #${newWaitlistPatient.queuePosition}.`,
          });

          return {
            success: true,
            waitlistPosition: newWaitlistPatient.queuePosition,
            message: `Facility is at 100% capacity (74/74). Patient ${input.name} placed on Waitlist at position #${newWaitlistPatient.queuePosition}.`,
          };
        }
      },

      admitNextWaitlistedPatient: (user) => {
        const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore.getState();
        const availableBed = get().beds.find(b => b.status === 'available');

        if (!availableBed) {
          return { success: false, message: 'No beds are currently available.' };
        }

        const waitlist = get().waitlist;
        if (waitlist.length === 0) {
          return { success: false, message: 'No patients are currently on the waitlist.' };
        }

        // FIFO: take the first waitlisted patient
        const [nextPatient, ...remainingWaitlist] = waitlist;
        const timestamp = getSimulatedTimestamp();
        const newPatientId = `PT-${Math.floor(Math.random() * 8999 + 1000)}`;

        const admittedPatient: Patient = {
          id: newPatientId,
          name: nextPatient.name,
          age: nextPatient.age,
          gender: nextPatient.gender,
          bedNumber: availableBed.id,
          admissionDate: currentFacilityDate,
          admissionTime: timestamp,
          contactNumber: nextPatient.contactNumber,
          status: 'admitted',
          temperatureHistory: [],
          doctorVisits: [],
          feverFreeDaysCount: 0,
          feverFreeDates: [],
        };

        // Re-index remaining waitlist positions
        const updatedWaitlist = remainingWaitlist.map((w, index) => ({
          ...w,
          queuePosition: index + 1,
        }));

        const updatedBeds = get().beds.map(b =>
          b.id === availableBed.id
            ? { ...b, status: 'occupied' as Bed['status'], currentPatientId: newPatientId, patientName: nextPatient.name, updatedAt: timestamp }
            : b
        );

        set(state => ({
          patients: [...state.patients, admittedPatient],
          waitlist: updatedWaitlist,
          beds: updatedBeds,
        }));

        useAuditStore.getState().logAction({
          action: 'WAITLIST_ADMISSION',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          patientId: admittedPatient.id,
          bedId: availableBed.id,
          facilityDate: currentFacilityDate,
          details: `Admitted waitlisted patient ${admittedPatient.name} into Bed ${availableBed.id}. Waitlist updated.`,
        });

        return { success: true, admittedPatient };
      },

      recalculateAllCureProgress: () => {
        const { currentFacilityDate } = useSimulationStore.getState();
        const { feverThreshold } = useSettingsStore.getState().settings;

        set(state => {
          const updatedPatients = state.patients.map(p => {
            if (p.status === 'discharged' || p.status === 'deceased') return p;

            const cureStatus = calculateCureProgress(
              p.admissionDate,
              p.temperatureHistory,
              currentFacilityDate,
              feverThreshold
            );

            let newStatus = p.status;
            let eligibilityDate = p.dischargeEligibilityDate;

            if (cureStatus.isEligible && p.status === 'admitted') {
              newStatus = 'discharge_eligible';
              eligibilityDate = currentFacilityDate;
            } else if (!cureStatus.isEligible && p.status === 'discharge_eligible') {
              newStatus = 'admitted';
              eligibilityDate = undefined;
            }

            return {
              ...p,
              status: newStatus,
              feverFreeDaysCount: cureStatus.consecutiveFeverFreeDays,
              feverFreeDates: cureStatus.qualifyingDates,
              dischargeEligibilityDate: eligibilityDate,
            };
          });

          return { patients: updatedPatients };
        });
      },

      resetDemoData: () => {
        const freshSeed = generateSeedData();
        set({
          patients: freshSeed.patients,
          beds: freshSeed.beds,
          waitlist: freshSeed.waitlist,
          historicalClosedCases: freshSeed.historicalClosedCases,
        });

        useSettingsStore.getState().resetSettings();
        useSimulationStore.getState().resetSimulation();
        useAuditStore.getState().resetAuditLogs();
      },
    }),
    {
      name: 'quarantine-care-patients-v1',
    }
  )
);
