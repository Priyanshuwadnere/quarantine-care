export type BedStatus = 'occupied' | 'available' | 'pending_release' | 'deceased_awaiting_release';

export interface Bed {
  id: string; // e.g., 'B-01', 'B-02', ..., 'B-74'
  bedNumber: number; // 1 to 74
  status: BedStatus;
  currentPatientId?: string;
  patientName?: string;
  updatedAt: string;
}
