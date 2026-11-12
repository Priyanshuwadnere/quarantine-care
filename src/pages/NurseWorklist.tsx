import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Thermometer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight,
  TrendingUp,
  User
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useSimulationStore } from '../store/simulationStore';
import { useSettingsStore } from '../store/settingsStore';
import { Patient } from '../types/patient';
import { getTodayReadings, hasReadingToday, hasFeverToday } from '../utils/temperature';
import { formatDate, formatTime } from '../utils/date';
import { RecordTemperatureModal } from '../components/temperature/RecordTemperatureModal';
import { useNavigate } from 'react-router-dom';

export const NurseWorklist: React.FC = () => {
  const { patients } = usePatientStore();
  const { currentFacilityDate } = useSimulationStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'done'>('pending');
  const [selectedPatientForTemp, setSelectedPatientForTemp] = useState<Patient | null>(null);

  // Filter only admitted patients (exclude discharged and deceased)
  const activePatients = useMemo(() => {
    return patients.filter((p) => p.status === 'admitted' || p.status === 'discharge_eligible' || p.status === 'discharge_confirmed');
  }, [patients]);

  // Compute status for today
  const patientStatuses = useMemo(() => {
    return activePatients.map((patient) => {
      const todayReadings = getTodayReadings(patient.temperatureHistory, currentFacilityDate);
      const isDone = todayReadings.length > 0;
      const isFever = hasFeverToday(patient.temperatureHistory, currentFacilityDate, settings.feverThreshold);
      const latestReading = isDone ? todayReadings[todayReadings.length - 1] : undefined;

      // Last reading overall
      const allReadings = patient.temperatureHistory;
      const previousReading = allReadings.length > 0 ? allReadings[allReadings.length - 1] : undefined;

      return {
        patient,
        isDone,
        isFever,
        todayReadings,
        latestReading,
        previousReading,
      };
    });
  }, [activePatients, currentFacilityDate, settings.feverThreshold]);

  // Counts
  const totalCount = activePatients.length;
  const doneCount = patientStatuses.filter((p) => p.isDone).length;
  const pendingCount = totalCount - doneCount;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Filter and sort: Pending first, then bed number
  const filteredPatients = useMemo(() => {
    return patientStatuses
      .filter(({ patient, isDone }) => {
        // Tab filter
        if (activeTab === 'pending' && isDone) return false;
        if (activeTab === 'done' && !isDone) return false;

        // Search query filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesName = patient.name.toLowerCase().includes(query);
          const matchesBed = patient.bedNumber.toLowerCase().includes(query);
          const matchesId = patient.id.toLowerCase().includes(query);
          return matchesName || matchesBed || matchesId;
        }

        return true;
      })
      .sort((a, b) => {
        // Pending before done
        if (!a.isDone && b.isDone) return -1;
        if (a.isDone && !b.isDone) return 1;
        // Then by bed number
        return a.patient.bedNumber.localeCompare(b.patient.bedNumber);
      });
  }, [patientStatuses, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Nurse Worklist
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Facility Date: <strong className="text-slate-800">{formatDate(currentFacilityDate)}</strong> • Active Shift Vitals Triage
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar Metric */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[260px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-600">Daily Measurement Progress:</span>
            <span className="font-bold text-brand-700">
              {doneCount} of {totalCount} Done ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span className="text-amber-700 font-medium">{pendingCount} Pending</span>
            <span className="text-teal-700 font-medium">{doneCount} Completed</span>
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('done')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'done'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Done ({doneCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({totalCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient name, bed (e.g. B-01)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      </div>

      {/* Patient Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPatients.map(({ patient, isDone, isFever, latestReading, previousReading }) => (
          <div
            key={patient.id}
            className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between ${
              isFever
                ? 'border-red-300 ring-1 ring-red-200'
                : isDone
                ? 'border-slate-200'
                : 'border-amber-300 bg-amber-50/20'
            }`}
          >
            <div className="p-5 space-y-3">
              {/* Card Header: Bed and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-slate-900 text-white rounded-lg tracking-wider">
                    {patient.bedNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {patient.id}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5">
                  {isFever && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Fever Active
                    </span>
                  )}

                  {isDone ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Done Today
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Patient Info */}
              <div
                className="cursor-pointer group"
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition flex items-center justify-between">
                  <span>{patient.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {patient.age} yrs • {patient.gender} • Admitted {formatDate(patient.admissionDate)}
                </p>
              </div>

              {/* Temperature Metrics */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Today's Temp
                  </span>
                  {isDone && latestReading ? (
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span
                        className={`text-lg font-extrabold ${
                          latestReading.isFever ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {latestReading.temperature.toFixed(1)}°C
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({formatTime(latestReading.recordedAt)})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700 mt-1 block">
                      Not Measured
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Cure Progress
                  </span>
                  <div className="mt-1 flex items-baseline gap-1 font-bold text-slate-800">
                    <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                    <span>Day {patient.feverFreeDaysCount} of 3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => navigate(`/patient/${patient.id}`)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition"
              >
                View History
              </button>

              <button
                onClick={() => setSelectedPatientForTemp(patient)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition ${
                  isDone
                    ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>{isDone ? 'Recheck Temp' : 'Record Temp'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Patients Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? `No active patients matched "${searchQuery}".`
              : 'All patients have been measured for this tab.'}
          </p>
        </div>
      )}

      {/* Record Temp Modal */}
      <RecordTemperatureModal
        patient={selectedPatientForTemp}
        isOpen={!!selectedPatientForTemp}
        onClose={() => setSelectedPatientForTemp(null)}
      />
    </div>
  );
};
