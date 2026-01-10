import React, { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Sun, LogOut, Pencil, Check, X, Lock, Eye, EyeOff } from 'lucide-react';
import { User, View } from '../../types';
import { formatPhoneNumberInput } from '../../lib/formatters';
import { supabase } from '../../services/supabase';

interface ProfileProps {
    currentUser: User;
    darkMode: boolean;
    toggleDarkMode: () => void;
    handleLogout: () => void;
    setCurrentView: (view: View) => void;
    onUpdateProfile: (updates: Partial<User>) => Promise<void>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Profile: React.FC<ProfileProps> = ({
    currentUser,
    darkMode,
    toggleDarkMode,
    handleLogout,
    setCurrentView,
    onUpdateProfile,
    showToast
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        addressLine1: currentUser.addressLine1 || '',
        addressLine2: currentUser.addressLine2 || '',
        city: currentUser.city || '',
        state: currentUser.state || '',
        pincode: currentUser.pincode || ''
    });

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isGoogleUser, setIsGoogleUser] = useState(false);

    // Check if user is signed in with Google
    useEffect(() => {
        const checkAuthProvider = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.app_metadata?.provider === 'google') {
                setIsGoogleUser(true);
            }
        };
        checkAuthProvider();
    }, []);

    // Track if there are unsaved changes
    const hasChanges =
        formData.name !== (currentUser.name || '') ||
        formData.phone !== (currentUser.phone || '') ||
        formData.addressLine1 !== (currentUser.addressLine1 || '') ||
        formData.addressLine2 !== (currentUser.addressLine2 || '') ||
        formData.city !== (currentUser.city || '') ||
        formData.state !== (currentUser.state || '') ||
        formData.pincode !== (currentUser.pincode || '');

    useEffect(() => {
        setFormData({
            name: currentUser.name || '',
            phone: currentUser.phone || '',
            addressLine1: currentUser.addressLine1 || '',
            addressLine2: currentUser.addressLine2 || '',
            city: currentUser.city || '',
            state: currentUser.state || '',
            pincode: currentUser.pincode || ''
        });
    }, [currentUser]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast('Name is required', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await onUpdateProfile({
                name: formData.name.trim(),
                phone: formData.phone.trim() || undefined,
                addressLine1: formData.addressLine1.trim() || undefined,
                addressLine2: formData.addressLine2.trim() || undefined,
                city: formData.city.trim() || undefined,
                state: formData.state.trim() || undefined,
                pincode: formData.pincode.trim() || undefined
            });
            setIsEditing(false);
            showToast('Profile updated successfully', 'success');
        } catch {
            showToast('Failed to update profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: currentUser.name || '',
            phone: currentUser.phone || '',
            addressLine1: currentUser.addressLine1 || '',
            addressLine2: currentUser.addressLine2 || '',
            city: currentUser.city || '',
            state: currentUser.state || '',
            pincode: currentUser.pincode || ''
        });
        setIsEditing(false);
    };

    const handleChangePassword = async () => {
        if (!passwordData.newPassword || !passwordData.confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setIsChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) {
                throw error;
            }

            // Close modal and reset state immediately before showing toast
            setShowPasswordModal(false);
            setPasswordData({ newPassword: '', confirmPassword: '' });
            setIsChangingPassword(false);

            // Show success message after state is cleared
            showToast('Password changed successfully!', 'success');
        } catch (error: unknown) {
            setIsChangingPassword(false);
            const message = error instanceof Error ? error.message : 'Failed to change password';
            showToast(message, 'error');
        }
    };

    const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const labelClass = "text-sm font-medium text-slate-600 dark:text-neutral-400 mb-1.5";

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black">


            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Profile Photo & Basic Info */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-slate-200 dark:border-neutral-800 relative">
                    {/* Floating Buttons */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                        <button
                            onClick={() => setCurrentView(View.HOME)}
                            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !hasChanges}
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check size={20} />
                                    )}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                            >
                                <Pencil size={20} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col items-center text-center mt-4">
                        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden border-4 border-white dark:border-neutral-700 shadow-lg mb-4">
                            {currentUser.photoURL ? (
                                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-500 dark:text-neutral-400">
                                    {currentUser.name[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="text-xl font-bold text-center bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Your name"
                            />
                        ) : (
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{currentUser.name}</h1>
                        )}

                        <p className="text-slate-500 dark:text-neutral-500 mt-1">{currentUser.email}</p>

                        {currentUser.role && (
                            <span className={`mt-3 px-3 py-1 text-xs font-semibold rounded-full ${currentUser.role === 'admin'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                                }`}>
                                {currentUser.role === 'admin' ? 'Administrator' : 'Staff'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Contact Details */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-slate-200 dark:border-neutral-800">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Contact Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Phone Number</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumberInput(e.target.value) })}
                                    className={inputClass}
                                    placeholder="+91 12345 67890"
                                />
                            ) : (
                                <p className="text-slate-800 dark:text-white py-2">
                                    {currentUser.phone || <span className="text-slate-400 dark:text-neutral-600">Not provided</span>}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-slate-200 dark:border-neutral-800">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Address</h2>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Address Line 1</label>
                                <input
                                    type="text"
                                    value={formData.addressLine1}
                                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                    className={inputClass}
                                    placeholder="Building, Street"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Address Line 2</label>
                                <input
                                    type="text"
                                    value={formData.addressLine2}
                                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                    className={inputClass}
                                    placeholder="Area, Landmark"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className={inputClass}
                                        placeholder="City"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>State</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className={inputClass}
                                        placeholder="State"
                                    />
                                </div>
                            </div>
                            <div className="w-1/2">
                                <label className={labelClass}>Pincode</label>
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    className={inputClass}
                                    placeholder="123456"
                                    maxLength={6}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-800 dark:text-white">
                            {currentUser.addressLine1 || currentUser.city ? (
                                <div className="space-y-1">
                                    {currentUser.addressLine1 && <p>{currentUser.addressLine1}</p>}
                                    {currentUser.addressLine2 && <p>{currentUser.addressLine2}</p>}
                                    <p>
                                        {[currentUser.city, currentUser.state].filter(Boolean).join(', ')}
                                        {currentUser.pincode && ` - ${currentUser.pincode}`}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-slate-400 dark:text-neutral-600">No address provided</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Settings */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white px-6 pt-6 pb-4">Settings</h2>

                    <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors border-t border-slate-100 dark:border-neutral-800"
                    >
                        <div className="flex items-center gap-3">
                            {darkMode ? <Moon size={20} className="text-blue-500" /> : <Sun size={20} className="text-amber-500" />}
                            <span className="text-slate-700 dark:text-neutral-300">
                                {darkMode ? 'Dark Mode' : 'Light Mode'}
                            </span>
                        </div>
                        <div className={`w-12 h-7 rounded-full p-1 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-neutral-700'}`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    {/* Change Password Button - hidden for Google OAuth users */}
                    {!isGoogleUser && (
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors border-t border-slate-100 dark:border-neutral-800"
                        >
                            <div className="flex items-center gap-3">
                                <Lock size={20} className="text-slate-500 dark:text-slate-400" />
                                <span className="text-slate-700 dark:text-neutral-300">Change Password</span>
                            </div>
                            <span className="text-slate-400 dark:text-neutral-500">→</span>
                        </button>
                    )}
                </div>

                {/* Sign Out */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>

                {/* Version */}
                <p className="text-center text-xs text-slate-400 dark:text-neutral-600 pb-4">
                    v1.8.0 © 2024 Upasna Borewells
                </p>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-neutral-800 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Change Password</h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordData({ newPassword: '', confirmPassword: '' });
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className={labelClass}>New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className={inputClass}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className={inputClass}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Password must be at least 6 characters long.
                            </p>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-neutral-800 flex justify-end gap-3 bg-slate-50 dark:bg-neutral-900/50 rounded-b-2xl">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordData({ newPassword: '', confirmPassword: '' });
                                }}
                                className="px-4 py-2 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {isChangingPassword ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Lock size={16} />
                                )}
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
