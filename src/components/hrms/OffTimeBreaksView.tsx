import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import {
  Coffee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Users,
  Settings,
  ShieldCheck,
  Save,
  X,
} from 'lucide-react';

export const OffTimeBreaksView: React.FC = () => {
  const {
    employees,
    attendanceRecords,
    settings,
    updateSettings,
    startBreak,
    endBreak,
    currentEmployeeUser,
  } = useHRMS();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(r => r.date === todayStr);

  // Employees currently on break
  const activeBreakRecords = todayRecords.filter(r => r.breakStart && !r.breakEnd);

  // Policy form
  const [breakPolicyForm, setBreakPolicyForm] = useState({
    unpaidLunchBreakMinutes: settings.unpaidLunchBreakMinutes,
    paidTeaBreakMinutes: settings.paidTeaBreakMinutes,
    standardDailyHours: settings.standardDailyHours,
    defaultGracePeriodMinutes: settings.defaultGracePeriodMinutes,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      unpaidLunchBreakMinutes: Number(breakPolicyForm.unpaidLunchBreakMinutes),
      paidTeaBreakMinutes: Number(breakPolicyForm.paidTeaBreakMinutes),
      standardDailyHours: Number(breakPolicyForm.standardDailyHours),
      defaultGracePeriodMinutes: Number(breakPolicyForm.defaultGracePeriodMinutes),
    });
    setFeedback({ type: 'success', text: 'Break and rest policies updated successfully across the workforce!' });
    setTimeout(() => setFeedback(null), 3500);
  };

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
          <h2 className="text-xl font-bold text-white tracking-tight">Off-Time, Rest Periods & Break Governance</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time staff rest breaks, enforce statutory lunch deductions, and set paid tea intervals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold">
            {activeBreakRecords.length} Staff Currently on Break
          </span>
        </div>
      </div>

      {/* Live Active Breaks Monitor */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/15 text-sky-400 rounded-xl">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Live Active Break Tracker</h3>
              <p className="text-[11px] text-slate-400">Personnel currently away from workstations or duty stations</p>
            </div>
          </div>
        </div>

        {activeBreakRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
            <p className="font-semibold text-slate-300">All clocked-in staff are actively on duty</p>
            <p className="text-[11px] text-slate-500">No active break sessions currently recorded today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeBreakRecords.map(rec => (
              <div
                key={rec.id}
                className="p-3.5 bg-slate-950/90 border border-sky-500/30 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm"
              >
                <div>
                  <p className="font-bold text-white">{rec.employeeName}</p>
                  <p className="text-[11px] text-slate-400">{rec.department}</p>
                  <p className="text-[10px] text-sky-400 font-mono mt-1">
                    Break started at: {rec.breakStart}
                  </p>
                </div>

                <button
                  onClick={() => endBreak(rec.employeeId)}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs shadow-sm transition-colors shrink-0"
                >
                  End Break
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Break Policies & Working Time Calculation Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policy Configuration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Break & Rest Parameters</h3>
              <p className="text-[11px] text-slate-400">Company policy & statutory labor regulations</p>
            </div>
          </div>

          <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Unpaid Meal / Lunch Break Duration (Minutes)
              </label>
              <input
                type="number"
                min="0"
                value={breakPolicyForm.unpaidLunchBreakMinutes}
                onChange={e => setBreakPolicyForm({ ...breakPolicyForm, unpaidLunchBreakMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Automatically deducted from total clocked hours to compute regular billable working hours.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Paid Rest & Tea Interval (Minutes)
              </label>
              <input
                type="number"
                min="0"
                value={breakPolicyForm.paidTeaBreakMinutes}
                onChange={e => setBreakPolicyForm({ ...breakPolicyForm, paidTeaBreakMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Short rest periods (15 mins) are fully compensated and not deducted from payroll.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Standard Official Shift Hours Threshold
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={breakPolicyForm.standardDailyHours}
                onChange={e => setBreakPolicyForm({ ...breakPolicyForm, standardDailyHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Approved work exceeding this standard daily threshold triggers overtime calculation.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Punch Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                value={breakPolicyForm.defaultGracePeriodMinutes}
                onChange={e => setBreakPolicyForm({ ...breakPolicyForm, defaultGracePeriodMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Arrivals within this grace margin past scheduled start are not flagged as late penalties.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>Save Break Policies</span>
              </button>
            </div>
          </form>
        </div>

        {/* Policy Explainer & Statutory Guidelines */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-2">Hospitality Labor Standards Compliance</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Our automated system enforces fair work standards and accurate compensation calculations:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <p className="font-bold text-slate-200">1. Unpaid Break Deductions</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  When employees punch out for meal breaks, the system accurately subtracts total lunch time so staff are neither underpaid nor overcredited.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <p className="font-bold text-slate-200">2. Consecutive Shift Minimum Rest</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  A minimum 11-hour rest period is recommended between the end of an evening shift and the beginning of a morning shift.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <p className="font-bold text-slate-200">3. Automatic Overtime Transition</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Any verified duty time exceeding 8 net hours automatically routes to the Overtime Queue for supervisor approval before payroll inclusion.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Rules apply globally to all full-time, contract, and part-time staff members.
          </div>
        </div>
      </div>
    </div>
  );
};
