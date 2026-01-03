import React, { useState, ChangeEvent } from 'react';
import Tesseract from 'tesseract.js';
import { Trash2, Search, X, Plus, Truck, Upload, Calendar, DollarSign, FileText, Wrench, FileSpreadsheet } from 'lucide-react';
import { VEHICLES } from '../constants';

export interface Expense {
  id: string;
  date: string;
  type: 'Fuel' | 'Maintenance' | 'Salary' | 'Miscellaneous';
  amount: number;
  description: string;
  vehicle?: string;
  last_edited_by?: string;
  last_edited_at?: string;
}

const EXPENSE_TYPES = ['Fuel', 'Maintenance', 'Salary', 'Miscellaneous'] as const;

interface ExpensesProps {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
  vehicleFilter: string;
  onResetFilters: () => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAdd, onDelete, isReadOnly, vehicleFilter, onResetFilters }) => {
  // Form State
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<Expense['type']>('Fuel');
  const [description, setDescription] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Filter & Sort State
  const [filterType, setFilterType] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setOcrStatus('Initializing OCR...');

    try {
      setOcrStatus('Recognizing text...');
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrStatus(`Processing: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const text = result.data.text;
      parseReceiptText(text);
      setOcrStatus('Done!');
    } catch (err) {
      console.error(err);
      setOcrStatus('Error processing image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Basic heuristic to find dates and money in OCR text
  const parseReceiptText = (text: string) => {
    // Look for date (YYYY-MM-DD or DD/MM/YYYY)
    // This is a simple regex, real-world receipt parsing is complex
    const dateRegex = /(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/;
    const dateMatch = text.match(dateRegex);
    
    // Look for currency (e.g., 10.99)
    const amountRegex = /(\d+\.\d{2})/;
    const amountMatch = text.match(amountRegex);

    if (dateMatch) {
      // Normalize date if needed, for now just taking the match
      // In a real app, you'd parse this into YYYY-MM-DD for the input
      console.log('Found date:', dateMatch[0]);
      // Simple attempt to format for input type="date" if it matches YYYY-MM-DD
      if (dateMatch[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
        setDate(dateMatch[0]);
      }
    }

    if (amountMatch) {
      setAmount(amountMatch[0]);
    }

    // Default description to a snippet of the text
    setDescription(`Receipt scan: ${text.substring(0, 20).replace(/\n/g, ' ')}...`);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !amount) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      date,
      type: type,
      amount: parseFloat(amount),
      description,
      vehicle: vehicle || undefined,
      last_edited_by: 'Current User',
      last_edited_at: new Date().toISOString()
    };

    onAdd(newExpense);
    // Reset form
    setDate('');
    setAmount('');
    setDescription('');
    setVehicle('');
    setOcrStatus('');
    setShowAddForm(false);
  };

  const handleCsvImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      // Skip header row if it contains 'date'
      const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Expected CSV Format: Date, Type, Amount, Description, Vehicle
        const [date, typeRaw, amountStr, description, vehicle] = line.split(',').map(s => s.trim());
        const amount = parseFloat(amountStr);

        if (date && !isNaN(amount)) {
          const type = EXPENSE_TYPES.find(t => t.toLowerCase() === typeRaw?.toLowerCase()) || 'Miscellaneous';
          
          onAdd({
            id: Date.now().toString() + Math.random().toString().slice(2),
            date,
            type: type as Expense['type'],
            amount,
            description: description || 'Imported Expense',
            vehicle: vehicle || undefined,
            last_edited_by: 'CSV Import',
            last_edited_at: new Date().toISOString()
          });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredExpenses = expenses
    .filter(exp => {
      const matchesVehicle = vehicleFilter === 'All Vehicles' || exp.vehicle === vehicleFilter;
      const matchesType = filterType === 'All' || exp.type === filterType;
      const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || exp.amount.toString().includes(searchTerm);
      const matchesDate = (!startDate || exp.date >= startDate) && (!endDate || exp.date <= endDate);
      
      return matchesVehicle && matchesType && matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const activeFiltersCount = (filterType !== 'All' ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  const clearFilters = () => {
    setFilterType('All');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Box - Maximized */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${
                    startDate || endDate
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-black border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Calendar size={16} />
                  <span className="hidden sm:inline">{startDate || endDate ? 'Date Active' : 'Filter by Date'}</span>
                </button>

                {showDateFilter && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-slate-200 dark:border-neutral-800 p-4 z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Date Range</h4>
                      <button onClick={() => setShowDateFilter(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1 block">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          max={endDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1 block">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          min={startDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                      {(startDate || endDate) && (
                        <button
                          onClick={() => { setStartDate(''); setEndDate(''); }}
                          className="w-full py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          Clear Dates
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm cursor-pointer"
              >
                <option value="All">All Types</option>
                {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap text-sm font-medium"
              >
                {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
              </button>

              {activeFiltersCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Clear Filters"
                >
                  <X size={20} />
                </button>
              )}

          {!isReadOnly && (
            <div className="relative">
              <input type="file" id="csv-upload" accept=".csv" className="hidden" onChange={handleCsvImport} />
              <label 
                htmlFor="csv-upload" 
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet size={18} />
                <span className="hidden sm:inline">Import CSV</span>
              </label>
            </div>
          )}

          {!isReadOnly && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                showAddForm 
                  ? 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showAddForm ? <X size={20} /> : <Plus size={20} />}
              {showAddForm ? 'Cancel' : 'Add Expense'}
            </button>
          )}
        </div>
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

      {/* Add Expense Form */}
      {!isReadOnly && showAddForm && (
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-lg animate-in fade-in slide-in-from-top-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Plus size={20} className="text-blue-600" />
          New Expense Entry
        </h3>
        <form onSubmit={handleAddExpense} className="space-y-4">
          
          <div className="p-4 bg-slate-50 dark:bg-black rounded-lg border border-dashed border-slate-300 dark:border-neutral-700">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-neutral-400 mb-2">
              <Upload size={16} />
              Upload Receipt (Auto-fill)
            </label>
            <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isProcessing} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400" />
            {ocrStatus && <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 animate-pulse">{ocrStatus}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Date</label>
              <input 
                type="date" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Amount (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as Expense['type'])}
                className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              >
                {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Vehicle (Optional)</label>
              <select
                value={vehicle}
                onChange={e => setVehicle(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              >
                <option value="">-- Select Vehicle --</option>
                {VEHICLES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="w-full px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              placeholder="e.g., Diesel for Rig, Lunch, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isProcessing} 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isProcessing ? 'Processing...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
      )}

      {/* Expenses List */}
      <div className="grid gap-4">
        {filteredExpenses.map(expense => (
          <div key={expense.id} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                expense.type === 'Fuel' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                expense.type === 'Maintenance' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                expense.type === 'Salary' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}>
                {expense.type === 'Fuel' ? <Truck size={20} /> :
                 expense.type === 'Maintenance' ? <Wrench size={20} /> :
                 expense.type === 'Salary' ? <DollarSign size={20} /> :
                 <FileText size={20} />}
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-white">{expense.description}</h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {expense.date}</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-neutral-800 rounded-full text-xs font-medium">
                    {expense.type}
                  </span>
                  {expense.vehicle && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                      <Truck size={12} /> {expense.vehicle}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="font-bold text-lg text-slate-800 dark:text-white">
                ₹{expense.amount.toFixed(2)}
              </div>
              {!isReadOnly && (
                <button 
                  onClick={() => onDelete(expense.id)} 
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete Expense"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-slate-200 dark:border-neutral-800">
            <div className="inline-flex p-4 bg-slate-50 dark:bg-neutral-800 rounded-full mb-4 text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-white">No expenses found</h3>
            <p className="text-slate-500 dark:text-neutral-400 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};