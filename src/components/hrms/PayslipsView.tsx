import React, { useState, useRef } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { PayrollRecord } from '../../types/hrms';
import {
  Printer,
  Download,
  Share2,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  FileText,
  Search,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatINR, numberToWordsINR } from '../../utils/formatters';

interface PayslipsViewProps {
  initialRecord?: PayrollRecord | null;
}

export const PayslipsView: React.FC<PayslipsViewProps> = ({ initialRecord }) => {
  const { payrollRecords, settings, employees } = useHRMS();

  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    initialRecord?.id || payrollRecords[0]?.id || ''
  );
  const [searchEmployee, setSearchEmployee] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const payslipRef = useRef<HTMLDivElement>(null);

  const selectedRecord =
    payrollRecords.find(p => p.id === selectedRecordId) || payrollRecords[0];

  const employee = selectedRecord
    ? employees.find(e => e.id === selectedRecord.employeeId)
    : null;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!payslipRef.current || !selectedRecord) return;

    try {
      const canvas = await html2canvas(payslipRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Payslip_${selectedRecord.employeeName.replace(/\s+/g, '_')}_${selectedRecord.payrollMonth}.pdf`);
    } catch (err) {
      console.error('Failed to export payslip PDF', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Convert number to words helper (Indian Rupee system)
  const numberToWords = (num: number): string => {
    return numberToWordsINR(num);
  };

  const filteredStatements = payrollRecords.filter(p =>
    p.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    p.department.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    p.payrollMonth.includes(searchEmployee)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Official Employee Payslips & Salary Statements</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade salary vouchers, PDF generation, print preview, and statutory compliance
          </p>
        </div>

        {selectedRecord && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              title="Copy share link"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Statement Selector List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[750px]">
          <div className="mb-3">
            <p className="text-xs font-bold text-white mb-1.5">Select Statement</p>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search staff or month..."
                value={searchEmployee}
                onChange={e => setSearchEmployee(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
            {filteredStatements.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No payroll records match search.</p>
            ) : (
              filteredStatements.map(stmt => {
                const isSelected = selectedRecord?.id === stmt.id;
                return (
                  <button
                    key={stmt.id}
                    onClick={() => setSelectedRecordId(stmt.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white truncate">{stmt.employeeName}</span>
                      <span className="font-mono text-[10px] text-amber-400 font-semibold">{stmt.payrollMonth}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate">{stmt.department}</span>
                      <span className="font-mono font-bold text-emerald-400">{formatINR(stmt.netSalary)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Professional High-Fidelity Payslip Document */}
        <div className="lg:col-span-3">
          {!selectedRecord ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              No statement selected. Generate payroll in the Payroll tab to view payslips.
            </div>
          ) : (
            <div
              ref={payslipRef}
              className="bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 select-text font-sans"
              style={{ minHeight: '750px' }}
            >
              {/* Payslip Header */}
              <div className="border-b-2 border-slate-900 pb-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                      GS
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                        {settings.legalEntityName}
                      </h1>
                      <p className="text-xs text-slate-500 mt-1">{settings.companyAddress}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-600">
                    <span>Tax Reg: <strong>{settings.taxRegistrationNumber}</strong></span>
                    <span>·</span>
                    <span>Phone: {settings.companyPhone}</span>
                    <span>·</span>
                    <span>Email: {settings.companyEmail}</span>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="inline-block px-3 py-1 rounded bg-slate-900 text-amber-400 font-black tracking-wider text-xs uppercase">
                    Salary Voucher & Payslip
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1.5">
                    Pay Period: {selectedRecord.payrollMonth}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Employee Particulars Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Employee ID</span>
                  <strong className="text-slate-900 font-mono text-sm">{selectedRecord.employeeId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Employee Name</span>
                  <strong className="text-slate-900 text-sm">{selectedRecord.employeeName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Department</span>
                  <strong className="text-slate-900">{selectedRecord.department}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Designation</span>
                  <strong className="text-slate-900">{selectedRecord.jobTitle}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Bank Name</span>
                  <strong className="text-slate-900">{employee?.bankDetails.bankName || 'Direct Deposit'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Account Number</span>
                  <strong className="text-slate-900 font-mono">{employee?.bankDetails.accountNumber || '**** **** 8812'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Pay Days Worked</span>
                  <strong className="text-emerald-700 font-bold">{selectedRecord.actualPresentDays} / {selectedRecord.workingDaysInMonth} Days</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Approved OT</span>
                  <strong className="text-amber-700 font-bold">{selectedRecord.overtimeHours} Hours</strong>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Earnings Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider flex justify-between">
                    <span>Earnings Component</span>
                    <span>Amount (₹)</span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-3 text-slate-700 font-medium">Basic Pay / Base Salary</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatINR(selectedRecord.basePay)}</td>
                      </tr>
                      {selectedRecord.overtimePay > 0 && (
                        <tr>
                          <td className="py-2 px-3 text-slate-700 font-medium">Overtime Premium ({selectedRecord.overtimeHours}h approved)</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">+{formatINR(selectedRecord.overtimePay, { showDecimals: true })}</td>
                        </tr>
                      )}
                      {selectedRecord.allowances.map((a, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 text-slate-700">{a.name}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-900">+{formatINR(a.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                      <tr>
                        <td className="py-2.5 px-3 text-slate-900">Total Gross Earnings</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900">{formatINR(selectedRecord.grossSalary)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Deductions Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider flex justify-between">
                    <span>Statutory / Authorized Deductions</span>
                    <span>Amount (₹)</span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-slate-100">
                      {selectedRecord.deductions.map((d, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 text-slate-700">{d.name}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">-{formatINR(d.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                      <tr>
                        <td className="py-2.5 px-3 text-slate-900">Total Deductions</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600">-{formatINR(selectedRecord.totalDeductions)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Net Payable Highlight Card */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Net Take-Home Remuneration
                  </span>
                  <p className="text-3xl font-black text-emerald-950 font-mono mt-0.5">
                    {formatINR(selectedRecord.netSalary)}
                  </p>
                  <p className="text-xs text-emerald-800 font-medium italic mt-1">
                    Amount in words: {numberToWords(selectedRecord.netSalary)}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-xs uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Status: {selectedRecord.paymentStatus}</span>
                  </span>
                  {selectedRecord.transactionRef && (
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      UTR / Wire: {selectedRecord.transactionRef}
                    </p>
                  )}
                </div>
              </div>

              {/* Signatures & Corporate Seal */}
              <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-900">Prepared By:</p>
                  <p className="mt-6 border-t border-slate-300 pt-1 text-[11px]">Workforce Payroll Department</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Authorized Signatory:</p>
                  <p className="mt-6 border-t border-slate-300 pt-1 text-[11px]">Director of Operations / HR</p>
                </div>
                <div className="col-span-2 sm:col-span-1 text-right">
                  <div className="inline-block p-2 border-2 border-dashed border-slate-300 rounded-lg text-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mt-0.5">
                      Digitally Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
