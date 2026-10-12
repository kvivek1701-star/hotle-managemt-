import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import {
  Settings,
  Building2,
  IndianRupee,
  ShieldCheck,
  History,
  Save,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

export const HRMSSettingsView: React.FC = () => {
  const { settings, updateSettings, auditLogs } = useHRMS();

  const [activeTab, setActiveTab] = useState<'company' | 'policies' | 'audit'>('company');

  const [formData, setFormData] = useState({
    companyName: settings.companyName,
    legalEntityName: settings.legalEntityName,
    companyAddress: settings.companyAddress,
    companyPhone: settings.companyPhone,
    companyEmail: settings.companyEmail,
    taxRegistrationNumber: settings.taxRegistrationNumber,
    standardDailyHours: settings.standardDailyHours,
    standardWeeklyHours: settings.standardWeeklyHours,
    overtimeRateWeekday: settings.overtimeRateWeekday,
    overtimeRateWeekendOrHoliday: settings.overtimeRateWeekendOrHoliday,
    defaultGracePeriodMinutes: settings.defaultGracePeriodMinutes,
    monthlyPayrollCutoffDay: settings.monthlyPayrollCutoffDay,
    currency: settings.currency,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName: formData.companyName,
      legalEntityName: formData.legalEntityName,
      companyAddress: formData.companyAddress,
      companyPhone: formData.companyPhone,
      companyEmail: formData.companyEmail,
      taxRegistrationNumber: formData.taxRegistrationNumber,
      standardDailyHours: Number(formData.standardDailyHours),
      standardWeeklyHours: Number(formData.standardWeeklyHours),
      overtimeRateWeekday: Number(formData.overtimeRateWeekday),
      overtimeRateWeekendOrHoliday: Number(formData.overtimeRateWeekendOrHoliday),
      defaultGracePeriodMinutes: Number(formData.defaultGracePeriodMinutes),
      monthlyPayrollCutoffDay: Number(formData.monthlyPayrollCutoffDay),
      currency: formData.currency,
    });
    setFeedback({ type: 'success', text: 'System workforce policies and corporate credentials saved.' });
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
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">HRMS Configuration & Audit Center</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Corporate entity information, statutory tax rates, labor multipliers, and tamper-evident audit logs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-colors ${
            activeTab === 'company'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Entity Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-colors ${
            activeTab === 'policies'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Work Hours & OT Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-colors ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log History ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm mb-2">Corporate Entity & Contact Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Brand Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Legal Registered Entity</label>
              <input
                type="text"
                value={formData.legalEntityName}
                onChange={e => setFormData({ ...formData, legalEntityName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Headquarters / Physical Campus Address</label>
            <input
              type="text"
              value={formData.companyAddress}
              onChange={e => setFormData({ ...formData, companyAddress: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tax ID / GST Number</label>
              <input
                type="text"
                value={formData.taxRegistrationNumber}
                onChange={e => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Official HR Phone</label>
              <input
                type="text"
                value={formData.companyPhone}
                onChange={e => setFormData({ ...formData, companyPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Official HR Email</label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={e => setFormData({ ...formData, companyEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Corporate Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Policies */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm mb-2">Statutory Working Hours & Overtime Rules</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Daily Standard Work Hours (Hours/Day)</label>
              <input
                type="number"
                step="0.5"
                value={formData.standardDailyHours}
                onChange={e => setFormData({ ...formData, standardDailyHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Weekly Standard Work Hours (Hours/Week)</label>
              <input
                type="number"
                value={formData.standardWeeklyHours}
                onChange={e => setFormData({ ...formData, standardWeeklyHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Weekday Overtime Rate Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={formData.overtimeRateWeekday}
                onChange={e => setFormData({ ...formData, overtimeRateWeekday: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default 1.5x of hourly wage rate</p>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Holiday / Weekly-Off Overtime Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={formData.overtimeRateWeekendOrHoliday}
                onChange={e => setFormData({ ...formData, overtimeRateWeekendOrHoliday: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default 2.0x of hourly wage rate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Late Arrival Grace Period (Minutes)</label>
              <input
                type="number"
                value={formData.defaultGracePeriodMinutes}
                onChange={e => setFormData({ ...formData, defaultGracePeriodMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Monthly Payroll Cutoff Day (1 - 31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.monthlyPayrollCutoffDay}
                onChange={e => setFormData({ ...formData, monthlyPayrollCutoffDay: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Workforce Policies</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Security & Administrative Audit Trail</h3>
            <span className="font-mono text-slate-400 text-[11px]">{auditLogs.length} events recorded</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Every attendance correction, overtime approval, leave decision, deletion, and salary disbursement is permanently logged.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Actor & Role</th>
                  <th className="pb-3">Action Event</th>
                  <th className="pb-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 text-slate-200">
                      <span className="font-sans font-bold text-white">{log.actorName}</span>{' '}
                      <span className="text-[10px] text-amber-400">({log.actorRole})</span>
                    </td>
                    <td className="py-2.5 text-amber-400 font-bold text-[11px]">{log.action}</td>
                    <td className="py-2.5 text-slate-300 font-sans text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
