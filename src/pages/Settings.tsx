import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, AlertTriangle, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useSimulationStore } from '../store/simulationStore';
import { usePatientStore } from '../store/patientStore';
import { useToast } from '../components/common/Toast';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { currentUser } = useAuthStore();
  const { currentFacilityDate } = useSimulationStore();
  const { recalculateAllCureProgress } = usePatientStore();
  const toast = useToast();

  const [feverThreshold, setFeverThreshold] = useState<string>(settings.feverThreshold.toString());
  const [mortalityAlertLimit, setMortalityAlertLimit] = useState<string>(settings.mortalityAlertLimit.toString());
  const [reason, setReason] = useState<string>('Clinical safety policy adjustment');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) return;

    const feverNum = parseFloat(feverThreshold);
    const mortalityNum = parseFloat(mortalityAlertLimit);

    if (isNaN(feverNum) || feverNum < 37.0 || feverNum > 40.0) {
      setErrorMessage('Fever threshold must be a valid number between 37.0°C and 40.0°C.');
      return;
    }

    if (isNaN(mortalityNum) || mortalityNum < 1.0 || mortalityNum > 50.0) {
      setErrorMessage('Mortality alert limit must be a valid percentage between 1.0% and 50.0%.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Please provide a mandatory reason for clinical setting alteration.');
      return;
    }

    const res = updateSettings(
      {
        feverThreshold: feverNum,
        mortalityAlertLimit: mortalityNum,
      },
      currentUser,
      reason.trim(),
      currentFacilityDate
    );

    if (res.success) {
      // Recalculate cure progress across all patients with new fever threshold immediately!
      recalculateAllCureProgress();
      toast.success(
        'Settings Updated',
        `Fever Threshold set to ${feverNum}°C, Mortality Alert Limit set to ${mortalityNum}%.`
      );
    } else {
      setErrorMessage(res.message || 'Failed to update settings.');
    }
  };

  const handleResetDefaults = () => {
    resetSettings();
    setFeverThreshold('38.0');
    setMortalityAlertLimit('15.0');
    recalculateAllCureProgress();
    toast.info('Settings Reset', 'Restored default clinical parameters (Fever: 38.0°C, Alert: 15.0%).');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Clinical & Quality Facility Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Head Doctor access only • All modifications are timestamped and recorded in the audit trail
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Settings Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fever Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Clinical Fever Threshold (°C) <span className="text-red-600">*</span>
              </label>
              <span className="text-xs text-slate-500">Default: 38.0°C (Permitted: 37.0 - 40.0°C)</span>
            </div>
            <div className="relative max-w-xs">
              <input
                type="number"
                step="0.1"
                min="37.0"
                max="40.0"
                required
                value={feverThreshold}
                onChange={(e) => setFeverThreshold(e.target.value)}
                className="w-full text-lg font-bold px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <span className="absolute right-4 top-3 text-sm font-bold text-slate-400">°C</span>
            </div>
            <p className="text-xs text-slate-500">
              Any reading equal to or exceeding this threshold is classified as Fever, resetting the patient's consecutive fever-free counter to zero.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Mortality Alert Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Mortality Benchmark Alert Limit (%) <span className="text-red-600">*</span>
              </label>
              <span className="text-xs text-slate-500">Default: 15.0% (Permitted: 1.0 - 50.0%)</span>
            </div>
            <div className="relative max-w-xs">
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="50.0"
                required
                value={mortalityAlertLimit}
                onChange={(e) => setMortalityAlertLimit(e.target.value)}
                className="w-full text-lg font-bold px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <span className="absolute right-4 top-3 text-sm font-bold text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-500">
              When facility mortality exceeds this threshold and closed cases &ge; 20, the prominent red alert banner triggers automatically across management screens.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Facility Capacity (Fixed) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Facility Isolation Capacity (Beds)
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Fixed for Assessment
              </span>
            </div>
            <div className="max-w-xs">
              <input
                type="number"
                disabled
                value={settings.facilityCapacity}
                className="w-full text-lg font-bold px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-500">
              Facility physical capacity is fixed at exactly 74 beds (B-01 through B-74) per assessment specification.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Mandatory Reason for Change */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Mandatory Audit Reason for Configuration Change <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Health ministry updated clinical guideline for fever definition..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
