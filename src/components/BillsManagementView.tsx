import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { SavedBill, PaymentStatus, BillPrintFormat } from '../types/hotel';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Printer,
  Download,
  Share2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  IndianRupee,
  TrendingUp,
  Receipt,
  Building,
  Check,
} from 'lucide-react';

interface BillsManagementViewProps {
  onOpenBillPreview: (bill: SavedBill) => void;
  onOpenCreateNewBill: () => void;
}

export const BillsManagementView: React.FC<BillsManagementViewProps> = ({
  onOpenBillPreview,
  onOpenCreateNewBill,
}) => {
  const { filteredSavedBills, activeHotel, deleteSavedBill, notify } = useHotel();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [billToDelete, setBillToDelete] = useState<SavedBill | null>(null);
  const [isDeletingBill, setIsDeletingBill] = useState(false);

  const currency = activeHotel?.currency || '₹';

  // Metrics
  const totalInvoiced = filteredSavedBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const totalCollected = filteredSavedBills.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalDue = filteredSavedBills.reduce((sum, b) => sum + b.balanceDue, 0);

  const displayBills = useMemo(() => {
    return filteredSavedBills.filter(bill => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesGuest = bill.guestName.toLowerCase().includes(term);
        const matchesPhone = bill.guestPhone.toLowerCase().includes(term);
        const matchesBillNo = bill.billNumber.toLowerCase().includes(term);
        const matchesRoom = bill.roomNumber ? bill.roomNumber.toLowerCase().includes(term) : false;
        if (!matchesGuest && !matchesPhone && !matchesBillNo && !matchesRoom) return false;
      }

      if (statusFilter !== 'all' && bill.paymentStatus !== statusFilter) return false;
      if (formatFilter !== 'all' && bill.printFormat !== formatFilter) return false;

      return true;
    });
  }, [filteredSavedBills, searchTerm, statusFilter, formatFilter]);

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid_in_full':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Paid in Full
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Partially Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" /> Balance Due
          </span>
        );
    }
  };

  const handleQuickCopy = (bill: SavedBill) => {
    const summary = `${bill.billNumber} • ${bill.guestName} • Room ${bill.roomNumber || 'N/A'} • Total: ${currency}${bill.grandTotal} • Paid: ${currency}${bill.paidAmount} • Due: ${currency}${bill.balanceDue}`;
    navigator.clipboard.writeText(summary);
    notify(`Copied bill ${bill.billNumber} to clipboard!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            Saved Bills & Invoice Folio Records
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage generated guest bills, print thermal receipts (58mm / 80mm / A4), download PDFs, and track settlement folios.
          </p>
        </div>

        <button
          onClick={onOpenCreateNewBill}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Generate New Bill</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Total Invoiced</span>
            <IndianRupee className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white">
            {currency}{totalInvoiced.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {filteredSavedBills.length} saved bills
          </p>
        </div>

        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Total Paid / Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400">
            {currency}{totalCollected.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Settled via Cash, Card, UPI
          </p>
        </div>

        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Outstanding Balances</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className={`text-xl font-black ${totalDue > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {currency}{totalDue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Pending guest settlements
          </p>
        </div>

        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Active Hotel</span>
            <Building className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-sm font-bold text-white truncate">
            {activeHotel?.name || 'Grand Azure'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Tax ID: {activeHotel?.taxNumber || 'Registered'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bill No (INV-...), Guest Name, Mobile, or Room..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid_in_full">Paid in Full</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="payment_pending">Payment Pending</option>
          </select>

          <select
            value={formatFilter}
            onChange={e => setFormatFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="all">All Print Formats</option>
            <option value="standard">Standard A4 Format</option>
            <option value="thermal80">80mm POS Thermal</option>
            <option value="thermal58">58mm Mini Thermal</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-900/60">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Guest Details</th>
                <th className="py-3 px-4">Room / Service</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4 text-center">Format</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-white">No saved bills found.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Generate a new bill or open any booking to create and save its folio.
                    </p>
                  </td>
                </tr>
              ) : (
                displayBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* Bill Number */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-400 block">
                        {bill.billNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Saved: {new Date(bill.savedAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Guest */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-white text-sm">{bill.guestName}</p>
                      <p className="text-slate-400 text-[11px]">{bill.guestPhone}</p>
                      {bill.guestEmail && (
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{bill.guestEmail}</p>
                      )}
                    </td>

                    {/* Room */}
                    <td className="py-3 px-4">
                      {bill.roomNumber ? (
                        <>
                          <span className="font-bold text-white block">
                            Room {bill.roomNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {bill.roomType} • {bill.isAC ? 'AC' : 'Non-AC'}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">Direct Folio</span>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 text-slate-300">
                      {bill.checkInDate ? (
                        <>
                          <span className="block">{bill.checkInDate}</span>
                          <span className="text-[10px] text-slate-500">to {bill.checkOutDate} ({bill.nights}N)</span>
                        </>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Format */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300">
                        {bill.printFormat === 'thermal58' ? '58mm POS' : bill.printFormat === 'thermal80' ? '80mm POS' : 'Standard A4'}
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {currency}{bill.grandTotal.toLocaleString()}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                      {currency}{bill.paidAmount.toLocaleString()}
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${bill.balanceDue > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {currency}{bill.balanceDue.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(bill.paymentStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Eye icon for Preview */}
                        <button
                          onClick={() => onOpenBillPreview(bill)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700 transition-colors"
                          title="Preview Bill (👁)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Print */}
                        <button
                          onClick={() => onOpenBillPreview(bill)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                          title="Print Bill"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Share */}
                        <button
                          onClick={() => handleQuickCopy(bill)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                          title="Copy / Share Bill Summary"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setBillToDelete(bill)}
                          className="p-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors"
                          title="Delete / Archive Bill"
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

      {/* Confirmation Dialog to Prevent Accidental Data Loss */}
      <ConfirmDeleteModal
        isOpen={!!billToDelete}
        title="Delete Guest Bill"
        itemName={billToDelete ? `Bill #${billToDelete.billNumber} • ${billToDelete.guestName}` : undefined}
        message={`Are you sure you want to permanently delete Bill #${billToDelete?.billNumber}? This will remove the bill record and invoice history from the system.`}
        confirmLabel="Delete Bill"
        isDeleting={isDeletingBill}
        onConfirm={() => {
          if (billToDelete) {
            setIsDeletingBill(true);
            const res = deleteSavedBill(billToDelete.id);
            setIsDeletingBill(false);
            if (res.success) {
              setBillToDelete(null);
            }
          }
        }}
        onCancel={() => setBillToDelete(null)}
      />
    </div>
  );
};
