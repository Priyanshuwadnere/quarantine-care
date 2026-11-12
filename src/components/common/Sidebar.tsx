import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ClipboardList, 
  Stethoscope, 
  CheckCircle2, 
  Bed, 
  FileOutput, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  Users,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePatientStore } from '../../store/patientStore';
import { useSettingsStore } from '../../store/settingsStore';
import { calculateMortalityMetrics } from '../../utils/mortality';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuthStore();
  const { patients, beds, waitlist, historicalClosedCases } = usePatientStore();
  const { settings } = useSettingsStore();

  const role = currentUser?.role || 'nurse';

  // Metrics for badges
  const eligibleDischargesCount = patients.filter(
    (p) => p.status === 'discharge_eligible' || p.feverFreeDaysCount >= 3
  ).length;

  const confirmedDischargesCount = patients.filter(
    (p) => p.status === 'discharge_confirmed'
  ).length;

  const deceasedPendingRelease = patients.filter(
    (p) => p.status === 'deceased' && p.bedReleaseStatus === 'pending'
  ).length;

  // Calculate mortality alert for Head Doctor badge
  const curedCount = historicalClosedCases.filter(c => c.outcome === 'cured').length;
  const deathsCount = historicalClosedCases.filter(c => c.outcome === 'deceased').length;
  const mortalityMetrics = calculateMortalityMetrics(
    curedCount,
    deathsCount,
    settings.mortalityAlertLimit,
    85.0,
    settings.alertMinCases
  );

  const getNavLinks = () => {
    switch (role) {
      case 'nurse':
        return [
          {
            to: '/nurse',
            label: 'Nurse Worklist',
            icon: <ClipboardList className="w-4 h-4" />,
            badge: `${patients.filter(p => p.status === 'admitted').length} Active`,
          },
          {
            to: '/admin/beds',
            label: 'Bed Map',
            icon: <Bed className="w-4 h-4" />,
          },
        ];

      case 'doctor':
        return [
          {
            to: '/doctor',
            label: 'Ready for Review',
            icon: <Stethoscope className="w-4 h-4" />,
            badge: `${patients.filter(p => p.status === 'admitted').length}`,
          },
          {
            to: '/doctor/discharge-queue',
            label: 'Discharge Queue',
            icon: <CheckCircle2 className="w-4 h-4" />,
            badge: eligibleDischargesCount > 0 ? `${eligibleDischargesCount} Eligible` : undefined,
            badgeVariant: 'success',
          },
          {
            to: '/admin/beds',
            label: 'Facility Bed Map',
            icon: <Bed className="w-4 h-4" />,
          },
        ];

      case 'admin':
        return [
          {
            to: '/admin/beds',
            label: 'Bed Map & Admission',
            icon: <Bed className="w-4 h-4" />,
            badge: `${beds.filter(b => b.status === 'occupied').length}/74`,
          },
          {
            to: '/admin/discharge-processing',
            label: 'Discharge Processing',
            icon: <FileOutput className="w-4 h-4" />,
            badge: confirmedDischargesCount + deceasedPendingRelease > 0 
              ? `${confirmedDischargesCount + deceasedPendingRelease} Pending` 
              : undefined,
            badgeVariant: 'warning',
          },
          {
            to: '/nurse',
            label: 'Patient Directory',
            icon: <Users className="w-4 h-4" />,
          },
        ];

      case 'head_doctor':
        return [
          {
            to: '/head-doctor',
            label: 'Quality Dashboard',
            icon: <BarChart3 className="w-4 h-4" />,
            badge: mortalityMetrics.isAlertActive ? 'Alert' : undefined,
            badgeVariant: 'danger',
          },
          {
            to: '/doctor',
            label: 'Ready for Review',
            icon: <Stethoscope className="w-4 h-4" />,
          },
          {
            to: '/doctor/discharge-queue',
            label: 'Discharge Queue',
            icon: <CheckCircle2 className="w-4 h-4" />,
            badge: eligibleDischargesCount > 0 ? `${eligibleDischargesCount}` : undefined,
          },
          {
            to: '/admin/beds',
            label: 'Bed Map & Capacity',
            icon: <Bed className="w-4 h-4" />,
          },
          {
            to: '/admin/discharge-processing',
            label: 'Discharge Desk',
            icon: <FileOutput className="w-4 h-4" />,
          },
          {
            to: '/head-doctor/settings',
            label: 'Clinical Settings',
            icon: <Settings className="w-4 h-4" />,
          },
          {
            to: '/head-doctor/audit',
            label: 'Facility Audit Log',
            icon: <ShieldCheck className="w-4 h-4" />,
          },
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-[57px] left-0 z-40 h-[calc(100vh-57px)] w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out shrink-0 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Active Role Indicator */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Workspace
            </span>
            <p className="text-sm font-bold text-slate-800 capitalize mt-0.5">
              {role.replace('_', ' ')} Workspace
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                end={link.to === '/doctor' || link.to === '/head-doctor' || link.to === '/admin/beds'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-white' : 'text-slate-500'}>
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </div>

                    {link.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : link.badgeVariant === 'danger'
                            ? 'bg-red-100 text-red-700'
                            : link.badgeVariant === 'success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : link.badgeVariant === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Facility Status Widget */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
            <span className="font-medium">Facility Capacity:</span>
            <strong className="text-slate-900 font-bold">
              {beds.filter(b => b.status === 'occupied').length} / 74
            </strong>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{
                width: `${(beds.filter(b => b.status === 'occupied').length / 74) * 100}%`,
              }}
            />
          </div>
          {waitlist.length > 0 && (
            <p className="text-[11px] text-amber-700 font-medium mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{waitlist.length} waitlisted patients awaiting beds</span>
            </p>
          )}
        </div>
      </aside>
    </>
  );
};
