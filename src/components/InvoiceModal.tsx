import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Booking, Hotel, SavedBill, SavedBillItem, BillPrintFormat, PaymentStatus, PaymentMethod } from '../types/hotel';
import { useHotel } from '../context/HotelContext';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  Building,
  Save,
  Share2,
  Eye,
  FileText,
  Copy,
  Mail,
  Send,
  Plus,
  Trash2,
  Sparkles,
  Check,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface InvoiceModalProps {
  booking?: Booking | null;
  savedBill?: SavedBill | null;
  hotel?: Hotel;
  roomNumber?: string;
  roomType?: string;
  isAC?: boolean;
  onClose: () => void;
  onBillSaved?: (bill: SavedBill) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  booking,
  savedBill,
  hotel: propHotel,
  roomNumber: propRoomNumber,
  roomType: propRoomType,
  isAC: propIsAC,
  onClose,
  onBillSaved,
}) => {
  const {
    activeHotel,
    hotels,
    filteredRooms,
    savedBills,
    saveBill,
    notify,
  } = useHotel();

  // Resolved hotel
  const hotel = propHotel || activeHotel || hotels[0];
  const currency = hotel?.currency || '₹';

  // Resolved room details
  const room = booking ? filteredRooms.find(r => r.id === booking.roomId) : null;
  const roomNumber = propRoomNumber || (savedBill ? savedBill.roomNumber : room?.roomNumber) || '101';
  const roomType = propRoomType || (savedBill ? savedBill.roomType : room?.roomType) || 'deluxe';
  const isAC = propIsAC !== undefined ? propIsAC : (savedBill ? (savedBill.isAC ?? true) : (room?.isAC ?? true));

  // Determine print format
  const [printFormat, setPrintFormat] = useState<BillPrintFormat>(
    savedBill?.printFormat || 'standard'
  );

  // Check if a saved version already exists
  const existingSavedBill = useMemo(() => {
    if (savedBill) return savedBill;
    if (booking) {
      return savedBills.find(b => b.bookingId === booking.id || b.id === `bill-${booking.id}`);
    }
    return null;
  }, [savedBill, booking, savedBills]);

  // Initial bill attributes
  const initialBillNumber = useMemo(() => {
    if (savedBill) return savedBill.billNumber;
    if (existingSavedBill) return existingSavedBill.billNumber;
    if (booking) {
      return `INV-${booking.id.replace('bk-', '')}-${new Date(booking.bookingDate || Date.now()).getFullYear()}`;
    }
    return `INV-GEN-${Date.now().toString().slice(-6)}`;
  }, [savedBill, existingSavedBill, booking]);

  // Items state for live real-time editing & calculation
  const [items, setItems] = useState<SavedBillItem[]>(() => {
    if (savedBill) return savedBill.items;
    if (existingSavedBill) return existingSavedBill.items;
    if (booking) {
      const generated: SavedBillItem[] = [];
      generated.push({
        id: 'item-tariff',
        description: `Room Tariff - Room ${roomNumber} (${roomType.toUpperCase()} - ${isAC ? 'AC' : 'Non-AC'})`,
        category: 'accommodation',
        quantity: booking.nights,
        unitPrice: booking.roomPricePerNight,
        totalPrice: booking.nights * booking.roomPricePerNight,
      });

      if (booking.extraBeds > 0) {
        generated.push({
          id: 'item-extra-beds',
          description: `Extra Bed Charges (${booking.extraBeds} bed${booking.extraBeds > 1 ? 's' : ''})`,
          category: 'accommodation',
          quantity: booking.extraBeds * booking.nights,
          unitPrice: 800,
          totalPrice: booking.extraBeds * 800 * booking.nights,
        });
      }

      booking.extraCharges.forEach((c, idx) => {
        generated.push({
          id: `item-charge-${idx}`,
          description: c.title,
          category: c.category,
          quantity: c.quantity || 1,
          unitPrice: c.amount,
          totalPrice: c.amount,
        });
      });

      return generated;
    }

    return [
      {
        id: 'item-tariff',
        description: `Room Tariff - Room ${roomNumber} (${roomType.toUpperCase()})`,
        category: 'accommodation',
        quantity: 1,
        unitPrice: 3500,
        totalPrice: 3500,
      },
    ];
  });

  // Financial inputs with instant real-time recalculations
  const [taxRatePercent, setTaxRatePercent] = useState<number>(
    savedBill?.taxRatePercent ?? (existingSavedBill?.taxRatePercent ?? 12)
  );
  const [discount, setDiscount] = useState<number>(
    savedBill?.discount ?? (existingSavedBill?.discount ?? (booking?.discount ?? 0))
  );
  const [discountReason, setDiscountReason] = useState<string>(
    savedBill?.discountReason ?? (existingSavedBill?.discountReason ?? (booking?.discountReason ?? ''))
  );
  const [paidAmount, setPaidAmount] = useState<number>(
    savedBill?.paidAmount ?? (existingSavedBill?.paidAmount ?? (booking?.totalAmountReceived ?? 0))
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    savedBill?.paymentMethod ?? (existingSavedBill?.paymentMethod ?? (booking?.payments[0]?.method ?? 'cash'))
  );
  const [notes, setNotes] = useState<string>(
    savedBill?.notes ?? (existingSavedBill?.notes ?? (booking?.specialRequests ?? ''))
  );

  // New item draft inputs
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  // UI state
  const [isSaved, setIsSaved] = useState<boolean>(!!existingSavedBill || !!savedBill);
  const [savedAtTimestamp, setSavedAtTimestamp] = useState<string>(
    savedBill?.savedAt || existingSavedBill?.savedAt || ''
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const printableRef = useRef<HTMLDivElement>(null);

  // Real-time calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return Math.round((subtotal * taxRatePercent) / 100);
  }, [subtotal, taxRatePercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + taxAmount - discount);
  }, [subtotal, taxAmount, discount]);

  const balanceDue = useMemo(() => {
    return Math.max(0, grandTotal - paidAmount);
  }, [grandTotal, paidAmount]);

  const paymentStatus: PaymentStatus = useMemo(() => {
    if (balanceDue === 0 && paidAmount > 0) return 'paid_in_full';
    if (paidAmount > 0) return 'partially_paid';
    return 'payment_pending';
  }, [balanceDue, paidAmount]);

  // Guest details
  const guestName = savedBill?.guestName || booking?.customer.fullName || 'Guest Customer';
  const guestPhone = savedBill?.guestPhone || booking?.customer.mobileNumber || '+91 98000 00000';
  const guestEmail = savedBill?.guestEmail || booking?.customer.email || '';
  const guestIdProof = savedBill?.guestIdProof || (booking ? `${booking.customer.idProofType.toUpperCase()}: ${booking.customer.idProofNumber}` : 'ID Proof Verified');

  // Dates
  const checkInDate = savedBill?.checkInDate || booking?.checkInDate || new Date().toISOString().split('T')[0];
  const checkOutDate = savedBill?.checkOutDate || booking?.checkOutDate || new Date().toISOString().split('T')[0];
  const nights = savedBill?.nights || booking?.nights || 1;

  // Add Item to Bill
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim() || newItemPrice <= 0) return;

    const newItem: SavedBillItem = {
      id: `item-${Date.now()}`,
      description: newItemDesc.trim(),
      quantity: Number(newItemQty) || 1,
      unitPrice: Number(newItemPrice),
      totalPrice: (Number(newItemQty) || 1) * Number(newItemPrice),
    };

    setItems(prev => [...prev, newItem]);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemPrice(0);
    setShowAddItem(false);
    setIsSaved(false); // Mark modified
  };

  const [itemToDelete, setItemToDelete] = useState<SavedBillItem | null>(null);

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
    setIsSaved(false);
    notify(`Charge "${itemToDelete.description}" removed from bill.`, 'info');
    setItemToDelete(null);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    setIsSaved(false);
  };

  // 1. SAVE BILL FUNCTIONALITY
  const handleSaveBill = () => {
    const billObject: SavedBill = {
      id: savedBill?.id || (booking ? `bill-${booking.id}` : `bill-${Date.now()}`),
      hotelId: hotel?.id || 'hotel-1',
      bookingId: booking?.id || savedBill?.bookingId,
      billNumber: initialBillNumber,
      createdAt: savedBill?.createdAt || booking?.bookingDate || new Date().toISOString(),
      savedAt: new Date().toISOString(),
      guestName,
      guestPhone,
      guestEmail,
      guestIdProof,
      roomNumber,
      roomType,
      isAC,
      checkInDate,
      checkOutDate,
      nights,
      items,
      subtotal,
      taxRatePercent,
      taxAmount,
      discount,
      discountReason,
      grandTotal,
      paidAmount,
      balanceDue,
      paymentStatus,
      paymentMethod,
      paymentRef: booking?.payments[0]?.referenceNo || `RCPT-${Date.now().toString().slice(-6)}`,
      notes,
      printFormat,
    };

    saveBill(billObject);
    setIsSaved(true);
    setSavedAtTimestamp(billObject.savedAt);
    if (onBillSaved) {
      onBillSaved(billObject);
    }
  };

  // 2. PRINT BILL FUNCTIONALITY
  const handlePrint = () => {
    window.print();
    notify('Printing bill on selected layout...', 'info');
  };

  // 3. DOWNLOAD PDF FUNCTIONALITY
  const handleDownloadPDF = async () => {
    if (!printableRef.current) return;
    setIsExportingPdf(true);
    notify('Generating high-resolution PDF...', 'info');

    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      if (printFormat === 'thermal58') {
        const widthMm = 58;
        const heightMm = (canvas.height * widthMm) / canvas.width;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [widthMm, heightMm] });
        pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);
        pdf.save(`${hotel.code || 'HOTEL'}_Receipt_${initialBillNumber}_58mm.pdf`);
      } else if (printFormat === 'thermal80') {
        const widthMm = 80;
        const heightMm = (canvas.height * widthMm) / canvas.width;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [widthMm, heightMm] });
        pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);
        pdf.save(`${hotel.code || 'HOTEL'}_Receipt_${initialBillNumber}_80mm.pdf`);
      } else {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`${hotel.code || 'HOTEL'}_Invoice_${initialBillNumber}.pdf`);
      }

      notify(`Downloaded PDF: ${initialBillNumber}.pdf`, 'success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      notify('Could not export PDF canvas. Try Print -> Save as PDF.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 4. SHARE BILL FUNCTIONALITY
  const billSummaryText = `*${hotel.name} - Official Bill Receipt*\nBill No: ${initialBillNumber}\nGuest: ${guestName}\nRoom: ${roomNumber} (${roomType.toUpperCase()})\nStay: ${checkInDate} to ${checkOutDate} (${nights} Nights)\n\nGrand Total: ${currency}${grandTotal.toLocaleString()}\nTotal Paid: ${currency}${paidAmount.toLocaleString()}\nBalance Due: ${currency}${balanceDue.toLocaleString()}\nStatus: ${paymentStatus.replace('_', ' ').toUpperCase()}\n\nThank you for choosing ${hotel.name}!`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${hotel.name} - Bill ${initialBillNumber}`,
          text: billSummaryText,
        });
        notify('Bill shared successfully!', 'success');
        setShareMenuOpen(false);
        return;
      } catch (e) {
        // Fall back to modal share menu
      }
    }
    setShareMenuOpen(true);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(billSummaryText);
    setCopiedLink(true);
    notify('Bill summary copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(billSummaryText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    setShareMenuOpen(false);
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`${hotel.name} - Folio & Invoice #${initialBillNumber}`);
    const body = encodeURIComponent(billSummaryText);
    window.open(`mailto:${guestEmail || ''}?subject=${subject}&body=${body}`, '_blank');
    setShareMenuOpen(false);
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'paid_in_full':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> PAID IN FULL
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> PARTIALLY PAID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> PAYMENT PENDING
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black my-4 max-h-[92vh] flex flex-col">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/80 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Bill Folio & Tax Invoice
                </h3>
                <span className="text-[11px] font-mono text-amber-400">
                  {initialBillNumber}
                </span>
              </div>
            </div>

            {/* Saved state badge */}
            {isSaved ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Check className="w-3 h-3" /> Saved in Records
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Unsaved Draft
              </span>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Paper Size / Thermal Format Selector */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintFormat('standard')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  printFormat === 'standard'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Standard A4 Paper Format"
              >
                A4 Standard
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal80')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  printFormat === 'thermal80'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="80mm Thermal Receipt Printer"
              >
                80mm POS
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal58')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  printFormat === 'thermal58'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="58mm Mini Thermal Printer"
              >
                58mm Mini
              </button>
            </div>

            {/* Save Bill CTA */}
            <button
              onClick={handleSaveBill}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
                isSaved
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
              title="Save Bill to System Records"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved' : 'Save Bill'}</span>
            </button>

            {/* Print CTA */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all shadow-sm"
              title="Print bill to thermal or standard printer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Print</span>
            </button>

            {/* PDF Download CTA */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all shadow-sm disabled:opacity-50"
              title="Download Bill as formatted PDF"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
            </button>

            {/* Share CTA */}
            <div className="relative">
              <button
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all shadow-sm"
                title="Share bill via WhatsApp, Email, or Copy"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Share</span>
              </button>

              {shareMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                    Share Options
                  </div>
                  <button
                    onClick={handleCopySummary}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{copiedLink ? 'Copied!' : 'Copy Bill Summary'}</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full text-left px-3 py-2 text-emerald-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share on WhatsApp</span>
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="w-full text-left px-3 py-2 text-sky-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span>Email to Guest</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download PDF to send</span>
                  </button>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-all ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center">
          
          {/* Quick Adjustment Toolbar (For Real-Time editing before saving/printing) */}
          <div className="w-full max-w-3xl mb-4 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs print:hidden space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Live Calculation & Folio Adjustments
              </span>
              <button
                type="button"
                onClick={() => setShowAddItem(!showAddItem)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/20 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Add Charge / Service</span>
              </button>
            </div>

            {/* Quick adjustments row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Tax / GST Rate</label>
                <select
                  value={taxRatePercent}
                  onChange={e => {
                    setTaxRatePercent(Number(e.target.value));
                    setIsSaved(false);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value={0}>0% (Tax Exempt)</option>
                  <option value={5}>5% (Economy / Food)</option>
                  <option value={12}>12% (Standard Hotel GST)</option>
                  <option value={18}>18% (Luxury Suite GST)</option>
                  <option value={28}>28% (Special High Tariff)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Discount ({currency})</label>
                <input
                  type="number"
                  min="0"
                  max={subtotal + taxAmount}
                  value={discount}
                  onChange={e => {
                    setDiscount(Number(e.target.value) || 0);
                    setIsSaved(false);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-semibold focus:outline-none focus:border-amber-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Amount Paid ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={e => {
                    setPaidAmount(Number(e.target.value) || 0);
                    setIsSaved(false);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => {
                    setPaymentMethod(e.target.value as PaymentMethod);
                    setIsSaved(false);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="cash">Cash (Front Desk)</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="card">Card (POS Swiped)</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                </select>
              </div>
            </div>

            {/* Add item inline form */}
            {showAddItem && (
              <form onSubmit={handleAddItem} className="pt-2 border-t border-slate-800 flex flex-wrap items-end gap-2 bg-slate-800/40 p-2.5 rounded-lg">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Item Description</label>
                  <input
                    type="text"
                    placeholder="e.g. In-Room Dining, Airport Drop"
                    value={newItemDesc}
                    onChange={e => setNewItemDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                    required
                  />
                </div>
                <div className="w-16">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={e => setNewItemQty(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Rate ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemPrice}
                    onChange={e => setNewItemPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-semibold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition-all"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {/* PRINTABLE BILL CONTAINER */}
          {/* FORMAT 1: 58mm POS Mini Thermal */}
          {printFormat === 'thermal58' && (
            <div
              ref={printableRef}
              id="printable-bill-root"
              className="w-full max-w-[280px] bg-white text-black p-4 rounded-xl shadow-xl font-mono text-[11px] leading-tight printable-thermal-58"
            >
              {/* Hotel Header */}
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <p className="font-extrabold text-sm uppercase tracking-wider">{hotel.name}</p>
                <p className="text-[10px] text-gray-700">{hotel.address}, {hotel.city}</p>
                <p className="text-[10px] text-gray-700">Tel: {hotel.phone}</p>
                {hotel.taxNumber && <p className="text-[9px] text-gray-700">GST: {hotel.taxNumber}</p>}
              </div>

              {/* Bill Details */}
              <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>BILL NO:</span>
                  <span>{initialBillNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>GUEST:</span>
                  <span className="font-semibold truncate max-w-[150px]">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span>ROOM:</span>
                  <span className="font-bold">{roomNumber} ({roomType.toUpperCase()})</span>
                </div>
                <div className="flex justify-between text-[9px] text-gray-700">
                  <span>STAY:</span>
                  <span>{checkInDate} to {checkOutDate} ({nights}N)</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="py-2 border-b border-dashed border-gray-400">
                <div className="flex justify-between font-bold text-[9px] border-b border-gray-300 pb-1 mb-1">
                  <span>ITEM</span>
                  <span>AMOUNT</span>
                </div>
                {items.map(item => (
                  <div key={item.id} className="flex justify-between py-0.5 text-[10px]">
                    <span className="truncate max-w-[170px]">
                      {item.description} {item.quantity > 1 ? `x${item.quantity}` : ''}
                    </span>
                    <span className="font-semibold">{currency}{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currency}{subtotal.toLocaleString()}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>GST ({taxRatePercent}%):</span>
                    <span>{currency}{taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Discount:</span>
                    <span>-{currency}{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-gray-400">
                  <span>TOTAL:</span>
                  <span>{currency}{grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800">
                  <span>PAID ({paymentMethod.toUpperCase()}):</span>
                  <span>{currency}{paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-[11px] pt-0.5">
                  <span>DUE BALANCE:</span>
                  <span>{currency}{balanceDue.toLocaleString()}</span>
                </div>
              </div>

              {/* Thermal Footer */}
              <div className="text-center pt-2 text-[9px] text-gray-700 space-y-0.5">
                <p className="font-bold text-black uppercase">STATUS: {paymentStatus.replace('_', ' ').toUpperCase()}</p>
                <p>Thank you for your visit!</p>
                <p>Please visit again</p>
                <p className="text-[8px] text-gray-500 pt-1">GrandStay PMS • Official Receipt</p>
              </div>
            </div>
          )}

          {/* FORMAT 2: 80mm POS Thermal Receipt */}
          {printFormat === 'thermal80' && (
            <div
              ref={printableRef}
              id="printable-bill-root"
              className="w-full max-w-[360px] bg-white text-black p-5 rounded-xl shadow-xl font-mono text-xs leading-normal printable-thermal-80"
            >
              {/* Hotel Header */}
              <div className="text-center pb-3 border-b-2 border-dashed border-gray-500">
                <h2 className="font-extrabold text-base uppercase tracking-wider">{hotel.name}</h2>
                <p className="text-xs text-gray-700">{hotel.address}, {hotel.city}</p>
                <p className="text-xs text-gray-700">Phone: {hotel.phone} • {hotel.email}</p>
                {hotel.taxNumber && <p className="text-xs font-bold text-gray-800">GSTIN / TAX: {hotel.taxNumber}</p>}
                <div className="mt-1 inline-block px-2 py-0.5 bg-gray-200 text-black font-extrabold text-[10px] rounded uppercase tracking-wider">
                  Front Desk Folio Receipt
                </div>
              </div>

              {/* Bill Details */}
              <div className="py-2.5 border-b border-dashed border-gray-400 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>INVOICE NO:</span>
                  <span className="font-extrabold">{initialBillNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE & TIME:</span>
                  <span>{new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>GUEST NAME:</span>
                  <span className="font-bold">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span>CONTACT:</span>
                  <span>{guestPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>ROOM ALLOTTED:</span>
                  <span className="font-extrabold">Room {roomNumber} ({roomType.toUpperCase()}, {isAC ? 'AC' : 'Non-AC'})</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>DURATION:</span>
                  <span>{checkInDate} to {checkOutDate} ({nights} Night{nights > 1 ? 's' : ''})</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-2.5 border-b-2 border-dashed border-gray-500">
                <div className="flex justify-between font-bold text-[11px] border-b border-gray-400 pb-1 mb-1.5 uppercase">
                  <span>Item / Description</span>
                  <span className="text-right">Qty x Rate = Total</span>
                </div>
                {items.map(item => (
                  <div key={item.id} className="py-1 border-b border-gray-200 last:border-none">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">{item.description}</span>
                      <span className="font-bold">{currency}{item.totalPrice.toLocaleString()}</span>
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-gray-600">
                        {item.quantity} units @ {currency}{item.unitPrice} each
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="py-3 border-b-2 border-dashed border-gray-500 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-800">
                  <span>Gross Subtotal:</span>
                  <span>{currency}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-800">
                  <span>GST / Tax ({taxRatePercent}%):</span>
                  <span>{currency}{taxAmount.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Discount {discountReason ? `(${discountReason})` : ''}:</span>
                    <span>-{currency}{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm pt-1.5 border-t border-gray-400">
                  <span>NET PAYABLE:</span>
                  <span>{currency}{grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1">
                  <span>PAID VIA {paymentMethod.toUpperCase()}:</span>
                  <span>{currency}{paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-dashed border-gray-400">
                  <span>BALANCE DUE:</span>
                  <span className={balanceDue > 0 ? 'text-black font-black' : ''}>{currency}{balanceDue.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Status & Signature */}
              <div className="pt-3 text-center space-y-2 text-xs">
                <div className="p-1.5 bg-gray-100 rounded border border-gray-300 font-extrabold uppercase tracking-wide">
                  FOLIO STATUS: {paymentStatus.replace('_', ' ')}
                </div>
                <p className="text-[11px] text-gray-700">
                  {hotel.name} appreciates your visit and patronage.
                </p>
                <div className="pt-4 flex justify-between items-end text-[10px] text-gray-600">
                  <span>Ref: {initialBillNumber}</span>
                  <span className="border-t border-gray-400 pt-1 px-3">Front Desk Executive</span>
                </div>
              </div>
            </div>
          )}

          {/* FORMAT 3: Standard A4 Tax Invoice / Full Folio */}
          {printFormat === 'standard' && (
            <div
              ref={printableRef}
              id="printable-bill-root"
              className="w-full max-w-3xl bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl printable-standard"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-300 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow">
                      {hotel.code || 'HTL'}
                    </div>
                    <div>
                      <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
                        {hotel.name}
                      </h1>
                      <p className="text-xs text-slate-600">
                        {hotel.address}, {hotel.city}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                    <p>Phone: <span className="font-semibold text-slate-900">{hotel.phone}</span> • Email: <span className="font-semibold text-slate-900">{hotel.email}</span></p>
                    {hotel.taxNumber && (
                      <p>GSTIN / Tax ID: <span className="font-mono font-bold text-slate-900">{hotel.taxNumber}</span></p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="mb-2">{getStatusBadge()}</div>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                    Official Guest Folio & Bill
                  </h2>
                  <p className="font-mono text-sm font-extrabold text-amber-600">
                    {initialBillNumber}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Invoice Date: <span className="font-semibold text-slate-800">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </p>
                  {savedAtTimestamp && (
                    <p className="text-[10px] text-emerald-700 font-medium">
                      ✓ System Verified & Saved
                    </p>
                  )}
                </div>
              </div>

              {/* Guest Information & Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-b border-slate-300 text-xs">
                {/* Guest Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                    Guest Information
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {guestName}
                  </p>
                  <p className="text-slate-700">
                    Phone / Mobile: <span className="font-semibold text-slate-900">{guestPhone}</span>
                  </p>
                  {guestEmail && (
                    <p className="text-slate-700">
                      Email: <span className="text-slate-900">{guestEmail}</span>
                    </p>
                  )}
                  <div className="pt-1 text-slate-600 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ID Proof: <span className="font-semibold text-slate-900">{guestIdProof}</span></span>
                  </div>
                </div>

                {/* Stay & Room Schedule Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                    Stay & Accommodation
                  </span>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">
                      Room {roomNumber} <span className="font-normal text-xs text-slate-600">({roomType.toUpperCase()}, {isAC ? 'AC' : 'Non-AC'})</span>
                    </p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {nights} {nights === 1 ? 'Night' : 'Nights'}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    Check-in Date: <span className="font-semibold text-slate-900">{checkInDate}</span>
                  </p>
                  <p className="text-slate-700">
                    Check-out Date: <span className="font-semibold text-slate-900">{checkOutDate}</span>
                  </p>
                  {notes && (
                    <p className="text-[11px] text-slate-500 italic pt-0.5">
                      Notes: {notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <div className="my-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Itemized Billing Charges & Services
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Currency: {currency} (INR)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-bold">
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty / Nights</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right">Total Amount</th>
                        <th className="py-2.5 px-2 text-center print:hidden w-8">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right">{currency}{item.unitPrice.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {currency}{item.totalPrice.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-2 text-center print:hidden">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setItemToDelete(item)}
                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors"
                                title="Remove charge from bill"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="mt-4 flex flex-col items-end text-xs">
                  <div className="w-full sm:w-80 space-y-2 border-t border-slate-300 pt-3">
                    <div className="flex justify-between text-slate-700">
                      <span>Subtotal Charges:</span>
                      <span className="font-semibold text-slate-900">
                        {currency}{subtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700">
                      <span>Taxes & GST ({taxRatePercent}%):</span>
                      <span className="font-semibold text-slate-900">
                        {currency}{taxAmount.toLocaleString()}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount {discountReason ? `(${discountReason})` : ''}:</span>
                        <span className="font-bold">-{currency}{discount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-extrabold text-slate-950 border-t border-slate-300 pt-2">
                      <span>Grand Total:</span>
                      <span className="text-base text-slate-950">{currency}{grandTotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-xs font-semibold text-emerald-700">
                      <span>Total Amount Paid ({paymentMethod.toUpperCase()}):</span>
                      <span>{currency}{paidAmount.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-sm font-extrabold border-t border-slate-300 pt-2">
                      <span>Remaining Balance Due:</span>
                      <span className={balanceDue > 0 ? 'text-rose-600 font-black' : 'text-emerald-700 font-bold'}>
                        {currency}{balanceDue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details Box */}
              <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-900 uppercase">Payment Summary:</span>
                    <span className="text-slate-600">Method: <strong className="text-slate-900 capitalize">{paymentMethod.replace('_', ' ')}</strong></span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-600 text-[11px]">Folio Ref: {initialBillNumber}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Signatures */}
              <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px] text-slate-600">
                <div>
                  <p className="font-bold text-slate-900 mb-1">Standard Terms & Policies:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                    <li>This is a computer-generated tax invoice and valid guest folio receipt.</li>
                    <li>Standard checkout time is 11:00 AM. Late checkouts subject to prior approval.</li>
                    <li>Thank you for choosing {hotel.name}! We look forward to your next stay.</li>
                  </ul>
                </div>
                <div className="flex flex-col justify-end items-end space-y-8">
                  <div className="w-44 border-b border-slate-400 pb-1 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-700">Authorized Front Desk Seal</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status / Quick Info Footer (Hidden on print) */}
        <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Previewing in <strong>{printFormat === 'standard' ? 'Standard A4' : printFormat === 'thermal80' ? '80mm Thermal POS' : '58mm Mini POS'}</strong> format.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-200">
              Total: {currency}{grandTotal.toLocaleString()}
            </span>
            <span className={balanceDue > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              Balance Due: {currency}{balanceDue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Confirmation Dialog: Delete Invoice Item */}
        <ConfirmDeleteModal
          isOpen={!!itemToDelete}
          title="Remove Item from Bill"
          itemName={itemToDelete ? `${itemToDelete.description} (${currency}${itemToDelete.totalPrice.toLocaleString()})` : undefined}
          message={`Are you sure you want to remove "${itemToDelete?.description}" from this invoice? The subtotal, tax calculations, and balance due will update immediately.`}
          confirmLabel="Remove Item"
          onConfirm={handleConfirmDeleteItem}
          onCancel={() => setItemToDelete(null)}
        />

      </div>
    </div>
  );
};
