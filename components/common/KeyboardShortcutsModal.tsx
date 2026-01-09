import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts = [
    { key: '1', description: 'Go to Home' },
    { key: '2', description: 'Go to Dashboard' },
    { key: '3', description: 'Go to Service Requests' },
    { key: '4', description: 'Go to Inventory' },
    { key: '5', description: 'Go to Employees' },
    { key: '6', description: 'Go to Expenses' },
    { key: 'N', description: 'New item (context-aware)' },
    { key: 'Esc', description: 'Close sidebar / Cancel' },
    { key: '?', description: 'Show this help' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-slate-200 dark:border-neutral-800 w-full max-w-md mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Keyboard size={20} className="text-blue-600" />
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="px-6 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                    {shortcuts.map(({ key, description }) => (
                        <div key={key} className="flex items-center justify-between py-2">
                            <span className="text-slate-600 dark:text-neutral-400">{description}</span>
                            <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-sm font-mono text-slate-700 dark:text-neutral-300 shadow-sm">
                                {key}
                            </kbd>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-neutral-800/50 border-t border-slate-200 dark:border-neutral-800">
                    <p className="text-xs text-slate-500 dark:text-neutral-500 text-center">
                        Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-neutral-700 rounded text-xs font-mono">?</kbd> anytime to show this help
                    </p>
                </div>
            </div>
        </div>
    );
};
