import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { OvertimeRecord } from '../../types/hrms';
import {
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Filter,
  Search,
  X,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { formatINR } from '../../utils/formatters';

export const OvertimeManagementView: React.FC = () => {
  const {
    employees,
    overtimeRecords,
    submitOvertimeRequest,
    approveOvertimeRequest,
    rejectOvertimeRequest,
    deleteOvertimeRecord,
    settings,
    currentEmployeeUser,
  } = useHRMS();

  const [searchEmployee, setSearchEmployee] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Submit Modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [otForm, setOtForm] = useState({
    employeeId: employees[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    hours: 2,
    rateMultiplier: 1.5,
    hourlyRate: 25,
    reason: '',
  });

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<OvertimeRecord | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenSubmit = () => {
    const defaultEmp = employees[0];
    const calcHourly = defaultEmp
      ? defaultEmp.salaryType === 'hourly'
        ? defaultEmp.payRate
        : Math.round(defaultEmp.payRate / 160)
      : 25;

    setOtForm({
      employeeId: defaultEmp?.id || '',
      date: new Date().toISOString().split('T')[0],
      hours: 1.5,
      rateMultiplier: 1.5,
      hourlyRate: calcHourly,
      reason: '',
    });
    setSubmitModalOpen(true);
  };

  const handleEmployeeChangeInForm = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    const hourly = emp
      ? emp.salaryType === 'hourly'
        ? emp.payRate
        : Math.round(emp.payRate / 160)
      : 25;

    setOtForm(prev => ({
      ...prev,
      employeeId: empId,
      hourlyRate: hourly,
    }));
  };

  const handleSubmitOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === otForm.employeeId);
    if (!emp) return;

    if (!otForm.reason.trim()) {
      setFeedback({ type: 'error', text: 'Please provide a legitimate operational justification reason.' });
      return;
    }

    const res = submitOvertimeRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      date: otForm.date,
      hours: Number(otForm.hours),
      rateMultiplier: Number(otForm.rateMultiplier),
      hourlyRate: Number(otForm.hourlyRate),
      reason: otForm.reason,
    });

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setSubmitModalOpen(false);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleApprove = (id: string) => {
    const res = approveOvertimeRequest(id);
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

    const res = rejectOvertimeRequest(rejectTargetId, rejectionReason);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setRejectModalOpen(false);
    setRejectTargetId(null);
    setRejectionReason('');
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!recordToDelete) return;
    const res = deleteOvertimeRecord(recordToDelete.id);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setDeleteModalOpen(false);
    setRecordToDelete(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filtered records
  const filteredRecords = overtimeRecords.filter(r => {
    const matchesEmp =
      r.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      r.department.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesEmp && matchesStatus;
  });

  const totalApprovedHours = overtimeRecords
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.hours, 0);

  const totalApprovedCost = overtimeRecords
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.calculatedAmount, 0);

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
          <h2 className="text-xl font-bold text-white tracking-tight">Overtime Governance & Approvals</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Authorize premium overtime hours, enforce multipliers (1.5x / 2.0x), and preview payable amounts
          </p>
        </div>

        <button
          onClick={handleOpenSubmit}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Overtime Claim</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Total Approved OT Hours</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{totalApprovedHours.toFixed(1)} hrs</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Validated against timesheet punches</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Total Approved OT Liability</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatINR(totalApprovedCost, { showDecimals: true })}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Will be credited in monthly payroll run</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Pending Approvals</p>
          <p className="text-2xl font-black text-white mt-1">
            {overtimeRecords.filter(r => r.status === 'pending').length} requests
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Requires supervisor or HR sign-off</p>
        </div>
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
      </div>

      {/* Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 px-3">Hours</th>
                <th className="py-3.5 px-3">Multiplier</th>
                <th className="py-3.5 px-3">Payable Amount</th>
                <th className="py-3.5 px-3">Reason / Justification</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No overtime records found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{r.employeeName}</p>
                      <p className="text-[11px] text-slate-400">{r.department}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{r.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{r.hours} hrs</td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {r.rateMultiplier}x ({formatINR(r.hourlyRate)}/h)
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {formatINR(r.calculatedAmount, { showDecimals: true })}
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
                              title="Approve Overtime Claim"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectTargetId(r.id);
                                setRejectModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700 rounded-lg text-xs transition-colors"
                              title="Reject Overtime Claim"
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
                          title="Delete Overtime Record"
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

      {/* Submit Claim Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setSubmitModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Submit Overtime Claim</h3>

            <form onSubmit={handleSubmitOvertime} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Employee *</label>
                <select
                  value={otForm.employeeId}
                  onChange={e => handleEmployeeChangeInForm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Overtime Date *</label>
                <input
                  type="date"
                  required
                  value={otForm.date}
                  onChange={e => setOtForm({ ...otForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Hours Claimed *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    required
                    value={otForm.hours}
                    onChange={e => setOtForm({ ...otForm, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Rate Multiplier</label>
                  <select
                    value={otForm.rateMultiplier}
                    onChange={e => setOtForm({ ...otForm, rateMultiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value={1.5}>1.5x (Standard Overtime)</option>
                    <option value={2.0}>2.0x (Holiday / Rest Day OT)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Calculated Payable Amount:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatINR(otForm.hours * otForm.hourlyRate * otForm.rateMultiplier, { showDecimals: true })}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Operational Justification *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Mandatory banquet hall turnover following late wedding reception..."
                  value={otForm.reason}
                  onChange={e => setOtForm({ ...otForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Submit Overtime
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

            <h3 className="text-lg font-bold text-white mb-2">Reject Overtime Claim</h3>
            <p className="text-xs text-slate-400 mb-4">
              State the reason for rejection so the employee is informed via notification.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Rejection Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Overtime was not pre-authorized by department supervisor."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
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

      {/* Confirmation Modal for Overtime Deletion */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Overtime Record"
        itemName={recordToDelete ? `${recordToDelete.employeeName} (${recordToDelete.date} - ${recordToDelete.hours}h)` : undefined}
        message="Are you sure you want to delete this overtime record? This will permanently remove the claim and prevent it from being included in payroll calculations."
        confirmLabel="Permanently Delete Overtime"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
      />
    </div>
  );
};
