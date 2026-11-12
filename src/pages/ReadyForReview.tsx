import React, { useState, useMemo } from 'react';
import { 
  Stethoscope, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Search, 
  ChevronRight, 
  Thermometer, 
  Filter,
  AlertCircle
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useSimulationStore } from '../store/simulationStore';
import { useSettingsStore } from '../store/settingsStore';
import { Patient } from '../types/patient';
import { getTodayReadings, hasReadingToday, hasFeverToday } from '../utils/temperature';
import { formatDate, formatTime } from '../utils/date';
import { VisitNoteModal } from '../components/patients/VisitNoteModal';
import { RecordTemperatureModal } from '../components/temperature/RecordTemperatureModal';
import { useNavigate } from 'react-router-dom';

export const ReadyForReview: React.FC = () => {
  const { patients } = usePatientStore();
  const { currentFacilityDate } = useSimulationStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'ready' | 'awaiting' | 'visited'>('ready');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState<Patient | null>(null);
  const [selectedPatientForTemp, setSelectedPatientForTemp] = useState<Patient | null>(null);

  // Active admitted patients only
  const activePatients = useMemo(() => {
    return patients.filter((p) => p.status === 'admitted' || p.status === 'discharge_eligible');
  }, [patients]);

  // Classify each patient for Doctor Review
  const classifiedPatients = useMemo(() => {
    return activePatients.map((patient) => {
      const todayReadings = getTodayReadings(patient.temperatureHistory, currentFacilityDate);
      const hasTemp = todayReadings.length > 0;
      const isFever = hasFeverToday(patient.temperatureHistory, currentFacilityDate, settings.feverThreshold);
      const latestReading = hasTemp ? todayReadings[todayReadings.length - 1] : undefined;

      // Has doctor visited today?
      const hasVisitedToday = patient.doctorVisits.some(
        (v) => v.facilityDate === currentFacilityDate && v.isDailyVisit
      );

      // Last visit overall
      const lastVisit = patient.doctorVisits.length > 0
        ? patient.doctorVisits[patient.doctorVisits.length - 1]
        : undefined;

      return {
        patient,
        hasTemp,
        isFever,
        latestReading,
        hasVisitedToday,
        lastVisit,
      };
    });
  }, [activePatients, currentFacilityDate, settings.feverThreshold]);

  // Ready for review: has today's temperature AND not yet visited today
  const readyPatients = useMemo(() => {
    return classifiedPatients
      .filter((p) => p.hasTemp && !p.hasVisitedToday)
      .sort((a, b) => {
        // Fever patients first!
        if (a.isFever && !b.isFever) return -1;
        if (!a.isFever && b.isFever) return 1;
        // Then by highest temperature descending
        const tempA = a.latestReading?.temperature || 0;
        const tempB = b.latestReading?.temperature || 0;
        return tempB - tempA;
      });
  }, [classifiedPatients]);

  // Awaiting temperature: NO temperature recorded today
  const awaitingPatients = useMemo(() => {
    return classifiedPatients.filter((p) => !p.hasTemp);
  }, [classifiedPatients]);

  // Already visited today
  const visitedPatients = useMemo(() => {
    return classifiedPatients.filter((p) => p.hasVisitedToday);
  }, [classifiedPatients]);

  // Search filter
  const currentList = useMemo(() => {
    let list = activeTab === 'ready' ? readyPatients : activeTab === 'awaiting' ? awaitingPatients : visitedPatients;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.patient.name.toLowerCase().includes(q) ||
          item.patient.bedNumber.toLowerCase().includes(q) ||
          item.patient.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, readyPatients, awaitingPatients, visitedPatients, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Physician Daily Worklist & Vitals Review
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Facility Date: <strong>{formatDate(currentFacilityDate)}</strong> • Prioritizing febrile and acute patients
            </p>
          </div>
        </div>

        {/* Quick Triage Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">
              Ready For Review
            </span>
            <span className="text-xl font-extrabold text-blue-900">{readyPatients.length}</span>
          </div>

          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">
              Awaiting Temp
            </span>
            <span className="text-xl font-extrabold text-amber-900">{awaitingPatients.length}</span>
          </div>

          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
              Visited Today
            </span>
            <span className="text-xl font-extrabold text-emerald-900">{visitedPatients.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('ready')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ready'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>Ready for Review ({readyPatients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('awaiting')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'awaiting'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Awaiting Temperature ({awaitingPatients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('visited')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'visited'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Visited Today ({visitedPatients.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient or bed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      </div>

      {/* Patient Cards / Worklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {currentList.map(({ patient, hasTemp, isFever, latestReading, hasVisitedToday, lastVisit }) => (
          <div
            key={patient.id}
            className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
              isFever
                ? 'border-red-300 ring-1 ring-red-200'
                : hasVisitedToday
                ? 'border-emerald-200 bg-emerald-50/20'
                : 'border-slate-200'
            }`}
          >
            <div className="p-5 space-y-3">
              {/* Bed & Status Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                    {patient.bedNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {patient.id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isFever && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Fever Priority
                    </span>
                  )}
                  {hasVisitedToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Visited
                    </span>
                  )}
                  {!hasTemp && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      No Temp Today
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

              {/* Temperature & Visit Info */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Today's Reading
                  </span>
                  {hasTemp && latestReading ? (
                    <div className="mt-1">
                      <span
                        className={`text-base font-extrabold ${
                          latestReading.isFever ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {latestReading.temperature.toFixed(1)}°C
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({formatTime(latestReading.recordedAt)})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700 mt-1 block">
                      Awaiting Nurse Temp
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Last Visit
                  </span>
                  <div className="mt-1 text-slate-800 font-semibold truncate">
                    {lastVisit ? formatDate(lastVisit.facilityDate) : 'No prior visits'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => navigate(`/patient/${patient.id}`)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition"
              >
                Chart History
              </button>

              <div className="flex items-center gap-1.5">
                {!hasTemp && (
                  <button
                    onClick={() => setSelectedPatientForTemp(patient)}
                    title="Record temperature fallback as Doctor"
                    className="p-2 text-slate-600 hover:text-brand-600 hover:bg-white rounded-xl border border-slate-200 transition text-xs font-semibold flex items-center gap-1"
                  >
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Log Temp</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedPatientForVisit(patient)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-xs transition ${
                    hasTemp
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>{hasVisitedToday ? 'Add Note' : 'Review Patient'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentList.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === 'ready'
              ? 'All Ready Patients Reviewed!'
              : activeTab === 'awaiting'
              ? 'No Patients Awaiting Temperature'
              : 'No Patients Visited Today'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'ready'
              ? 'No pending unvisited patients with recorded temperatures.'
              : 'Check other tabs to review active patient queue.'}
          </p>
        </div>
      )}

      {/* Doctor Visit Modal */}
      <VisitNoteModal
        patient={selectedPatientForVisit}
        isOpen={!!selectedPatientForVisit}
        onClose={() => setSelectedPatientForVisit(null)}
        onOpenRecordTemp={(p) => setSelectedPatientForTemp(p)}
      />

      {/* Record Temp Fallback Modal */}
      <RecordTemperatureModal
        patient={selectedPatientForTemp}
        isOpen={!!selectedPatientForTemp}
        onClose={() => setSelectedPatientForTemp(null)}
      />
    </div>
  );
};
