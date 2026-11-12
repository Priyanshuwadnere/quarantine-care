import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Check, 
  X, 
  ArrowRight, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useSimulationStore } from '../store/simulationStore';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/date';
import { Patient } from '../types/patient';
import { useToast } from '../components/common/Toast';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';

export const DischargeQueue: React.FC = () => {
  const { patients, confirmDischarge, deferDischarge } = usePatientStore();
  const { currentFacilityDate } = useSimulationStore();
  const { currentUser } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [deferModalState, setDeferModalState] = useState<{
    isOpen: boolean;
    patient: Patient | null;
    reason: string;
  }>({
    isOpen: false,
    patient: null,
    reason: '',
  });

  // Eligible patients: status is 'discharge_eligible' OR completed 3 consecutive fever-free days
  const eligiblePatients = useMemo(() => {
    return patients
      .filter((p) => p.status === 'discharge_eligible' || (p.status === 'admitted' && p.feverFreeDaysCount >= 3))
      .map((p) => {
        // Overdue check: if eligible on a prior facility date and not confirmed
        const isOverdue = p.dischargeEligibilityDate && p.dischargeEligibilityDate < currentFacilityDate;
        return {
          patient: p,
          isOverdue,
        };
      })
      .sort((a, b) => {
        // Overdue patients first
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.patient.bedNumber.localeCompare(b.patient.bedNumber);
      });
  }, [patients, currentFacilityDate]);

  // Already confirmed discharges waiting for Admin
  const confirmedDischarges = useMemo(() => {
    return patients.filter((p) => p.status === 'discharge_confirmed');
  }, [patients]);

  const handleConfirmDischarge = (patient: Patient) => {
    if (!currentUser) return;
    const res = confirmDischarge(patient.id, currentUser);
    if (res.success) {
      toast.success(
        'Discharge Confirmed',
        `Discharge for ${patient.name} (${patient.bedNumber}) confirmed and forwarded to Admin discharge queue.`
      );
    } else {
      toast.error('Discharge Error', res.message);
    }
  };

  const handleDeferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !deferModalState.patient) return;

    if (!deferModalState.reason.trim()) {
      toast.error('Reason Required', 'Mandatory deferral reason is required.');
      return;
    }

    const res = deferDischarge(deferModalState.patient.id, deferModalState.reason.trim(), currentUser);
    if (res.success) {
      toast.warning(
        'Discharge Deferred',
        `Discharge for ${deferModalState.patient.name} deferred for continued clinical observation.`
      );
      setDeferModalState({ isOpen: false, patient: null, reason: '' });
    } else {
      toast.error('Deferral Error', res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Physician Discharge Queue
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Patients meeting the strict 3 consecutive full days fever-free criterion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
              Eligible Awaiting Doctor
            </span>
            <span className="text-xl font-extrabold text-emerald-900">{eligiblePatients.length}</span>
          </div>

          <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-purple-600 block tracking-wider">
              Confirmed for Admin
            </span>
            <span className="text-xl font-extrabold text-purple-900">{confirmedDischarges.length}</span>
          </div>
        </div>
      </div>

      {/* Eligible Patients List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Eligible Patients Requiring Doctor Confirmation</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {eligiblePatients.length}
            </span>
          </h2>
          <span className="text-xs text-slate-500">
            Eligibility is automatic; discharge is never automatic
          </span>
        </div>

        {eligiblePatients.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {eligiblePatients.map(({ patient, isOverdue }) => (
              <div
                key={patient.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isOverdue ? 'border-red-300 ring-1 ring-red-200 bg-red-50/20' : 'border-emerald-200'
                }`}
              >
                {/* Left: Patient Details & Qualifying Evidence */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-extrabold px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                      {patient.bedNumber}
                    </span>
                    <h3
                      onClick={() => navigate(`/patient/${patient.id}`)}
                      className="text-base font-bold text-slate-900 hover:text-brand-600 cursor-pointer"
                    >
                      {patient.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      ({patient.age}y, {patient.gender} • {patient.id})
                    </span>

                    {/* Badges */}
                    {isOverdue ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Confirmation Overdue
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Day 3 of 3 Completed
                      </span>
                    )}

                    {patient.dischargeDeferral && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        Previously Deferred: {patient.dischargeDeferral.reason}
                      </span>
                    )}
                  </div>

                  {/* 3 Qualifying Dates Evidence */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Qualifying Afebrile Dates (3 Full Consecutive Days)
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {patient.feverFreeDates.length > 0 ? (
                          patient.feverFreeDates.map((date) => (
                            <span
                              key={date}
                              className="px-2 py-1 bg-white font-semibold text-slate-800 rounded-lg border border-slate-200 shadow-2xs"
                            >
                              ✓ {formatDate(date)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic">Historical qualifying dates recorded</span>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Admitted Date
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatDate(patient.admissionDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex sm:flex-row lg:flex-col items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleConfirmDischarge(patient)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Discharge</span>
                  </button>

                  <button
                    onClick={() =>
                      setDeferModalState({
                        isOpen: true,
                        patient,
                        reason: '',
                      })
                    }
                    className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                    <span>Defer with Reason</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              No Patients Currently Eligible for Discharge
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Patients will appear here automatically as soon as three full consecutive fever-free days have been established across facility day boundaries.
            </p>
          </div>
        )}
      </div>

      {/* Confirmed Discharges Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <h3 className="font-bold text-base text-slate-900">
              Confirmed Discharges Forwarded to Admin Desk ({confirmedDischarges.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Awaiting administrative bed-release processing</span>
        </div>

        {confirmedDischarges.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {confirmedDischarges.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                    {p.bedNumber}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">{p.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      Confirmed by {p.dischargeConfirmation?.doctorName} at{' '}
                      {p.dischargeConfirmation?.confirmedAt
                        ? new Date(p.dischargeConfirmation.confirmedAt).toLocaleTimeString()
                        : 'Today'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    With Admin Desk
                  </span>
                  <button
                    onClick={() => navigate('/admin/discharge-processing')}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                  >
                    <span>View in Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-xs text-slate-400 text-center">
            No confirmed discharges currently in queue.
          </p>
        )}
      </div>

      {/* Deferral Reason Modal */}
      {deferModalState.isOpen && deferModalState.patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Defer Patient Discharge
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: <strong>{deferModalState.patient.name}</strong> ({deferModalState.patient.bedNumber}). Please provide a clinical reason for holding the patient in facility despite afebrile criterion.
            </p>

            <form onSubmit={handleDeferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Clinical Deferral Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={deferModalState.reason}
                  onChange={(e) =>
                    setDeferModalState({ ...deferModalState, reason: e.target.value })
                  }
                  placeholder="e.g. Residual cough with oxygen saturation 93% on room air, observing for additional 24h..."
                  required
                  className="w-full text-xs p-3 border rounded-xl border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeferModalState({ isOpen: false, patient: null, reason: '' })
                  }
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Confirm Deferral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
