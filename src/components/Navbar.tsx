import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import {
  Building2,
  CalendarPlus,
  Shield,
  User,
  ChevronDown,
  Database,
  Download,
  Upload,
  RotateCcw,
  Hotel as HotelIcon,
  Check,
  Users,
} from 'lucide-react';

interface NavbarProps {
  onOpenNewBooking: () => void;
  onOpenRoleSwitcher: () => void;
  onOpenNewBill?: () => void;
  onSwitchToHRMS?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewBooking, onOpenRoleSwitcher, onOpenNewBill, onSwitchToHRMS }) => {
  const {
    currentUser,
    hotels,
    selectedHotelId,
    setSelectedHotelId,
    activeHotel,
    resetToDefaultData,
    exportDatabaseJson,
    importDatabaseJson,
  } = useHotel();

  const [dbMenuOpen, setDbMenuOpen] = useState(false);
  const [hotelMenuOpen, setHotelMenuOpen] = useState(false);

  const handleDownloadBackup = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grandstay_hotel_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDbMenuOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        if (content) {
          const ok = importDatabaseJson(content);
          if (ok) {
            alert('Database backup restored successfully!');
          } else {
            alert('Invalid backup file format.');
          }
        }
      };
      reader.readAsText(file);
    }
    setDbMenuOpen(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset all rooms, bookings, payments, and users to initial factory demo state?')) {
      resetToDefaultData();
      setDbMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Hotel Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              G
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
                GrandStay <span className="text-amber-400 font-semibold text-xs uppercase ml-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">PMS</span>
              </span>
              <span className="text-[11px] text-slate-400 block font-medium">
                Hotel Owner & Admin Software
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Hotel Property Selector */}
          <div className="relative">
            {currentUser.role === 'super_admin' ? (
              <div>
                <button
                  type="button"
                  onClick={() => setHotelMenuOpen(!hotelMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-all"
                >
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span className="max-w-[140px] md:max-w-[200px] truncate">
                    {selectedHotelId === 'all'
                      ? 'All Properties (Admin)'
                      : activeHotel?.name || 'Select Hotel'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {hotelMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHotelId('all');
                        setHotelMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span>All Properties (Consolidated)</span>
                      {selectedHotelId === 'all' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                    <div className="h-px bg-slate-800 my-1" />
                    {hotels.map(h => (
                      <button
                        type="button"
                        key={h.id}
                        onClick={() => {
                          setSelectedHotelId(h.id);
                          setHotelMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">{h.name}</p>
                          <p className="text-[10px] text-slate-400">{h.city}</p>
                        </div>
                        {selectedHotelId === h.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Hotel Owner View: Strictly locked to assigned hotel */
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-200">
                <HotelIcon className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-bold text-white block leading-tight">{activeHotel?.name}</span>
                  <span className="text-[10px] text-slate-400 block">{activeHotel?.city} • Owner Portal</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Database Tools & User Profile */}
        <div className="flex items-center gap-2.5">


          {/* Switch to Workforce HRMS Suite */}
          {onSwitchToHRMS && (
            <button
              onClick={onSwitchToHRMS}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition-all"
              title="Open Employee & Workforce Management Software (HRMS)"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Workforce HRMS</span>
            </button>
          )}

          {/* New Booking CTA */}
          <button
            onClick={onOpenNewBooking}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all"
          >
            <CalendarPlus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Booking</span>
          </button>

          {/* Database Backup / Tools */}
          <div className="relative">
            <button
              onClick={() => setDbMenuOpen(!dbMenuOpen)}
              title="Data Tools & Backups"
              className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all"
            >
              <Database className="w-4 h-4" />
            </button>

            {dbMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={handleDownloadBackup}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export JSON Backup</span>
                </button>
                <label className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Restore from JSON</span>
                  <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                </label>
                <div className="h-px bg-slate-800 my-1" />
                <button
                  onClick={handleReset}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile / Role Switcher */}
          <button
            onClick={onOpenRoleSwitcher}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200">
              {currentUser.role === 'super_admin' ? (
                <Shield className="w-4 h-4 text-amber-400" />
              ) : (
                <User className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="hidden md:block">
              <span className="text-xs font-bold text-white block leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] uppercase font-semibold text-amber-400 block">
                {currentUser.role === 'super_admin' ? 'Super Admin' : 'Hotel Owner'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
