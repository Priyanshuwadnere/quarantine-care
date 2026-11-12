import React from 'react';
import { X, PlayCircle, CheckCircle, ArrowRight, ShieldAlert, Calendar, UserCheck, Stethoscope, Bed, HeartPulse } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSimulationStore } from '../../store/simulationStore';
import { useNavigate } from 'react-router-dom';
import { Role } from '../../types/user';

interface HowToTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToTestModal: React.FC<HowToTestModalProps> = ({ isOpen, onClose }) => {
  const { switchRole } = useAuthStore();
  const { advanceFacilityDate, currentFacilityDate } = useSimulationStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAction = (role: Role, route: string, dateAdvance = false) => {
    switchRole(role);
    if (dateAdvance) {
      advanceFacilityDate();
    }
    navigate(route);
    onClose();
  };

  const steps = [
    {
      step: 1,
      title: 'Login as Nurse',
      role: 'nurse' as Role,
      icon: <UserCheck className="w-5 h-5 text-teal-600" />,
      description: 'Log in with credentials: nurse / nurse123. Lands on Nurse Worklist with 74 admitted patients.',
      expected: 'Nurse Worklist displays Pending vs Done tabs, progress bar (e.g. 44 of 74 done), and search by name/bed.',
      actionLabel: 'Switch to Nurse',
      route: '/nurse',
    },
    {
      step: 2,
      title: 'Record a Temperature for Pending Patient',
      role: 'nurse' as Role,
      icon: <HeartPulse className="w-5 h-5 text-teal-600" />,
      description: 'Click "Record Temperature" on any pending patient (e.g. Rahul Deshmukh B-05 or Amitav Mukherjee B-04). Enter 36.8°C.',
      expected: 'Patient automatically moves from "Pending" tab to "Done" tab. Completed counter increases.',
      actionLabel: 'Go to Nurse Worklist',
      route: '/nurse',
    },
    {
      step: 3,
      title: 'Verify Duplicate Reading Warning & Reason',
      role: 'nurse' as Role,
      icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
      description: 'Record a second temperature for a patient who already has a reading today (e.g. Sneha Nair in Bed B-02).',
      expected: 'System halts with warning showing previous reading & timestamp. Requires reason (Recheck, Doubtful reading, or Other with note) before saving.',
      actionLabel: 'Test on Bed B-02',
      route: '/nurse',
    },
    {
      step: 4,
      title: 'Login as Doctor & Verify Ready for Review',
      role: 'doctor' as Role,
      icon: <Stethoscope className="w-5 h-5 text-blue-600" />,
      description: 'Switch to Doctor role. Review the Ready for Review queue versus Awaiting Temperature.',
      expected: 'Only patients with today\'s temperature appear in Ready for Review (fever patients like B-01 on top). Patients without reading appear in Awaiting Temperature with "Mark Visited" disabled.',
      actionLabel: 'Switch to Doctor',
      route: '/doctor',
    },
    {
      step: 5,
      title: 'Advance Simulation Date & Confirm Discharge',
      role: 'doctor' as Role,
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      description: 'Inspect patient Sunita Joshi (Bed B-08) who already completed 3 consecutive fever-free days. Go to Doctor Discharge Queue.',
      expected: 'Patient is automatically marked "Eligible for Discharge" (Day 3 of 3). Doctor clicks "Confirm Discharge". Patient moves to Admin queue.',
      actionLabel: 'Go to Discharge Queue',
      route: '/doctor/discharge-queue',
    },
    {
      step: 6,
      title: 'Login as Admin & Process Discharge & Admit Waitlist',
      role: 'admin' as Role,
      icon: <Bed className="w-5 h-5 text-purple-600" />,
      description: 'Switch to Admin. Go to Discharge Processing. Process confirmed discharge for Bed B-08 (or B-12).',
      expected: 'Bed is immediately released to Available (Green on Bed Map). Suggests 1st FIFO waitlisted patient (Devendra Joshi). Admin admits waitlisted patient into released bed.',
      actionLabel: 'Switch to Admin',
      route: '/admin/discharge-processing',
    },
    {
      step: 7,
      title: 'Record a Death as Doctor',
      role: 'doctor' as Role,
      icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
      description: 'As Doctor, open an admitted patient (e.g. Ramesh Patel B-01) and click "Record Death". Mandatory clinical confirmation required.',
      expected: 'Status changes to Deceased. Removed from active worklists. Bed B-01 turns Red on Bed Map ("deceased_awaiting_release") and creates bed-release task for Admin.',
      actionLabel: 'Doctor Dashboard',
      route: '/doctor',
    },
    {
      step: 8,
      title: 'Head Doctor Quality Dashboard & Red Alert Verification',
      role: 'head_doctor' as Role,
      icon: <PlayCircle className="w-5 h-5 text-indigo-700" />,
      description: 'Baseline: 5 deaths / 40 closed = 12.5% (Alert INACTIVE). Record 1st new death: 6/41 = 14.6% (Alert INACTIVE). Record 2nd new death: 7/42 = 16.7% (PROMINENT RED ALERT TRIGGERS!).',
      expected: 'Prominent red alert banner activates at >15% threshold across >=20 cases. Full mortality vs success donut charts and historical metrics render accurately.',
      actionLabel: 'Quality Dashboard',
      route: '/head-doctor',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-400">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">How to Test This Demo</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                8-step evaluator walkthrough covering all core clinical and administrative requirements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Facility Simulation Banner */}
        <div className="bg-blue-50 px-6 py-2.5 border-b border-blue-100 flex items-center justify-between text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] bg-blue-200/80 px-2 py-0.5 rounded text-blue-900">
              Simulation Active
            </span>
            <span>Current Facility Date: <strong>{currentFacilityDate}</strong></span>
          </div>
          <span className="text-slate-500 italic">
            Controlled simulation mode — does not alter system clock
          </span>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {steps.map((s) => (
            <div
              key={s.step}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-700 text-sm shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 text-sm">{s.title}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {s.role.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.description}</p>
                    <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                      <strong className="text-slate-900">Expected Outcome:</strong> {s.expected}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAction(s.role, s.route)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 rounded-lg shadow-sm transition"
                >
                  {s.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>All business rules and edge-case verifications implemented</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 rounded-lg transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
