import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FACILITY_BASE_DATE } from '../data/seedData';
import { addDays } from '../utils/date';

interface SimulationStore {
  currentFacilityDate: string; // YYYY-MM-DD
  simulatedHour: number; // 0 to 23
  advanceFacilityDate: () => string;
  advanceSimulatedHour: (hours?: number) => void;
  resetSimulation: () => void;
  getSimulatedTimestamp: () => string;
}

export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set, get) => ({
      currentFacilityDate: FACILITY_BASE_DATE,
      simulatedHour: 12, // 12:00 PM base

      advanceFacilityDate: () => {
        const nextDate = addDays(get().currentFacilityDate, 1);
        set({
          currentFacilityDate: nextDate,
          simulatedHour: 8, // reset to morning shift
        });
        return nextDate;
      },

      advanceSimulatedHour: (hours = 1) => {
        const current = get().simulatedHour;
        const nextHour = (current + hours) % 24;
        set({ simulatedHour: nextHour });
      },

      resetSimulation: () => {
        set({
          currentFacilityDate: FACILITY_BASE_DATE,
          simulatedHour: 12,
        });
      },

      getSimulatedTimestamp: () => {
        const { currentFacilityDate, simulatedHour } = get();
        const hr = String(simulatedHour).padStart(2, '0');
        return `${currentFacilityDate}T${hr}:30:00Z`;
      },
    }),
    {
      name: 'quarantine-care-simulation-v1',
    }
  )
);
