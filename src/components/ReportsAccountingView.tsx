import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { PaymentMethod, ExpenseRecord } from '../types/hotel';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  PieChart,
  Percent,
} from 'lucide-react';

interface ReportsAccountingViewProps {
  initialTimeframe?: 'today' | 'week' | 'month' | 'all';
}

export const ReportsAccountingView: React.FC<ReportsAccountingViewProps> = ({
  initialTimeframe = 'month',
}) => {
  const {
    filteredBookings,
    filteredRooms,
    filteredExpenses,
    activeHotel,
    addExpense,
    deleteExpense,
  } = useHotel();

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>(initialTimeframe);

  React.useEffect(() => {
    if (initialTimeframe) {
      setTimeframe(initialTimeframe);
    }
  }, [initialTimeframe]);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // New expense form
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseRecord['category']>('utilities');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expMethod, setExpMethod] = useState<PaymentMethod>('bank_transfer');
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const currency = activeHotel?.currency || '₹';
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter bookings based on timeframe
  const timeframeBookings = useMemo(() => {
    const now = new Date();
    return filteredBookings.filter(b => {
      const bDate = new Date(b.bookingDate);
      if (timeframe === 'today') {
        return b.bookingDate.startsWith(todayStr) || b.checkInDate === todayStr;
      }
      if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return bDate >= weekAgo;
      }
      if (timeframe === 'month') {
        const currentMonth = todayStr.substring(0, 7);
        return b.bookingDate.startsWith(currentMonth) || b.checkInDate.startsWith(currentMonth);
      }
      return true;
    });
  }, [filteredBookings, timeframe, todayStr]);

  // Filter expenses based on timeframe
  const timeframeExpenses = useMemo(() => {
    const now = new Date();
    return filteredExpenses.filter(e => {
      const eDate = new Date(e.date);
      if (timeframe === 'today') {
        return e.date === todayStr;
      }
      if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return eDate >= weekAgo;
      }
      if (timeframe === 'month') {
        const currentMonth = todayStr.substring(0, 7);
        return e.date.startsWith(currentMonth);
      }
      return true;
    });
  }, [filteredExpenses, timeframe, todayStr]);

  // Aggregate Metrics
  const totalBookingsCount = timeframeBookings.length;
  const completedCheckIns = timeframeBookings.filter(b => b.status === 'checked_in' || b.status === 'checked_out').length;
  const completedCheckOuts = timeframeBookings.filter(b => b.status === 'checked_out').length;

  const totalInvoiced = timeframeBookings.reduce((sum, b) => {
    return b.status !== 'cancelled' ? sum + b.finalPayableAmount : sum;
  }, 0);

  const totalDiscounts = timeframeBookings.reduce((sum, b) => sum + b.discount, 0);

  // Collections by Payment Method
  const methodTotals: Record<PaymentMethod, number> = {
    cash: 0,
    upi: 0,
    card: 0,
    bank_transfer: 0,
  };

  let totalCollected = 0;
  timeframeBookings.forEach(b => {
    b.payments.forEach(p => {
      const pDate = new Date(p.date);
      let match = true;
      if (timeframe === 'today') match = p.date.startsWith(todayStr);
      if (timeframe === 'month') match = p.date.startsWith(todayStr.substring(0, 7));
      if (match) {
        methodTotals[p.method] = (methodTotals[p.method] || 0) + p.amount;
        totalCollected += p.amount;
      }
    });
  });

  const totalPendingBalance = timeframeBookings.reduce((sum, b) => {
    return b.status !== 'cancelled' ? sum + b.remainingBalance : sum;
  }, 0);

  const totalExpenses = timeframeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netOperatingIncome = totalCollected - totalExpenses;

  // Room-wise Income
  const roomIncomeMap = useMemo(() => {
    const map = new Map<string, { roomNumber: string; roomType: string; nights: number; revenue: number }>();
    filteredRooms.forEach(r => {
      map.set(r.id, { roomNumber: r.roomNumber, roomType: r.roomType, nights: 0, revenue: 0 });
    });

    timeframeBookings.forEach(b => {
      if (b.status !== 'cancelled') {
        const existing = map.get(b.roomId);
        if (existing) {
          existing.nights += b.nights;
          existing.revenue += b.finalPayableAmount;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredRooms, timeframeBookings]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Booking ID',
      'Guest Name',
      'Mobile Number',
      'Room Number',
      'Check-In Date',
      'Check-Out Date',
      'Nights',
      'Final Payable',
      'Amount Received',
      'Remaining Balance',
      'Booking Status',
      'Payment Status',
    ];

    const rows = timeframeBookings.map(b => {
      const room = filteredRooms.find(r => r.id === b.roomId);
      return [
        b.id,
        `"${b.customer.fullName}"`,
        b.customer.mobileNumber,
        room?.roomNumber || 'N/A',
        b.checkInDate,
        b.checkOutDate,
        b.nights,
        b.finalPayableAmount,
        b.totalAmountReceived,
        b.remainingBalance,
        b.status,
        b.paymentStatus,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hotel_financial_report_${timeframe}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyForGoogleSheets = () => {
    const tsvRows = [
      ['Booking ID', 'Guest Name', 'Room', 'Check-In', 'Check-Out', 'Tariff', 'Received', 'Due', 'Status'].join('\t'),
      ...timeframeBookings.map(b => {
        const room = filteredRooms.find(r => r.id === b.roomId);
        return [
          b.id,
          b.customer.fullName,
          room?.roomNumber || '',
          b.checkInDate,
          b.checkOutDate,
          b.finalPayableAmount,
          b.totalAmountReceived,
          b.remainingBalance,
          b.status,
        ].join('\t');
      }),
    ].join('\n');

    navigator.clipboard.writeText(tsvRows).then(() => {
      alert('Report data copied to clipboard in tab-separated format! You can directly paste (Ctrl+V) into Google Sheets.');
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || expAmount <= 0) return;
    addExpense({
      hotelId: activeHotel?.id || 'hotel-1',
      description: expDesc.trim(),
      category: expCategory,
      amount: Number(expAmount),
      date: expDate,
      paymentMethod: expMethod,
    });
    setExpDesc('');
    setExpAmount(0);
    setExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Financial Reports & Business Accounting
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated income, collections by method, operating expenses, and net profit ledger.
          </p>
        </div>

        {/* Timeframe selector & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            {(['today', 'week', 'month', 'all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  timeframe === t ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'Weekly' : t === 'month' ? 'Monthly' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Export tools */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            title="Download CSV for Excel or Google Sheets"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handleCopyForGoogleSheets}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            title="Copy tab-delimited text for Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections Received */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Collections Received</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{currency}{totalCollected.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Cash, UPI, Card & Bank deposits</p>
        </div>

        {/* Total Invoiced Tariff */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Gross Bookings Tariff</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{currency}{totalInvoiced.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">{totalBookingsCount} bookings in this period</p>
        </div>

        {/* Operating Expenses */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Recorded Expenses</span>
            <button
              onClick={() => setExpenseModalOpen(true)}
              className="text-[11px] text-amber-400 hover:underline font-bold"
            >
              + Record
            </button>
          </div>
          <p className="text-2xl font-black text-rose-400">-{currency}{totalExpenses.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">{timeframeExpenses.length} expense vouchers recorded</p>
        </div>

        {/* Net Operating Income */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800/80 to-slate-900/90">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Net Operating Income</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <p className={`text-2xl font-black ${netOperatingIncome >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            {currency}{netOperatingIncome.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total Collections − Operating Expenses</p>
        </div>
      </div>

      {/* Row 2: Payment Method Breakdown & Operations Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              Collections by Payment Method ({currency}{totalCollected.toLocaleString()})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { id: 'cash' as PaymentMethod, label: 'Cash', color: 'from-emerald-500 to-emerald-600', text: 'text-emerald-400' },
              { id: 'upi' as PaymentMethod, label: 'UPI / QR', color: 'from-amber-500 to-amber-600', text: 'text-amber-400' },
              { id: 'card' as PaymentMethod, label: 'Card (POS)', color: 'from-blue-500 to-blue-600', text: 'text-blue-400' },
              { id: 'bank_transfer' as PaymentMethod, label: 'Bank Transfer', color: 'from-purple-500 to-purple-600', text: 'text-purple-400' },
            ].map(m => {
              const amount = methodTotals[m.id] || 0;
              const percent = totalCollected > 0 ? Math.round((amount / totalCollected) * 100) : 0;

              return (
                <div key={m.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{m.label}</span>
                  <p className={`text-base font-extrabold ${m.text}`}>{currency}{amount.toLocaleString()}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Share</span>
                    <span className="font-bold text-white">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${m.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-slate-400 text-xs flex justify-between">
            <span>Pending Customer Balances: <strong className="text-rose-400">{currency}{totalPendingBalance.toLocaleString()}</strong></span>
            <span>Total Discounts Given: <strong className="text-emerald-400">{currency}{totalDiscounts.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Operating Expenses Ledger */}
        <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">
              Operating Expenses ({currency}{totalExpenses.toLocaleString()})
            </h3>
            <button
              onClick={() => setExpenseModalOpen(true)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Record Expense
            </button>
          </div>

          {timeframeExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No expenses recorded in this period.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto text-xs pr-1">
              {timeframeExpenses.map(exp => (
                <div
                  key={exp.id}
                  className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-white">{exp.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {exp.date} • <span className="uppercase text-amber-400 font-semibold">{exp.category}</span> via {exp.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-400 text-sm">
                      -{currency}{exp.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => setExpenseToDelete(exp)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded transition-colors"
                      title="Delete Expense Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Room-Wise Income Analysis */}
      <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-3 text-xs">
        <h3 className="font-bold text-white text-sm">Room-Wise Revenue & Occupancy Ranking</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Room</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Nights Booked</th>
                <th className="py-2.5 px-3 text-right">Total Revenue</th>
                <th className="py-2.5 px-3 text-right">Revenue Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {roomIncomeMap.map(r => {
                const share = totalInvoiced > 0 ? Math.round((r.revenue / totalInvoiced) * 100) : 0;
                return (
                  <tr key={r.roomNumber} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">Room {r.roomNumber}</td>
                    <td className="py-2.5 px-3 text-slate-300 capitalize">{r.roomType}</td>
                    <td className="py-2.5 px-3 text-center font-semibold">{r.nights}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400">
                      {currency}{r.revenue.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 font-medium">
                      {share}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Expense */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
              <h3 className="text-base font-bold text-white">Record Hotel Operating Expense</h3>
              <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Expense Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Electric power bill, Housekeeping supplies"
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category *</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="utilities">Utilities (Electricity, Water, Gas)</option>
                  <option value="salaries">Staff Salaries & Wages</option>
                  <option value="maintenance">Repairs & Maintenance</option>
                  <option value="supplies">Cleaning & Toiletries Supplies</option>
                  <option value="laundry">Linen & Laundry Vendor</option>
                  <option value="marketing">Marketing & Commissions</option>
                  <option value="other">Other Operations</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount ({currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={expAmount || ''}
                    onChange={e => setExpAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                  <select
                    value={expMethod}
                    onChange={e => setExpMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="bank_transfer">Bank Transfer / Cheque</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="card">Company Card</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog to Prevent Accidental Data Loss */}
      <ConfirmDeleteModal
        isOpen={!!expenseToDelete}
        title="Delete Expense Record"
        itemName={expenseToDelete ? `${expenseToDelete.description} • ${currency}${expenseToDelete.amount.toLocaleString()}` : undefined}
        message={`Are you sure you want to permanently delete this ${expenseToDelete?.category.toUpperCase()} expense of ${currency}${expenseToDelete?.amount.toLocaleString()}? This will update accounting totals, net profit figures, and financial reports immediately.`}
        confirmLabel="Delete Expense"
        isDeleting={isDeletingExpense}
        onConfirm={() => {
          if (expenseToDelete) {
            setIsDeletingExpense(true);
            deleteExpense(expenseToDelete.id);
            setIsDeletingExpense(false);
            setExpenseToDelete(null);
          }
        }}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
