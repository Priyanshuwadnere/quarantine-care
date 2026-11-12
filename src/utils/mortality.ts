export interface MortalityMetrics {
  totalClosedCases: number;
  dischargedCured: number;
  totalDeaths: number;
  mortalityRate: number; // percentage, rounded to 1 decimal place
  successRate: number; // percentage, rounded to 1 decimal place
  rawMortalityRate: number;
  rawSuccessRate: number;
  isAlertActive: boolean;
  isLowSampleSize: boolean;
  benchmarkMortality: number; // default 15%
  benchmarkSuccess: number; // default 85%
  alertMessage?: string;
}

/**
 * Calculates mortality and success rates according to the exact clinical formula:
 * Mortality % = Deceased / (Discharged cured + Deceased) * 100
 * Success % = Discharged cured / (Discharged cured + Deceased) * 100
 */
export function calculateMortalityMetrics(
  dischargedCured: number,
  totalDeaths: number,
  benchmarkMortality: number = 15.0,
  benchmarkSuccess: number = 85.0,
  minSampleForAlert: number = 20
): MortalityMetrics {
  const totalClosedCases = dischargedCured + totalDeaths;

  if (totalClosedCases === 0) {
    return {
      totalClosedCases: 0,
      dischargedCured: 0,
      totalDeaths: 0,
      mortalityRate: 0,
      successRate: 0,
      rawMortalityRate: 0,
      rawSuccessRate: 0,
      isAlertActive: false,
      isLowSampleSize: true,
      benchmarkMortality,
      benchmarkSuccess,
      alertMessage: 'Low sample size — insufficient cases for benchmark alert.',
    };
  }

  const rawMortalityRate = (totalDeaths / totalClosedCases) * 100;
  const rawSuccessRate = (dischargedCured / totalClosedCases) * 100;

  // Round to 1 decimal place for clean clinical display
  const mortalityRate = Math.round(rawMortalityRate * 10) / 10;
  const successRate = Math.round(rawSuccessRate * 10) / 10;

  const isLowSampleSize = totalClosedCases < minSampleForAlert;
  // Alert triggers ONLY when mortality percentage > benchmark AND closed cases >= minSampleForAlert
  const isAlertActive = !isLowSampleSize && rawMortalityRate > benchmarkMortality;

  let alertMessage: string | undefined;
  if (isAlertActive) {
    alertMessage = `CRITICAL ALERT: Facility mortality rate (${mortalityRate}%) exceeds the ${benchmarkMortality}% safety benchmark across ${totalClosedCases} closed cases. Immediate clinical review required.`;
  } else if (isLowSampleSize) {
    alertMessage = 'Low sample size — insufficient cases for benchmark alert.';
  }

  return {
    totalClosedCases,
    dischargedCured,
    totalDeaths,
    mortalityRate,
    successRate,
    rawMortalityRate,
    rawSuccessRate,
    isAlertActive,
    isLowSampleSize,
    benchmarkMortality,
    benchmarkSuccess,
    alertMessage,
  };
}
