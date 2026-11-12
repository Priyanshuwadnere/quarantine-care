export interface WaitlistPatient {
  id: string; // e.g. "WL-01"
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contactNumber?: string;
  addedAt: string; // ISO datetime
  addedDate: string; // YYYY-MM-DD
  queuePosition: number;
  notes?: string;
}

export interface FacilitySettings {
  feverThreshold: number; // default 38.0 °C
  mortalityAlertLimit: number; // default 15.0 %
  facilityCapacity: number; // fixed 74
  alertMinCases: number; // default 20
}

export interface FacilitySimulationState {
  currentFacilityDate: string; // YYYY-MM-DD e.g. "2026-11-12"
  simulatedHour: number; // 0-23
  isSimulationActive: boolean;
}
