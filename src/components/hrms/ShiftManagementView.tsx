import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { Shift } from '../../types/hrms';
import {
  Timer,
  Plus,
  Trash2,
  Edit2,
  Moon,
  Sun,
  Coffee,
  Clock,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const ShiftManagementView: React.FC = () => {
  const { shifts, addShift, updateShift, deleteShift } = useHRMS();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startTime: '08:00',
    endTime: '16:30',
    isOvernight: false,
    breakMinutes: 30,
    requiredWorkingHours: 8,
    color: '#0284c7',
    description: '',
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenAdd = () => {
    setEditingShift(null);
    setFormData({
      name: '',
      code: '',
      startTime: '08:00',
      endTime: '16:30',
      isOvernight: false,
      breakMinutes: 30,
      requiredWorkingHours: 8,
      color: '#10b981',
      description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      code: shift.code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      isOvernight: shift.isOvernight,
      breakMinutes: shift.breakMinutes,
      requiredWorkingHours: shift.requiredWorkingHours,
      color: shift.color,
      description: shift.description || '',
    });
    setModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setFeedback({ type: 'error', text: 'Shift Name and Code are required.' });
      return;
    }

    if (editingShift) {
      const res = updateShift(editingShift.id, {
        name: formData.name,
        code: formData.code,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isOvernight: formData.isOvernight,
        breakMinutes: Number(formData.breakMinutes),
        requiredWorkingHours: Number(formData.requiredWorkingHours),
        color: formData.color,
        description: formData.description,
      });
      setFeedback({ type: 'success', text: res.message });
    } else {
      const res = addShift({
        name: formData.name,
        code: formData.code.toUpperCase(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        isOvernight: formData.isOvernight,
        breakMinutes: Number(formData.breakMinutes),
        requiredWorkingHours: Number(formData.requiredWorkingHours),
        color: formData.color,
        activeDays: [1, 2, 3, 4, 5],
        description: formData.description,
      });
      setFeedback({ type: 'success', text: res.message });
    }

    setModalOpen(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!shiftToDelete) return;
    const res = deleteShift(shiftToDelete.id);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setDeleteModalOpen(false);
    setShiftToDelete(null);
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
          <h2 className="text-xl font-bold text-white tracking-tight">Shift Definitions & Duty Hours</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure shift windows, overnight cross-day schedules, lunch breaks, and required minimum duty hours
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Shift</span>
        </button>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map(shift => (
          <div
            key={shift.id}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: shift.color }}
                  />
                  <div>
                    <h3 className="font-bold text-base text-white">{shift.name}</h3>
                    <span className="font-mono text-xs text-amber-400 font-semibold">{shift.code}</span>
                  </div>
                </div>

                {shift.isOvernight && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    <Moon className="w-3 h-3" />
                    <span>Overnight</span>
                  </span>
                )}
              </div>

              {/* Time details */}
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 text-xs mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Duty Hours:
                  </span>
                  <span className="font-mono font-bold text-white text-sm">
                    {shift.startTime} – {shift.endTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Coffee className="w-3.5 h-3.5 text-sky-400" /> Break Time:
                  </span>
                  <span className="font-mono text-slate-300">
                    {shift.breakMinutes} mins (unpaid)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Net Required Work:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {shift.requiredWorkingHours} hrs/shift
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                {shift.description || 'Standard hospitality shift assignment.'}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(shift)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  setShiftToDelete(shift);
                  setDeleteModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Shift Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingShift ? `Edit Shift: ${editingShift.name}` : 'Create New Shift'}
            </h3>

            <form onSubmit={handleSaveShift} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Shift Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Afternoon Turn-Down"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="ATD"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="isOvernight"
                  checked={formData.isOvernight}
                  onChange={e => setFormData({ ...formData, isOvernight: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="isOvernight" className="text-slate-300 font-semibold cursor-pointer">
                  Overnight Shift (Crosses midnight into the next calendar day)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Break Duration (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.breakMinutes}
                    onChange={e => setFormData({ ...formData, breakMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Required Net Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={formData.requiredWorkingHours}
                    onChange={e => setFormData({ ...formData, requiredWorkingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Operational responsibilities during this shift..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  {editingShift ? 'Save Changes' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Shift Definition"
        itemName={shiftToDelete ? `${shiftToDelete.name} (${shiftToDelete.code})` : undefined}
        message="Are you sure you want to permanently delete this shift configuration? Employees assigned to this shift will need to be reassigned."
        confirmLabel="Permanently Delete Shift"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setShiftToDelete(null);
        }}
      />
    </div>
  );
};
