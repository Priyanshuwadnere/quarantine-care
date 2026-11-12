import { Role } from './user';

export type DuplicateReasonType = 'Recheck' | 'Doubtful reading' | 'Other';

export interface TemperatureReading {
  id: string;
  patientId: string;
  temperature: number; // in °C with 1 decimal place (34.0 to 43.0)
  recordedAt: string; // ISO datetime
  facilityDate: string; // YYYY-MM-DD
  recordedBy: string; // Nurse / Doctor username or name
  recorderRole: Role;
  isFever: boolean;
  notes?: string;
  isDuplicate?: boolean;
  duplicateReason?: DuplicateReasonType;
  duplicateReasonText?: string;
  isCritical?: boolean; // >= 41.0°C or < 35.0°C
  isCorrected?: boolean;
  originalReadingId?: string;
  correctionReason?: string;
  correctedAt?: string;
  correctedBy?: string;
}

export interface TemperatureEntryInput {
  patientId: string;
  temperature: number;
  notes?: string;
  duplicateReason?: DuplicateReasonType;
  duplicateReasonText?: string;
  confirmedCritical?: boolean;
}
