import { TemperatureReading } from './temperature';

export type PatientStatus = 
  | 'admitted'
  | 'discharge_eligible'
  | 'discharge_confirmed'
  | 'discharged'
  | 'deceased';

export interface DoctorVisit {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  facilityDate: string; // YYYY-MM-DD
  visitedAt: string; // ISO datetime
  treatmentGiven: string;
  notes: string;
  followUpInstructions: string;
  isDailyVisit: boolean;
}

export interface DischargeConfirmation {
  doctorId: string;
  doctorName: string;
  confirmedAt: string; // ISO string
}

export interface DischargeDeferral {
  doctorId: string;
  doctorName: string;
  deferredAt: string; // ISO string
  reason: string;
}

export interface DeathRecord {
  doctorId: string;
  doctorName: string;
  recordedAt: string; // ISO string
  facilityDate: string;
  confirmed: boolean;
  notes?: string;
  isCorrected?: boolean;
  correctionReason?: string;
  correctedBy?: string;
  correctedAt?: string;
}

export interface Patient {
  id: string; // e.g. "PT-1001"
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bedNumber: string; // e.g. "B-01" or "" if discharged/waitlisted
  admissionDate: string; // YYYY-MM-DD
  admissionTime: string; // ISO string
  contactNumber?: string;
  status: PatientStatus;
  temperatureHistory: TemperatureReading[];
  doctorVisits: DoctorVisit[];
  feverFreeDaysCount: number; // 0, 1, 2, 3
  feverFreeDates: string[]; // actual qualifying dates
  dischargeEligibilityDate?: string;
  dischargeConfirmation?: DischargeConfirmation;
  dischargeDeferral?: DischargeDeferral;
  actualDischargeTime?: string;
  deathRecord?: DeathRecord;
  bedReleaseStatus?: 'not_needed' | 'pending' | 'released';
}

export interface HistoricalClosedCase {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  admissionDate: string;
  closedDate: string; // discharge or death date
  outcome: 'cured' | 'deceased';
  daysInQuarantine: number;
  finalDoctorName: string;
  notes?: string;
}
