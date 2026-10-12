import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { DutySchedule, DutyScheduleStatus } from '../../types/hrms';
import {
  CalendarDays,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Send,
  X,
  Edit2,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const DutySchedulingView: React.FC = () => {
  const {
    employees,
    shifts,
    dutySchedules,
    assignDutySchedule,
    bulkAssignDutySchedules,
    deleteDutySchedule,
    detectScheduleConflicts,
  } = useHRMS();

  // Current selected week offset
  const [weekOffset, setWeekOffset] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    employeeId: employees[0]?.id || '',
    shiftId: shifts[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    status: 'scheduled' as DutyScheduleStatus,
    notes: '',
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<DutySchedule | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generate 7 days for the current week view
  const getWeekDates = () => {
    const curr = new Date();
    // Monday of current week
    const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1 + weekOffset * 7));
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() + i);
      week.push(d.toISOString().split('T')[0]);
    }
    return week;
  };

  const weekDates = getWeekDates();

  const handleOpenAssign = (employeeId?: string, dateStr?: string) => {
    setAssignForm({
      employeeId: employeeId || employees[0]?.id || '',
      shiftId: shifts[0]?.id || '',
      date: dateStr || weekDates[0],
      status: 'scheduled',
      notes: '',
    });
    setAssignModalOpen(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === assignForm.employeeId);
    const shift = shifts.find(s => s.id === assignForm.shiftId);
    if (!emp || !shift) return;

    const res = assignDutySchedule({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      shiftId: shift.id,
      shiftName: shift.name,
      date: assignForm.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      status: assignForm.status,
      notes: assignForm.notes,
    });

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setAssignModalOpen(false);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!scheduleToDelete) return;
    const res = deleteDutySchedule(scheduleToDelete.id);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setDeleteModalOpen(false);
    setScheduleToDelete(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAutoGenerateWeeklyRoster = () => {
    const newItems: Omit<DutySchedule, 'id'>[] = [];
    employees.forEach(emp => {
      const shift = shifts.find(s => s.id === emp.defaultShiftId) || shifts[0];
      weekDates.forEach((dateStr, idx) => {
        // Saturday/Sunday or day 6/7 as weekly off for non-hospitality core
        const dayOfWeek = new Date(dateStr).getDay();
        const isOff = dayOfWeek === 0; // Sunday off by default
        newItems.push({
          employeeId: emp.id,
          employeeName: emp.name,
          department: emp.department,
          shiftId: shift.id,
          shiftName: isOff ? 'Weekly Off (WO)' : shift.name,
          date: dateStr,
          startTime: isOff ? '--:--' : shift.startTime,
          endTime: isOff ? '--:--' : shift.endTime,
          status: isOff ? 'weekly_off' : 'scheduled',
          notes: isOff ? 'Weekly Off Statutory Rest' : 'Standard weekly roster duty',
        });
      });
    });

    const res = bulkAssignDutySchedules(newItems);
    setFeedback({ type: 'success', text: `Published complete weekly duty roster for all ${employees.length} staff members!` });
    setTimeout(() => setFeedback(null), 4000);
  };

  const filteredEmployees = employees.filter(
    e => departmentFilter === 'All' || e.department === departmentFilter
  );

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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Duty Scheduling & Shift Roster</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Plan weekly shifts, assign duty slots, resolve conflicts, and configure rest days
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAutoGenerateWeeklyRoster}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
            title="Auto populate week with default assigned shifts"
          >
            <Send className="w-4 h-4 text-amber-400" />
            <span>Publish Standard Weekly Roster</span>
          </button>
          <button
            onClick={() => handleOpenAssign()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Single Shift</span>
          </button>
        </div>
      </div>

      {/* Week Navigator & Department Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-white font-bold">
            {weekDates[0]} to {weekDates[6]}
          </div>
          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[11px] text-amber-400 hover:underline font-semibold ml-2"
            >
              Back to Current Week
            </button>
          )}
        </div>

        {/* Filter by Dept */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Department:</span>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
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

      {/* Duty Roster Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                <th className="py-3 px-4 w-56 sticky left-0 bg-slate-950 z-10 border-r border-slate-800">
                  Staff Member
                </th>
                {weekDates.map(dateStr => {
                  const d = new Date(dateStr);
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <th
                      key={dateStr}
                      className={`py-3 px-3 text-center min-w-[130px] border-r border-slate-800/60 ${
                        isToday ? 'bg-amber-500/10 text-amber-300' : ''
                      }`}
                    >
                      <div className="font-bold">{dayName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{dayNum}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Sticky Employee cell */}
                  <td className="py-3 px-4 sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                    <p className="font-bold text-white truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{emp.department} · {emp.jobTitle}</p>
                  </td>

                  {/* 7 Day slots */}
                  {weekDates.map(dateStr => {
                    const schedule = dutySchedules.find(s => s.employeeId === emp.id && s.date === dateStr);
                    return (
                      <td
                        key={dateStr}
                        className="py-2.5 px-2 text-center border-r border-slate-800/60 align-top"
                      >
                        {schedule ? (
                          <div
                            className={`p-2 rounded-xl text-left border relative group transition-all ${
                              schedule.status === 'weekly_off'
                                ? 'bg-slate-950 text-slate-400 border-slate-800'
                                : schedule.status === 'leave'
                                ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                                : 'bg-slate-800/90 text-white border-slate-700/80 shadow-sm'
                            }`}
                          >
                            <p className="font-bold text-[11px] truncate">{schedule.shiftName}</p>
                            {schedule.startTime && schedule.startTime !== '--:--' && (
                              <p className="font-mono text-[10px] text-amber-400/90">
                                {schedule.startTime} - {schedule.endTime}
                              </p>
                            )}

                            {/* Delete button on hover */}
                            <button
                              onClick={() => {
                                setScheduleToDelete(schedule);
                                setDeleteModalOpen(true);
                              }}
                              className="absolute top-1 right-1 p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete shift assignment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAssign(emp.id, dateStr)}
                            className="w-full py-2.5 rounded-xl border border-dashed border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/50 text-[10px] text-slate-500 hover:text-amber-400 transition-all font-medium"
                          >
                            + Assign
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Shift Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Assign Duty Shift</h3>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Employee *</label>
                <select
                  value={assignForm.employeeId}
                  onChange={e => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Duty Date *</label>
                <input
                  type="date"
                  required
                  value={assignForm.date}
                  onChange={e => setAssignForm({ ...assignForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Shift / Assignment *</label>
                <select
                  value={assignForm.shiftId}
                  onChange={e => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime}) {s.isOvernight ? '🌙 Overnight' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Status</label>
                <select
                  value={assignForm.status}
                  onChange={e => setAssignForm({ ...assignForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="scheduled">Scheduled Active Shift</option>
                  <option value="weekly_off">Weekly Off (Rest Day)</option>
                  <option value="holiday">Public / Company Holiday</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Special Duties / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Assigned to VIP floor level 4"
                  value={assignForm.notes}
                  onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Assign Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Remove Duty Schedule"
        itemName={scheduleToDelete ? `${scheduleToDelete.employeeName} (${scheduleToDelete.date} - ${scheduleToDelete.shiftName})` : undefined}
        message="Are you sure you want to remove this shift assignment? The employee will be unscheduled on this date."
        confirmLabel="Remove Shift Assignment"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setScheduleToDelete(null);
        }}
      />
    </div>
  );
};
