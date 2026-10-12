import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import {
  Employee,
  Department,
  EmploymentType,
  SalaryType,
  EmployeeStatus,
} from '../../types/hrms';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  UserCheck,
  UserX,
  X,
  Save,
  Clock,
  TrendingUp,
  Palmtree,
  Wallet,
  Calendar,
  Eye,
  FileCheck,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { formatINR } from '../../utils/formatters';

export const EmployeeDirectoryView: React.FC = () => {
  const {
    employees,
    shifts,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    attendanceRecords,
    overtimeRecords,
    leaveRequests,
    payrollRecords,
    getEmployeeLeaveBalance,
  } = useHRMS();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Profile Drawer state
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'attendance' | 'overtime' | 'leaves' | 'payroll'>('overview');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
    department: 'Front Desk' as Department,
    jobTitle: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'full_time' as EmploymentType,
    status: 'active' as EmployeeStatus,
    workLocation: 'Main Resort Tower',
    defaultShiftId: 'shift-1',
    salaryType: 'monthly' as SalaryType,
    payRate: 4000,
    bankName: 'Chase Manhattan Bank',
    accountNumber: '**** **** 1234',
    ifscOrRouting: 'CHASUS33',
    taxIdOrPan: 'SSN-XXX-00-1122',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    notes: '',
  });

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      email: '',
      phone: '',
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?w=150`,
      department: 'Front Desk',
      jobTitle: '',
      joiningDate: new Date().toISOString().split('T')[0],
      employmentType: 'full_time',
      status: 'active',
      workLocation: 'Main Resort Tower',
      defaultShiftId: shifts[0]?.id || 'shift-1',
      salaryType: 'monthly',
      payRate: 4200,
      bankName: 'Chase Manhattan Bank',
      accountNumber: '**** **** 4421',
      ifscOrRouting: 'CHASUS33',
      taxIdOrPan: 'SSN-XXX-55-9988',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      notes: '',
    });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      avatarUrl: emp.avatarUrl || '',
      department: emp.department,
      jobTitle: emp.jobTitle,
      joiningDate: emp.joiningDate,
      employmentType: emp.employmentType,
      status: emp.status,
      workLocation: emp.workLocation,
      defaultShiftId: emp.defaultShiftId,
      salaryType: emp.salaryType,
      payRate: emp.payRate,
      bankName: emp.bankDetails.bankName,
      accountNumber: emp.bankDetails.accountNumber,
      ifscOrRouting: emp.bankDetails.ifscOrRouting,
      taxIdOrPan: emp.bankDetails.taxIdOrPan,
      emergencyName: emp.emergencyContact?.name || '',
      emergencyRelation: emp.emergencyContact?.relation || '',
      emergencyPhone: emp.emergencyContact?.phone || '',
      notes: emp.notes || '',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.jobTitle.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please fill in the required fields (Name, Email, Job Title).' });
      return;
    }

    if (editingEmployee) {
      const res = updateEmployee(editingEmployee.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
        department: formData.department,
        jobTitle: formData.jobTitle,
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType,
        status: formData.status,
        workLocation: formData.workLocation,
        defaultShiftId: formData.defaultShiftId,
        salaryType: formData.salaryType,
        payRate: Number(formData.payRate),
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscOrRouting: formData.ifscOrRouting,
          taxIdOrPan: formData.taxIdOrPan,
        },
        emergencyContact: {
          name: formData.emergencyName,
          relation: formData.emergencyRelation,
          phone: formData.emergencyPhone,
        },
        notes: formData.notes,
      });
      setFeedbackMessage({ type: 'success', text: res.message });
    } else {
      const res = addEmployee({
        employeeId: formData.employeeId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
        department: formData.department,
        jobTitle: formData.jobTitle,
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType,
        status: formData.status,
        workLocation: formData.workLocation,
        defaultShiftId: formData.defaultShiftId,
        salaryType: formData.salaryType,
        payRate: Number(formData.payRate),
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscOrRouting: formData.ifscOrRouting,
          taxIdOrPan: formData.taxIdOrPan,
        },
        emergencyContact: {
          name: formData.emergencyName,
          relation: formData.emergencyRelation,
          phone: formData.emergencyPhone,
        },
        documents: [
          { id: `doc-${Date.now()}`, name: 'Onboarding_Agreement.pdf', type: 'PDF', uploadDate: formData.joiningDate, fileSize: '1.2 MB' }
        ],
        notes: formData.notes,
      });
      setFeedbackMessage({ type: 'success', text: res.message });
    }

    setIsAddEditModalOpen(false);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDeleteConfirm = () => {
    if (!employeeToDelete) return;
    const res = deleteEmployee(employeeToDelete.id);
    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
      if (profileEmployee?.id === employeeToDelete.id) {
        setProfileEmployee(null);
      }
    } else {
      setFeedbackMessage({ type: 'error', text: res.message });
    }
    setDeleteModalOpen(false);
    setEmployeeToDelete(null);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    const matchesType = typeFilter === 'All' || emp.employmentType === typeFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesType;
  });

  const departments: Department[] = [
    'Front Desk',
    'Housekeeping',
    'Food & Beverage',
    'Kitchen & Culinary',
    'Maintenance & Facilities',
    'Security & Safety',
    'Finance & Accounts',
    'Human Resources',
    'Management',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast feedback */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Workforce & Employee Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {employees.length} personnel · {filteredEmployees.length} matching criteria
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, ID (e.g. EMP-1001), job title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="All">All Departments</option>
          {departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>

        {/* Employment Type Filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="All">All Types</option>
          <option value="full_time">Full-Time</option>
          <option value="part_time">Part-Time</option>
          <option value="contract">Contract</option>
          <option value="temporary">Temporary</option>
        </select>
      </div>

      {/* Employee Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-3">Department & Role</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Location & Shift</th>
                <th className="py-3.5 px-3">Compensation</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No employees found matching the selected search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const shift = shifts.find(s => s.id === emp.defaultShiftId);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                            alt={emp.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <button
                              onClick={() => setProfileEmployee(emp)}
                              className="font-bold text-white hover:text-amber-400 text-left transition-colors flex items-center gap-1.5"
                            >
                              <span>{emp.name}</span>
                            </button>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {emp.employeeId} · {emp.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-200">{emp.jobTitle}</p>
                        <p className="text-[11px] text-slate-400">{emp.department}</p>
                      </td>

                      {/* Employment Type */}
                      <td className="py-3 px-3">
                        <span className="capitalize text-slate-300 font-medium">
                          {emp.employmentType.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Location & Shift */}
                      <td className="py-3 px-3">
                        <p className="text-slate-300">{emp.workLocation}</p>
                        <p className="text-[11px] text-slate-400">
                          {shift ? `${shift.name} (${shift.startTime}-${shift.endTime})` : 'Standard'}
                        </p>
                      </td>

                      {/* Compensation */}
                      <td className="py-3 px-3">
                        <p className="font-mono font-bold text-emerald-400">
                          {formatINR(emp.payRate)}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          per {emp.salaryType}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            emp.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : emp.status === 'on_leave'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {emp.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => setProfileEmployee(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="View Full Profile & Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Edit Employee Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active */}
                          <button
                            onClick={() => toggleEmployeeStatus(emp.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              emp.status === 'active'
                                ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={emp.status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
                          >
                            {emp.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete with Confirmation Modal */}
                          <button
                            onClick={() => {
                              setEmployeeToDelete(emp);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Employee Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsAddEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingEmployee ? `Edit Employee: ${editingEmployee.name}` : 'Add New Workforce Member'}
            </h3>

            <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
              {/* Row 1: Employee ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="elena@grandstay.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Row 3: Department & Job Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value as Department })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Concierge"
                    value={formData.jobTitle}
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Row 4: Employment Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={e => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="full_time">Full-Time</option>
                    <option value="part_time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Location & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Work Location</label>
                  <input
                    type="text"
                    value={formData.workLocation}
                    onChange={e => setFormData({ ...formData, workLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Default Assigned Shift</label>
                  <select
                    value={formData.defaultShiftId}
                    onChange={e => setFormData({ ...formData, defaultShiftId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 6: Compensation Structure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Salary Type</label>
                  <select
                    value={formData.salaryType}
                    onChange={e => setFormData({ ...formData, salaryType: e.target.value as SalaryType })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="monthly">Monthly Fixed</option>
                    <option value="hourly">Hourly Wage</option>
                    <option value="daily">Daily Wage</option>
                    <option value="contract">Contract Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Pay Rate (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.payRate}
                    onChange={e => setFormData({ ...formData, payRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 7: Banking & Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tax ID / SSN / PAN</label>
                  <input
                    type="text"
                    value={formData.taxIdOrPan}
                    onChange={e => setFormData({ ...formData, taxIdOrPan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Row 8: Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={formData.emergencyName}
                    onChange={e => setFormData({ ...formData, emergencyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Relation</label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse"
                    value={formData.emergencyRelation}
                    onChange={e => setFormData({ ...formData, emergencyRelation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.emergencyPhone}
                    onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEmployee ? 'Save Changes' : 'Create Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Dossier Modal / Drawer */}
      {profileEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100 max-h-[92vh] flex flex-col">
            <button
              onClick={() => setProfileEmployee(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-5 border-b border-slate-800">
              <img
                src={profileEmployee.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                alt={profileEmployee.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/40"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{profileEmployee.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {profileEmployee.employeeId}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {profileEmployee.jobTitle} · <span className="text-amber-400">{profileEmployee.department}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span>Joined: {profileEmployee.joiningDate}</span>
                  <span>·</span>
                  <span>Location: {profileEmployee.workLocation}</span>
                  <span>·</span>
                  <span>Comp: {formatINR(profileEmployee.payRate)}/{profileEmployee.salaryType}</span>
                </div>
              </div>
            </div>

            {/* Tabs Bar */}
            <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-800 text-xs overflow-x-auto">
              {[
                { id: 'overview', label: 'Dossier Overview', icon: FileCheck },
                { id: 'attendance', label: 'Attendance Logs', icon: Clock },
                { id: 'overtime', label: 'Overtime History', icon: TrendingUp },
                { id: 'leaves', label: 'Leave Balances', icon: Palmtree },
                { id: 'payroll', label: 'Salary Statements', icon: Wallet },
              ].map(t => {
                const Icon = t.icon;
                const active = profileActiveTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setProfileActiveTab(t.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile Tab Contents */}
            <div className="flex-1 overflow-y-auto py-4 text-xs space-y-4 custom-scrollbar">
              {profileActiveTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                    <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1.5">Employment Profile</h4>
                    <p><span className="text-slate-400">Employment Type:</span> <strong className="text-white capitalize">{profileEmployee.employmentType.replace('_', ' ')}</strong></p>
                    <p><span className="text-slate-400">Status:</span> <strong className="text-emerald-400 capitalize">{profileEmployee.status}</strong></p>
                    <p><span className="text-slate-400">Reporting Manager:</span> <strong className="text-white">{profileEmployee.assignedManagerName || 'Executive HQ'}</strong></p>
                    <p><span className="text-slate-400">Work Email:</span> <strong className="text-white">{profileEmployee.email}</strong></p>
                    <p><span className="text-slate-400">Phone:</span> <strong className="text-white">{profileEmployee.phone}</strong></p>
                    <p><span className="text-slate-400">Notes:</span> <span className="text-slate-300 italic">{profileEmployee.notes || 'No special remarks recorded.'}</span></p>
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                    <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1.5">Bank & Statutory</h4>
                    <p><span className="text-slate-400">Bank Name:</span> <strong className="text-white">{profileEmployee.bankDetails.bankName}</strong></p>
                    <p><span className="text-slate-400">Account Number:</span> <strong className="text-white font-mono">{profileEmployee.bankDetails.accountNumber}</strong></p>
                    <p><span className="text-slate-400">Routing / IFSC:</span> <strong className="text-white font-mono">{profileEmployee.bankDetails.ifscOrRouting}</strong></p>
                    <p><span className="text-slate-400">Tax Registration:</span> <strong className="text-white font-mono">{profileEmployee.bankDetails.taxIdOrPan}</strong></p>
                    <h5 className="font-semibold text-slate-300 pt-2 border-t border-slate-800">Emergency Contact</h5>
                    <p><span className="text-slate-400">Name:</span> <strong className="text-white">{profileEmployee.emergencyContact?.name || 'N/A'}</strong></p>
                    <p><span className="text-slate-400">Relation / Phone:</span> <strong className="text-white">{profileEmployee.emergencyContact?.relation} ({profileEmployee.emergencyContact?.phone})</strong></p>
                  </div>

                  {/* Documents */}
                  <div className="md:col-span-2 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-white text-sm mb-2">Verified Documents & Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {profileEmployee.documents.map(d => (
                        <div key={d.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{d.name}</p>
                            <p className="text-[10px] text-slate-400">{d.uploadDate} · {d.fileSize}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">Verified</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {profileActiveTab === 'attendance' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-white">Recent Attendance Records for {profileEmployee.name}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">In</th>
                          <th className="pb-2">Out</th>
                          <th className="pb-2">Break</th>
                          <th className="pb-2">Hours</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {attendanceRecords
                          .filter(a => a.employeeId === profileEmployee.id)
                          .map(att => (
                            <tr key={att.id}>
                              <td className="py-2 font-mono text-white">{att.date}</td>
                              <td className="py-2 font-mono text-emerald-400">{att.clockIn || '--'}</td>
                              <td className="py-2 font-mono text-rose-400">{att.clockOut || '--'}</td>
                              <td className="py-2 text-slate-400">{att.totalBreakMinutes}m</td>
                              <td className="py-2 font-mono font-bold text-slate-200">{att.regularHours}h</td>
                              <td className="py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  att.status === 'present' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {att.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {profileActiveTab === 'overtime' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-white">Overtime History</h4>
                  {overtimeRecords.filter(o => o.employeeId === profileEmployee.id).map(ot => (
                    <div key={ot.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{ot.date} · {ot.hours} Hours ({ot.rateMultiplier}x)</p>
                        <p className="text-[11px] text-slate-400">"{ot.reason}"</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-emerald-400">{formatINR(ot.calculatedAmount, { showDecimals: true })}</p>
                        <span className="capitalize text-[10px] text-amber-400">{ot.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {profileActiveTab === 'leaves' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-white">Annual Entitlements & Consumption</h4>
                  {(() => {
                    const bal = getEmployeeLeaveBalance(profileEmployee.id);
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <p className="text-[11px] text-slate-400">Annual Leave</p>
                          <p className="text-xl font-bold text-white">{bal.annual - bal.annualUsed} / {bal.annual}</p>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <p className="text-[11px] text-slate-400">Sick Leave</p>
                          <p className="text-xl font-bold text-white">{bal.sick - bal.sickUsed} / {bal.sick}</p>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <p className="text-[11px] text-slate-400">Casual Leave</p>
                          <p className="text-xl font-bold text-white">{bal.casual - bal.casualUsed} / {bal.casual}</p>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <p className="text-[11px] text-slate-400">Emergency Leave</p>
                          <p className="text-xl font-bold text-white">{bal.emergency - bal.emergencyUsed} / {bal.emergency}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {profileActiveTab === 'payroll' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-white">Disbursed Salary History</h4>
                  {payrollRecords.filter(p => p.employeeId === profileEmployee.id).map(pr => (
                    <div key={pr.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">Period: {pr.payrollMonth}</p>
                        <p className="text-[11px] text-slate-400">Gross: {formatINR(pr.grossSalary)} · Deductions: {formatINR(pr.totalDeductions)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-emerald-400">{formatINR(pr.netSalary)}</p>
                        <span className="text-[10px] uppercase font-bold text-emerald-400">{pr.paymentStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Employee Deletion */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Employee Record"
        itemName={employeeToDelete ? `${employeeToDelete.name} (${employeeToDelete.employeeId})` : undefined}
        message="Are you sure you want to delete this employee? This will permanently remove their records, shifts, and credentials from the system. This action cannot be undone."
        confirmLabel="Permanently Delete Employee"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
      />
    </div>
  );
};
