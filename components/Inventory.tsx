import React, { useState } from 'react';
import { Product, User } from '../types';
import { Plus, Edit2, Trash2, X, Package, ChevronRight } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  currentUser: User;
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  isReadOnly?: boolean;
}

export const Inventory: React.FC<InventoryProps> = ({ 
  products, currentUser, onAddProduct, onUpdateProduct, onDeleteProduct, isReadOnly 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: 'Accessory', unitPrice: 0, unit: 'pcs'
  });

  const openModal = (product?: Product) => {
    // Prevent opening modal in read-only mode (double check)
    if (isReadOnly && !product) return; 

    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: 'Accessory', unitPrice: 0, unit: 'pcs' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toLocaleString();
    if (editingProduct) {
      onUpdateProduct({ 
        ...editingProduct, 
        ...formData,
        lastEditedBy: currentUser.name,
        lastEditedAt: timestamp
      } as Product);
    } else {
      onAddProduct({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        lastEditedBy: currentUser.name,
        lastEditedAt: timestamp
      } as Product);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sticky top-0 z-10 bg-slate-50 dark:bg-black py-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Product Inventory</h2>
        {!isReadOnly && (
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Add Product</span><span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800 group overflow-hidden hover:shadow-md transition-shadow">
            
            {/* Mobile View: Compact Row */}
            <div className="md:hidden flex items-center justify-between p-4" onClick={() => !isReadOnly && openModal(p)}>
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider 
                    ${p.category === 'Motor' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 
                      p.category === 'Pipe' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                    {p.category}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white truncate">{p.name}</h3>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                  ₹{p.unitPrice.toLocaleString()} <span className="text-slate-400 dark:text-neutral-500 font-normal">/ {p.unit}</span>
                </div>
              </div>
              {!isReadOnly && <ChevronRight size={20} className="text-slate-300 dark:text-neutral-600" />}
            </div>

            {/* Desktop View: Full Card */}
            <div className="hidden md:flex flex-col p-4 h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${p.category === 'Motor' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 
                      p.category === 'Pipe' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                    {p.category}
                  </span>
                  {!isReadOnly && (
                    <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openModal(p); }} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-neutral-800 rounded">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(p.id); }} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-neutral-800 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-neutral-100 mb-1 line-clamp-2 min-h-[3rem]">{p.name}</h3>
                <div className="flex items-baseline gap-1 text-slate-900 dark:text-white mt-2">
                  <span className="text-xl font-bold">₹{p.unitPrice.toLocaleString()}</span>
                  <span className="text-sm text-slate-500 dark:text-neutral-400">/ {p.unit}</span>
                </div>
              </div>
              
              {p.lastEditedBy && (
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-neutral-800 text-xs text-slate-400 dark:text-neutral-500 truncate">
                  Edited by {p.lastEditedBy}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className={isReadOnly ? "pointer-events-none opacity-80" : ""}>
                   {/* Fields */}
                   <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Product Name</label>
                      <input disabled={isReadOnly} required type="text" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mt-4">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Category</label>
                       <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                         value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                         {['Motor', 'Pipe', 'Cable', 'Service', 'Accessory'].map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Unit</label>
                       <input disabled={isReadOnly} required type="text" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                         placeholder="e.g. ft, pcs"
                         value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                     </div>
                   </div>

                   <div className="mt-4">
                     <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Unit Price (₹)</label>
                     <input disabled={isReadOnly} required type="number" min="0" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                       value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})} />
                   </div>
                </div>

                {editingProduct && !isReadOnly && (
                   <div className="pt-4 mt-2 border-t border-slate-100 dark:border-neutral-800">
                      <button 
                        type="button" 
                        onClick={() => {
                           onDeleteProduct(editingProduct.id);
                           setIsModalOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 p-2.5 text-red-600 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium"
                      >
                         <Trash2 size={16} /> Delete Product
                      </button>
                   </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-neutral-800 flex justify-end gap-3 bg-slate-50 dark:bg-neutral-900/50 rounded-b-xl mt-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg text-sm font-medium">
                  {isReadOnly ? 'Close' : 'Cancel'}
                </button>
                {!isReadOnly && (
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                    {editingProduct ? 'Save Changes' : 'Add Product'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};