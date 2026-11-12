import { Role } from '../types/user';

export type Permission =
  | 'VIEW_NURSE_WORKLIST'
  | 'RECORD_TEMPERATURE'
  | 'CORRECT_TEMPERATURE'
  | 'VIEW_PATIENT_PROFILE'
  | 'VIEW_READY_FOR_REVIEW'
  | 'RECORD_DOCTOR_VISIT'
  | 'RECORD_TREATMENT_NOTE'
  | 'RECORD_DEATH'
  | 'CORRECT_DEATH_RECORD'
  | 'CONFIRM_DISCHARGE'
  | 'DEFER_DISCHARGE'
  | 'VIEW_BED_MAP'
  | 'REGISTER_PATIENT'
  | 'ALLOCATE_BED'
  | 'MANAGE_WAITLIST'
  | 'VIEW_CONFIRMED_DISCHARGES'
  | 'PROCESS_DISCHARGE'
  | 'RELEASE_BED'
  | 'ADMIT_WAITLIST_PATIENT'
  | 'VIEW_QUALITY_DASHBOARD'
  | 'MANAGE_SETTINGS'
  | 'VIEW_AUDIT_LOG';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  nurse: [
    'VIEW_NURSE_WORKLIST',
    'RECORD_TEMPERATURE',
    'CORRECT_TEMPERATURE',
    'VIEW_PATIENT_PROFILE',
  ],
  doctor: [
    'VIEW_READY_FOR_REVIEW',
    'VIEW_PATIENT_PROFILE',
    'RECORD_DOCTOR_VISIT',
    'RECORD_TREATMENT_NOTE',
    'RECORD_DEATH',
    'CONFIRM_DISCHARGE',
    'DEFER_DISCHARGE',
    'CORRECT_TEMPERATURE',
    'RECORD_TEMPERATURE', // Doctors can record as fallback
  ],
  admin: [
    'VIEW_BED_MAP',
    'VIEW_PATIENT_PROFILE',
    'REGISTER_PATIENT',
    'ALLOCATE_BED',
    'MANAGE_WAITLIST',
    'VIEW_CONFIRMED_DISCHARGES',
    'PROCESS_DISCHARGE',
    'RELEASE_BED',
    'ADMIT_WAITLIST_PATIENT',
  ],
  head_doctor: [
    // Inherits all Doctor permissions
    'VIEW_READY_FOR_REVIEW',
    'VIEW_PATIENT_PROFILE',
    'RECORD_DOCTOR_VISIT',
    'RECORD_TREATMENT_NOTE',
    'RECORD_DEATH',
    'CORRECT_DEATH_RECORD', // Head Doctor alone can correct a death record
    'CONFIRM_DISCHARGE',
    'DEFER_DISCHARGE',
    'CORRECT_TEMPERATURE',
    'RECORD_TEMPERATURE',
    // Management & quality
    'VIEW_QUALITY_DASHBOARD',
    'MANAGE_SETTINGS',
    'VIEW_AUDIT_LOG',
    'VIEW_BED_MAP',
  ],
};

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getDefaultRouteForRole(role: Role): string {
  switch (role) {
    case 'nurse':
      return '/nurse';
    case 'doctor':
      return '/doctor';
    case 'admin':
      return '/admin';
    case 'head_doctor':
      return '/head-doctor';
    default:
      return '/login';
  }
}
