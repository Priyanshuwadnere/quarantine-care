import React, { useState, useEffect } from 'react';
import { X, Stethoscope, AlertCircle, CheckCircle2, ShieldAlert, HeartPulse, Clock } from 'lucide-react';
import { Patient } from '../../types/patient';
import { useAuthStore } from '../../store/authStore';
import { useSimulationStore } from '../../store/simulationStore';
import { usePatientStore } from '../../store/patientStore';
import { getTodayReadings, hasReadingToday } from '../../utils/temperature';
import { formatTime, formatDate } from '../../utils/date';
import { useToast } from '../common/Toast';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface VisitNoteModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenRecordTemp?: (patient: Patient) => void;
}

export const VisitNoteModal: React.FC<VisitNoteModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess,
  onOpenRecordTemp,
}) => {
  const { currentUser } = useAuthStore();
  const { currentFacilityDate, getSimulatedTimestamp } = useSimulationStore();
  const { recordDoctorVisit, recordDeath } = usePatientStore();
  const toast = useToast();

  const [treatmentGiven, setTreatmentGiven] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Death confirmation modal state
  const [isDeathConfirmOpen, setIsDeathConfirmOpen] = useState(false);
  const [deathReason, setDeathReason] = useState('Acute cardiopulmonary arrest secondary to viral pneumonia');

  useEffect(() => {
    if (isOpen) {
      setTreatmentGiven('Paracetamol 650mg IV stat, IV fluids maintenance at 75ml/hr');
      setNotes('Chest clear on auscultation. Hydration adequate. Patient resting comfortably.');
      setFollowUpInstructions('Re-check temperature in 4 hours. Monitor SpO2 continuous.');
      setErrorMessage('');
      setIsDeathConfirmOpen(false);
    }
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const todayReadings = getTodayReadings(patient.temperatureHistory, currentFacilityDate);
  const hasTempToday = hasReadingToday(patient.temperatureHistory, currentFacilityDate);
  const latestTodayReading = todayReadings.length > 0 ? todayReadings[todayReadings.length - 1] : undefined;

  // Has doctor already visited today?
  const alreadyVisitedToday = patient.doctorVisits.some(
    v => v.facilityDate === currentFacilityDate && v.isDailyVisit
  );

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) return;

    if (!hasTempToday) {
      setErrorMessage('Cannot complete visit: Today\'s temperature has not yet been recorded.');
      return;
    }

    const result = recordDoctorVisit(
      patient.id,
      {
        treatmentGiven: treatmentGiven.trim(),
        notes: notes.trim(),
        followUpInstructions: followUpInstructions.trim(),
      },
      currentUser
    );

    if (result.success) {
      toast.success(
        'Doctor Visit Logged',
        `Daily visit and treatment plan recorded for ${patient.name} (${patient.bedNumber}).`
      );
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMessage(result.message || 'Failed to save doctor note.');
    }
  };

  const handleConfirmDeath = () => {
    if (!currentUser) return;

    const result = recordDeath(patient.id, deathReason, currentUser);
    if (result.success) {
      toast.error(
        'Death Protocol Recorded',
        `Patient ${patient.name} recorded as Deceased. Bed ${patient.bedNumber} marked for Admin decontamination.`
      );
      setIsDeathConfirmOpen(false);
      if (onSuccess) onSuccess();
      onClose();
    } else {
      toast.error('Error', result.message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Doctor Clinical Visit & Orders</h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Bed {patient.bedNumber} • {patient.name} ({patient.age}y, {patient.gender})
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

          {/* Body */}
          <form onSubmit={handleSaveVisit} className="p-6 overflow-y-auto space-y-5">
            {/* Vitals Summary Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-brand-600" />
                  Today's Temperature Reading
                </span>
                <span className="text-xs text-slate-500">{formatDate(currentFacilityDate)}</span>
              </div>

              {hasTempToday && latestTodayReading ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-bold ${
                        latestTodayReading.isFever ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {latestTodayReading.temperature.toFixed(1)}°C
                    </span>
                    <div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          latestTodayReading.isFever
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {latestTodayReading.isFever ? 'Fever Active' : 'Normal / Afebrile'}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Recorded at {formatTime(latestTodayReading.recordedAt)} by {latestTodayReading.recordedBy}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Awaiting Temperature:</strong> Nurse has not recorded a reading for today yet.
                    </span>
                  </div>
                  {onOpenRecordTemp && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenRecordTemp(patient);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition"
                    >
                      Record Temp as Fallback
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Treatment Given */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Treatment Administered / Medications
              </label>
              <textarea
                rows={2}
                value={treatmentGiven}
                onChange={(e) => setTreatmentGiven(e.target.value)}
                placeholder="Prescribed medicines, dosages, IV infusions..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                required
              />
            </div>

            {/* Clinical Observations */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Physician Clinical Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Examination findings, respiratory effort, general condition..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                required
              />
            </div>

            {/* Follow-up Orders */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Follow-up Instructions for Nursing Staff
              </label>
              <input
                type="text"
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                placeholder="e.g., Reposition patient q2h, repeat blood pressure in 2h..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            {/* Doctor & Timestamp metadata */}
            <div className="flex items-center justify-between text-xs text-slate-500 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Visit Timestamp: {formatTime(getSimulatedTimestamp())}</span>
              </span>
              <span>Attending: <strong>{currentUser?.name}</strong></span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {/* Record Death Trigger */}
              <button
                type="button"
                onClick={() => setIsDeathConfirmOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                Record Death
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hasTempToday}
                  title={!hasTempToday ? 'Awaiting temperature. Mark Visited disabled.' : undefined}
                  className={`flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl shadow-md transition ${
                    hasTempToday
                      ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {alreadyVisitedToday ? 'Add Clinical Note' : 'Save Note & Mark Visited'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Record Death Clinical Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isDeathConfirmOpen}
        onClose={() => setIsDeathConfirmOpen(false)}
        onConfirm={handleConfirmDeath}
        title={`Record Clinical Death for Bed ${patient.bedNumber}?`}
        message={`WARNING: Recording death is a permanent clinical action.\n\nPatient: ${patient.name} (${patient.id})\nBed: ${patient.bedNumber}\n\nUpon confirmation:\n1. Patient status will become DECEASED.\n2. Removed from active Nurse and Doctor worklists.\n3. Bed will turn RED and create an Admin bed-release decontamination task.\n4. Facility mortality analytics will immediately update.\n\nPlease confirm.`}
        confirmLabel="Confirm Clinical Death"
        variant="danger"
      />
    </>
  );
};
