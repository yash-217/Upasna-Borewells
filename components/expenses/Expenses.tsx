import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Truck, Calendar, Edit2, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, Tag, Fuel, Wrench, Wallet, Settings } from 'lucide-react';
import { Vehicle, Employee, User, View } from '../../types';

export interface Expense {
  id: string;
  date: string;
  type: 'Fuel' | 'Maintenance' | 'Salary' | 'Miscellaneous';
  amount: number;
  description?: string;
  vehicle?: string;
  last_edited_by?: string;
  last_edited_at?: string;
  created_by?: string;
  receipt_status?: 'uploaded' | 'missing' | 'verified';
}

const EXPENSE_TYPES = ['Fuel', 'Maintenance', 'Salary', 'Miscellaneous'] as const;

// Type icon mapping
const TYPE_ICONS: Record<Expense['type'], React.ElementType> = {
  Fuel: Fuel,
  Maintenance: Wrench,
  Salary: Wallet,
  Miscellaneous: Settings,
};

// Type color mapping
const TYPE_COLORS: Record<Expense['type'], { bg: string; text: string; darkBg: string; darkText: string }> = {
  Fuel: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
  Maintenance: { bg: 'bg-indigo-100', text: 'text-indigo-700', darkBg: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
  Salary: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
  Miscellaneous: { bg: 'bg-slate-100', text: 'text-slate-700', darkBg: 'dark:bg-slate-700', darkText: 'dark:text-slate-300' },
};

// Receipt status styling
const RECEIPT_STATUS: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  uploaded: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: 'check_circle', label: 'Uploaded' },
  verified: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: 'verified', label: 'Verified' },
  missing: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', icon: 'cancel', label: 'Missing' },
};

interface ExpensesProps {
  expenses: Expense[];
  vehicles: Vehicle[];
  employees: Employee[];
  currentUser: User;
  onAdd: (expense: Expense) => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
  vehicleFilter: string;
  onResetFilters: () => void;
  setCurrentView?: (view: View) => void;
}

const ITEMS_PER_PAGE = 10;

export const Expenses: React.FC<ExpensesProps> = ({
  expenses,
  vehicles,
  employees,
  currentUser,
  onUpdate,
  onDelete,
  isReadOnly,
  vehicleFilter,
  onResetFilters,
  setCurrentView
}) => {
  // UI State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Sort State
  const [filterType, setFilterType] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('All');

  useEffect(() => {
    if (currentUser.role === 'staff') {
      setEmployeeFilter(currentUser.name);
    } else {
      setEmployeeFilter('All');
    }
  }, [currentUser]);

  // Statistics calculations
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= monthStart);
    const lastMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    // Top spending category
    const categoryTotals = EXPENSE_TYPES.reduce((acc, type) => {
      acc[type] = thisMonthExpenses.filter(e => e.type === type).reduce((sum, e) => sum + e.amount, 0);
      return acc;
    }, {} as Record<string, number>);
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0]?.[0] || 'None';
    const secondCategory = sortedCategories[1]?.[0] || '';

    // Missing receipts
    const missingReceipts = expenses.filter(e => e.receipt_status === 'missing').length;

    return { thisMonthTotal, percentChange, topCategory, secondCategory, missingReceipts };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(exp => {
        const matchesVehicle = vehicleFilter === 'All Vehicles' || exp.vehicle === vehicleFilter;
        const matchesType = filterType === 'All' || exp.type === filterType;
        const description = exp.description || '';
        const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase()) || exp.amount.toString().includes(searchTerm);
        const matchesDate = (!startDate || exp.date >= startDate) && (!endDate || exp.date <= endDate);
        const matchesEmployee = employeeFilter === 'All' || exp.created_by === employeeFilter || (!exp.created_by && exp.last_edited_by === employeeFilter);

        return matchesVehicle && matchesType && matchesSearch && matchesDate && matchesEmployee;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, vehicleFilter, filterType, searchTerm, startDate, endDate, employeeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Permission check: Admin can edit all, Staff can edit their own
  const canEdit = (expense: Expense) => {
    if (isReadOnly) return false;
    if (currentUser.role === 'admin') return true;
    return expense.created_by === currentUser.name || expense.last_edited_by === currentUser.name;
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense({ ...expense });
  };

  const handleEditSave = () => {
    if (editingExpense) {
      onUpdate({
        ...editingExpense,
        last_edited_by: currentUser.name,
        last_edited_at: new Date().toISOString()
      });
      setEditingExpense(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
  };

  // Render expense card for mobile
  const renderExpenseCard = (expense: Expense) => {
    const typeColors = TYPE_COLORS[expense.type];
    const TypeIcon = TYPE_ICONS[expense.type];
    const receiptStatus = RECEIPT_STATUS[expense.receipt_status || 'uploaded'];

    return (
      <div key={expense.id} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${typeColors.bg} ${typeColors.text} ${typeColors.darkBg} ${typeColors.darkText}`}>
              <TypeIcon size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{expense.description || expense.type}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(expense.date)}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${typeColors.bg} ${typeColors.text} ${typeColors.darkBg} ${typeColors.darkText}`}>
            {expense.type}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-800">
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(expense.amount)}</p>
            {expense.vehicle && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <Truck size={12} /> {expense.vehicle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${receiptStatus.bg} ${receiptStatus.text}`}>
              <span className="material-symbols-outlined text-sm">{receiptStatus.icon}</span>
              {receiptStatus.label}
            </span>
            {canEdit(expense) && (
              <button
                onClick={() => handleEditClick(expense)}
                className="text-blue-600 hover:bg-blue-600/10 p-2 rounded-lg transition-colors"
              >
                <Edit2 size={16} />
              </button>
            )}
            {!isReadOnly && currentUser.role === 'admin' && (
              <button
                onClick={() => onDelete(expense.id)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex min-w-72 flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Expense Tracking Log</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Manage and monitor drilling operations expenditures</p>
        </div>
        {!isReadOnly && setCurrentView && (
          <button
            onClick={() => setCurrentView(View.NEW_EXPENSE)}
            className="flex items-center gap-2 cursor-pointer justify-center rounded-lg h-12 px-6 bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            <span className="truncate">Add New Expense</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="flex flex-wrap gap-4">
        {/* Monthly Total */}
        <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monthly Total Expenditure</p>
            <Wallet className="text-blue-600" size={20} />
          </div>
          <p className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight">{formatCurrency(stats.thisMonthTotal)}</p>
          <p className={`text-sm font-semibold flex items-center gap-1 ${stats.percentChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            <TrendingUp size={14} className={stats.percentChange < 0 ? 'rotate-180' : ''} />
            {stats.percentChange >= 0 ? '+' : ''}{stats.percentChange.toFixed(1)}% vs last month
          </p>
        </div>

        {/* Top Category */}
        <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Top Spending Category</p>
            <Tag className="text-amber-500" size={20} />
          </div>
          <p className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight">{stats.topCategory}</p>
          {stats.secondCategory && (
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Followed by: {stats.secondCategory}</p>
          )}
        </div>

        {/* Missing Receipts */}
        <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Missing Receipts</p>
            <AlertTriangle className="text-rose-500" size={20} />
          </div>
          <p className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold leading-tight">{stats.missingReceipts} entries</p>
          {stats.missingReceipts > 0 && (
            <p className="text-rose-600 text-sm font-semibold flex items-center gap-1">
              <AlertTriangle size={14} /> Action required
            </p>
          )}
        </div>
      </div>

      {/* Active Vehicle Filter Banner */}
      {vehicleFilter !== 'All Vehicles' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-sm font-medium opacity-80">Filtered by Vehicle</p>
              <p className="font-bold">{vehicleFilter}</p>
            </div>
          </div>
          <button
            onClick={onResetFilters}
            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
            title="Clear Filter"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Quick Filters */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Filters</span>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          {/* All Expenses */}
          <button
            onClick={() => setFilterType('All')}
            className={`flex h-9 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors ${filterType === 'All'
              ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20'
              : 'bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700'
              }`}
          >
            <span className="text-sm font-bold">All Expenses</span>
          </button>

          {/* Type Filters */}
          {EXPENSE_TYPES.map(type => {
            const Icon = TYPE_ICONS[type];
            return (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? 'All' : type)}
                className={`flex h-9 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors ${filterType === type
                  ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                  }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium hidden sm:inline">{type}</span>
              </button>
            );
          })}

          {/* Search Box */}
          <div className="relative flex-1 min-w-[150px] md:min-w-[200px] ml-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 h-9 bg-slate-100 dark:bg-neutral-800 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm"
            />
          </div>

          {/* Date Range Filter */}
          <button
            onClick={() => {
              if (startDate || endDate) {
                setStartDate('');
                setEndDate('');
              }
            }}
            className="flex h-9 items-center justify-center gap-x-2 rounded-lg border border-slate-200 dark:border-neutral-700 px-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <Calendar size={16} />
            <span className="text-sm font-medium hidden sm:inline">Last 30 Days</span>
          </button>
        </div>
      </div>

      {/* Desktop: Table View | Mobile: Card View */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        {/* Desktop Table - Hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Receipt Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {paginatedExpenses.map(expense => {
                const typeColors = TYPE_COLORS[expense.type];
                const TypeIcon = TYPE_ICONS[expense.type];
                const receiptStatus = RECEIPT_STATUS[expense.receipt_status || 'uploaded'];

                return (
                  <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm font-medium whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${typeColors.bg} ${typeColors.text} ${typeColors.darkBg} ${typeColors.darkText}`}>
                        <TypeIcon size={14} />
                        {expense.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 dark:text-white text-sm font-medium max-w-[200px] truncate">
                        {expense.description || '-'}
                      </div>
                      {expense.vehicle && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Truck size={12} /> {expense.vehicle}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white text-sm font-bold whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${receiptStatus.bg} ${receiptStatus.text}`}>
                        <span className="material-symbols-outlined text-base">{receiptStatus.icon}</span>
                        {receiptStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit(expense) && (
                          <button
                            onClick={() => handleEditClick(expense)}
                            className="text-blue-600 hover:bg-blue-600/10 p-2 rounded-lg transition-colors"
                            title="Edit Expense"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {!isReadOnly && currentUser.role === 'admin' && (
                          <button
                            onClick={() => onDelete(expense.id)}
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2 rounded-lg transition-colors"
                            title="Delete Expense"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - Shown only on mobile */}
        <div className="md:hidden p-4 space-y-4">
          {paginatedExpenses.map(expense => renderExpenseCard(expense))}
        </div>

        {/* Empty State */}
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-slate-50 dark:bg-neutral-800 rounded-full mb-4 text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-white">No expenses found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Table Footer / Pagination */}
        {filteredExpenses.length > 0 && (
          <div className="px-4 md:px-6 py-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-slate-500">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)} of {filteredExpenses.length} expenses
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 dark:border-neutral-700 rounded-lg hover:bg-white dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 3) {
                  if (currentPage === 1) pageNum = i + 1;
                  else if (currentPage === totalPages) pageNum = totalPages - 2 + i;
                  else pageNum = currentPage - 1 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                      ? 'bg-white dark:bg-neutral-800 font-bold shadow-sm'
                      : 'hover:bg-white dark:hover:bg-neutral-800'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 dark:border-neutral-700 rounded-lg hover:bg-white dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setEditingExpense(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-slate-200 dark:border-neutral-800 w-full max-w-lg p-6 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit2 size={20} className="text-blue-600" /> Edit Expense
              </h3>
              <button onClick={() => setEditingExpense(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingExpense.amount}
                    onChange={e => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Type</label>
                  <select
                    value={editingExpense.type}
                    onChange={e => setEditingExpense({ ...editingExpense, type: e.target.value as Expense['type'] })}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  >
                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Vehicle</label>
                  <select
                    value={editingExpense.vehicle || ''}
                    onChange={e => setEditingExpense({ ...editingExpense, vehicle: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  >
                    <option value="">-- No Vehicle --</option>
                    {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Description</label>
                <input
                  type="text"
                  value={editingExpense.description || ''}
                  onChange={e => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  placeholder="Expense description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-neutral-800">
              <button
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};