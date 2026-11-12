import { describe, it, expect, beforeEach } from 'vitest';
import { usePatientStore } from '../store/patientStore';
import { DEMO_USERS } from '../data/seedData';
import { useSimulationStore } from '../store/simulationStore';

describe('Duplicate Temperature Reading Logic', () => {
  const nurseUser = DEMO_USERS[0];

  beforeEach(() => {
    usePatientStore.getState().resetDemoData();
    useSimulationStore.getState().resetSimulation();
  });

  it('accepts first reading of the day without requiring duplicate reason', () => {
    // Patient B-05 has no reading today
    const result = usePatientStore.getState().recordTemperature(
      {
        patientId: 'PT-1005',
        temperature: 36.8,
        notes: 'Morning vitals check',
      },
      nurseUser
    );

    expect(result.success).toBe(true);

    const updatedPatient = usePatientStore.getState().patients.find(p => p.id === 'PT-1005');
    const todayReadings = updatedPatient?.temperatureHistory.filter(r => r.facilityDate === '2026-11-12');
    expect(todayReadings?.length).toBe(1);
    expect(todayReadings?.[0].temperature).toBe(36.8);
    expect(todayReadings?.[0].isDuplicate).toBeFalsy();
  });

  it('blocks duplicate reading without reason and prompts with previous reading info', () => {
    // Patient B-02 already has a reading today (Sneha Nair, 37.1°C)
    const result = usePatientStore.getState().recordTemperature(
      {
        patientId: 'PT-1002',
        temperature: 37.3,
      },
      nurseUser
    );

    expect(result.success).toBe(false);
    expect(result.isDuplicatePrompt).toBe(true);
    expect(result.existingReading?.temperature).toBe(37.1);
    expect(result.message).toContain('already recorded today');
  });

  it('accepts duplicate reading when reason is provided', () => {
    // Provide reason 'Recheck'
    const result = usePatientStore.getState().recordTemperature(
      {
        patientId: 'PT-1002',
        temperature: 37.4,
        duplicateReason: 'Recheck',
        notes: 'Patient felt warm, repeated reading.',
      },
      nurseUser
    );

    expect(result.success).toBe(true);

    const updatedPatient = usePatientStore.getState().patients.find(p => p.id === 'PT-1002');
    const todayReadings = updatedPatient?.temperatureHistory.filter(r => r.facilityDate === '2026-11-12');
    // Both readings must remain in history!
    expect(todayReadings?.length).toBe(2);
    expect(todayReadings?.[0].temperature).toBe(37.1);
    expect(todayReadings?.[1].temperature).toBe(37.4);
    expect(todayReadings?.[1].isDuplicate).toBe(true);
    expect(todayReadings?.[1].duplicateReason).toBe('Recheck');
  });

  it('requires written explanation when duplicate reason is "Other"', () => {
    const resultWithoutText = usePatientStore.getState().recordTemperature(
      {
        patientId: 'PT-1002',
        temperature: 37.4,
        duplicateReason: 'Other',
        duplicateReasonText: '', // missing
      },
      nurseUser
    );

    expect(resultWithoutText.success).toBe(false);
    expect(resultWithoutText.message).toContain('written explanation');

    const resultWithText = usePatientStore.getState().recordTemperature(
      {
        patientId: 'PT-1002',
        temperature: 37.4,
        duplicateReason: 'Other',
        duplicateReasonText: 'Thermometer probe replaced per protocol.',
      },
      nurseUser
    );

    expect(resultWithText.success).toBe(true);
  });
});
