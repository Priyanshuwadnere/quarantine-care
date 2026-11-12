import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FacilitySettings } from '../types/workflow';
import { DEFAULT_SETTINGS } from '../data/seedData';
import { useAuditStore } from './auditStore';
import { User } from '../types/user';

interface SettingsStore {
  settings: FacilitySettings;
  updateSettings: (
    newSettings: Partial<FacilitySettings>,
    user: User,
    reason: string,
    facilityDate: string
  ) => { success: boolean; message?: string };
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (newSettings, user, reason, facilityDate) => {
        const current = get().settings;

        // Validation
        if (newSettings.feverThreshold !== undefined) {
          if (newSettings.feverThreshold < 37.0 || newSettings.feverThreshold > 40.0) {
            return {
              success: false,
              message: 'Fever threshold must be between 37.0°C and 40.0°C.',
            };
          }
        }

        if (newSettings.mortalityAlertLimit !== undefined) {
          if (newSettings.mortalityAlertLimit < 1.0 || newSettings.mortalityAlertLimit > 50.0) {
            return {
              success: false,
              message: 'Mortality alert limit must be between 1.0% and 50.0%.',
            };
          }
        }

        // Capacity is fixed at 74 for this assessment
        const updated: FacilitySettings = {
          ...current,
          ...newSettings,
          facilityCapacity: 74, // fixed
        };

        // Audit log
        useAuditStore.getState().logAction({
          action: 'SETTINGS_CHANGE',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          facilityDate,
          previousValue: JSON.stringify(current),
          newValue: JSON.stringify(updated),
          reason: reason || 'Facility clinical threshold adjustment by Head Doctor',
          details: `Updated parameters: Fever Threshold=${updated.feverThreshold}°C, Alert Limit=${updated.mortalityAlertLimit}%.`,
        });

        set({ settings: updated });
        return { success: true };
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },
    }),
    {
      name: 'quarantine-care-settings-v1',
    }
  )
);
