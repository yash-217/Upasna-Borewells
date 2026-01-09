import React, { useState, useMemo } from 'react';
import { Product, User } from '../../types';
import { Plus, Edit2, Trash2, X, Search, ChevronLeft, ChevronRight, Download, Package, AlertTriangle, TrendingUp } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  currentUser: User;
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  isReadOnly?: boolean;
}

// Category color mapping
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Motor: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  Pipe: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  Cable: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  Service: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  Accessory: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400' },
};

const CATEGORIES = ['All', 'Motor', 'Pipe', 'Cable', 'Service', 'Accessory'] as const;
const ITEMS_PER_PAGE = 10;

export const Inventory: React.FC<InventoryProps> = ({
  products, currentUser, onAddProduct, onUpdateProduct, onDeleteProduct, isReadOnly
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: 'Accessory', unitPrice: 0, unit: 'pcs'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats calculations
  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + p.unitPrice, 0);
    const totalItems = products.length;
    const categoryBreakdown = CATEGORIES.slice(1).map(cat => ({
      category: cat,
      count: products.filter(p => p.category === cat).length
    }));
    const topCategory = categoryBreakdown.sort((a, b) => b.count - a.count)[0];

    return { totalValue, totalItems, topCategory };
  }, [products]);

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openModal = (product?: Product) => {
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

  const handleExportCSV = () => {
    const headers = ['Name', 'Category', 'Unit Price', 'Unit'];
    const rows = products.map(p => [p.name, p.category, p.unitPrice.toString(), p.unit]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  // Render product card for mobile
  const renderProductCard = (product: Product) => {
    const categoryColor = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Accessory;

    return (
      <div
        key={product.id}
        className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm"
        onClick={() => openModal(product)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${categoryColor.bg} ${categoryColor.text} mb-2`}>
              {product.category}
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{product.name}</h4>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-800">
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(product.unitPrice)}</p>
            <span className="text-xs text-slate-500 dark:text-slate-400">per {product.unit}</span>
          </div>
          {!isReadOnly && (
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => openModal(product)}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDeleteProduct(product.id)}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Equipment & Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Real-time tracking of borewell assets and equipment</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          {!isReadOnly && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Entry</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Asset Value */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Catalog Value</p>
            <span className="material-symbols-outlined text-blue-600">payments</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalValue)}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp size={12} />
            {stats.totalItems} products listed
          </p>
        </div>

        {/* Total Items */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Products</p>
            <Package size={20} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalItems}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">Across all categories</p>
        </div>

        {/* Top Category */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Top Category</p>
            <AlertTriangle size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.topCategory?.category || 'N/A'}</p>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-1 font-medium">{stats.topCategory?.count || 0} products</p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        {/* Tabs Header */}
        <div className="border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 px-4 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-3 md:py-0">
          {/* Mobile: Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="md:hidden w-full h-10 px-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-slate-800 dark:text-white"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Items' : cat}</option>
            ))}
          </select>

          {/* Desktop: Tabs */}
          <div className="hidden md:flex gap-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                className={`flex items-center justify-center border-b-[3px] pb-3 pt-4 text-sm font-bold tracking-wide transition-colors ${categoryFilter === cat
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-blue-600'
                  }`}
              >
                {cat === 'All' ? 'All Items' : cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 h-10 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-neutral-800/50">
              <tr className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Unit Price</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Last Edited</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
              {paginatedProducts.map(product => {
                const categoryColor = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Accessory;

                return (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-slate-900 dark:text-white font-semibold">{product.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs">ID: {product.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${categoryColor.bg} ${categoryColor.text}`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-900 dark:text-white font-medium">
                      {formatCurrency(product.unitPrice)}
                    </td>
                    <td className="px-6 py-5 text-slate-500 dark:text-slate-400 font-medium">
                      {product.unit}
                    </td>
                    <td className="px-6 py-5 text-slate-500 dark:text-slate-400 text-sm">
                      {product.lastEditedBy ? (
                        <div className="flex flex-col">
                          <span>{product.lastEditedBy}</span>
                          {product.lastEditedAt && <span className="text-xs text-slate-400">{product.lastEditedAt}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openModal(product)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-white rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-neutral-600 transition-all"
                        >
                          {isReadOnly ? 'View' : 'Edit'}
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => onDeleteProduct(product.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
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

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-4">
          {paginatedProducts.map(product => renderProductCard(product))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-slate-50 dark:bg-neutral-800 rounded-full mb-4 text-slate-400">
              <Package size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-white">No products found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-neutral-800/50 border-t border-slate-200 dark:border-neutral-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of {filteredProducts.length} items
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
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
                    className={`flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                      ? 'bg-blue-600 text-white font-bold'
                      : 'border border-slate-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingProduct ? (isReadOnly ? 'Product Details' : 'Edit Product') : 'Add Product'}</h3>
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
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Category</label>
                      <select disabled={isReadOnly} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                        value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as Product['category'] })}>
                        {['Motor', 'Pipe', 'Cable', 'Service', 'Accessory'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Unit</label>
                      <input disabled={isReadOnly} required type="text" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                        placeholder="e.g. ft, pcs"
                        value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Unit Price (₹)</label>
                    <input disabled={isReadOnly} required type="number" min="0" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })} />
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