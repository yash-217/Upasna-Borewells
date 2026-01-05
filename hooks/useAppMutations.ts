import { useMutation, QueryClient } from '@tanstack/react-query';
import { supabase, mapRequestToDB, mapRequestFromDB, mapProductToDB, mapProductFromDB, mapEmployeeToDB, mapEmployeeFromDB } from '../services/supabase';
import { ServiceRequest, Product, Employee, Expense, User } from '../types';

interface UseAppMutationsProps {
  queryClient: QueryClient;
  currentUser: User | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useAppMutations = ({ queryClient, currentUser, showToast }: UseAppMutationsProps) => {
  // Service Requests
  const addRequestMutation = useMutation({
    mutationFn: async (req: ServiceRequest) => {
      const dbData = mapRequestToDB({
        ...req,
        createdBy: currentUser?.name // Add createdBy
      });
      const { data, error } = await supabase.from('service_requests').insert(dbData).select().single();
      if (error) throw error;
      return mapRequestFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error) => {
      console.error("Error adding request:", error);
      showToast("Error adding request", "error");
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (updatedReq: ServiceRequest) => {
      const dbData = mapRequestToDB(updatedReq);
      const { error } = await supabase.from('service_requests').update(dbData).eq('id', updatedReq.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error) => {
      console.error("Error updating request:", error);
      showToast("Error updating request", "error");
    }
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error) => {
      console.error("Error deleting request:", error);
      showToast("Error deleting request", "error");
    }
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
    },
    onError: (error) => console.error("Error adding product:", error)
  });

  const updateProductMutation = useMutation({
    mutationFn: async (p: Product) => {
      const dbData = mapProductToDB(p);
      const { error } = await supabase.from('products').update(dbData).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => console.error("Error updating product:", error)
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => console.error("Error deleting product:", error)
  });

  // Employees
  const addEmployeeMutation = useMutation({
    mutationFn: async (e: Employee) => {
      const dbData = mapEmployeeToDB(e);
      const { data, error } = await supabase.from('employees').insert(dbData).select().single();
      if (error) throw error;
      return mapEmployeeFromDB(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error) => console.error("Error adding employee:", error)
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (e: Employee) => {
      const dbData = mapEmployeeToDB(e);
      const { error } = await supabase.from('employees').update(dbData).eq('id', e.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error) => console.error("Error updating employee:", error)
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    onError: (error) => console.error("Error deleting employee:", error)
  });

  // Expenses
  const addExpenseMutation = useMutation({
    mutationFn: async (exp: Expense) => {
      const { id, ...rest } = exp;
      const dbData = {
        ...rest,
        last_edited_by: currentUser?.name,
        last_edited_at: new Date().toISOString(),
        created_by: currentUser?.name // Add created_by
      };
      const { data, error } = await supabase.from('expenses').insert(dbData).select().single();
      if (error) throw error;
      return { ...data, amount: Number(data.amount) };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (error) => console.error("Error adding expense:", error)
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (error) => console.error("Error deleting expense:", error)
  });

  return {
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
  };
};
