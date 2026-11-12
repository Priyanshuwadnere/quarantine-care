import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Thermometer, 
  Stethoscope, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  User,
  ShieldCheck,
  Edit2
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useSimulationStore } from '../store/simulationStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { calculateCureProgress } from '../utils/cureCounter';
import { formatDate, formatDateTime, formatTime } from '../utils/date';
import { RecordTemperatureModal } from '../components/temperature/RecordTemperatureModal';
import { VisitNoteModal } from '../components/patients/VisitNoteModal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useToast } from '../components/common/Toast';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

export const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, correctTemperature, confirmDischarge } = usePatientStore();
  const { currentFacilityDate } = useSimulationStore();
  const { settings } = useSettingsStore();
  const { currentUser } = useAuthStore();
  const toast = useToast();

  const [isRecordTempOpen, setIsRecordTempOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [correctionModalState, setCorrectionModalState] = useState<{
    isOpen: boolean;
    readingId: string;
    currentTemp: number;
    newTemp: string;
    reason: string;
  }>({
    isOpen: false,
    readingId: '',
    currentTemp: 37.0,
    newTemp: '37.0',
    reason: '',
  });

  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Patient Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          The requested patient ID ({id}) was not found in the facility database.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Calculate detailed cure progress
  const cureProgress = calculateCureProgress(
    patient.admissionDate,
    patient.temperatureHistory,
    currentFacilityDate,
    settings.feverThreshold
  );

  // Prepare chart data
  const chartData = patient.temperatureHistory.map((r) => ({
    date: `${r.facilityDate.slice(5)} ${formatTime(r.recordedAt)}`,
    temperature: r.temperature,
    feverThreshold: settings.feverThreshold,
  }));

  const handleCorrectReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newTempNum = parseFloat(correctionModalState.newTemp);
    if (isNaN(newTempNum)) {
      toast.error('Invalid Temperature', 'Enter a valid number.');
      return;
    }
    if (!correctionModalState.reason.trim()) {
      toast.error('Reason Required', 'Please provide a clinical explanation for the correction.');
      return;
    }

    const res = correctTemperature(
      patient.id,
      correctionModalState.readingId,
      newTempNum,
      correctionModalState.reason.trim(),
      currentUser
    );

    if (res.success) {
      toast.success('Reading Corrected', `Updated to ${newTempNum.toFixed(1)}°C with audit log.`);
      setCorrectionModalState({ ...correctionModalState, isOpen: false });
    } else {
      toast.error('Correction Failed', res.message);
    }
  };

  const handleConfirmDischarge = () => {
    if (!currentUser) return;
    const res = confirmDischarge(patient.id, currentUser);
    if (res.success) {
      toast.success('Discharge Confirmed', 'Patient sent to Admin discharge queue.');
    } else {
      toast.error('Discharge Error', res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Worklist</span>
        </button>

        <div className="flex items-center gap-2">
          {currentUser?.role !== 'nurse' && (
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Visit / Note</span>
            </button>
          )}

          <button
            onClick={() => setIsRecordTempOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Thermometer className="w-4 h-4" />
            <span>Record Temperature</span>
          </button>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center font-bold text-xl shrink-0">
              {patient.bedNumber || 'DIS'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{patient.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {patient.id}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    patient.status === 'discharge_eligible'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : patient.status === 'discharge_confirmed'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : patient.status === 'deceased'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {patient.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {patient.age} yrs • {patient.gender} • Admitted {formatDate(patient.admissionDate)} • Bed: <strong>{patient.bedNumber || 'Released'}</strong> • Contact: {patient.contactNumber || 'N/A'}
              </p>
            </div>
          </div>

          {/* Quick Discharge Action if Eligible */}
          {patient.status === 'discharge_eligible' && (currentUser?.role === 'doctor' || currentUser?.role === 'head_doctor') && (
            <button
              onClick={handleConfirmDischarge}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Discharge (Eligible)</span>
            </button>
          )}
        </div>

        {/* Cure Progress Tracker Bar */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Three-Day Fever-Free Cure Criterion:
              </span>
              <strong className="text-xs text-brand-700 font-extrabold">
                {cureProgress.displayProgress}
              </strong>
            </div>
            {cureProgress.isEligible && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Eligible for Discharge
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 mb-3">{cureProgress.summaryMessage}</p>

          {/* Days timeline pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {cureProgress.dailyStatuses.map((ds) => {
              let bg = 'bg-slate-50 border-slate-200 text-slate-700';
              let badge = ds.statusLabel;

              if (ds.status === 'fever') {
                bg = 'bg-red-50 border-red-200 text-red-900';
              } else if (ds.status === 'fever_free') {
                bg = 'bg-emerald-50 border-emerald-200 text-emerald-900';
              } else if (ds.status === 'temp_missing') {
                bg = 'bg-amber-50 border-amber-200 text-amber-900';
              }

              return (
                <div key={ds.date} className={`p-3 rounded-xl border ${bg} text-xs`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{formatDate(ds.date)}</span>
                    {!ds.isCompletedDay && (
                      <span className="text-[10px] bg-white/80 px-1.5 py-0.2 rounded font-semibold text-slate-600">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-xs">{badge}</div>
                  {ds.maxTemperature && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Max: {ds.maxTemperature.toFixed(1)}°C
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Temperature Trend Line Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-base text-slate-900">
              Temperature Trend (°C)
            </h3>
          </div>
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
            Fever Threshold: {settings.feverThreshold}°C
          </span>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[34.0, 42.0]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={settings.feverThreshold}
                  label={{ value: `Fever (${settings.feverThreshold}°C)`, fill: '#dc2626', fontSize: 10 }}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-8 text-center">No temperature readings recorded yet.</p>
        )}
      </div>

      {/* Temperature History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">
            Temperature Measurement Log ({patient.temperatureHistory.length} entries)
          </h3>
          <span className="text-xs text-slate-500">All historical readings preserved</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Facility Date</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Reading (°C)</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Recorded By</th>
                <th className="px-5 py-3">Notes & Reason</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patient.temperatureHistory.map((reading) => (
                <tr key={reading.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {formatDate(reading.facilityDate)}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {formatTime(reading.recordedAt)}
                  </td>
                  <td className="px-5 py-3 font-bold text-slate-900">
                    <span className={reading.isFever ? 'text-red-600' : 'text-slate-800'}>
                      {reading.temperature.toFixed(1)}°C
                    </span>
                    {reading.isCorrected && (
                      <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold">
                        Corrected
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {reading.isFever ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                        Fever
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600 font-medium">
                    {reading.recordedBy} ({reading.recorderRole})
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {reading.duplicateReason && (
                      <span className="block text-[11px] font-semibold text-amber-800">
                        Duplicate Reason: {reading.duplicateReason} {reading.duplicateReasonText ? `(${reading.duplicateReasonText})` : ''}
                      </span>
                    )}
                    {reading.notes && <span>{reading.notes}</span>}
                    {reading.correctionReason && (
                      <span className="block text-[10px] text-amber-700 italic">
                        Correction reason: {reading.correctionReason} (by {reading.correctedBy})
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() =>
                        setCorrectionModalState({
                          isOpen: true,
                          readingId: reading.id,
                          currentTemp: reading.temperature,
                          newTemp: reading.temperature.toString(),
                          reason: '',
                        })
                      }
                      className="text-xs text-brand-600 hover:text-brand-800 font-semibold p-1 hover:bg-brand-50 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Visits & Clinical Notes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">
              Physician Visits & Treatment History ({patient.doctorVisits.length})
            </h3>
          </div>
          {currentUser?.role !== 'nurse' && (
            <button
              onClick={() => setIsVisitModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              + Add Doctor Visit
            </button>
          )}
        </div>

        {patient.doctorVisits.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {patient.doctorVisits.map((v) => (
              <div key={v.id} className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{v.doctorName}</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                      {v.isDailyVisit ? 'Daily Review' : 'Supplemental Note'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDate(v.facilityDate)}, {formatTime(v.visitedAt)}
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <p><strong>Treatment Given:</strong> {v.treatmentGiven}</p>
                  <p><strong>Physician Notes:</strong> {v.notes}</p>
                  {v.followUpInstructions && (
                    <p className="text-slate-500">
                      <strong>Follow-up:</strong> {v.followUpInstructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-xs text-slate-400 text-center">
            No physician clinical visits recorded yet for this patient.
          </p>
        )}
      </div>

      {/* Modals */}
      <RecordTemperatureModal
        patient={patient}
        isOpen={isRecordTempOpen}
        onClose={() => setIsRecordTempOpen(false)}
      />

      <VisitNoteModal
        patient={patient}
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        onOpenRecordTemp={() => setIsRecordTempOpen(true)}
      />

      {/* Reading Correction Modal */}
      {correctionModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Correct Temperature Reading
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current recorded value: {correctionModalState.currentTemp}°C. This correction will be permanently logged in the facility audit trail.
            </p>

            <form onSubmit={handleCorrectReadingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corrected Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="34.0"
                  max="43.0"
                  value={correctionModalState.newTemp}
                  onChange={(e) =>
                    setCorrectionModalState({
                      ...correctionModalState,
                      newTemp: e.target.value,
                    })
                  }
                  required
                  className="w-full text-sm px-3 py-2 border rounded-xl border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Clinical Correction Reason
                </label>
                <textarea
                  rows={2}
                  value={correctionModalState.reason}
                  onChange={(e) =>
                    setCorrectionModalState({
                      ...correctionModalState,
                      reason: e.target.value,
                    })
                  }
                  placeholder="e.g. Typo during entry, verified against chart..."
                  required
                  className="w-full text-xs p-3 border rounded-xl border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setCorrectionModalState({ ...correctionModalState, isOpen: false })
                  }
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                >
                  Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
