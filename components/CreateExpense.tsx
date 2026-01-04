import React, { useState, ChangeEvent } from 'react';
import Tesseract from 'tesseract.js';
import { Truck, Upload, Plus, FileSpreadsheet } from 'lucide-react';
import { Vehicle } from '../types';
import { Expense } from './Expenses';

interface CreateExpenseProps {
  vehicles: Vehicle[];
  onAdd: (expense: Expense) => void;
  onCancel: () => void;
}

const EXPENSE_TYPES = ['Fuel', 'Maintenance', 'Salary', 'Miscellaneous'] as const;

export const CreateExpense: React.FC<CreateExpenseProps> = ({ vehicles, onAdd, onCancel }) => {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<Expense['type']>('Fuel');
  const [description, setDescription] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');

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

  const parseReceiptText = (text: string) => {
    const dateRegex = /(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/; // Corrected escaping for regex
    const dateMatch = text.match(dateRegex);
    
    const amountRegex = /(\d+\.\d{2})/; // Corrected escaping for regex
    const amountMatch = text.match(amountRegex);

    if (dateMatch) {
      if (dateMatch[0].match(/^\d{4}-\d{2}-\d{2}$/)) { // Corrected escaping for regex
        setDate(dateMatch[0]);
      }
    }

    if (amountMatch) {
      setAmount(amountMatch[0]);
    }

    setDescription(`Receipt scan: ${text.substring(0, 20).replace(/\n/g, ' ')}...`); // Corrected escaping for newline in template literal
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    onCancel(); // Navigate back
  };

  const handleCsvImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n'); // Corrected escaping for newline
      const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

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
      onCancel();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-lg max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <Plus size={24} className="text-blue-600" />
          Create New Expense
        </h3>
        
        <div className="mb-6 p-4 bg-slate-50 dark:bg-black rounded-lg border border-dashed border-slate-300 dark:border-neutral-700 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-neutral-400 mb-2">
                <Upload size={16} />
                Upload Receipt (Auto-fill)
              </label>
              <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isProcessing} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400" />
              {ocrStatus && <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 animate-pulse">{ocrStatus}</p>}
           </div>
           
           <div className="flex-1 w-full border-l border-slate-200 dark:border-neutral-800 pl-4">
               <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-neutral-400 mb-2">
                  <FileSpreadsheet size={16} /> Bulk Import
               </label>
               <input type="file" id="csv-upload-page" accept=".csv" className="hidden" onChange={handleCsvImport} />
               <label 
                htmlFor="csv-upload-page" 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer text-sm font-medium"
               >
                Upload CSV
               </label>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Date</label>
              <input 
                type="date" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full px-3 py-2.5 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Amount (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full px-3 py-2.5 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as Expense['type'])}
                className="w-full px-3 py-2.5 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              >
                {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Vehicle (Optional)</label>
              <select
                value={vehicle}
                onChange={e => setVehicle(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="w-full px-3 py-2.5 bg-white dark:bg-black border border-slate-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              placeholder="e.g., Diesel for Rig, Lunch, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-5 py-2.5 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isProcessing} 
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {isProcessing ? 'Processing...' : 'Create Expense'}
            </button>
          </div>
        </form>
    </div>
  );
};