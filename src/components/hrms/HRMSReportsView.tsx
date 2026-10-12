import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Clock,
  TrendingUp,
  Palmtree,
  Wallet,
  FileSpreadsheet,
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const HRMSReportsView: React.FC = () => {
  const {
    employees,
    attendanceRecords,
    overtimeRecords,
    leaveRequests,
    payrollRecords,
    dutySchedules,
  } = useHRMS();

  const [reportType, setReportType] = useState<
    'attendance' | 'overtime' | 'leaves' | 'payroll' | 'workforce'
  >('attendance');

  const [dateRange, setDateRange] = useState<'today' | 'this_month' | 'all'>('this_month');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = '2026-10';

  // Export CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Report_${reportType}.csv`;

    if (reportType === 'attendance') {
      headers = ['Date', 'Employee ID', 'Name', 'Department', 'Clock In', 'Clock Out', 'Regular Hours', 'OT Hours', 'Status', 'Late Minutes'];
      rows = attendanceRecords.map(a => [
        a.date,
        a.employeeId,
        `"${a.employeeName}"`,
        `"${a.department}"`,
        a.clockIn || '--',
        a.clockOut || '--',
        a.regularHours,
        a.overtimeHours,
        a.status,
        a.lateMinutes,
      ]);
    } else if (reportType === 'overtime') {
      headers = ['Date', 'Employee ID', 'Name', 'Department', 'Hours', 'Multiplier', 'Payable Amount', 'Status', 'Reason'];
      rows = overtimeRecords.map(o => [
        o.date,
        o.employeeId,
        `"${o.employeeName}"`,
        `"${o.department}"`,
        o.hours,
        o.rateMultiplier,
        o.calculatedAmount,
        o.status,
        `"${o.reason}"`,
      ]);
    } else if (reportType === 'leaves') {
      headers = ['Applied Date', 'Name', 'Department', 'Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'];
      rows = leaveRequests.map(l => [
        l.appliedAt,
        `"${l.employeeName}"`,
        `"${l.department}"`,
        l.leaveType,
        l.startDate,
        l.endDate,
        l.totalDays,
        l.status,
        `"${l.reason}"`,
      ]);
    } else if (reportType === 'payroll') {
      headers = ['Month', 'Name', 'Department', 'Base Pay', 'Present Days', 'OT Pay', 'Gross Pay', 'Total Deductions', 'Net Pay', 'Status'];
      rows = payrollRecords.map(p => [
        p.payrollMonth,
        `"${p.employeeName}"`,
        `"${p.department}"`,
        p.basePay,
        p.actualPresentDays,
        p.overtimePay,
        p.grossSalary,
        p.totalDeductions,
        p.netSalary,
        p.paymentStatus,
      ]);
    } else {
      headers = ['Employee ID', 'Name', 'Department', 'Job Title', 'Type', 'Status', 'Pay Rate', 'Salary Type', 'Joined'];
      rows = employees.map(e => [
        e.employeeId,
        `"${e.name}"`,
        `"${e.department}"`,
        `"${e.jobTitle}"`,
        e.employmentType,
        e.status,
        e.payRate,
        e.salaryType,
        e.joiningDate,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Workforce Analytics & Export Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade summaries for attendance compliance, overtime cost, leave burn, and payroll disbursements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { id: 'attendance', label: 'Attendance & Punches', icon: Clock },
          { id: 'overtime', label: 'Overtime & Liabilities', icon: TrendingUp },
          { id: 'leaves', label: 'Leave Consumption', icon: Palmtree },
          { id: 'payroll', label: 'Payroll & Remuneration', icon: Wallet },
          { id: 'workforce', label: 'Headcount & Demographics', icon: Users },
        ].map(r => {
          const Icon = r.icon;
          const active = reportType === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setReportType(r.id as any)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                active
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 mb-2" />
              <span className="font-bold text-xs">{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Timeframe:</span>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="today">Today ({todayStr})</option>
              <option value="this_month">Current Month ({thisMonthStr})</option>
              <option value="all">Complete History</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Department:</span>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
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
        </div>

        <span className="text-slate-500 font-mono text-[11px]">
          Audited by GrandStay Automated HRMS
        </span>
      </div>

      {/* Render Current Report Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5">
        <h3 className="font-bold text-white text-base mb-1 capitalize">
          {reportType.replace('_', ' ')} Executive Audit Ledger
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Filtered by: {dateRange} · Department: {departmentFilter}
        </p>

        <div className="overflow-x-auto">
          {reportType === 'attendance' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Dept</th>
                  <th className="pb-3">Clock In</th>
                  <th className="pb-3">Clock Out</th>
                  <th className="pb-3">Reg Hours</th>
                  <th className="pb-3">OT Hours</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attendanceRecords.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono text-white">{a.date}</td>
                    <td className="py-2.5 font-bold text-slate-200">{a.employeeName}</td>
                    <td className="py-2.5 text-slate-400">{a.department}</td>
                    <td className="py-2.5 font-mono text-emerald-400">{a.clockIn || '--:--'}</td>
                    <td className="py-2.5 font-mono text-rose-400">{a.clockOut || '--:--'}</td>
                    <td className="py-2.5 font-mono text-slate-200">{a.regularHours}h</td>
                    <td className="py-2.5 font-mono text-amber-400">+{a.overtimeHours}h</td>
                    <td className="py-2.5 text-right font-bold text-slate-300">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'overtime' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Hours Claimed</th>
                  <th className="pb-3">Rate Multiplier</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {overtimeRecords.map(o => (
                  <tr key={o.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono text-white">{o.date}</td>
                    <td className="py-2.5 font-bold text-slate-200">{o.employeeName}</td>
                    <td className="py-2.5 font-mono text-amber-400">{o.hours}h</td>
                    <td className="py-2.5">{o.rateMultiplier}x</td>
                    <td className="py-2.5 font-mono font-bold text-emerald-400">{formatINR(o.calculatedAmount, { showDecimals: true })}</td>
                    <td className="py-2.5 uppercase font-bold text-[10px] text-slate-300">{o.status}</td>
                    <td className="py-2.5 text-right text-slate-400 truncate max-w-xs">{o.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'leaves' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Leave Type</th>
                  <th className="pb-3">Date Window</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaveRequests.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-slate-200">{l.employeeName}</td>
                    <td className="py-2.5 uppercase font-bold text-amber-400 text-[10px]">{l.leaveType}</td>
                    <td className="py-2.5 font-mono text-slate-300">{l.startDate} to {l.endDate}</td>
                    <td className="py-2.5 font-mono font-bold text-white">{l.totalDays} day(s)</td>
                    <td className="py-2.5 uppercase font-bold text-[10px] text-slate-300">{l.status}</td>
                    <td className="py-2.5 text-right text-slate-400 truncate max-w-xs">{l.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'payroll' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Period</th>
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Base Pay</th>
                  <th className="pb-3">Present Days</th>
                  <th className="pb-3">OT Pay</th>
                  <th className="pb-3">Gross Salary</th>
                  <th className="pb-3">Deductions</th>
                  <th className="pb-3 text-right">Net Take-Home</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payrollRecords.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono text-white">{p.payrollMonth}</td>
                    <td className="py-2.5 font-bold text-slate-200">{p.employeeName}</td>
                    <td className="py-2.5 font-mono text-slate-300">{formatINR(p.basePay)}</td>
                    <td className="py-2.5 font-mono text-emerald-400">{p.actualPresentDays}d</td>
                    <td className="py-2.5 font-mono text-amber-400">+{formatINR(p.overtimePay, { showDecimals: true })}</td>
                    <td className="py-2.5 font-mono text-white font-bold">{formatINR(p.grossSalary)}</td>
                    <td className="py-2.5 font-mono text-rose-400">-{formatINR(p.totalDeductions)}</td>
                    <td className="py-2.5 text-right font-mono font-black text-emerald-400 text-sm">
                      {formatINR(p.netSalary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'workforce' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Pay Rate</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {employees.map(e => (
                  <tr key={e.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono text-amber-400">{e.employeeId}</td>
                    <td className="py-2.5 font-bold text-white">{e.name}</td>
                    <td className="py-2.5 text-slate-300">{e.department}</td>
                    <td className="py-2.5 text-slate-400">{e.jobTitle}</td>
                    <td className="py-2.5 capitalize">{e.employmentType.replace('_', ' ')}</td>
                    <td className="py-2.5 font-mono text-emerald-400">{formatINR(e.payRate)}/{e.salaryType}</td>
                    <td className="py-2.5 text-right uppercase font-bold text-[10px] text-slate-300">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
