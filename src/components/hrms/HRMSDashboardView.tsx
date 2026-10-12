import React from 'react';
import { useHRMS } from '../../context/HRMSContext';
import {
  Users,
  UserCheck,
  UserX,
  Palmtree,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  IndianRupee,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  UserPlus,
  Play,
  Square,
  Coffee,
} from 'lucide-react';
import { HRMSTab } from './HRMSSidebar';
import { formatINR } from '../../utils/formatters';

interface HRMSDashboardViewProps {
  onNavigateTab: (tab: HRMSTab) => void;
  onOpenAddEmployee: () => void;
}

export const HRMSDashboardView: React.FC<HRMSDashboardViewProps> = ({
  onNavigateTab,
  onOpenAddEmployee,
}) => {
  const {
    stats,
    employees,
    attendanceRecords,
    dutySchedules,
    leaveRequests,
    overtimeRecords,
    correctionRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    approveOvertimeRequest,
    rejectOvertimeRequest,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    currentEmployeeUser,
    settings,
  } = useHRMS();

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = dutySchedules.filter(s => s.date === todayStr);

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');
  const pendingOvertimes = overtimeRecords.filter(o => o.status === 'pending');
  const pendingCorrections = correctionRequests.filter(c => c.status === 'pending');

  const userTodayAttendance = attendanceRecords.find(
    r => r.employeeId === currentEmployeeUser.id && r.date === todayStr
  );
  const isClockedIn = Boolean(userTodayAttendance?.clockIn && !userTodayAttendance?.clockOut);
  const isOnBreak = Boolean(userTodayAttendance?.breakStart && !userTodayAttendance?.breakEnd);
  const isClockedOut = Boolean(userTodayAttendance?.clockOut);

  // Department distribution
  const deptCounts: Record<string, number> = {};
  employees.forEach(e => {
    deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
              Real-Time Control Center
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-slate-400 text-xs">GrandStay Workforce v4.2</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Workforce & Operations Executive Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            Live monitoring of employee shifts, biometric punches, duty rosters, overtime thresholds, and payroll liabilities.
          </p>
        </div>

        {/* Quick Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddEmployee}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={() => onNavigateTab('attendance')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Live Attendance</span>
          </button>
          <button
            onClick={() => onNavigateTab('payroll')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <IndianRupee className="w-4 h-4 text-amber-400" />
            <span>Run Payroll</span>
          </button>
        </div>
      </div>

      {/* Row 1: KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Active Employees */}
        <div 
          onClick={() => onNavigateTab('employees')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Workforce</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.totalEmployees}</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
              <UserCheck className="w-3 h-3" /> {stats.activeEmployees} Active
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{employees.filter(e => e.status === 'inactive').length} Inactive</span>
            <span className="text-blue-400 flex items-center gap-0.5 group-hover:underline">
              View Directory <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Today's Present</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.todayPresentCount}</span>
            <span className="text-xs font-medium text-slate-400">
              of {stats.activeEmployees} expected
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className={stats.todayLateCount > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
              {stats.todayLateCount} Late Arrivals
            </span>
            <span className="text-emerald-400 flex items-center gap-0.5 group-hover:underline">
              Punch Log <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Regular & Overtime Working Hours */}
        <div 
          onClick={() => onNavigateTab('overtime')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Hours Logged Today</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.totalRegularHoursToday}h</span>
            <span className="text-xs font-bold text-amber-400">
              +{stats.totalOvertimeHoursToday}h OT
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rate: {settings.overtimeRateWeekday}x standard</span>
            <span className="text-amber-400 flex items-center gap-0.5 group-hover:underline">
              OT Approvals <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Absences & On Leave */}
        <div 
          onClick={() => onNavigateTab('leaves')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Leave & Absence</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.onLeaveEmployees}</span>
            <span className="text-xs font-medium text-slate-400">On Leave Today</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className={stats.pendingLeaveRequestsCount > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
              {stats.pendingLeaveRequestsCount} Pending Requests
            </span>
            <span className="text-purple-400 flex items-center gap-0.5 group-hover:underline">
              Leave Desk <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Live Punch Station for Logged User + Triage Approvals Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Punch Clock Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">My Attendance Station</h3>
                  <p className="text-[11px] text-slate-400">{currentEmployeeUser.name} ({currentEmployeeUser.jobTitle})</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isClockedOut
                  ? 'bg-slate-800 text-slate-400'
                  : isOnBreak
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : isClockedIn
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isClockedOut ? 'Clocked Out' : isOnBreak ? 'On Break' : isClockedIn ? 'Clocked In' : 'Not Punched'}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Today's Clock In:</span>
                <span className="font-mono font-bold text-white">{userTodayAttendance?.clockIn || '--:--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Today's Clock Out:</span>
                <span className="font-mono font-bold text-white">{userTodayAttendance?.clockOut || '--:--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Breaks:</span>
                <span className="font-mono text-slate-300">{userTodayAttendance?.totalBreakMinutes || 0} mins</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Hours Credited:</span>
                <span className="font-mono font-bold text-emerald-400">{userTodayAttendance?.regularHours || 0} hrs</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {!isClockedIn && !isClockedOut && (
              <button
                onClick={() => clockIn(currentEmployeeUser.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Punch Clock In</span>
              </button>
            )}

            {isClockedIn && !isOnBreak && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => startBreak(currentEmployeeUser.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  <Coffee className="w-4 h-4 text-sky-400" />
                  <span>Start Break</span>
                </button>
                <button
                  onClick={() => clockOut(currentEmployeeUser.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-rose-600/20"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Clock Out</span>
                </button>
              </div>
            )}

            {isClockedIn && isOnBreak && (
              <button
                onClick={() => endBreak(currentEmployeeUser.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Resume Work (End Break)</span>
              </button>
            )}

            {isClockedOut && (
              <div className="p-2 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl">
                Shift completed for today. Thank you for your service!
              </div>
            )}
          </div>
        </div>

        {/* Pending Approvals & Requests Queue */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Pending Requests & Approvals Queue</h3>
                  <p className="text-[11px] text-slate-400">
                    {pendingLeaves.length + pendingOvertimes.length + pendingCorrections.length} total items requiring manager or HR review
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('leaves')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of pending items */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {pendingLeaves.length === 0 && pendingOvertimes.length === 0 && pendingCorrections.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <ShieldCheck className="w-8 h-8 text-emerald-400/80 mx-auto mb-2" />
                  <p className="font-medium text-slate-300">All queues are clear!</p>
                  <p className="text-[11px]">No pending leave applications, overtime requests, or attendance corrections.</p>
                </div>
              )}

              {/* Pending Leave Requests */}
              {pendingLeaves.map(leave => (
                <div
                  key={leave.id}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                      Leave ({leave.leaveType})
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{leave.employeeName} · {leave.department}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {leave.totalDays} day(s): {leave.startDate} to {leave.endDate} · "{leave.reason}"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => approveLeaveRequest(leave.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectLeaveRequest(leave.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 rounded-lg text-xs transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}

              {/* Pending Overtime Requests */}
              {pendingOvertimes.map(ot => (
                <div
                  key={ot.id}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                      Overtime ({ot.hours}h)
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{ot.employeeName} · ${ot.calculatedAmount} ({ot.rateMultiplier}x)</p>
                      <p className="text-[11px] text-slate-400 truncate">{ot.date} · "{ot.reason}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => approveOvertimeRequest(ot.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectOvertimeRequest(ot.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 rounded-lg text-xs transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}

              {/* Pending Correction Requests */}
              {pendingCorrections.map(corr => (
                <div
                  key={corr.id}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                      Punch Fix
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{corr.employeeName} · {corr.date}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Req: {corr.requestedClockIn} - {corr.requestedClockOut} · "{corr.reason}"
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('attendance')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold shrink-0"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Pending approvals automatically sync across timesheets and payroll.</span>
            <button
              onClick={() => onNavigateTab('overtime')}
              className="text-amber-400 hover:underline font-semibold"
            >
              Manage Overtime Rules
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Today's Shift Roster & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Shift Schedules */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-500/15 text-sky-400 rounded-xl">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Today's Duty Roster & Shift Coverage</h3>
                <p className="text-[11px] text-slate-400">{todayStr} · {todaySchedules.length} assigned duty shifts</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Full Schedule Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">Department</th>
                  <th className="pb-2">Assigned Shift</th>
                  <th className="pb-2">Hours</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {todaySchedules.map(sch => {
                  const att = attendanceRecords.find(a => a.employeeId === sch.employeeId && a.date === todayStr);
                  const isPresent = att && att.clockIn;
                  return (
                    <tr key={sch.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-bold text-white">{sch.employeeName}</td>
                      <td className="py-2.5 text-slate-400">{sch.department}</td>
                      <td className="py-2.5 font-medium text-slate-300">{sch.shiftName}</td>
                      <td className="py-2.5 font-mono text-slate-400">{sch.startTime} - {sch.endTime}</td>
                      <td className="py-2.5 text-right">
                        {sch.status === 'leave' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            On Leave
                          </span>
                        ) : isPresent ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Punched In ({att.clockIn})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Scheduled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Distribution & Payroll Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Workforce & Payroll Summary</h3>
                  <p className="text-[11px] text-slate-400">Monthly estimated budget</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl mb-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Estimated Monthly Payroll</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {formatINR(stats.monthlyPayrollEstimatedTotal, { showDecimals: true })}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated across {stats.upcomingDisbursementsCount} active personnel
              </p>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Staff Headcount by Department
            </p>
            <div className="space-y-2 text-xs">
              {Object.entries(deptCounts).map(([dept, count]) => {
                const pct = Math.round((count / employees.length) * 100);
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">{dept}</span>
                      <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('payroll')}
            className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-colors text-center"
          >
            Review Salary Statements & Disbursements
          </button>
        </div>
      </div>
    </div>
  );
};
