import React, { useState, useMemo } from 'react';
import { 
  Bed as BedIcon, 
  UserPlus, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  X, 
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { usePatientStore } from '../store/patientStore';
import { useSimulationStore } from '../store/simulationStore';
import { useAuthStore } from '../store/authStore';
import { Bed, BedStatus } from '../types/bed';
import { useToast } from '../components/common/Toast';
import { useNavigate } from 'react-router-dom';

export const BedMap: React.FC = () => {
  const { beds, patients, waitlist, registerAndAdmitPatient } = usePatientStore();
  const { currentFacilityDate } = useSimulationStore();
  const { currentUser } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<'all' | BedStatus>('all');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);

  // Admission form state
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<string>('35');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [contactNumber, setContactNumber] = useState('');

  // Counts
  const totalCapacity = 74;
  const occupiedCount = beds.filter((b) => b.status === 'occupied').length;
  const availableCount = beds.filter((b) => b.status === 'available').length;
  const pendingReleaseCount = beds.filter((b) => b.status === 'pending_release').length;
  const deceasedAwaitingCount = beds.filter((b) => b.status === 'deceased_awaiting_release').length;
  const occupancyPercent = Math.round((occupiedCount / totalCapacity) * 100);

  // Filtered beds
  const filteredBeds = useMemo(() => {
    if (statusFilter === 'all') return beds;
    return beds.filter((b) => b.status === statusFilter);
  }, [beds, statusFilter]);

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const ageNum = parseInt(age, 10);
    if (!patientName.trim() || isNaN(ageNum) || ageNum <= 0) {
      toast.error('Validation Error', 'Please enter valid patient name and age.');
      return;
    }

    const res = registerAndAdmitPatient(
      {
        name: patientName.trim(),
        age: ageNum,
        gender,
        contactNumber: contactNumber.trim() || undefined,
      },
      currentUser
    );

    if (res.success) {
      if (res.assignedBed) {
        toast.success(
          'Patient Admitted',
          `${patientName} successfully admitted into Bed ${res.assignedBed}.`
        );
      } else {
        toast.warning(
          'Placed on Waitlist',
          `Facility at 100% capacity. ${patientName} placed on FIFO Waitlist at Position #${res.waitlistPosition}.`
        );
      }
      setIsAdmissionModalOpen(false);
      setPatientName('');
      setAge('35');
      setContactNumber('');
    } else {
      toast.error('Admission Error', res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <BedIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Facility 74-Bed Map & Occupancy
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time spatial visualization of all 74 isolation and treatment units (B-01 to B-74)
            </p>
          </div>
        </div>

        {/* Admission Action */}
        <button
          onClick={() => setIsAdmissionModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Patient Triage / Admission</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Occupied Beds</span>
            <span className="w-3 h-3 rounded-full bg-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-900">{occupiedCount}</span>
            <span className="text-xs text-slate-500">of 74 beds</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-blue-700">
            {occupancyPercent}% Total Capacity
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Available Beds</span>
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-900">{availableCount}</span>
            <span className="text-xs text-slate-500">ready for admission</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-emerald-700">
            {availableCount > 0 ? 'Accepting Patients' : 'Zero Vacancy'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Pending Release</span>
            <span className="w-3 h-3 rounded-full bg-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-900">{pendingReleaseCount}</span>
            <span className="text-xs text-slate-500">confirmed discharge</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-amber-700">
            Awaiting Admin Processing
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-red-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Deceased Release</span>
            <span className="w-3 h-3 rounded-full bg-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-900">{deceasedAwaitingCount}</span>
            <span className="text-xs text-slate-500">awaiting sanitize</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-red-700">
            Mortality Bed Clearance
          </div>
        </div>
      </div>

      {/* Legend & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Bed Status Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-600" />
            <span className="text-slate-700 font-medium">Occupied (Blue)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-600" />
            <span className="text-slate-700 font-medium">Available (Green)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-slate-700 font-medium">Pending Release (Amber)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-600" />
            <span className="text-slate-700 font-medium">Deceased Awaiting (Red)</span>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          {(['all', 'occupied', 'available', 'pending_release', 'deceased_awaiting_release'] as (
            | 'all'
            | BedStatus
          )[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 74-Bed Interactive Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2.5">
          {filteredBeds.map((bed) => {
            let bgClass = 'bg-blue-600 text-white hover:bg-blue-700';
            let borderClass = 'border-blue-700';

            if (bed.status === 'available') {
              bgClass = 'bg-emerald-600 text-white hover:bg-emerald-700';
              borderClass = 'border-emerald-700';
            } else if (bed.status === 'pending_release') {
              bgClass = 'bg-amber-500 text-white hover:bg-amber-600';
              borderClass = 'border-amber-600';
            } else if (bed.status === 'deceased_awaiting_release') {
              bgClass = 'bg-red-600 text-white hover:bg-red-700 animate-pulse';
              borderClass = 'border-red-700';
            }

            return (
              <button
                key={bed.id}
                onClick={() => setSelectedBed(bed)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 shadow-xs cursor-pointer ${bgClass} ${borderClass}`}
                title={`Bed ${bed.id}: ${bed.status.replace('_', ' ')}`}
              >
                <span className="font-extrabold text-xs tracking-wider">{bed.id}</span>
                <span className="text-[9px] opacity-80 uppercase tracking-widest mt-0.5 truncate max-w-full">
                  {bed.status === 'occupied'
                    ? 'Occupied'
                    : bed.status === 'available'
                    ? 'Vacant'
                    : bed.status === 'pending_release'
                    ? 'Pending'
                    : 'Deceased'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bed Detail Drawer / Modal */}
      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold px-3 py-1 bg-slate-900 text-white rounded-lg text-sm">
                  {selectedBed.id}
                </span>
                <h3 className="font-bold text-base text-slate-900">Bed Details</h3>
              </div>
              <button
                onClick={() => setSelectedBed(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className="font-bold capitalize text-slate-900 px-2 py-0.5 bg-white rounded border border-slate-200">
                  {selectedBed.status.replace('_', ' ')}
                </span>
              </div>

              {selectedBed.currentPatientId ? (
                (() => {
                  const patient = patients.find((p) => p.id === selectedBed.currentPatientId);
                  return patient ? (
                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Assigned Patient
                        </span>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {patient.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{patient.name}</p>
                      <p className="text-slate-500">
                        {patient.age} yrs • {patient.gender} • Admitted {patient.admissionDate}
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedBed(null);
                            navigate(`/patient/${patient.id}`);
                          }}
                          className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-xs transition"
                        >
                          View Full Patient Profile
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500">Patient info not found.</p>
                  );
                })()
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-900">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                  <p className="font-bold">Bed Ready for Immediate Admission</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Sanitized and decontaminated per facility protocol.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBed(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Admission Modal */}
      {isAdmissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-50 text-brand-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Patient Registration & Bed Allocation
                </h3>
              </div>
              <button
                onClick={() => setIsAdmissionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdmissionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Patient Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Anand Mahindra"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Age <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="115"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Emergency Contact Number (Optional)
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Admission Notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                {availableCount > 0 ? (
                  <p className="text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{availableCount} beds available. System will automatically assign the first vacant bed.</span>
                  </p>
                ) : (
                  <p className="text-amber-800 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Facility is at 100% capacity (74/74). Patient will be placed on the FIFO Waitlist at Position #{waitlist.length + 1}.</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdmissionModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition"
                >
                  {availableCount > 0 ? 'Admit to Bed' : 'Add to Waitlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
