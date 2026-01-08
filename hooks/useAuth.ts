import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { User } from '../types';

interface UseAuthReturn {
    currentUser: User | null;
    isAuthLoading: boolean;
    handleLogin: () => Promise<void>;
    handleLogout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
    const queryClient = useQueryClient();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    /**
     * Get employee details from database.
     */
    const getEmployeeDetails = useCallback(async (email: string | null | undefined) => {
        if (!email) return null;

        const { data: employee } = await supabase
            .from('employees')
            .select('id, role, phone, address_line1, address_line2, city, state, pincode')
            .eq('email', email)
            .single();

        return employee;
    }, []);

    // Create user object from Supabase session
    const createUserFromSession = useCallback(async (session: { user: { email?: string | null; user_metadata: { full_name?: string; avatar_url?: string } } }) => {
        const employee = await getEmployeeDetails(session.user.email);

        return {
            name: session.user.user_metadata.full_name || 'User',
            email: session.user.email || '',
            photoURL: session.user.user_metadata.avatar_url,
            isGuest: false,
            role: (employee?.role as 'admin' | 'staff') ?? 'staff',
            employeeId: employee?.id,
            phone: employee?.phone,
            addressLine1: employee?.address_line1,
            addressLine2: employee?.address_line2,
            city: employee?.city,
            state: employee?.state,
            pincode: employee?.pincode,
        };
    }, [getEmployeeDetails]);

    // Initialize auth state
    useEffect(() => {
        // Check active session from localStorage/cookies
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const user = await createUserFromSession(session);
                setCurrentUser(user);
            }
            setIsAuthLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const user = await createUserFromSession(session);
                setCurrentUser(user);
                setIsAuthLoading(false);
            } else if (!currentUser?.isGuest) {
                setCurrentUser(null);
                setIsAuthLoading(false);
                queryClient.clear();
            }
        });

        return () => subscription.unsubscribe();
    }, [createUserFromSession, currentUser?.isGuest, queryClient]);

    // Login handler
    const handleLogin = useCallback(async () => {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
        if (error) {
            // Re-throw with better context - will be caught by ErrorBoundary or caller
            throw new Error(`Login failed: ${error.message}`);
        }
    }, []);

    // Logout handler
    const handleLogout = useCallback(async () => {
        if (currentUser?.isGuest) {
            setCurrentUser(null);
        } else {
            await supabase.auth.signOut();
        }
        queryClient.clear();
    }, [currentUser?.isGuest, queryClient]);

    return {
        currentUser,
        isAuthLoading,
        handleLogin,
        handleLogout
    };
};
