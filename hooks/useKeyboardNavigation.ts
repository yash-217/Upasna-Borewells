import { useEffect, useCallback } from 'react';
import { View } from '../types';

interface UseKeyboardNavigationProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    setSidebarOpen: (open: boolean) => void;
    isSidebarOpen: boolean;
    onShowHelp?: () => void;
}

export const useKeyboardNavigation = ({
    currentView,
    setCurrentView,
    setSidebarOpen,
    isSidebarOpen,
    onShowHelp,
}: UseKeyboardNavigationProps) => {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in input fields
        const target = event.target as HTMLElement;
        const isTyping =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable;

        if (isTyping) return;

        // Don't trigger if modifier keys are pressed (except for ?)
        if (event.ctrlKey || event.altKey || event.metaKey) return;

        switch (event.key) {
            // View navigation (1-6)
            case '1':
                setCurrentView(View.HOME);
                break;
            case '2':
                setCurrentView(View.DASHBOARD);
                break;
            case '3':
                setCurrentView(View.REQUESTS);
                break;
            case '4':
                setCurrentView(View.INVENTORY);
                break;
            case '5':
                setCurrentView(View.EMPLOYEES);
                break;
            case '6':
                setCurrentView(View.EXPENSES);
                break;

            // New item (context-aware)
            case 'n':
            case 'N':
                if (currentView === View.REQUESTS) {
                    setCurrentView(View.NEW_REQUEST);
                } else if (currentView === View.EXPENSES) {
                    setCurrentView(View.NEW_EXPENSE);
                }
                break;

            // Escape - close sidebar
            case 'Escape':
                if (isSidebarOpen) {
                    setSidebarOpen(false);
                }
                break;

            // Show help
            case '?':
                event.preventDefault();
                onShowHelp?.();
                break;

            default:
                break;
        }
    }, [currentView, setCurrentView, setSidebarOpen, isSidebarOpen, onShowHelp]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};
