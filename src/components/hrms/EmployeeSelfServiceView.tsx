import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import {
  User,
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  CalendarDays,
  Palmtree,
  Wallet,
  TrendingUp,
  FileText,
  AlertCircle,
  Plus,
  Send,
  Timer,
  Download,
  X,
} from 'lucide-react';
import { LeaveType } from '../../types/hrms';
import { formatINR } from '../../utils/formatters';

interface EmployeeSelfServiceViewProps {
  onViewPayslipModal?: (recordId: string) => void;
  onNavigateToPayslipsTab?: () => void;
}

export const EmployeeSelfServiceView: React.FC<EmployeeSelfServiceViewProps> = ({
  onNavigateToPayslipsTab,
}) => {
  const {
    currentEmployeeUser,
    attendanceRecords,
    dutySchedules,
    leaveRequests,
    overtimeRecords,
    payrollRecords,
    holidays,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    submitLeaveRequest,
    submitOvertimeRequest,
    submitCorrectionRequest,
    getEmployeeLeaveBalance,
    notifications,
  } = useHRMS();

  const [activePortalTab, setActivePortalTab] = useState<'overview' | 'attendance' | 'schedule' | 'leaves' | 'overtime' | 'payslips'>('overview');

  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayAttendance = attendanceRecords.find(
    r => r.employeeId === currentEmployeeUser.id && r.date === todayStr
  );
  const isClockedIn = Boolean(userTodayAttendance?.clockIn && !userTodayAttendance?.clockOut);
  const isOnBreak = Boolean(userTodayAttendance?.breakStart && !userTodayAttendance?.breakEnd);
  const isClockedOut = Boolean(userTodayAttendance?.clockOut);

  // Leave form modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'annual' as LeaveType,
    startDate: todayStr,
    endDate: todayStr,
    totalDays: 1,
    reason: '',
  });

  // OT form modal
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [otForm, setOtForm] = useState({
    date: todayStr,
    hours: 2,
    rateMultiplier: 1.5,
    reason: '',
  });

  // Correction modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    date: todayStr,
    requestedClockIn: '08:00',
    requestedClockOut: '16:30',
    reason: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const balance = getEmployeeLeaveBalance(currentEmployeeUser.id);

  // Submit leave
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      setFeedback({ type: 'error', text: 'Please provide a reason for the leave application.' });
      return;
    }
    const res = submitLeaveRequest({
      employeeId: currentEmployeeUser.id,
      employeeName: currentEmployeeUser.name,
      department: currentEmployeeUser.department,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      totalDays: Number(leaveForm.totalDays),
      reason: leaveForm.reason,
    });
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setLeaveModalOpen(false);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  // Submit OT
  const handleSubmitOT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otForm.reason.trim()) {
      setFeedback({ type: 'error', text: 'Please detail reason for overtime worked.' });
      return;
    }
    const hourly = currentEmployeeUser.salaryType === 'hourly'
      ? currentEmployeeUser.payRate
      : Math.round(currentEmployeeUser.payRate / 160);

    const res = submitOvertimeRequest({
      employeeId: currentEmployeeUser.id,
      employeeName: currentEmployeeUser.name,
      department: currentEmployeeUser.department,
      date: otForm.date,
      hours: Number(otForm.hours),
      rateMultiplier: Number(otForm.rateMultiplier),
      hourlyRate: hourly,
      reason: otForm.reason,
    });
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setOtModalOpen(false);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  // Submit Correction
  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.reason.trim()) {
      setFeedback({ type: 'error', text: 'Please detail why punch adjustment is requested.' });
      return;
    }
    const res = submitCorrectionRequest({
      employeeId: currentEmployeeUser.id,
      employeeName: currentEmployeeUser.name,
      department: currentEmployeeUser.department,
      date: correctionForm.date,
      requestedClockIn: correctionForm.requestedClockIn,
      requestedClockOut: correctionForm.requestedClockOut,
      reason: correctionForm.reason,
    });
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setCorrectionModalOpen(false);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const userSchedules = dutySchedules.filter(s => s.employeeId === currentEmployeeUser.id);
  const userLeaves = leaveRequests.filter(l => l.employeeId === currentEmployeeUser.id);
  const userOvertimes = overtimeRecords.filter(o => o.employeeId === currentEmployeeUser.id);
  const userPayrolls = payrollRecords.filter(p => p.employeeId === currentEmployeeUser.id);
  const userAttendances = attendanceRecords.filter(a => a.employeeId === currentEmployeeUser.id);

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

      {/* Profile Header Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={currentEmployeeUser.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
            alt={currentEmployeeUser.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{currentEmployeeUser.name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {currentEmployeeUser.employeeId}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {currentEmployeeUser.jobTitle} · <span className="text-amber-400">{currentEmployeeUser.department}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Work Location: {currentEmployeeUser.workLocation} · Manager: {currentEmployeeUser.assignedManagerName || 'Operations Director'}
            </p>
          </div>
        </div>

        {/* Live Punch Clock Widget */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3 self-stretch md:self-auto justify-between sm:justify-start">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Today's Punch Status</span>
            <span className={`text-xs font-bold ${
              isClockedOut
                ? 'text-slate-400'
                : isOnBreak
                ? 'text-sky-400'
                : isClockedIn
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}>
              {isClockedOut
                ? 'Done for the Day'
                : isOnBreak
                ? 'Currently on Break'
                : isClockedIn
                ? `Clocked In (${userTodayAttendance?.clockIn})`
                : 'Not Punched In Yet'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isClockedIn && !isClockedOut && (
              <button
                onClick={() => clockIn(currentEmployeeUser.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Clock In</span>
              </button>
            )}

            {isClockedIn && !isOnBreak && (
              <>
                <button
                  onClick={() => startBreak(currentEmployeeUser.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Break</span>
                </button>
                <button
                  onClick={() => clockOut(currentEmployeeUser.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Clock Out</span>
                </button>
              </>
            )}

            {isClockedIn && isOnBreak && (
              <button
                onClick={() => endBreak(currentEmployeeUser.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>End Break</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ESS Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs overflow-x-auto">
        {[
          { id: 'overview', label: 'My Hub Overview', icon: User },
          { id: 'schedule', label: 'My Shifts & Duties', icon: CalendarDays },
          { id: 'attendance', label: 'My Timesheets', icon: Clock },
          { id: 'leaves', label: 'My Leaves & Balance', icon: Palmtree },
          { id: 'overtime', label: 'My Overtime', icon: TrendingUp },
          { id: 'payslips', label: 'My Salary & Payslips', icon: Wallet },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activePortalTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePortalTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-colors shrink-0 ${
                active
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: My Hub Overview */}
      {activePortalTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-left flex items-center justify-between group transition-all"
            >
              <div>
                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  Apply for Time Off
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {balance.annual - balance.annualUsed} Annual Leave days remaining
                </p>
              </div>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                <Palmtree className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => setOtModalOpen(true)}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-left flex items-center justify-between group transition-all"
            >
              <div>
                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  Submit Overtime Claim
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  1.5x / 2.0x premium rate calculation
                </p>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => setCorrectionModalOpen(true)}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-left flex items-center justify-between group transition-all"
            >
              <div>
                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  Fix Missed Punch
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Request turnstile / badge adjustment
                </p>
              </div>
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl group-hover:scale-110 transition-transform">
                <Timer className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Upcoming Shifts & Duty Schedule */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-1">My Upcoming Roster & Scheduled Shifts</h3>
            <p className="text-xs text-slate-400 mb-4">Official shifts assigned by your department supervisor</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {userSchedules.slice(0, 4).map(sch => (
                <div key={sch.id} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1">
                  <span className="font-mono text-amber-400 font-bold">{sch.date}</span>
                  <p className="font-bold text-white text-sm">{sch.shiftName}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{sch.startTime} - {sch.endTime}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {sch.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: My Shifts */}
      {activePortalTab === 'schedule' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-white text-base">Assigned Roster & Rest Days</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Shift Name</th>
                  <th className="pb-2">Hours Window</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userSchedules.map(sch => (
                  <tr key={sch.id}>
                    <td className="py-2.5 font-mono text-white font-bold">{sch.date}</td>
                    <td className="py-2.5 text-slate-200">{sch.shiftName}</td>
                    <td className="py-2.5 font-mono text-amber-400">{sch.startTime} - {sch.endTime}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {sch.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 italic">{sch.notes || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: My Attendance Timesheets */}
      {activePortalTab === 'attendance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">My Recorded Biometric Punches</h3>
            <button
              onClick={() => setCorrectionModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold"
            >
              + Dispute / Request Correction
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Punch In</th>
                  <th className="pb-2">Punch Out</th>
                  <th className="pb-2">Break Duration</th>
                  <th className="pb-2">Regular Hours</th>
                  <th className="pb-2">OT Hours</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userAttendances.map(a => (
                  <tr key={a.id}>
                    <td className="py-2.5 font-mono text-white font-bold">{a.date}</td>
                    <td className="py-2.5 font-mono text-emerald-400">{a.clockIn || '--:--'}</td>
                    <td className="py-2.5 font-mono text-rose-400">{a.clockOut || '--:--'}</td>
                    <td className="py-2.5 text-slate-400 font-mono">{a.totalBreakMinutes} mins</td>
                    <td className="py-2.5 font-mono text-slate-200 font-bold">{a.regularHours}h</td>
                    <td className="py-2.5 font-mono text-amber-400 font-bold">+{a.overtimeHours}h</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: My Leaves */}
      {activePortalTab === 'leaves' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">Annual Paid Leave</span>
              <p className="text-xl font-bold text-white mt-1">{balance.annual - balance.annualUsed} / {balance.annual}</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">Sick Leave</span>
              <p className="text-xl font-bold text-white mt-1">{balance.sick - balance.sickUsed} / {balance.sick}</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">Casual Leave</span>
              <p className="text-xl font-bold text-white mt-1">{balance.casual - balance.casualUsed} / {balance.casual}</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 text-[11px]">Emergency Leave</span>
              <p className="text-xl font-bold text-white mt-1">{balance.emergency - balance.emergencyUsed} / {balance.emergency}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">My Leave History & Status</h3>
              <button
                onClick={() => setLeaveModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
              >
                + Apply for Leave
              </button>
            </div>

            <div className="space-y-2">
              {userLeaves.map(l => (
                <div key={l.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white capitalize">{l.leaveType} Leave ({l.totalDays} days)</span>
                    <p className="text-[11px] text-slate-400">{l.startDate} to {l.endDate} · "{l.reason}"</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    l.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: My Overtime */}
      {activePortalTab === 'overtime' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">My Overtime Claims</h3>
            <button
              onClick={() => setOtModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
            >
              + Submit OT Claim
            </button>
          </div>

          <div className="space-y-2">
            {userOvertimes.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No overtime claims submitted.</p>
            ) : (
              userOvertimes.map(o => (
                <div key={o.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{o.date} · {o.hours} Hours ({o.rateMultiplier}x rate)</p>
                    <p className="text-[11px] text-slate-400">"{o.reason}"</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-emerald-400">{formatINR(o.calculatedAmount, { showDecimals: true })}</p>
                    <span className="capitalize text-[10px] text-amber-400">{o.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 6: My Payslips */}
      {activePortalTab === 'payslips' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-white text-base">My Salary Statements</h3>
          <div className="space-y-3">
            {userPayrolls.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No payslip vouchers available yet for your account.</p>
            ) : (
              userPayrolls.map(pr => (
                <div key={pr.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">Pay Period: {pr.payrollMonth}</p>
                    <p className="text-[11px] text-slate-400">
                      Gross: {formatINR(pr.grossSalary)} · Deductions: -{formatINR(pr.totalDeductions)}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      Net Take-Home: {formatINR(pr.netSalary)} · Status: {pr.paymentStatus}
                    </p>
                  </div>

                  <button
                    onClick={onNavigateToPayslipsTab}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View & Download Payslip</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button onClick={() => setLeaveModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Apply for Time Off</h3>
            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Leave Category</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setLeaveModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit OT Modal */}
      {otModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button onClick={() => setOtModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Submit Overtime Claim</h3>
            <form onSubmit={handleSubmitOT} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Date</label>
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
                  <label className="block text-slate-400 font-semibold mb-1">Hours Claimed</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={otForm.hours}
                    onChange={e => setOtForm({ ...otForm, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Multiplier</label>
                  <select
                    value={otForm.rateMultiplier}
                    onChange={e => setOtForm({ ...otForm, rateMultiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value={1.5}>1.5x (Normal Day)</option>
                    <option value={2.0}>2.0x (Holiday/Weekend)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Operational Reason</label>
                <textarea
                  required
                  rows={3}
                  value={otForm.reason}
                  onChange={e => setOtForm({ ...otForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOtModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md">
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Missed Punch Modal */}
      {correctionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button onClick={() => setCorrectionModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Request Attendance Punch Fix</h3>
            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={correctionForm.date}
                  onChange={e => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Actual In Time</label>
                  <input
                    type="time"
                    required
                    value={correctionForm.requestedClockIn}
                    onChange={e => setCorrectionForm({ ...correctionForm, requestedClockIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Actual Out Time</label>
                  <input
                    type="time"
                    required
                    value={correctionForm.requestedClockOut}
                    onChange={e => setCorrectionForm({ ...correctionForm, requestedClockOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason for Missed Badge Punch</label>
                <textarea
                  required
                  rows={3}
                  value={correctionForm.reason}
                  onChange={e => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setCorrectionModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md">
                  Send to Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
