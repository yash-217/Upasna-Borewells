import { useMutation, QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase, mapRequestToDB, mapRequestFromDB, mapProductToDB, mapProductFromDB, mapEmployeeToDB, mapEmployeeFromDB } from '../services/supabase';
import { ServiceRequest, Product, Employee, Expense, User } from '../types';
import { getErrorMessage, ErrorMessages, logError } from '../lib/errors';

interface UseAppMutationsProps {
  queryClient: QueryClient;
  currentUser: User | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

/**
 * Creates a standardized error handler for mutations
 */
const createErrorHandler = (
  context: string,
  userMessage: string,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) => (error: unknown) => {
  logError(context, error);
  const detailedMessage = getErrorMessage(error);
  // Show user-friendly message with technical details if available
  showToast(`${userMessage}: ${detailedMessage}`, 'error');
};

export const useAppMutations = ({ queryClient, currentUser, showToast }: UseAppMutationsProps) => {
  // Service Requests
  const addRequestMutation = useMutation({
    mutationFn: async (req: ServiceRequest) => {
      const dbData = mapRequestToDB({
        ...req,
        createdBy: currentUser?.name
      });
      const { data, error } = await supabase.from('service_requests').insert(dbData).select().single();
      if (error) throw error;
      return mapRequestFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      showToast('Service request created successfully', 'success');
    },
    onError: createErrorHandler('addRequest', ErrorMessages.serviceRequest.add, showToast)
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (updatedReq: ServiceRequest) => {
      const dbData = mapRequestToDB(updatedReq);
      const { error } = await supabase.from('service_requests').update(dbData).eq('id', updatedReq.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      showToast('Service request updated successfully', 'success');
    },
    onError: createErrorHandler('updateRequest', ErrorMessages.serviceRequest.update, showToast)
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      showToast('Service request deleted', 'info');
    },
    onError: createErrorHandler('deleteRequest', ErrorMessages.serviceRequest.delete, showToast)
  });

  // Products
  const addProductMutation = useMutation({
    mutationFn: async (p: Product) => {
      const dbData = mapProductToDB(p);
      const { data, error } = await supabase.from('products').insert(dbData).select().single();
      if (error) throw error;
      return mapProductFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Product added successfully', 'success');
    },
    onError: createErrorHandler('addProduct', ErrorMessages.product.add, showToast)
  });

  const updateProductMutation = useMutation({
    mutationFn: async (p: Product) => {
      const dbData = mapProductToDB(p);
      const { error } = await supabase.from('products').update(dbData).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Product updated successfully', 'success');
    },
    onError: createErrorHandler('updateProduct', ErrorMessages.product.update, showToast)
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Product deleted', 'info');
    },
    onError: createErrorHandler('deleteProduct', ErrorMessages.product.delete, showToast)
  });

  // Employees
  const addEmployeeMutation = useMutation({
    mutationFn: async (e: Employee) => {
      const dbData = mapEmployeeToDB(e);
      const { data, error } = await supabase.from('employees').insert(dbData).select().single();
      if (error) throw error;
      return mapEmployeeFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      showToast('Employee added successfully', 'success');
    },
    onError: createErrorHandler('addEmployee', ErrorMessages.employee.add, showToast)
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (e: Employee) => {
      const dbData = mapEmployeeToDB(e);
      const { error } = await supabase.from('employees').update(dbData).eq('id', e.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      showToast('Employee updated successfully', 'success');
    },
    onError: createErrorHandler('updateEmployee', ErrorMessages.employee.update, showToast)
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      showToast('Employee deleted', 'info');
    },
    onError: createErrorHandler('deleteEmployee', ErrorMessages.employee.delete, showToast)
  });

  // Expenses
  const addExpenseMutation = useMutation({
    mutationFn: async (exp: Expense) => {
      const { id, ...rest } = exp;
      const dbData = {
        ...rest,
        last_edited_by: currentUser?.name,
        last_edited_at: new Date().toISOString(),
        created_by: currentUser?.name
      };
      const { data, error } = await supabase.from('expenses').insert(dbData).select().single();
      if (error) throw error;
      return { ...data, amount: Number(data.amount) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast('Expense added successfully', 'success');
    },
    onError: createErrorHandler('addExpense', ErrorMessages.expense.add, showToast)
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast('Expense deleted', 'info');
    },
    onError: createErrorHandler('deleteExpense', ErrorMessages.expense.delete, showToast)
  });

  return useMemo(() => ({
    addRequest: addRequestMutation.mutate,
    updateRequest: updateRequestMutation.mutate,
    deleteRequest: deleteRequestMutation.mutate,
    addProduct: addProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,
    addEmployee: addEmployeeMutation.mutate,
    updateEmployee: updateEmployeeMutation.mutate,
    deleteEmployee: deleteEmployeeMutation.mutate,
    addExpense: addExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
    // Expose loading states for UI feedback
    isLoading: {
      addRequest: addRequestMutation.isPending,
      updateRequest: updateRequestMutation.isPending,
      deleteRequest: deleteRequestMutation.isPending,
      addProduct: addProductMutation.isPending,
      updateProduct: updateProductMutation.isPending,
      deleteProduct: deleteProductMutation.isPending,
      addEmployee: addEmployeeMutation.isPending,
      updateEmployee: updateEmployeeMutation.isPending,
      deleteEmployee: deleteEmployeeMutation.isPending,
      addExpense: addExpenseMutation.isPending,
      deleteExpense: deleteExpenseMutation.isPending,
    },
  }), [
    addRequestMutation.mutate,
    updateRequestMutation.mutate,
    deleteRequestMutation.mutate,
    addProductMutation.mutate,
    updateProductMutation.mutate,
    deleteProductMutation.mutate,
    addEmployeeMutation.mutate,
    updateEmployeeMutation.mutate,
    deleteEmployeeMutation.mutate,
    addExpenseMutation.mutate,
    deleteExpenseMutation.mutate,
    addRequestMutation.isPending,
    updateRequestMutation.isPending,
    deleteRequestMutation.isPending,
    addProductMutation.isPending,
    updateProductMutation.isPending,
    deleteProductMutation.isPending,
    addEmployeeMutation.isPending,
    updateEmployeeMutation.isPending,
    deleteEmployeeMutation.isPending,
    addExpenseMutation.isPending,
    deleteExpenseMutation.isPending,
  ]);
};
