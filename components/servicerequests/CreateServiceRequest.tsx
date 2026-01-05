import React from 'react';
import { Product, ServiceRequest, User, Vehicle } from '../../types';
import { ServiceRequestForm } from './ServiceRequestForm';
import { Plus } from 'lucide-react';

interface CreateServiceRequestProps {
  products: Product[];
  vehicles: Vehicle[];
  currentUser: User;
  onAddRequest: (req: ServiceRequest) => void;
  onCancel: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const CreateServiceRequest: React.FC<CreateServiceRequestProps> = ({ 
  products, vehicles, currentUser, onAddRequest, onCancel, showToast
}) => {
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
        <ServiceRequestForm 
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
