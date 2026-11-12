import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  Activity,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuditStore } from '../store/auditStore';
import { AuditAction } from '../types/audit';
import { Role } from '../types/user';
import { formatDateTime } from '../utils/date';
import { useToast } from '../components/common/Toast';

export const AuditLog: React.FC = () => {
  const { auditLogs } = useAuditStore();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all');

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Role filter
      if (roleFilter !== 'all' && log.userRole !== roleFilter) return false;

      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = log.id.toLowerCase().includes(q);
        const matchesUser = log.userName.toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesPatient = log.patientId?.toLowerCase().includes(q) || false;
        const matchesBed = log.bedId?.toLowerCase().includes(q) || false;
        const matchesReason = log.reason?.toLowerCase().includes(q) || false;
        const matchesDetails = log.details?.toLowerCase().includes(q) || false;

        return matchesId || matchesUser || matchesAction || matchesPatient || matchesBed || matchesReason || matchesDetails;
      }

      return true;
    });
  }, [auditLogs, roleFilter, actionFilter, searchQuery]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No Data', 'No audit logs to export.');
      return;
    }

    const headers = ['Event ID', 'Action', 'User', 'Role', 'Patient ID', 'Bed ID', 'Timestamp', 'Previous Value', 'New Value', 'Reason', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.action,
      `"${l.userName}"`,
      l.userRole,
      l.patientId || '',
      l.bedId || '',
      l.timestamp,
      `"${l.previousValue || ''}"`,
      `"${l.newValue || ''}"`,
      `"${l.reason || ''}"`,
      `"${l.details || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QuarantineCare_AuditLog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Export Successful', `Exported ${filteredLogs.length} audit records to CSV.`);
  };

  const getActionBadgeColor = (action: AuditAction) => {
    switch (action) {
      case 'DEATH_RECORD':
      case 'DEATH_CORRECTION':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TEMPERATURE_CORRECTION':
      case 'DUPLICATE_READING':
      case 'DISCHARGE_DEFERRAL':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DISCHARGE_CONFIRMATION':
      case 'DISCHARGE_PROCESSING':
      case 'BED_RELEASE':
      case 'WAITLIST_ADMISSION':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Facility Forensic Audit Trail
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Immutable historical register of all clinical vitals, doctor visits, bed reallocations, and settings modifications
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-500 font-semibold">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none capitalize"
            >
              <option value="all">All Roles</option>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
              <option value="head_doctor">Head Doctor</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl">
            <span className="text-slate-500 font-semibold">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">All Event Actions</option>
              <option value="TEMPERATURE_RECORDING">TEMPERATURE_RECORDING</option>
              <option value="DUPLICATE_READING">DUPLICATE_READING</option>
              <option value="TEMPERATURE_CORRECTION">TEMPERATURE_CORRECTION</option>
              <option value="DOCTOR_VISIT">DOCTOR_VISIT</option>
              <option value="DISCHARGE_CONFIRMATION">DISCHARGE_CONFIRMATION</option>
              <option value="DISCHARGE_DEFERRAL">DISCHARGE_DEFERRAL</option>
              <option value="DISCHARGE_PROCESSING">DISCHARGE_PROCESSING</option>
              <option value="DEATH_RECORD">DEATH_RECORD</option>
              <option value="DEATH_CORRECTION">DEATH_CORRECTION</option>
              <option value="WAITLIST_ADMISSION">WAITLIST_ADMISSION</option>
              <option value="SETTINGS_CHANGE">SETTINGS_CHANGE</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search event, patient, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold">Showing {filteredLogs.length} audit entries</span>
          <span>Chronological order (newest first)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Event ID</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Actor / Role</th>
                <th className="px-5 py-3">Target (Pt / Bed)</th>
                <th className="px-5 py-3">Facility Date / Time</th>
                <th className="px-5 py-3">Values & Changes</th>
                <th className="px-5 py-3">Reason & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3 font-mono text-[11px] font-bold text-slate-800">
                    {log.id}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{log.userRole.replace('_', ' ')}</div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-700">
                    {log.patientId ? (
                      <div>
                        <span>{log.patientId}</span>
                        {log.bedId && <span className="ml-1 text-slate-400">({log.bedId})</span>}
                      </div>
                    ) : log.bedId ? (
                      <span>Bed {log.bedId}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    <div>{log.facilityDate}</div>
                    <div className="text-[10px] text-slate-400">{formatDateTime(log.timestamp)}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {log.previousValue && (
                      <div className="text-[11px] text-slate-400 line-through">
                        {log.previousValue}
                      </div>
                    )}
                    {log.newValue && (
                      <div className="font-bold text-slate-900">{log.newValue}</div>
                    )}
                    {!log.previousValue && !log.newValue && <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-600 max-w-xs">
                    {log.reason && (
                      <div className="font-semibold text-slate-900 mb-0.5">
                        Reason: {log.reason}
                      </div>
                    )}
                    {log.details && <div className="text-[11px] text-slate-500">{log.details}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No Matching Audit Entries</p>
            <p className="text-xs mt-0.5">Try clearing filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};
