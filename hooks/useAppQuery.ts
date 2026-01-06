import { useQuery } from '@tanstack/react-query';
import { supabase, mapRequestFromDB, mapProductFromDB, mapEmployeeFromDB, mapVehicleFromDB } from '../services/supabase';
import { User, Expense } from '../types';
import { DBExpense } from '../types/database';

export const useAppQuery = (currentUser: User | null) => {
  const {
    data: requests = [],
    isLoading: isRequestsLoading,
    error: requestsError
  } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_requests').select('*').order('date', { ascending: false });
      if (error) throw new Error(`Failed to load service requests: ${error.message}`);
      return data.map(mapRequestFromDB);
    },
    enabled: !!currentUser,
  });

  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw new Error(`Failed to load products: ${error.message}`);
      return data.map(mapProductFromDB);
    },
    enabled: !!currentUser,
  });

  const {
    data: employees = [],
    isLoading: isEmployeesLoading,
    error: employeesError
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw new Error(`Failed to load employees: ${error.message}`);
      return data.map(mapEmployeeFromDB);
    },
    enabled: !!currentUser,
  });

  const {
    data: expenses = [],
    isLoading: isExpensesLoading,
    error: expensesError
  } = useQuery({
    queryKey: ['expenses'],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw new Error(`Failed to load expenses: ${error.message}`);
      return data.map((e: DBExpense) => ({
        ...e,
        amount: Number(e.amount),
        description: e.description ?? undefined,
        vehicle: e.vehicle ?? undefined,
        lastEditedBy: e.last_edited_by ?? undefined,
        lastEditedAt: e.last_edited_at ?? undefined,
        createdBy: e.created_by ?? undefined
      }));
    },
    enabled: !!currentUser,
  });

  const {
    data: vehicles = [],
    isLoading: isVehiclesLoading,
    error: vehiclesError
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').order('name');
      if (error) throw new Error(`Failed to load vehicles: ${error.message}`);
      return data.map(mapVehicleFromDB);
    },
    enabled: !!currentUser,
  });

  // Aggregate errors for UI display
  const errors = [requestsError, productsError, employeesError, expensesError, vehiclesError].filter(Boolean);

  return {
    requests,
    products,
    employees,
    expenses,
    vehicles,
    isLoading: isRequestsLoading || isProductsLoading || isEmployeesLoading || isExpensesLoading || isVehiclesLoading,
    isError: errors.length > 0,
    errors: errors.map(e => e?.message || 'Unknown error'),
  };
};
