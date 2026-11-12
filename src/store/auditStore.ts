import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuditLogEntry, AuditAction } from '../types/audit';
import { Role } from '../types/user';

interface AuditStore {
  auditLogs: AuditLogEntry[];
  logAction: (entry: {
    action: AuditAction;
    userId: string;
    userName: string;
    userRole: Role;
    patientId?: string;
    bedId?: string;
    facilityDate: string;
    previousValue?: string;
    newValue?: string;
    reason?: string;
    details?: string;
  }) => void;
  clearAuditLogs: () => void;
  resetAuditLogs: () => void;
}

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-001',
    action: 'LOGIN',
    userId: 'u-nurse',
    userName: 'Nurse Sunita Rao',
    userRole: 'nurse',
    timestamp: '2026-11-12T08:00:00Z',
    facilityDate: '2026-11-12',
    details: 'Shift started and logged into QuarantineCare portal.',
  },
  {
    id: 'AUD-002',
    action: 'TEMPERATURE_RECORDING',
    userId: 'u-nurse',
    userName: 'Nurse Sunita Rao',
    userRole: 'nurse',
    patientId: 'PT-1001',
    bedId: 'B-01',
    timestamp: '2026-11-12T08:30:00Z',
    facilityDate: '2026-11-12',
    newValue: '38.8°C',
    details: 'High fever recorded for Ramesh Patel in Bed B-01.',
  },
  {
    id: 'AUD-003',
    action: 'DEATH_RECORD',
    userId: 'u-doctor',
    userName: 'Dr. Arjun Mehta',
    userRole: 'doctor',
    patientId: 'PT-1020',
    bedId: 'B-20',
    timestamp: '2026-11-12T07:15:00Z',
    facilityDate: '2026-11-12',
    reason: 'Acute respiratory distress syndrome secondary to viral load',
    details: 'Death confirmed. Bed B-20 flagged for Admin decontamination and release.',
  },
  {
    id: 'AUD-004',
    action: 'DISCHARGE_CONFIRMATION',
    userId: 'u-doctor',
    userName: 'Dr. Arjun Mehta',
    userRole: 'doctor',
    patientId: 'PT-1015',
    bedId: 'B-15',
    timestamp: '2026-11-12T08:30:00Z',
    facilityDate: '2026-11-12',
    details: 'Discharge confirmed following 3 consecutive fever-free days.',
  },
];

export const useAuditStore = create<AuditStore>()(
  persist(
    (set) => ({
      auditLogs: INITIAL_LOGS,

      logAction: (entry) => {
        const newLog: AuditLogEntry = {
          id: `AUD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
          timestamp: new Date().toISOString(),
          ...entry,
        };

        set((state) => ({
          auditLogs: [newLog, ...state.auditLogs],
        }));
      },

      clearAuditLogs: () => {
        set({ auditLogs: [] });
      },

      resetAuditLogs: () => {
        set({ auditLogs: INITIAL_LOGS });
      },
    }),
    {
      name: 'quarantine-care-audit-v1',
    }
  )
);
