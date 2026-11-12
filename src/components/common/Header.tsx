import React, { useState } from 'react';
import { 
  Activity, 
  Calendar, 
  RotateCcw, 
  LogOut, 
  ChevronDown, 
  HelpCircle, 
  Clock, 
  FastForward,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSimulationStore } from '../../store/simulationStore';
import { usePatientStore } from '../../store/patientStore';
import { useToast } from './Toast';
import { HowToTestModal } from './HowToTestModal';
import { ConfirmationModal } from './ConfirmationModal';
import { Role } from '../../types/user';
import { useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '../../utils/permissions';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { currentUser, switchRole, logout } = useAuthStore();
  const { currentFacilityDate, simulatedHour, advanceFacilityDate, advanceSimulatedHour } = useSimulationStore();
  const { recalculateAllCureProgress, resetDemoData } = usePatientStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [isHowToTestOpen, setIsHowToTestOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const handleRoleChange = (role: Role) => {
    switchRole(role);
    setIsRoleMenuOpen(false);
    toast.info(`Switched role to ${role.toUpperCase().replace('_', ' ')}`);
    navigate(getDefaultRouteForRole(role));
  };

  const handleAdvanceDay = () => {
    const nextDate = advanceFacilityDate();
    recalculateAllCureProgress();
    toast.success('Simulation Date Advanced', `Facility date advanced to ${nextDate}. Daily status updated.`);
  };

  const handleAdvanceHour = () => {
    advanceSimulatedHour(1);
    toast.info('Simulated Clock Advanced', 'Advanced simulated time by +1 hour.');
  };

  const handleResetData = () => {
    resetDemoData();
    setIsResetConfirmOpen(false);
    toast.success('Demo Data Reset', 'Facility state restored to initial 74-bed seed dataset.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Brand & Mobile Menu */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                aria-label="Toggle navigation"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => currentUser && navigate(getDefaultRouteForRole(currentUser.role))}>
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                    QuarantineCare
                  </span>
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200">
                    SaaS
                  </span>
                </div>
                <p className="hidden md:block text-[11px] text-slate-500 font-medium">
                  Smarter Patient Care. Better Facility Management.
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Simulation Controls */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg shadow-xs border border-slate-200/60 font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Facility Date:</span>
              <strong className="text-slate-900">{currentFacilityDate}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 text-slate-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{String(simulatedHour).padStart(2, '0')}:30</span>
            </div>

            <button
              onClick={handleAdvanceHour}
              title="Advance clock by 1 hour (test overdue 2-hr discharges)"
              className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-200 transition flex items-center gap-1"
            >
              <FastForward className="w-3 h-3 text-brand-600" />
              <span>+1h</span>
            </button>

            <button
              onClick={handleAdvanceDay}
              title="Advance facility day by 1 day (test 3-day fever-free discharge boundary)"
              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-xs transition flex items-center gap-1"
            >
              <FastForward className="w-3 h-3 text-white" />
              <span>Advance Day (+1d)</span>
            </button>
          </div>

          {/* Right: How to Test, Role Switcher & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* How to Test Button */}
            <button
              onClick={() => setIsHowToTestOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-lg shadow-xs transition"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">How to Test</span>
              <span className="sm:hidden">Guide</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              title="Reset state to initial seed data"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Role Switcher Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-left"
                >
                  <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor || 'bg-brand-600'} flex items-center justify-center text-white font-bold text-xs shadow-xs`}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium capitalize">
                      {currentUser.role.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isRoleMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Demo Role Switcher
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Instantly test role-based access & workflows
                      </p>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {(['nurse', 'doctor', 'admin', 'head_doctor'] as Role[]).map((r) => {
                        const isSelected = currentUser.role === r;
                        return (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(r)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${
                              isSelected
                                ? 'bg-brand-50 text-brand-700 font-semibold'
                                : 'text-slate-700 hover:bg-slate-100 font-medium'
                            }`}
                          >
                            <span className="capitalize">{r.replace('_', ' ')}</span>
                            {isSelected && <span className="text-[10px] bg-brand-200 text-brand-900 px-1.5 py-0.5 rounded">Active</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Simulation Bar */}
        <div className="xl:hidden px-4 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            <span>Date: <strong>{currentFacilityDate}</strong> ({String(simulatedHour).padStart(2, '0')}:30)</span>
          </div>
          <button
            onClick={handleAdvanceDay}
            className="px-2 py-0.5 bg-brand-600 text-white font-medium rounded text-[11px]"
          >
            Advance Day (+1d)
          </button>
        </div>
      </header>

      {/* How to Test Modal */}
      <HowToTestModal
        isOpen={isHowToTestOpen}
        onClose={() => setIsHowToTestOpen(false)}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset Demo Data?"
        message="This will restore all 74 patient records, bed occupancy, audit logs, and settings to the initial baseline seed data. Any new entries will be cleared."
        confirmLabel="Yes, Reset Data"
        variant="warning"
      />
    </>
  );
};
