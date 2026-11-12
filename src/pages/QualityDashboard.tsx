import React, { useMemo } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Bed, 
  Users, 
  TrendingUp, 
  Clock, 
  HeartPulse, 
  Percent,
  FileSpreadsheet
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useSettingsStore } from '../store/settingsStore';
import { useSimulationStore } from '../store/simulationStore';
import { calculateMortalityMetrics } from '../utils/mortality';
import { formatDate } from '../utils/date';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export const QualityDashboard: React.FC = () => {
  const { patients, beds, historicalClosedCases } = usePatientStore();
  const { settings } = useSettingsStore();
  const { currentFacilityDate } = useSimulationStore();

  // Closed cases counts
  const curedCount = useMemo(
    () => historicalClosedCases.filter((c) => c.outcome === 'cured').length,
    [historicalClosedCases]
  );

  const deathsCount = useMemo(
    () => historicalClosedCases.filter((c) => c.outcome === 'deceased').length,
    [historicalClosedCases]
  );

  // Facility metrics
  const totalActivePatients = patients.filter(
    (p) => p.status === 'admitted' || p.status === 'discharge_eligible' || p.status === 'discharge_confirmed'
  ).length;

  const occupiedBedsCount = beds.filter((b) => b.status === 'occupied').length;
  const availableBedsCount = beds.filter((b) => b.status === 'available').length;
  const occupancyPercentage = Math.round((occupiedBedsCount / settings.facilityCapacity) * 100);

  // Exact clinical mortality & success calculations
  const mortalityMetrics = useMemo(() => {
    return calculateMortalityMetrics(
      curedCount,
      deathsCount,
      settings.mortalityAlertLimit,
      85.0,
      settings.alertMinCases
    );
  }, [curedCount, deathsCount, settings.mortalityAlertLimit, settings.alertMinCases]);

  // Donut chart data: Cured vs Deceased
  const donutData = [
    { name: 'Discharged Cured', value: curedCount, color: '#16a34a' },
    { name: 'Deceased', value: deathsCount, color: '#dc2626' },
  ];

  // Benchmark comparison chart data
  const benchmarkComparisonData = [
    {
      category: 'Mortality Rate (%)',
      Actual: mortalityMetrics.mortalityRate,
      Benchmark: settings.mortalityAlertLimit,
    },
    {
      category: 'Success Rate (%)',
      Actual: mortalityMetrics.successRate,
      Benchmark: 85.0,
    },
  ];

  // Bed status distribution
  const bedDistributionData = [
    { name: 'Occupied', count: occupiedBedsCount, fill: '#2563eb' },
    { name: 'Available', count: availableBedsCount, fill: '#16a34a' },
    { name: 'Pending Release', count: beds.filter((b) => b.status === 'pending_release').length, fill: '#f59e0b' },
    { name: 'Deceased Awaiting', count: beds.filter((b) => b.status === 'deceased_awaiting_release').length, fill: '#dc2626' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Head Doctor Quality & Outcome Analytics
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Clinical safety monitoring • Benchmark threshold verification • Executive operational oversight
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <span>Reporting Facility Date: <strong>{formatDate(currentFacilityDate)}</strong></span>
        </div>
      </div>

      {/* Prominent Red Alert Banner */}
      {mortalityMetrics.isAlertActive && (
        <div className="p-5 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-700 animate-in zoom-in-95 duration-200 flex items-start gap-4">
          <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base tracking-tight">
              CRITICAL CLINICAL ALERT: MORTALITY RATE EXCEEDS BENCHMARK
            </h3>
            <p className="text-xs text-red-100 leading-relaxed">
              Current facility mortality rate has reached{' '}
              <strong>{mortalityMetrics.mortalityRate}%</strong> ({deathsCount} deaths out of {mortalityMetrics.totalClosedCases} closed cases), exceeding the established{' '}
              <strong>{settings.mortalityAlertLimit}%</strong> safety threshold. Both conditions satisfied (Mortality &gt; {settings.mortalityAlertLimit}% and Closed Cases &ge; {settings.alertMinCases}). Immediate clinical review and epidemic protocol escalation required.
            </p>
          </div>
        </div>
      )}

      {/* Low Sample Size Notice if applicable */}
      {mortalityMetrics.isLowSampleSize && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{mortalityMetrics.alertMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mortality % Card */}
        <div
          className={`p-5 rounded-2xl border shadow-xs transition ${
            mortalityMetrics.isAlertActive
              ? 'bg-red-50/50 border-red-300 ring-1 ring-red-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Mortality Rate</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                mortalityMetrics.isAlertActive
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Benchmark: &le;{settings.mortalityAlertLimit}%
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                mortalityMetrics.isAlertActive ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {mortalityMetrics.mortalityRate}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {deathsCount} deaths / {mortalityMetrics.totalClosedCases} closed cases
          </p>
        </div>

        {/* Success % Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Success Rate</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Benchmark: &ge;85%
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">
              {mortalityMetrics.successRate}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {curedCount} cured / {mortalityMetrics.totalClosedCases} closed cases
          </p>
        </div>

        {/* Total Closed Cases */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Closed Cases</span>
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {mortalityMetrics.totalClosedCases}
            </span>
            <span className="text-xs text-slate-500">cases</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {curedCount} Discharged Cured • {deathsCount} Deaths
          </p>
        </div>

        {/* Facility Bed Utilization */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Bed Occupancy</span>
            <Bed className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-900 tracking-tight">
              {occupancyPercentage}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({occupiedBedsCount}/74)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {availableBedsCount} available beds in facility
          </p>
        </div>
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outcome Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-base text-slate-900">
                Patient Outcome Distribution (Closed Cases)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Total {mortalityMetrics.totalClosedCases} cases
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-emerald-800 font-semibold block">Discharged Cured</span>
              <strong className="text-base text-emerald-900">{curedCount} ({mortalityMetrics.successRate}%)</strong>
            </div>
            <div className="p-2.5 bg-red-50 rounded-xl border border-red-100">
              <span className="text-red-800 font-semibold block">Deceased</span>
              <strong className="text-base text-red-900">{deathsCount} ({mortalityMetrics.mortalityRate}%)</strong>
            </div>
          </div>
        </div>

        {/* Benchmark Comparison Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900">
                Actual vs. Safety Benchmarks
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Safety Limit: 15%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={benchmarkComparisonData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="Actual" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Benchmark" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <p className="leading-relaxed">
              <strong>Quality Policy:</strong> If facility mortality exceeds 15% across &ge;20 closed cases, high-alert protocol engages automatically until mortality stabilizes below 15%.
            </p>
          </div>
        </div>
      </div>

      {/* Bed Distribution & Throughput Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">
              Facility Capacity Utilization Breakdown (74 Beds)
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {bedDistributionData.map((b) => (
            <div key={b.name} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-slate-500 font-semibold block">{b.name}</span>
              <strong className="text-xl text-slate-900 block mt-1">{b.count}</strong>
              <span className="text-[11px] text-slate-400">
                {Math.round((b.count / settings.facilityCapacity) * 100)}% of total
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
