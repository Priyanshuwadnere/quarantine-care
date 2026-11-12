import React, { useState, useMemo } from 'react';
import { 
  FileOutput, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Bed, 
  ArrowRight, 
  ShieldAlert, 
  Check, 
  Users,
  AlertCircle
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useSimulationStore } from '../store/simulationStore';
import { useAuthStore } from '../store/authStore';
import { Patient } from '../types/patient';
import { getHoursElapsed, formatElapsed, formatTime, formatDate } from '../utils/date';
import { useToast } from '../components/common/Toast';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';

export const DischargeProcessing: React.FC = () => {
  const { 
    patients, 
    beds, 
    waitlist, 
    processDischarge, 
    releaseDeceasedBed, 
    admitNextWaitlistedPatient 
  } = usePatientStore();
  const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore();
  const { currentUser } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const simulatedTimestamp = getSimulatedTimestamp();

  // 1. Confirmed discharges awaiting Admin processing
  const confirmedDischarges = useMemo(() => {
    return patients
      .filter((p) => p.status === 'discharge_confirmed')
      .map((p) => {
        const confirmedAt = p.dischargeConfirmation?.confirmedAt || simulatedTimestamp;
        const hoursElapsed = getHoursElapsed(confirmedAt, simulatedTimestamp);
        const isOverdue = hoursElapsed >= 2.0; // Overdue if not processed within 2 hours!

        return {
          patient: p,
          confirmedAt,
          hoursElapsed,
          isOverdue,
        };
      })
      .sort((a, b) => {
        // Overdue (> 2 hrs) first, then longest elapsed
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return b.hoursElapsed - a.hoursElapsed;
      });
  }, [patients, simulatedTimestamp]);

  // 2. Deceased patients awaiting bed release
  const deceasedAwaitingRelease = useMemo(() => {
    return patients.filter((p) => p.status === 'deceased' && p.bedReleaseStatus === 'pending');
  }, [patients]);

  // Available beds count
  const availableBeds = beds.filter((b) => b.status === 'available');

  // Confirmation modal states
  const [releaseConfirmState, setReleaseConfirmState] = useState<{
    isOpen: boolean;
    patient: Patient | null;
    isDeceased: boolean;
  }>({
    isOpen: false,
    patient: null,
    isDeceased: false,
  });

  const handleProcessDischargeClick = (patient: Patient) => {
    setReleaseConfirmState({
      isOpen: true,
      patient,
      isDeceased: false,
    });
  };

  const handleReleaseDeceasedClick = (patient: Patient) => {
    setReleaseConfirmState({
      isOpen: true,
      patient,
      isDeceased: true,
    });
  };

  const handleConfirmBedRelease = () => {
    if (!currentUser || !releaseConfirmState.patient) return;
    const { patient, isDeceased } = releaseConfirmState;

    if (isDeceased) {
      const res = releaseDeceasedBed(patient.id, currentUser);
      if (res.success) {
        toast.success(
          'Deceased Bed Released',
          `Bed ${res.freedBedId} sanitized and released to Available inventory.`
        );
      } else {
        toast.error('Error', res.message);
      }
    } else {
      const res = processDischarge(patient.id, currentUser);
      if (res.success) {
        toast.success(
          'Discharge Processed & Bed Released',
          `Patient ${patient.name} formally discharged. Bed ${res.freedBedId} is now available.`
        );
      } else {
        toast.error('Error', res.message);
      }
    }

    setReleaseConfirmState({ isOpen: false, patient: null, isDeceased: false });
  };

  const handleAdmitWaitlist = () => {
    if (!currentUser) return;
    const res = admitNextWaitlistedPatient(currentUser);
    if (res.success && res.admittedPatient) {
      toast.success(
        'Waitlisted Patient Admitted',
        `${res.admittedPatient.name} successfully admitted into Bed ${res.admittedPatient.bedNumber}.`
      );
    } else {
      toast.error('Admission Failed', res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <FileOutput className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Administrative Discharge Desk & Waitlist Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Process doctor-confirmed discharges, release facility beds, and admit waitlisted patients FIFO
            </p>
          </div>
        </div>

        {/* Available Bed Quick Status */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
              Available Beds
            </span>
            <span className="text-xl font-extrabold text-emerald-900">{availableBeds.length}</span>
          </div>

          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">
              Waitlist Queue
            </span>
            <span className="text-xl font-extrabold text-amber-900">{waitlist.length}</span>
          </div>
        </div>
      </div>

      {/* Overdue Discharge Processing Alert */}
      {confirmedDischarges.some((d) => d.isOverdue) && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900">
            <p className="font-bold text-sm">
              Critical Admin Warning: Confirmed Discharges Overdue (&gt; 2 Hours)
            </p>
            <p className="mt-1 text-red-700">
              One or more patients confirmed for discharge by physicians have been waiting for administrative processing for over 2 hours. This delays bed turnover for waitlisted patients.
            </p>
          </div>
        </div>
      )}

      {/* Confirmed Discharges Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Doctor-Confirmed Discharges Awaiting Processing</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              {confirmedDischarges.length}
            </span>
          </h2>
          <span className="text-xs text-slate-500">
            Processing immediately frees the bed for new admissions
          </span>
        </div>

        {confirmedDischarges.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {confirmedDischarges.map(({ patient, confirmedAt, hoursElapsed, isOverdue }) => (
              <div
                key={patient.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  isOverdue ? 'border-red-300 ring-1 ring-red-200 bg-red-50/20' : 'border-purple-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-extrabold px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                      {patient.bedNumber}
                    </span>
                    <h3
                      onClick={() => navigate(`/patient/${patient.id}`)}
                      className="text-base font-bold text-slate-900 hover:text-brand-600 cursor-pointer"
                    >
                      {patient.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      ({patient.age}y, {patient.gender} • {patient.id})
                    </span>

                    {/* Overdue Badge */}
                    {isOverdue ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Processing Overdue ({hoursElapsed.toFixed(1)} hrs elapsed)
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatElapsed(confirmedAt, simulatedTimestamp)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">
                    Discharge confirmed by <strong>{patient.dischargeConfirmation?.doctorName}</strong> at{' '}
                    {formatTime(confirmedAt)} ({formatDate(confirmedAt)}).
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleProcessDischargeClick(patient)}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Process Discharge & Release Bed</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No Confirmed Discharges Pending</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctor-confirmed discharges will appear here immediately for bed release.
            </p>
          </div>
        )}
      </div>

      {/* Deceased Bed Sanitization & Release Section */}
      {deceasedAwaitingRelease.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-red-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Deceased Patients Awaiting Bed Decontamination & Release</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                {deceasedAwaitingRelease.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {deceasedAwaitingRelease.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-red-300 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-1 bg-red-600 text-white rounded-lg">
                      {p.bedNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                      Deceased
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Certified by {p.deathRecord?.doctorName} • Cause: {p.deathRecord?.notes || 'Viral complications'}
                  </p>
                </div>

                <button
                  onClick={() => handleReleaseDeceasedClick(p)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Sanitize & Release Bed {p.bedNumber}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FIFO Waitlist Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-base text-slate-900">
                FIFO Triage Waitlist Queue ({waitlist.length} patients waiting)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict First-In-First-Out ordering preserved for all new admissions
            </p>
          </div>

          {availableBeds.length > 0 && waitlist.length > 0 && (
            <button
              onClick={handleAdmitWaitlist}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <UserCheck className="w-4 h-4" />
              <span>Admit Next Waitlisted Patient (FIFO #{waitlist[0].queuePosition})</span>
            </button>
          )}
        </div>

        {waitlist.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Queue #</th>
                  <th className="px-5 py-3">Patient Name</th>
                  <th className="px-5 py-3">Age / Gender</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Triage Reason / Notes</th>
                  <th className="px-5 py-3">Added Time</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitlist.map((w, idx) => (
                  <tr key={w.id} className={idx === 0 ? 'bg-emerald-50/40 font-semibold' : 'hover:bg-slate-50'}>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                          idx === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {w.queuePosition}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {w.name}
                      {idx === 0 && (
                        <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                          Next in Line
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {w.age} yrs • {w.gender}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {w.contactNumber || 'N/A'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {w.notes || 'Symptomatic triage'}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {formatTime(w.addedAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {availableBeds.length > 0 && idx === 0 ? (
                        <button
                          onClick={handleAdmitWaitlist}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs"
                        >
                          Admit to Bed
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Awaiting bed release
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-xs text-slate-400 text-center">
            No patients currently waiting on the triage waitlist.
          </p>
        )}
      </div>

      {/* Bed Release Confirmation Dialog */}
      <ConfirmationModal
        isOpen={releaseConfirmState.isOpen}
        onClose={() => setReleaseConfirmState({ isOpen: false, patient: null, isDeceased: false })}
        onConfirm={handleConfirmBedRelease}
        title={
          releaseConfirmState.isDeceased
            ? `Confirm Sanitization & Bed Release for Bed ${releaseConfirmState.patient?.bedNumber}?`
            : `Process Discharge & Release Bed ${releaseConfirmState.patient?.bedNumber}?`
        }
        message={
          releaseConfirmState.isDeceased
            ? `Patient: ${releaseConfirmState.patient?.name}\nBed: ${releaseConfirmState.patient?.bedNumber}\n\nConfirm that full virus terminal decontamination has been completed. This bed will immediately become Available for waitlisted admissions.`
            : `Patient: ${releaseConfirmState.patient?.name}\nBed: ${releaseConfirmState.patient?.bedNumber}\n\nThis will:\n1. Set patient status to DISCHARGED.\n2. Release Bed ${releaseConfirmState.patient?.bedNumber} immediately.\n3. Add patient to historical closed cases.\n4. Recommend the first waitlisted patient (${waitlist[0]?.name || 'None'}) for admission.`
        }
        confirmLabel={releaseConfirmState.isDeceased ? 'Release Bed' : 'Process & Release Bed'}
        variant={releaseConfirmState.isDeceased ? 'danger' : 'info'}
      />
    </div>
  );
};
