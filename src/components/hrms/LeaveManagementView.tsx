import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { LeaveRequest, LeaveType } from '../../types/hrms';
import {
  CalendarCheck,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Palmtree,
  Calendar,
  Filter,
  Search,
  X,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const LeaveManagementView: React.FC = () => {
  const {
    employees,
    leaveRequests,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    deleteLeaveRequest,
    getEmployeeLeaveBalance,
    currentEmployeeUser,
  } = useHRMS();

  const [searchEmployee, setSearchEmployee] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: currentEmployeeUser.id,
    leaveType: 'annual' as LeaveType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: '',
  });

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LeaveRequest | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenApply = () => {
    setLeaveForm({
      employeeId: currentEmployeeUser.id,
      leaveType: 'annual',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      totalDays: 1,
      reason: '',
    });
    setApplyModalOpen(true);
  };

  const handleDatesChange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    const days = Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)) + 1);

    setLeaveForm(prev => ({
      ...prev,
      startDate: start,
      endDate: end,
      totalDays: days,
    }));
  };

  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === leaveForm.employeeId);
    if (!emp) return;

    if (!leaveForm.reason.trim()) {
      setFeedback({ type: 'error', text: 'Please provide a reason for the leave application.' });
      return;
    }

    const res = submitLeaveRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      totalDays: Number(leaveForm.totalDays),
      reason: leaveForm.reason,
    });

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setApplyModalOpen(false);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleApprove = (id: string) => {
    const res = approveLeaveRequest(id);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTargetId) return;

    const res = rejectLeaveRequest(rejectTargetId, rejectionNotes);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setRejectModalOpen(false);
    setRejectTargetId(null);
    setRejectionNotes('');
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!recordToDelete) return;
    const res = deleteLeaveRequest(recordToDelete.id);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setDeleteModalOpen(false);
    setRecordToDelete(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filtered requests
  const filteredRequests = leaveRequests.filter(r => {
    const matchesEmp =
      r.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      r.department.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesType = typeFilter === 'All' || r.leaveType === typeFilter;
    return matchesEmp && matchesStatus && matchesType;
  });

  const selectedEmpBalance = getEmployeeLeaveBalance(leaveForm.employeeId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Leave & Absence Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Annual leave entitlements, sick notes, casual days off, approvals, and balance reconciliation
          </p>
        </div>

        <button
          onClick={handleOpenApply}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Entitlement Overview Cards for Logged-In User */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palmtree className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              Annual Entitlements Balance: {currentEmployeeUser.name}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Policy Year 2026</span>
        </div>

        {(() => {
          const bal = getEmployeeLeaveBalance(currentEmployeeUser.id);
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px]">Annual Paid Leave</span>
                <p className="text-xl font-black text-white mt-0.5">{bal.annual - bal.annualUsed} <span className="text-xs text-slate-500">/ {bal.annual} left</span></p>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (bal.annualUsed / bal.annual) * 100)}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px]">Sick Leave</span>
                <p className="text-xl font-black text-white mt-0.5">{bal.sick - bal.sickUsed} <span className="text-xs text-slate-500">/ {bal.sick} left</span></p>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-sky-400" style={{ width: `${Math.min(100, (bal.sickUsed / bal.sick) * 100)}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px]">Casual Leave</span>
                <p className="text-xl font-black text-white mt-0.5">{bal.casual - bal.casualUsed} <span className="text-xs text-slate-500">/ {bal.casual} left</span></p>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (bal.casualUsed / bal.casual) * 100)}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px]">Emergency Leave</span>
                <p className="text-xl font-black text-white mt-0.5">{bal.emergency - bal.emergencyUsed} <span className="text-xs text-slate-500">/ {bal.emergency} left</span></p>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-purple-400" style={{ width: `${Math.min(100, (bal.emergencyUsed / bal.emergency) * 100)}%` }} />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by employee name or department..."
            value={searchEmployee}
            onChange={e => setSearchEmployee(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Leave Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 capitalize"
          >
            <option value="All">All Types</option>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="paid">Paid Leave</option>
            <option value="unpaid">Unpaid Leave</option>
            <option value="emergency">Emergency Leave</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Dates</th>
                <th className="py-3.5 px-3">Days</th>
                <th className="py-3.5 px-3">Reason</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No leave applications found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{r.employeeName}</p>
                      <p className="text-[11px] text-slate-400">{r.department}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-400 border border-slate-700">
                        {r.leaveType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {r.startDate} to {r.endDate}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {r.totalDays} day(s)
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : r.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors"
                              title="Approve Leave"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectTargetId(r.id);
                                setRejectModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700 rounded-lg text-xs transition-colors"
                              title="Reject Leave"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setRecordToDelete(r);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Leave Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setApplyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Apply for Leave</h3>

            <form onSubmit={handleSaveLeaveRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Employee *</label>
                <select
                  value={leaveForm.employeeId}
                  onChange={e => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Leave Type *</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="annual">Annual Leave (AL)</option>
                  <option value="sick">Sick Leave (SL)</option>
                  <option value="casual">Casual Leave (CL)</option>
                  <option value="paid">Paid Special Leave (PL)</option>
                  <option value="emergency">Emergency Leave (EL)</option>
                  <option value="unpaid">Unpaid Leave (Loss of Pay)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={e => handleDatesChange(e.target.value, leaveForm.endDate)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={e => handleDatesChange(leaveForm.startDate, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Total Duration Requested:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {leaveForm.totalDays} Day(s)
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the circumstances or medical necessity..."
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Reject Leave Request</h3>
            <p className="text-xs text-slate-400 mb-4">
              State the operational or staffing reason why this leave cannot be granted.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason for Decision</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Critical staff shortage during high occupancy convention dates..."
                  value={rejectionNotes}
                  onChange={e => setRejectionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Leave Deletion */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Leave Application"
        itemName={recordToDelete ? `${recordToDelete.employeeName} (${recordToDelete.startDate} to ${recordToDelete.endDate})` : undefined}
        message="Are you sure you want to delete this leave record? If previously approved, the employee's leave balance will be restored."
        confirmLabel="Permanently Delete Leave Record"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
      />
    </div>
  );
};
