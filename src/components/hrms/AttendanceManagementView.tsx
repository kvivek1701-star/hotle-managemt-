import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { AttendanceRecord, Department } from '../../types/hrms';
import {
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  FileCheck,
  Check,
  X,
  Timer,
  ChevronRight,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const AttendanceManagementView: React.FC = () => {
  const {
    employees,
    attendanceRecords,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    correctionRequests,
    approveCorrectionRequest,
    rejectCorrectionRequest,
    deleteCorrectionRequest,
    submitCorrectionRequest,
    currentEmployeeUser,
  } = useHRMS();

  const [activeSubTab, setActiveSubTab] = useState<'live_log' | 'corrections' | 'monthly_sheet'>('live_log');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState<string>('All');

  // Manual Add Modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);

  // Correction Request Modal state
  const [reqCorrectionModalOpen, setReqCorrectionModalOpen] = useState(false);
  const [reqData, setReqData] = useState({
    employeeId: currentEmployeeUser.id,
    date: new Date().toISOString().split('T')[0],
    requestedClockIn: '06:00',
    requestedClockOut: '14:30',
    reason: '',
  });

  // Manual form
  const [manualForm, setManualForm] = useState({
    employeeId: employees[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '08:00',
    clockOut: '16:30',
    totalBreakMinutes: 30,
    status: 'present' as AttendanceRecord['status'],
    notes: '',
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenAddManual = () => {
    setEditingAttendance(null);
    setManualForm({
      employeeId: employees[0]?.id || '',
      date: selectedDate,
      clockIn: '08:00',
      clockOut: '16:30',
      totalBreakMinutes: 30,
      status: 'present',
      notes: 'Manual entry by manager',
    });
    setManualModalOpen(true);
  };

  const handleOpenEditManual = (rec: AttendanceRecord) => {
    setEditingAttendance(rec);
    setManualForm({
      employeeId: rec.employeeId,
      date: rec.date,
      clockIn: rec.clockIn || '08:00',
      clockOut: rec.clockOut || '16:30',
      totalBreakMinutes: rec.totalBreakMinutes || 30,
      status: rec.status,
      notes: rec.notes || '',
    });
    setManualModalOpen(true);
  };

  const handleSaveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === manualForm.employeeId);
    if (!emp) return;

    // Calculate hours
    const [inH, inM] = manualForm.clockIn.split(':').map(Number);
    const [outH, outM] = manualForm.clockOut.split(':').map(Number);
    let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const netWorkedMinutes = Math.max(0, totalMinutes - manualForm.totalBreakMinutes);
    const regularHours = Math.min(8, parseFloat((netWorkedMinutes / 60).toFixed(1)));
    const overtimeHours = Math.max(0, parseFloat(((netWorkedMinutes / 60) - 8).toFixed(1)));

    if (editingAttendance) {
      const res = updateAttendanceRecord(editingAttendance.id, {
        clockIn: manualForm.clockIn,
        clockOut: manualForm.clockOut,
        totalBreakMinutes: manualForm.totalBreakMinutes,
        regularHours,
        overtimeHours,
        status: manualForm.status,
        notes: manualForm.notes,
      });
      setFeedback({ type: 'success', text: res.message });
    } else {
      const res = addAttendanceRecord({
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        date: manualForm.date,
        clockIn: manualForm.clockIn,
        clockOut: manualForm.clockOut,
        totalBreakMinutes: manualForm.totalBreakMinutes,
        regularHours,
        overtimeHours,
        status: manualForm.status,
        isLate: manualForm.status === 'late',
        lateMinutes: manualForm.status === 'late' ? 20 : 0,
        isEarlyDeparture: false,
        earlyDepartureMinutes: 0,
        notes: manualForm.notes,
      });
      setFeedback({ type: 'success', text: res.message });
    }

    setManualModalOpen(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!recordToDelete) return;
    const res = deleteAttendanceRecord(recordToDelete.id);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setDeleteModalOpen(false);
    setRecordToDelete(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSendCorrectionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === reqData.employeeId);
    if (!emp) return;

    const res = submitCorrectionRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      date: reqData.date,
      requestedClockIn: reqData.requestedClockIn,
      requestedClockOut: reqData.requestedClockOut,
      reason: reqData.reason || 'Punch card reader malfunction',
    });

    setFeedback({ type: 'success', text: res.message });
    setReqCorrectionModalOpen(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filter attendance records
  const filteredRecords = attendanceRecords.filter(r => {
    const matchesEmp =
      r.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      r.department.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesDate = !selectedDate || r.date === selectedDate;
    const matchesDept = selectedDept === 'All' || r.department === selectedDept;
    return matchesEmp && matchesDate && matchesDept;
  });

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

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Biometric & Attendance Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Clock in/out times, break durations, late arrivals, and attendance corrections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReqCorrectionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
          >
            <Timer className="w-4 h-4 text-sky-400" />
            <span>Request Punch Fix</span>
          </button>
          <button
            onClick={handleOpenAddManual}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('live_log')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'live_log'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Daily Punch Logs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('corrections')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'corrections'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Correction Requests</span>
          {correctionRequests.filter(c => c.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {correctionRequests.filter(c => c.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('monthly_sheet')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'monthly_sheet'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Monthly Timesheet Matrix</span>
        </button>
      </div>

      {/* Tab 1: Daily Punch Logs */}
      {activeSubTab === 'live_log' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employee or department..."
                value={searchEmployee}
                onChange={e => setSearchEmployee(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Department:</span>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
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
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3">Clock In</th>
                    <th className="py-3.5 px-3">Clock Out</th>
                    <th className="py-3.5 px-3">Breaks Taken</th>
                    <th className="py-3.5 px-3">Reg Hours</th>
                    <th className="py-3.5 px-3">OT Hours</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No attendance records found for the selected date and filters.
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
                        <td className="py-3 px-3">
                          {r.clockIn ? (
                            <span className="font-mono font-bold text-emerald-400">{r.clockIn}</span>
                          ) : (
                            <span className="text-slate-500">--:--</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {r.clockOut ? (
                            <span className="font-mono font-bold text-rose-400">{r.clockOut}</span>
                          ) : (
                            <span className="text-slate-500">--:--</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono">
                          {r.totalBreakMinutes} mins
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">
                          {r.regularHours}h
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">
                          {r.overtimeHours > 0 ? `+${r.overtimeHours}h` : '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              r.status === 'present'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : r.status === 'late'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : r.status === 'on_leave'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {r.status} {r.isLate && `(${r.lateMinutes}m)`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditManual(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              title="Edit Attendance Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setRecordToDelete(r);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Attendance Record"
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
        </div>
      )}

      {/* Tab 2: Correction Requests */}
      {activeSubTab === 'corrections' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-1">Attendance Correction Workflow</h3>
            <p className="text-xs text-slate-400 mb-4">
              Employees can dispute or submit adjustments for missing biometric punches, transit delays, or device offline incidents.
            </p>

            <div className="space-y-3">
              {correctionRequests.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No correction requests recorded.</p>
              ) : (
                correctionRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{req.employeeName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-400">{req.department}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-amber-400">{req.date}</span>
                      </div>
                      <p className="text-slate-300 mt-1">
                        Requested Clock In: <strong className="text-emerald-400 font-mono">{req.requestedClockIn}</strong> | Requested Clock Out: <strong className="text-rose-400 font-mono">{req.requestedClockOut}</strong>
                      </p>
                      <p className="text-slate-400 text-[11px] mt-0.5 italic">
                        Reason: "{req.reason}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => approveCorrectionRequest(req.id, 'Approved by manager')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
                          >
                            Approve Correction
                          </button>
                          <button
                            onClick={() => rejectCorrectionRequest(req.id, 'Discrepancy in logs')}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700 rounded-xl text-xs transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      )}

                      <button
                        onClick={() => deleteCorrectionRequest(req.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Timesheet Matrix */}
      {activeSubTab === 'monthly_sheet' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Monthly Timesheet Matrix</h3>
              <p className="text-xs text-slate-400">Aggregated days present, hours, late arrivals, and absence counts</p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">Month: October 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Dept</th>
                  <th className="py-3 px-3">Present Days</th>
                  <th className="py-3 px-3">Total Reg Hours</th>
                  <th className="py-3 px-3">Total OT Hours</th>
                  <th className="py-3 px-3">Late Incidents</th>
                  <th className="py-3 px-4 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {employees.map(emp => {
                  const empRecords = attendanceRecords.filter(a => a.employeeId === emp.id);
                  const presentCount = empRecords.filter(a => a.status === 'present' || a.status === 'late').length;
                  const totalReg = empRecords.reduce((sum, a) => sum + (a.regularHours || 0), 0);
                  const totalOt = empRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
                  const lateCount = empRecords.filter(a => a.isLate).length;
                  const pct = Math.min(100, Math.round(((presentCount || 1) / 22) * 100));

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{emp.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{emp.employeeId}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{emp.department}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{presentCount || 21} / 22</td>
                      <td className="py-3 px-3 font-mono text-slate-200">{totalReg.toFixed(1)} hrs</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">+{totalOt.toFixed(1)} hrs</td>
                      <td className="py-3 px-3 text-slate-300 font-mono">{lateCount}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-emerald-400 font-mono">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Add / Edit Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setManualModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingAttendance ? 'Edit Attendance Record' : 'Add Manual Attendance Entry'}
            </h3>

            <form onSubmit={handleSaveManualAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Employee</label>
                <select
                  disabled={Boolean(editingAttendance)}
                  value={manualForm.employeeId}
                  onChange={e => setManualForm({ ...manualForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-60"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employeeId} · {e.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={manualForm.date}
                  onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Clock In Time</label>
                  <input
                    type="time"
                    required
                    value={manualForm.clockIn}
                    onChange={e => setManualForm({ ...manualForm, clockIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Clock Out Time</label>
                  <input
                    type="time"
                    required
                    value={manualForm.clockOut}
                    onChange={e => setManualForm({ ...manualForm, clockOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unpaid Break (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    value={manualForm.totalBreakMinutes}
                    onChange={e => setManualForm({ ...manualForm, totalBreakMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Status</label>
                  <select
                    value={manualForm.status}
                    onChange={e => setManualForm({ ...manualForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late Arrival</option>
                    <option value="half_day">Half Day</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Field inspection or manual register entry"
                  value={manualForm.notes}
                  onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Correction Modal */}
      {reqCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setReqCorrectionModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Request Attendance Correction</h3>
            <p className="text-xs text-slate-400 mb-4">
              Submit adjusted punch times for manager verification and approval.
            </p>

            <form onSubmit={handleSendCorrectionRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Employee</label>
                <select
                  value={reqData.employeeId}
                  onChange={e => setReqData({ ...reqData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.jobTitle})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={reqData.date}
                  onChange={e => setReqData({ ...reqData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Correct Clock In</label>
                  <input
                    type="time"
                    required
                    value={reqData.requestedClockIn}
                    onChange={e => setReqData({ ...reqData, requestedClockIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Correct Clock Out</label>
                  <input
                    type="time"
                    required
                    value={reqData.requestedClockOut}
                    onChange={e => setReqData({ ...reqData, requestedClockOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason for Dispute / Correction *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Turnstile reader failed to recognize RFID card upon arrival"
                  value={reqData.reason}
                  onChange={e => setReqData({ ...reqData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReqCorrectionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Attendance Deletion */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Attendance Record"
        itemName={recordToDelete ? `${recordToDelete.employeeName} (${recordToDelete.date})` : undefined}
        message="Are you sure you want to permanently delete this attendance record? This will remove the recorded working hours and affect payroll calculations."
        confirmLabel="Permanently Delete Attendance"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setRecordToDelete(null);
        }}
      />
    </div>
  );
};
