import React from 'react';
import { useHotel } from '../context/HotelContext';
import { Shield, User, X, Check, Building, Lock } from 'lucide-react';

interface RoleSwitcherModalProps {
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ onClose }) => {
  const { allUsers, currentUser, setCurrentUserById, hotels } = useHotel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">Switch Operator Session</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-400">
            Select an account to test role permissions. Admin has full multi-property access, while Hotel Owners are locked to their assigned property only.
          </p>

          <div className="space-y-2.5">
            {allUsers.map(user => {
              const isCurrent = currentUser.id === user.id;
              const assignedHotel = hotels.find(h => h.id === user.assignedHotelId);

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    if (user.isActive) {
                      setCurrentUserById(user.id);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all ${
                    !user.isActive
                      ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800'
                      : isCurrent
                      ? 'bg-amber-500/15 border-amber-500 shadow-sm cursor-pointer'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        user.role === 'super_admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role === 'super_admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{user.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            user.role === 'super_admin' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {user.role === 'super_admin' ? 'Super Admin' : 'Hotel Owner'}
                          </span>
                        </div>
                        <p className="text-slate-400">{user.email}</p>
                        <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {user.role === 'super_admin'
                            ? 'All Hotels & Properties Access'
                            : `Assigned: ${assignedHotel?.name || 'Unassigned'}`}
                        </p>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="p-1 rounded-full bg-amber-500 text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
