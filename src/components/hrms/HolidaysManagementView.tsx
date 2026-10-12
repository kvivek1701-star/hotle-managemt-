import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { Holiday } from '../../types/hrms';
import {
  Palmtree,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Building2,
  Flag,
  X,
  Save,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const HolidaysManagementView: React.FC = () => {
  const { holidays, addHoliday, updateHoliday, deleteHoliday } = useHRMS();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: 'public' as Holiday['type'],
    description: '',
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      type: 'public',
      description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (hol: Holiday) => {
    setEditingHoliday(hol);
    setFormData({
      name: hol.name,
      date: hol.date,
      type: hol.type,
      description: hol.description || '',
    });
    setModalOpen(true);
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', text: 'Holiday Name is required.' });
      return;
    }

    if (editingHoliday) {
      const res = updateHoliday(editingHoliday.id, {
        name: formData.name,
        date: formData.date,
        type: formData.type,
        description: formData.description,
      });
      setFeedback({ type: 'success', text: res.message });
    } else {
      const res = addHoliday({
        name: formData.name,
        date: formData.date,
        type: formData.type,
        description: formData.description,
      });
      setFeedback({ type: 'success', text: res.message });
    }

    setModalOpen(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteConfirm = () => {
    if (!holidayToDelete) return;
    const res = deleteHoliday(holidayToDelete.id);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
    setDeleteModalOpen(false);
    setHolidayToDelete(null);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Sort holidays by date
  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

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
          <h2 className="text-xl font-bold text-white tracking-tight">Public & Corporate Holiday Calendar</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure official statutory paid days off and company festival closures for 2026
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Holiday Event</span>
        </button>
      </div>

      {/* Holidays List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedHolidays.map(hol => {
          const isPassed = new Date(hol.date) < new Date();
          return (
            <div
              key={hol.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isPassed
                  ? 'bg-slate-900/60 border-slate-800/60 opacity-80'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      hol.type === 'public'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : hol.type === 'company'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {hol.type} Holiday
                  </span>
                </div>

                <h3 className="font-bold text-base text-white">{hol.name}</h3>
                <p className="font-mono text-sm text-amber-400 font-bold mt-1">{hol.date}</p>
                <p className="text-xs text-slate-400 mt-2 italic">
                  {hol.description || 'All standard hotel shifts receive holiday premium rates if on duty.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {isPassed ? 'Past Holiday' : 'Upcoming'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(hol)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    title="Edit Holiday"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setHolidayToDelete(hol);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
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
              {editingHoliday ? `Edit Holiday: ${editingHoliday.name}` : 'Add Official Holiday'}
            </h3>

            <form onSubmit={handleSaveHoliday} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Labor Day"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Observed Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Holiday Classification</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="public">Statutory Public Holiday</option>
                  <option value="company">Company Foundation / Annual Holiday</option>
                  <option value="optional">Optional / Floating Holiday</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description / Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Notes on roster coverage or premium multiplier..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                  {editingHoliday ? 'Save Changes' : 'Add to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Holiday"
        itemName={holidayToDelete ? `${holidayToDelete.name} (${holidayToDelete.date})` : undefined}
        message="Are you sure you want to remove this holiday from the calendar? Overtime calculated on this date will revert to weekday standards."
        confirmLabel="Permanently Delete Holiday"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setHolidayToDelete(null);
        }}
      />
    </div>
  );
};
