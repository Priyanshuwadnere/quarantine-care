import { Role } from './user';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PATIENT_REGISTRATION'
  | 'BED_ALLOCATION'
  | 'TEMPERATURE_RECORDING'
  | 'DUPLICATE_READING'
  | 'TEMPERATURE_CORRECTION'
  | 'DOCTOR_VISIT'
  | 'TREATMENT_NOTE'
  | 'DISCHARGE_ELIGIBILITY'
  | 'DISCHARGE_CONFIRMATION'
  | 'DISCHARGE_DEFERRAL'
  | 'DISCHARGE_PROCESSING'
  | 'DEATH_RECORD'
  | 'DEATH_CORRECTION'
  | 'BED_RELEASE'
  | 'WAITLIST_ADMISSION'
  | 'SETTINGS_CHANGE';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: Role;
  patientId?: string;
  bedId?: string;
  timestamp: string; // ISO datetime
  facilityDate: string; // YYYY-MM-DD
  previousValue?: string;
  newValue?: string;
  reason?: string;
  details?: string;
}
