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
     * Get employee role from database.
     * Note: Employee record is created automatically by the DB trigger 
     * `on_auth_user_created` when a new user signs up. This function
     * only fetches the existing role - no duplicate creation logic.
     */
    const getEmployeeRole = useCallback(async (email: string | null | undefined): Promise<'admin' | 'staff'> => {
        if (!email) return 'staff';

        const { data: employee } = await supabase
            .from('employees')
            .select('role')
            .eq('email', email)
            .single();

        return (employee?.role as 'admin' | 'staff') ?? 'staff';
    }, []);

    // Create user object from Supabase session
    const createUserFromSession = useCallback(async (session: { user: { email?: string | null; user_metadata: { full_name?: string; avatar_url?: string } } }) => {
        const role = await getEmployeeRole(session.user.email);
        return {
            name: session.user.user_metadata.full_name || 'User',
            email: session.user.email || '',
            photoURL: session.user.user_metadata.avatar_url,
            isGuest: false,
            role
        };
    }, [getEmployeeRole]);

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
