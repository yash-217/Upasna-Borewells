import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

// Types
interface ToastState {
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
}

interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

interface AppContextValue {
    // Toast
    toast: ToastState;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    hideToast: () => void;

    // Confirmation Modal
    confirmState: ConfirmState;
    triggerConfirm: (title: string, message: string, action: () => void) => void;
    closeConfirm: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    // Toast State
    const [toast, setToast] = useState<ToastState>({
        message: '',
        type: 'info',
        isVisible: false
    });
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Confirmation Modal State
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Toast Helpers
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ message, type, isVisible: true });
        toastTimeoutRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, isVisible: false }));
    };

    // Confirmation Helpers
    const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

    const triggerConfirm = (title: string, message: string, action: () => void) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                action();
                closeConfirm();
            }
        });
    };

    const value: AppContextValue = {
        toast,
        showToast,
        hideToast,
        confirmState,
        triggerConfirm,
        closeConfirm,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
