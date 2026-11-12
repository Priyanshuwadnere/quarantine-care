import React, { useState, useEffect } from 'react';
import { X, Thermometer, AlertTriangle, AlertCircle, Clock, User, Check } from 'lucide-react';
import { Patient } from '../../types/patient';
import { DuplicateReasonType, TemperatureReading } from '../../types/temperature';
import { useAuthStore } from '../../store/authStore';
import { useSimulationStore } from '../../store/simulationStore';
import { usePatientStore } from '../../store/patientStore';
import { validateTemperature, getTodayReadings } from '../../utils/temperature';
import { formatTime, formatDate } from '../../utils/date';
import { useToast } from '../common/Toast';

interface RecordTemperatureModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RecordTemperatureModal: React.FC<RecordTemperatureModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuthStore();
  const { currentFacilityDate, simulatedHour, getSimulatedTimestamp } = useSimulationStore();
  const { recordTemperature } = usePatientStore();
  const toast = useToast();

  const [tempValue, setTempValue] = useState<string>('37.0');
  const [notes, setNotes] = useState<string>('');
  const [duplicateReason, setDuplicateReason] = useState<DuplicateReasonType>('Recheck');
  const [duplicateReasonText, setDuplicateReasonText] = useState<string>('');
  const [confirmCritical, setConfirmCritical] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Today's existing readings for this patient
  const todayReadings: TemperatureReading[] = patient
    ? getTodayReadings(patient.temperatureHistory, currentFacilityDate)
    : [];
  const hasExistingToday = todayReadings.length > 0;
  const lastReading = hasExistingToday ? todayReadings[todayReadings.length - 1] : undefined;

  useEffect(() => {
    if (isOpen) {
      setTempValue('37.0');
      setNotes('');
      setDuplicateReason('Recheck');
      setDuplicateReasonText('');
      setConfirmCritical(false);
      setErrorMessage('');
    }
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const simulatedIso = getSimulatedTimestamp();
  const numTemp = parseFloat(tempValue);
  const validation = !isNaN(numTemp) ? validateTemperature(numTemp) : { isValid: false, errorMessage: 'Enter temperature' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) {
      setErrorMessage('User session missing.');
      return;
    }

    if (isNaN(numTemp)) {
      setErrorMessage('Please enter a valid numeric temperature.');
      return;
    }

    const valCheck = validateTemperature(numTemp);
    if (!valCheck.isValid) {
      setErrorMessage(valCheck.errorMessage || 'Value looks incorrect.');
      return;
    }

    if (valCheck.isCritical && !confirmCritical) {
      setErrorMessage('Critical value. Please check the confirmation box below to proceed.');
      return;
    }

    if (hasExistingToday && duplicateReason === 'Other' && !duplicateReasonText.trim()) {
      setErrorMessage('Please provide a written explanation for "Other" duplicate reason.');
      return;
    }

    const result = recordTemperature(
      {
        patientId: patient.id,
        temperature: numTemp,
        notes: notes.trim() || undefined,
        duplicateReason: hasExistingToday ? duplicateReason : undefined,
        duplicateReasonText: hasExistingToday && duplicateReason === 'Other' ? duplicateReasonText.trim() : undefined,
        confirmedCritical: confirmCritical,
      },
      currentUser
    );

    if (result.success) {
      toast.success(
        'Temperature Recorded',
        `Successfully logged ${numTemp.toFixed(1)}°C for ${patient.name} (${patient.bedNumber}).`
      );
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMessage(result.message || 'Failed to record temperature.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-brand-700 to-brand-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Thermometer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Record Temperature</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Bed {patient.bedNumber} • {patient.name} ({patient.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Duplicate Reading Warning Banner */}
          {hasExistingToday && lastReading && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-950">
                    Duplicate Reading Notice
                  </p>
                  <p className="mt-1 text-amber-800">
                    A reading of <strong>{lastReading.temperature}°C</strong> was already recorded today at{' '}
                    <strong>{formatTime(lastReading.recordedAt)}</strong> by {lastReading.recordedBy}.
                  </p>
                </div>
              </div>

              {/* Mandatory Duplicate Reason */}
              <div className="pt-2 border-t border-amber-200/60">
                <label className="block text-xs font-semibold text-amber-950 mb-1.5">
                  Select Reason for Second Reading <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Recheck', 'Doubtful reading', 'Other'] as DuplicateReasonType[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDuplicateReason(r)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                        duplicateReason === r
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100/50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {duplicateReason === 'Other' && (
                  <div className="mt-2.5">
                    <label className="block text-xs font-medium text-amber-950 mb-1">
                      Written Explanation <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={duplicateReasonText}
                      onChange={(e) => setDuplicateReasonText(e.target.value)}
                      placeholder="Explain reason for extra reading..."
                      className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Temperature Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Temperature (°C) <span className="text-red-600">*</span>
              </label>
              <span className="text-xs text-slate-400">Valid: 34.0 – 43.0 °C</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="30"
                max="45"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                required
                className="w-full text-2xl font-bold px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-900 tracking-tight"
                placeholder="37.0"
              />
              <span className="absolute right-4 top-3.5 text-base font-bold text-slate-400">
                °C
              </span>
            </div>

            {/* Quick Temp Preset Buttons */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400 font-medium">Quick presets:</span>
              {[36.6, 37.0, 38.2, 38.9, 41.2].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTempValue(preset.toFixed(1))}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded border transition ${
                    preset >= 38.0
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}°C {preset >= 38.0 ? '(Fever)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Critical Value Confirmation */}
          {validation.isCritical && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <p className="font-bold">Critical Temperature Value ({numTemp}°C)</p>
                <p className="mt-0.5 text-red-700">
                  Values &ge; 41.0°C or &lt; 35.0°C require explicit nurse/doctor confirmation.
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer font-semibold text-red-950">
                  <input
                    type="checkbox"
                    checked={confirmCritical}
                    onChange={(e) => setConfirmCritical(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                  />
                  <span>Confirm this reading is accurate and verified</span>
                </label>
              </div>
            </div>
          )}

          {/* Auto-populated Uneditable Metadata */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Recorded Date & Time (Locked)
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                <span>{formatDate(currentFacilityDate)}, {formatTime(simulatedIso)}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Logged By
              </span>
              <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-800">
                <User className="w-3.5 h-3.5 text-brand-600" />
                <span>{currentUser?.name} ({currentUser?.role})</span>
              </div>
            </div>
          </div>

          {/* Clinical Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Clinical Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Patient complaining of chills, shivering observed..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md shadow-brand-500/20 transition"
            >
              <Check className="w-4 h-4" />
              Save Reading
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
