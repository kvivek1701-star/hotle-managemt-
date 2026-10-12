import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { PayrollRecord } from '../../types/hrms';
import {
  Wallet,
  Play,
  CheckCircle2,
  IndianRupee,
  Download,
  Trash2,
  FileText,
  Search,
  Filter,
  Eye,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { HRMSTab } from './HRMSSidebar';
import { formatINR } from '../../utils/formatters';

interface PayrollManagementViewProps {
  onOpenPayslip: (record: PayrollRecord) => void;
  onNavigateTab: (tab: HRMSTab) => void;
}

export const PayrollManagementView: React.FC<PayrollManagementViewProps> = ({
  onOpenPayslip,
  onNavigateTab,
}) => {
  const {
    employees,
    payrollRecords,
    generateMonthlyPayroll,
    approvePayrollRecord,
    markPayrollPaid,
    deletePayrollRecord,
    settings,
  } = useHRMS();

  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Disbursement modal state
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [disburseTargetRecord, setDisburseTargetRecord] = useState<PayrollRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PayrollRecord['paymentMethod']>('bank_transfer');
  const [transactionRef, setTransactionRef] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PayrollRecord | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRunPayrollBatch = () => {
    const res = generateMonthlyPayroll(selectedMonth, departmentFilter);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenDisburse = (rec: PayrollRecord) => {
    setDisburseTargetRecord(rec);
    setPaymentMethod('bank_transfer');
    setTransactionRef(`ACH-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setDisburseModalOpen(true);
  };

  const handleConfirmDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseTargetRecord) return;

    const res = markPayrollPaid(disburseTargetRecord.id, paymentMethod, transactionRef);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setDisburseModalOpen(false);
    setDisburseTargetRecord(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!recordToDelete) return;
    const res = deletePayrollRecord(recordToDelete.id);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setDeleteModalOpen(false);
    setRecordToDelete(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Export CSV
  const handleExportPayrollCSV = () => {
    const headers = [
      'Payroll Month',
      'Employee ID',
      'Name',
      'Department',
      'Job Title',
      'Base Pay',
      'Present Days',
      'OT Hours',
      'OT Pay',
      'Gross Salary',
      'Deductions',
      'Net Salary',
      'Status',
      'Payment Method',
      'Transaction Ref',
    ];

    const rows = filteredRecords.map(r => [
      r.payrollMonth,
      r.employeeId,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      `"${r.jobTitle}"`,
      r.basePay,
      r.actualPresentDays,
      r.overtimeHours,
      r.overtimePay,
      r.grossSalary,
      r.totalDeductions,
      r.netSalary,
      r.paymentStatus,
      r.paymentMethod || 'N/A',
      r.transactionRef || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payroll_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback({ type: 'success', text: 'Downloaded payroll audit spreadsheet as CSV.' });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filter records
  const filteredRecords = payrollRecords.filter(r => {
    const matchesMonth = r.payrollMonth === selectedMonth;
    const matchesDept = departmentFilter === 'All' || r.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || r.paymentStatus === statusFilter;
    const matchesQuery =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesDept && matchesStatus && matchesQuery;
  });

  const totalNetLiability = filteredRecords.reduce((sum, r) => sum + r.netSalary, 0);
  const totalGrossPayroll = filteredRecords.reduce((sum, r) => sum + r.grossSalary, 0);
  const totalDeductionsHeld = filteredRecords.reduce((sum, r) => sum + r.totalDeductions, 0);
  const totalOTDisbursed = filteredRecords.reduce((sum, r) => sum + r.overtimePay, 0);

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
          <h2 className="text-xl font-bold text-white tracking-tight">Salary & Automated Payroll Processing</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compute regular wages from biometric punches, approved overtime, statutory tax withholdings, and disburse salaries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPayrollCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRunPayrollBatch}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Compute Month Payroll</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Total Net Payable</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatINR(totalNetLiability, { showDecimals: true })}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{filteredRecords.length} statements in {selectedMonth}</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Gross Earnings Total</p>
          <p className="text-2xl font-black text-white mt-1">{formatINR(totalGrossPayroll, { showDecimals: true })}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Before tax & benefits deductions</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Total Deductions Held</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{formatINR(totalDeductionsHeld, { showDecimals: true })}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Income Tax, PF & Insurance</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-[11px] font-semibold text-slate-400">Overtime Earnings</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatINR(totalOTDisbursed, { showDecimals: true })}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Approved timesheet OT credits</p>
        </div>
      </div>

      {/* Control Bar: Select Month & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Pay Period:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Department:</span>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Departments</option>
            <option value="Front Desk">Front Desk</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Kitchen & Culinary">Kitchen & Culinary</option>
            <option value="Maintenance & Facilities">Maintenance & Facilities</option>
            <option value="Security & Safety">Security & Safety</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Management">Management</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="draft">Draft Computed</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid / Disbursed</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-3">Base Pay</th>
                <th className="py-3.5 px-3">Attendance / Days</th>
                <th className="py-3.5 px-3">OT Pay</th>
                <th className="py-3.5 px-3">Gross Salary</th>
                <th className="py-3.5 px-3">Deductions</th>
                <th className="py-3.5 px-3">Net Payable</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No payroll records generated for {selectedMonth} yet. Click "Compute Month Payroll" above to batch generate!
                  </td>
                </tr>
              ) : (
                filteredRecords.map(pr => (
                  <tr key={pr.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{pr.employeeName}</p>
                      <p className="text-[11px] text-slate-400">{pr.department} · {pr.jobTitle}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300 font-semibold">
                      {formatINR(pr.basePay)}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400">
                      {pr.actualPresentDays} / {pr.workingDaysInMonth} days
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-400">
                      {pr.overtimePay > 0 ? `+${formatINR(pr.overtimePay, { showDecimals: true })}` : '₹0.00'}
                    </td>
                    <td className="py-3 px-3 font-mono text-white font-bold">
                      {formatINR(pr.grossSalary)}
                    </td>
                    <td className="py-3 px-3 font-mono text-rose-400">
                      -{formatINR(pr.totalDeductions)}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-400 text-sm">
                      {formatINR(pr.netSalary)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          pr.paymentStatus === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : pr.paymentStatus === 'approved'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {pr.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Payslip Button */}
                        <button
                          onClick={() => onOpenPayslip(pr)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="View Official Payslip & Export PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Payslip</span>
                        </button>

                        {/* Approve Button */}
                        {pr.paymentStatus === 'draft' && (
                          <button
                            onClick={() => approvePayrollRecord(pr.id)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                        )}

                        {/* Disburse Button */}
                        {pr.paymentStatus === 'approved' && (
                          <button
                            onClick={() => handleOpenDisburse(pr)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            Disburse
                          </button>
                        )}

                        {/* Delete with Confirmation Modal */}
                        <button
                          onClick={() => {
                            setRecordToDelete(pr);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Payroll Statement"
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

      {/* Disburse Salary Modal */}
      {disburseModalOpen && disburseTargetRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setDisburseModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Disburse Salary Payment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Authorize salary wire payment of <strong className="text-emerald-400">{formatINR(disburseTargetRecord.netSalary)}</strong> to {disburseTargetRecord.employeeName}.
            </p>

            <form onSubmit={handleConfirmDisbursement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Disbursement Channel</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="bank_transfer">Direct Bank Wire (ACH/SWIFT)</option>
                  <option value="direct_deposit">Electronic Direct Deposit</option>
                  <option value="cheque">Payroll Company Cheque</option>
                  <option value="cash">Cash Pay Packet</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bank Reference / UTR / Transaction ID</label>
                <input
                  type="text"
                  required
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee:</span>
                  <span className="font-bold text-white">{disburseTargetRecord.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gross Salary:</span>
                  <span className="text-slate-300 font-mono">{formatINR(disburseTargetRecord.grossSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Deductions:</span>
                  <span className="text-rose-400 font-mono">-{formatINR(disburseTargetRecord.totalDeductions)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="font-bold text-slate-200">Net Credited:</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatINR(disburseTargetRecord.netSalary)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDisburseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm & Mark as Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Payroll Deletion */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Payroll Statement"
        itemName={recordToDelete ? `${recordToDelete.employeeName} (${recordToDelete.payrollMonth})` : undefined}
        message="Are you sure you want to delete this payroll record? If re-computed later, it will be recalculated based on timesheet data."
        confirmLabel="Permanently Delete Statement"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
      />
    </div>
  );
};
