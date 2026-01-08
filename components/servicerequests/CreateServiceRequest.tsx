import React from 'react';
import { Product, ServiceRequest, User, Vehicle } from '../../types';
import { ServiceRequestForm } from './ServiceRequestForm';
import { Plus, Sparkles, Upload } from 'lucide-react';
import { scanServiceRequestWithGemini, isGeminiAvailable } from '../../services/ocrService';

interface CreateServiceRequestProps {
  products: Product[];
  vehicles: Vehicle[];
  currentUser: User;
  onAddRequest: (req: ServiceRequest) => void;
  onAddProduct: (p: Product) => void;
  onCancel: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const CreateServiceRequest: React.FC<CreateServiceRequestProps> = ({
  products, vehicles, currentUser, onAddRequest, onAddProduct, onCancel, showToast
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [ocrStatus, setOcrStatus] = React.useState('');
  const [initialData, setInitialData] = React.useState<Partial<ServiceRequest> | undefined>(undefined);
  const [missingProducts, setMissingProducts] = React.useState<Array<{ name: string; price: number }>>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isGeminiAvailable()) {
      showToast("Gemini API key is missing.", "error");
      return;
    }

    setIsProcessing(true);
    setOcrStatus("Processing with Gemini AI...");

    try {
      const result = await scanServiceRequestWithGemini(file);

      // Populate form data with all extracted fields
      const extracted: Partial<ServiceRequest> = {};

      // Customer details
      if (result.customerName) extracted.customerName = result.customerName;
      if (result.phone) extracted.phone = result.phone.startsWith('+91') ? result.phone : '+91 ' + result.phone.replace(/\D/g, '').slice(-10);
      if (result.address) {
        extracted.addressLine1 = result.address;
        extracted.location = result.address;
      }
      if (result.date) extracted.date = result.date;
      if (result.notes) extracted.notes = result.notes;

      // Drilling details
      if (result.drillingDepth) extracted.drillingDepth = result.drillingDepth;
      if (result.drillingRate) extracted.drillingRate = result.drillingRate;

      // Casing details (7")
      if (result.casingDepth) extracted.casingDepth = result.casingDepth;
      if (result.casingRate) extracted.casingRate = result.casingRate;

      // 10" Casing details
      if (result.casing10Depth) extracted.casing10Depth = result.casing10Depth;
      if (result.casing10Rate) extracted.casing10Rate = result.casing10Rate;

      // Handle products/items
      if (result.items && result.items.length > 0) {
        const matchedItems: Array<{ productId: string; quantity: number; priceAtTime: number }> = [];
        const detectedMissing: Array<{ name: string; price: number }> = [];

        for (const item of result.items) {
          if (!item.name || item.name.trim() === '') continue;

          // Try to find matching product in inventory (fuzzy match)
          const matchedProduct = products.find(p =>
            p.name.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(p.name.toLowerCase())
          );

          if (matchedProduct) {
            matchedItems.push({
              productId: matchedProduct.id,
              quantity: 1,
              priceAtTime: item.price || matchedProduct.unitPrice
            });
          } else {
            detectedMissing.push({ name: item.name, price: item.price || 0 });
          }
        }

        if (matchedItems.length > 0) {
          extracted.items = matchedItems;
        }

        // Store missing products for one-click add
        if (detectedMissing.length > 0) {
          setMissingProducts(detectedMissing);
        }
      }

      setInitialData(extracted);
      showToast("Form auto-filled from image!", "success");
      setOcrStatus("✅ Done!");
    } catch (error) {
      console.error("OCR Error:", error);
      showToast("Failed to scan image.", "error");
      setOcrStatus("Failed to scan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (data: ServiceRequest) => {
    // Add logic to generate ID and timestamp here if not handled in parent or form
    // The previous implementation in ServiceRequests.tsx handled this.
    // We should probably handle it here before calling onAddRequest.
    const timestamp = new Date().toLocaleString();
    const newRequest = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      lastEditedBy: currentUser.name,
      lastEditedAt: timestamp
    };
    onAddRequest(newRequest);
    onCancel();
  };

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-lg max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <Plus size={24} className="text-blue-600" />
        New Service Request
      </h3>

      {/* OCR Upload Section */}
      {isGeminiAvailable() && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-dashed border-purple-200 dark:border-purple-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-purple-900 dark:text-purple-300">
                <Sparkles size={16} />
                Auto-fill from Photo
              </h4>
            </div>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black border border-purple-200 dark:border-purple-800/50 rounded-lg text-sm font-medium text-purple-700 dark:text-purple-300 shadow-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                {isProcessing ? (
                  <span className="animate-pulse">{ocrStatus}</span>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload Photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Products Alert */}
      {missingProducts.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-3">
            ⚠️ Products detected but not in inventory:
          </h4>
          <div className="space-y-2">
            {missingProducts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white dark:bg-black p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{item.name}</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">₹{item.price.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => {
                    const newProductId = Math.random().toString(36).substr(2, 9);
                    onAddProduct({
                      id: newProductId,
                      name: item.name,
                      category: 'Accessory',
                      unit: 'set',
                      unitPrice: item.price
                    });

                    // Also add to items list in the form
                    setInitialData(prev => ({
                      ...prev,
                      items: [
                        ...(prev?.items || []),
                        { productId: newProductId, quantity: 1, priceAtTime: item.price }
                      ]
                    }));

                    setMissingProducts(prev => prev.filter((_, i) => i !== idx));
                    showToast(`Added "${item.name}" to inventory and Items Used!`, 'success');
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add to Inventory
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ServiceRequestForm
        key={initialData ? 'loaded' : 'new'} // Force re-render when data loads
        initialData={initialData}
        products={products}
        vehicles={vehicles}
        currentUser={currentUser}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        showToast={showToast}
      />
    </div>
  );
};
