import { describe, it, expect, beforeEach } from 'vitest';
import { usePatientStore } from '../store/patientStore';
import { useSimulationStore } from '../store/simulationStore';
import { useAuditStore } from '../store/auditStore';
import { DEMO_USERS } from '../data/seedData';

describe('End-to-End Clinical & Operational Workflow Integration', () => {
  const nurse = DEMO_USERS[0];
  const doctor = DEMO_USERS[1];
  const admin = DEMO_USERS[2];

  beforeEach(() => {
    usePatientStore.getState().resetDemoData();
    useSimulationStore.getState().resetSimulation();
    useAuditStore.getState().resetAuditLogs();
  });

  it('runs complete lifecycle: temperature entry -> visit -> eligibility -> confirmation -> discharge -> bed release -> waitlist admission', () => {
    // 1. Nurse temperature entry for pending patient PT-1005 (Bed B-05)
    const patientStore = usePatientStore.getState();
    const tempResult = patientStore.recordTemperature(
      {
        patientId: 'PT-1005',
        temperature: 36.7,
      },
      nurse
    );
    expect(tempResult.success).toBe(true);

    // 2. Doctor visit completion for PT-1005
    const visitResult = patientStore.recordDoctorVisit(
      'PT-1005',
      {
        treatmentGiven: 'Antipyretic tapered, hydration maintained',
        notes: 'Patient stable, afebrile, vitals normal.',
        followUpInstructions: 'Continue vitals monitoring every 6 hours.',
      },
      doctor
    );
    expect(visitResult.success).toBe(true);

    // 3. Automatic eligibility test:
    // Patient PT-1008 (Sunita Joshi, Bed B-08) was seeded with 3 past fever-free days
    const eligiblePatient = patientStore.patients.find(p => p.id === 'PT-1008');
    expect(eligiblePatient?.status).toBe('discharge_eligible');
    expect(eligiblePatient?.feverFreeDaysCount).toBe(3);

    // 4. Doctor confirms discharge for eligible patient PT-1008
    const confirmResult = patientStore.confirmDischarge('PT-1008', doctor);
    expect(confirmResult.success).toBe(true);

    const confirmedPatient = usePatientStore.getState().patients.find(p => p.id === 'PT-1008');
    expect(confirmedPatient?.status).toBe('discharge_confirmed');
    expect(confirmedPatient?.dischargeConfirmation?.doctorName).toBe(doctor.name);

    // 5. Admin processes confirmed discharge
    const initialClosedCount = usePatientStore.getState().historicalClosedCases.length;
    const initialWaitlistCount = usePatientStore.getState().waitlist.length; // 3
    const firstWaitlisted = usePatientStore.getState().waitlist[0];

    const processResult = usePatientStore.getState().processDischarge('PT-1008', admin);
    expect(processResult.success).toBe(true);
    expect(processResult.freedBedId).toBe('B-08');

    // Bed B-08 is now available
    const freedBed = usePatientStore.getState().beds.find(b => b.id === 'B-08');
    expect(freedBed?.status).toBe('available');
    expect(freedBed?.currentPatientId).toBeUndefined();

    // Closed cases incremented by 1 (cured)
    expect(usePatientStore.getState().historicalClosedCases.length).toBe(initialClosedCount + 1);

    // 6. Admin admits the next waitlisted patient into the freed bed
    const admitResult = usePatientStore.getState().admitNextWaitlistedPatient(admin);
    expect(admitResult.success).toBe(true);
    expect(admitResult.admittedPatient?.name).toBe(firstWaitlisted.name);
    expect(admitResult.admittedPatient?.bedNumber).toBe('B-08');

    // Waitlist decremented
    expect(usePatientStore.getState().waitlist.length).toBe(initialWaitlistCount - 1);
    // Bed B-08 is now occupied again
    const reoccupiedBed = usePatientStore.getState().beds.find(b => b.id === 'B-08');
    expect(reoccupiedBed?.status).toBe('occupied');

    // 7. Death recording workflow
    const deathPatient = usePatientStore.getState().patients.find(p => p.id === 'PT-1001'); // B-01
    const deathResult = usePatientStore.getState().recordDeath(
      'PT-1001',
      'Sudden cardiovascular collapse secondary to septic shock',
      doctor
    );
    expect(deathResult.success).toBe(true);

    const updatedDeathPatient = usePatientStore.getState().patients.find(p => p.id === 'PT-1001');
    expect(updatedDeathPatient?.status).toBe('deceased');
    expect(updatedDeathPatient?.deathRecord?.confirmed).toBe(true);

    const bedB01 = usePatientStore.getState().beds.find(b => b.id === 'B-01');
    expect(bedB01?.status).toBe('deceased_awaiting_release');

    // 8. Audit logs were recorded for all critical actions
    const auditLogs = useAuditStore.getState().auditLogs;
    expect(auditLogs.some(l => l.action === 'TEMPERATURE_RECORDING')).toBe(true);
    expect(auditLogs.some(l => l.action === 'DOCTOR_VISIT')).toBe(true);
    expect(auditLogs.some(l => l.action === 'DISCHARGE_CONFIRMATION')).toBe(true);
    expect(auditLogs.some(l => l.action === 'DISCHARGE_PROCESSING')).toBe(true);
    expect(auditLogs.some(l => l.action === 'WAITLIST_ADMISSION')).toBe(true);
    expect(auditLogs.some(l => l.action === 'DEATH_RECORD')).toBe(true);
  });
});
