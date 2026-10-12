import React, { useState, useEffect } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import {
  Bell,
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  ChevronDown,
  Building2,
  Hotel,
} from 'lucide-react';
import { HRMSUserRole } from '../../types/hrms';

interface HRMSNavbarProps {
  onSwitchToPMS: () => void;
  onOpenNotifications: () => void;
  onOpenSelfService: () => void;
}

export const HRMSNavbar: React.FC<HRMSNavbarProps> = ({
  onSwitchToPMS,
  onOpenNotifications,
  onOpenSelfService,
}) => {
  const {
    hrmsRole,
    setHRMSRole,
    currentEmployeeUser,
    setCurrentEmployeeUser,
    employees,
    attendanceRecords,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    notifications,
    settings,
  } = useHRMS();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = currentTime.toISOString().split('T')[0];
  const userTodayAttendance = attendanceRecords.find(
    r => r.employeeId === currentEmployeeUser.id && r.date === todayStr
  );

  const isClockedIn = Boolean(userTodayAttendance?.clockIn && !userTodayAttendance?.clockOut);
  const isOnBreak = Boolean(userTodayAttendance?.breakStart && !userTodayAttendance?.breakEnd);
  const isClockedOut = Boolean(userTodayAttendance?.clockOut);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const rolesList: { role: HRMSUserRole; label: string; desc: string }[] = [
    { role: 'super_admin', label: 'Super Admin', desc: 'Full workforce, financial & system authority' },
    { role: 'hr_manager', label: 'HR Manager', desc: 'Staff directory, recruitment, leaves & compliance' },
    { role: 'manager', label: 'Operations / Shift Manager', desc: 'Roster scheduling, attendance & OT approvals' },
    { role: 'payroll_officer', label: 'Payroll Officer', desc: 'Salary structures, monthly payroll & payslips' },
    { role: 'employee', label: 'Employee (Self-Service)', desc: 'My schedule, punch clock, leaves & payslips' },
  ];

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 lg:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Brand & Suite Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-lg">
            GS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">GrandStay</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                HRMS & Workforce
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">
              {settings.legalEntityName}
            </p>
          </div>
        </div>

        {/* Quick App Suite Switcher */}
        <div className="hidden md:flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={onSwitchToPMS}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-400 hover:text-white transition-colors"
            title="Switch back to Hotel FrontDesk & Bookings PMS"
          >
            <Hotel className="w-3.5 h-3.5 text-slate-400" />
            <span>Hotel PMS</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Workforce HRMS</span>
          </button>
        </div>
      </div>

      {/* Center Live Clock */}
      <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="font-medium text-slate-400">
          {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span className="text-slate-600">|</span>
        <span className="font-mono font-bold text-white text-sm">
          {currentTime.toLocaleTimeString('en-US', { hour12: true })}
        </span>
      </div>

      {/* Right Controls: Quick Punch Clock & Persona Switcher */}
      <div className="flex items-center gap-3">
        {/* Punch Clock Widget for current persona */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1">
          <div className="text-[11px] mr-1">
            <span className="text-slate-400 font-medium">{currentEmployeeUser.name.split(' ')[0]}:</span>{' '}
            {isClockedOut ? (
              <span className="text-slate-500 font-semibold">Done Today</span>
            ) : isOnBreak ? (
              <span className="text-sky-400 font-semibold">On Break</span>
            ) : isClockedIn ? (
              <span className="text-emerald-400 font-semibold">Clocked In ({userTodayAttendance?.clockIn})</span>
            ) : (
              <span className="text-slate-400">Not In</span>
            )}
          </div>

          {!isClockedIn && !isClockedOut && (
            <button
              onClick={() => clockIn(currentEmployeeUser.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
              title="Clock In Now"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Clock In</span>
            </button>
          )}

          {isClockedIn && !isOnBreak && (
            <>
              <button
                onClick={() => startBreak(currentEmployeeUser.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium border border-slate-700 transition-colors"
                title="Start Break"
              >
                <Coffee className="w-3 h-3 text-sky-400" />
                <span>Break</span>
              </button>
              <button
                onClick={() => clockOut(currentEmployeeUser.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
                title="Clock Out"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Clock Out</span>
              </button>
            </>
          )}

          {isClockedIn && isOnBreak && (
            <button
              onClick={() => endBreak(currentEmployeeUser.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all"
              title="End Break & Resume Work"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>End Break</span>
            </button>
          )}
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          title="Notifications and Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
          )}
        </button>

        {/* Role Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleMenuOpen(!roleMenuOpen);
              setEmployeeMenuOpen(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs transition-colors"
          >
            <div className="text-left">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">
                Role View
              </span>
              <span className="text-amber-400 font-semibold capitalize">
                {hrmsRole.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Perspective
              </p>
              {rolesList.map(r => (
                <button
                  key={r.role}
                  onClick={() => {
                    setHRMSRole(r.role);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex flex-col ${
                    hrmsRole === r.role
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-bold">{r.label}</span>
                  <span className="text-[10px] text-slate-400 leading-snug">{r.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Employee Switcher (for Self Service Portal test) */}
        <div className="relative">
          <button
            onClick={() => {
              setEmployeeMenuOpen(!employeeMenuOpen);
              setRoleMenuOpen(false);
            }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            title="Active Employee Account"
          >
            <img
              src={currentEmployeeUser.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
              alt={currentEmployeeUser.name}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-amber-500/40"
            />
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-semibold text-white leading-tight">
                {currentEmployeeUser.name}
              </span>
              <span className="block text-[10px] text-slate-400 leading-none">
                {currentEmployeeUser.department}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {employeeMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white">{currentEmployeeUser.name}</p>
                <p className="text-[11px] text-amber-400">{currentEmployeeUser.jobTitle}</p>
                <p className="text-[10px] text-slate-400">{currentEmployeeUser.email}</p>
                <button
                  onClick={() => {
                    setEmployeeMenuOpen(false);
                    onOpenSelfService();
                  }}
                  className="mt-2 w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs text-center transition-colors"
                >
                  Open My Self-Service Portal
                </button>
              </div>

              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Employee Account
              </p>
              <div className="max-h-56 overflow-y-auto space-y-1">
                {employees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setCurrentEmployeeUser(emp);
                      setEmployeeMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 p-1.5 rounded-xl text-left text-xs transition-colors ${
                      emp.id === currentEmployeeUser.id
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <img
                      src={emp.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                      alt={emp.name}
                      className="w-6 h-6 rounded-md object-cover"
                    />
                    <div className="truncate">
                      <p className="truncate font-medium">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{emp.department} · {emp.jobTitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
