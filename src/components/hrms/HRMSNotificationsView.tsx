import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Megaphone,
  Clock,
  TrendingUp,
  Palmtree,
  Wallet,
  Calendar,
  X,
  Plus,
} from 'lucide-react';
import { HRMSNotification } from '../../types/hrms';

export const HRMSNotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    addNotification,
  } = useHRMS();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMsg.trim()) {
      setFeedback({ type: 'error', text: 'Title and message are required.' });
      return;
    }

    addNotification(announcementTitle, announcementMsg, 'announcement');
    setFeedback({ type: 'success', text: 'Company broadcast announcement dispatched to all personnel.' });
    setAnnouncementModalOpen(false);
    setAnnouncementTitle('');
    setAnnouncementMsg('');
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredNotifs = notifications.filter(
    n => categoryFilter === 'All' || n.type === categoryFilter
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Workforce Communications & Live Alerts</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational broadcast notices, shift schedule publications, leave & overtime verdicts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            onClick={() => setAnnouncementModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Megaphone className="w-4 h-4" />
            <span>Broadcast Announcement</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['All', 'shift', 'leave', 'overtime', 'attendance', 'payroll', 'announcement'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl font-semibold capitalize shrink-0 transition-colors ${
              categoryFilter === cat
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No alerts or notifications recorded in this category.
          </div>
        ) : (
          filteredNotifs.map(notif => {
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 text-xs ${
                  isUnread
                    ? 'bg-slate-950/90 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    notif.type === 'shift'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : notif.type === 'leave'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : notif.type === 'overtime'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : notif.type === 'payroll'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}>
                    {notif.type === 'shift' && <Calendar className="w-4 h-4" />}
                    {notif.type === 'leave' && <Palmtree className="w-4 h-4" />}
                    {notif.type === 'overtime' && <TrendingUp className="w-4 h-4" />}
                    {notif.type === 'attendance' && <Clock className="w-4 h-4" />}
                    {notif.type === 'payroll' && <Wallet className="w-4 h-4" />}
                    {notif.type === 'announcement' && <Megaphone className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold text-sm ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                        {notif.title}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-500">{notif.date}</span>
                    </div>
                    <p className={`mt-1 leading-relaxed ${isUnread ? 'text-slate-200' : 'text-slate-400'}`}>
                      {notif.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUnread && (
                    <button
                      onClick={() => markNotificationRead(notif.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
            <button
              onClick={() => setAnnouncementModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Broadcast Company Announcement</h3>
            <p className="text-xs text-slate-400 mb-4">
              Send an alert banner and notification to all employees in the system.
            </p>

            <form onSubmit={handleBroadcastAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notice Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Staff Gala & Service Excellence Awards"
                  value={announcementTitle}
                  onChange={e => setAnnouncementTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Announcement Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Details of the announcement, date, dress code, and department requirements..."
                  value={announcementMsg}
                  onChange={e => setAnnouncementMsg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
