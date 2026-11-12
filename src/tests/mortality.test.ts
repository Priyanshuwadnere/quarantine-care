import { describe, it, expect } from 'vitest';
import { calculateMortalityMetrics } from '../utils/mortality';

describe('Mortality & Benchmark Alert Calculations', () => {
  it('calculates seeded baseline: 5 deaths / 40 closed cases = 12.5%', () => {
    // 35 cured, 5 deceased -> 40 closed cases
    const metrics = calculateMortalityMetrics(35, 5, 15.0, 85.0, 20);

    expect(metrics.totalClosedCases).toBe(40);
    expect(metrics.dischargedCured).toBe(35);
    expect(metrics.totalDeaths).toBe(5);
    expect(metrics.mortalityRate).toBe(12.5);
    expect(metrics.successRate).toBe(87.5);
    // 12.5% <= 15% benchmark -> Alert should be INACTIVE
    expect(metrics.isAlertActive).toBe(false);
    expect(metrics.isLowSampleSize).toBe(false);
  });

  it('calculates after 1st new death: 6 deaths / 41 closed cases = 14.6%', () => {
    // 35 cured, 6 deceased -> 41 closed cases
    const metrics = calculateMortalityMetrics(35, 6, 15.0, 85.0, 20);

    expect(metrics.totalClosedCases).toBe(41);
    expect(metrics.totalDeaths).toBe(6);
    expect(metrics.mortalityRate).toBe(14.6);
    // 14.6% <= 15% benchmark -> Alert should remain INACTIVE
    expect(metrics.isAlertActive).toBe(false);
  });

  it('calculates after 2nd new death: 7 deaths / 42 closed cases = 16.7% and triggers alert', () => {
    // 35 cured, 7 deceased -> 42 closed cases
    const metrics = calculateMortalityMetrics(35, 7, 15.0, 85.0, 20);

    expect(metrics.totalClosedCases).toBe(42);
    expect(metrics.totalDeaths).toBe(7);
    expect(metrics.mortalityRate).toBe(16.7);
    // 16.7% > 15% benchmark AND closed cases (42) >= 20 -> Alert ACTIVE!
    expect(metrics.isAlertActive).toBe(true);
    expect(metrics.alertMessage).toContain('CRITICAL ALERT');
  });

  it('does not trigger alert when closed cases are below 20 (low sample size)', () => {
    // 8 cured, 2 deceased -> 10 closed cases. Mortality = 20%
    const metrics = calculateMortalityMetrics(8, 2, 15.0, 85.0, 20);

    expect(metrics.totalClosedCases).toBe(10);
    expect(metrics.mortalityRate).toBe(20.0);
    expect(metrics.isLowSampleSize).toBe(true);
    // Must NOT trigger red alert due to insufficient sample size
    expect(metrics.isAlertActive).toBe(false);
    expect(metrics.alertMessage).toBe('Low sample size — insufficient cases for benchmark alert.');
  });
});
