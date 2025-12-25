import React, { useState, ChangeEvent } from 'react';
import Tesseract from 'tesseract.js';

interface Expense {
  id: string;
  date: string;
  type: 'Fuel' | 'Maintenance' | 'Salary' | 'Miscellaneous';
  amount: number;
  description: string;
}

const EXPENSE_TYPES = ['Fuel', 'Maintenance', 'Salary', 'Miscellaneous'] as const;

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Form State
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<Expense['type']>('Fuel');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');

  // Filter & Sort State
  const [filterType, setFilterType] = useState<string>('All');
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
      description
    };

    setExpenses([...expenses, newExpense]);
    // Reset form
    setDate('');
    setAmount('');
    setDescription('');
    setOcrStatus('');
  };

  const filteredExpenses = expenses
    .filter(exp => filterType === 'All' || exp.type === filterType)
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Expense Tracker</h2>

      {/* Add Expense Form */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
        <h3>Add New Expense</h3>
        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Upload Receipt (Auto-fill):</label>
            <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isProcessing} />
            {ocrStatus && <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#666' }}>{ocrStatus}</span>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Date</label>
              <input 
                type="date" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Amount</label>
              <input 
                type="number" 
                step="0.01" 
                required 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as Expense['type'])}
                style={{ width: '100%', padding: '8px' }}
              >
                {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Description</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
          </div>

          <button type="submit" disabled={isProcessing} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Add Expense
          </button>
        </form>
      </div>

      {/* List Controls */}
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <label style={{ marginRight: '10px' }}>Filter by Type:</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '5px' }}>
            <option value="All">All</option>
            {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} style={{ padding: '5px 10px' }}>
          Sort by Date ({sortOrder === 'asc' ? 'Oldest' : 'Newest'})
        </button>
      </div>

      {/* Expenses List */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredExpenses.map(expense => (
          <li key={expense.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{expense.description}</strong> <span style={{ color: '#666', fontSize: '0.9em' }}>({expense.type})</span>
              <div style={{ fontSize: '0.85em', color: '#888' }}>{expense.date}</div>
            </div>
            <div style={{ fontWeight: 'bold' }}>
              ${expense.amount.toFixed(2)}
            </div>
          </li>
        ))}
        {filteredExpenses.length === 0 && <li style={{ color: '#888', textAlign: 'center' }}>No expenses found.</li>}
      </ul>
    </div>
  );
};