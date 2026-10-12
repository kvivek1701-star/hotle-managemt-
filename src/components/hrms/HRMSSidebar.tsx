import React from 'react';
import { useHRMS } from '../../context/HRMSContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Timer,
  Coffee,
  TrendingUp,
  CalendarCheck,
  Palmtree,
  Wallet,
  FileText,
  BarChart3,
  Bell,
  Settings,
  UserCheck,
} from 'lucide-react';

export type HRMSTab =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'schedule'
  | 'shifts'
  | 'breaks'
  | 'overtime'
  | 'leaves'
  | 'holidays'
  | 'payroll'
  | 'payslips'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'self_service';

interface HRMSSidebarProps {
  activeTab: HRMSTab;
  onSelectTab: (tab: HRMSTab) => void;
  onSwitchToPMS: () => void;
}

export const HRMSSidebar: React.FC<HRMSSidebarProps> = ({
  activeTab,
  onSelectTab,
  onSwitchToPMS,
}) => {
  const { stats, notifications, hrmsRole } = useHRMS();

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const navItems = [
    {
      id: 'dashboard' as HRMSTab,
      label: 'Admin Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'employees' as HRMSTab,
      label: 'Employees',
      icon: Users,
      badge: `${stats.totalEmployees}`,
      badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
    },
    {
      id: 'attendance' as HRMSTab,
      label: 'Attendance',
      icon: Clock,
      badge: stats.todayLateCount > 0 ? `${stats.todayLateCount} Late` : `${stats.todayPresentCount} In`,
      badgeColor: stats.todayLateCount > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'schedule' as HRMSTab,
      label: 'Duty Schedule',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'shifts' as HRMSTab,
      label: 'Shifts',
      icon: Timer,
      badge: null,
    },
    {
      id: 'breaks' as HRMSTab,
      label: 'Off Time & Breaks',
      icon: Coffee,
      badge: stats.todayOnBreakCount > 0 ? `${stats.todayOnBreakCount} on break` : null,
      badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    },
    {
      id: 'overtime' as HRMSTab,
      label: 'Overtime',
      icon: TrendingUp,
      badge: stats.pendingOvertimeApprovalsCount > 0 ? `${stats.pendingOvertimeApprovalsCount} req` : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    {
      id: 'leaves' as HRMSTab,
      label: 'Leave Management',
      icon: CalendarCheck,
      badge: stats.pendingLeaveRequestsCount > 0 ? `${stats.pendingLeaveRequestsCount} pending` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'holidays' as HRMSTab,
      label: 'Holidays',
      icon: Palmtree,
      badge: null,
    },
    {
      id: 'payroll' as HRMSTab,
      label: 'Payroll',
      icon: Wallet,
      badge: stats.upcomingDisbursementsCount > 0 ? `${stats.upcomingDisbursementsCount} active` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'payslips' as HRMSTab,
      label: 'Payslips',
      icon: FileText,
      badge: null,
    },
    {
      id: 'reports' as HRMSTab,
      label: 'Reports',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'notifications' as HRMSTab,
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifs > 0 ? `${unreadNotifs}` : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
    {
      id: 'settings' as HRMSTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
    {
      id: 'self_service' as HRMSTab,
      label: 'User Profile / Portal',
      icon: UserCheck,
      badge: 'Self-Service',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between py-4 select-none">
      <div className="overflow-y-auto max-h-[calc(100vh-140px)] space-y-1 px-3 custom-scrollbar">
        <div className="flex items-center justify-between px-3 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            HRMS & Workforce
          </p>
          <span className="text-[10px] font-semibold text-amber-400/90 capitalize">
            {hrmsRole.replace('_', ' ')}
          </span>
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1.5 ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Switch to Hotel FrontDesk & PMS button */}
      <div className="px-4 pt-3 border-t border-slate-800/80">
        <button
          onClick={onSwitchToPMS}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-amber-400 transition-colors"
        >
          <span>🏨</span>
          <span>Switch to Hotel PMS</span>
        </button>
      </div>
    </aside>
  );
};
