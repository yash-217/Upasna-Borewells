import { useQuery } from '@tanstack/react-query';
import { supabase, mapRequestFromDB, mapProductFromDB, mapEmployeeFromDB, mapVehicleFromDB } from '../services/supabase';
import { User } from '../types';

export const useAppQuery = (currentUser: User | null) => {
  const { data: requests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_requests').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data.map(mapRequestFromDB);
    },
    enabled: !!currentUser,
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data.map(mapProductFromDB);
    },
    enabled: !!currentUser,
  });

  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw error;
      return data.map(mapEmployeeFromDB);
    },
    enabled: !!currentUser,
  });

  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data.map((e: any) => ({ ...e, amount: Number(e.amount) }));
    },
    enabled: !!currentUser,
  });

  const { data: vehicles = [], isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').order('name');
      if (error) throw error;
      return data.map(mapVehicleFromDB);
    },
    enabled: !!currentUser,
  });

  return {
    requests,
    products,
    employees,
    expenses,
    vehicles,
    isLoading: isRequestsLoading || isProductsLoading || isEmployeesLoading || isExpensesLoading || isVehiclesLoading
  };
};
