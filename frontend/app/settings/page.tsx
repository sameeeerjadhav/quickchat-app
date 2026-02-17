'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Save, User as UserIcon, Mail, Upload, X } from 'lucide-react';
import { User } from '../../types';
import { userAPI, authAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        avatar: ''
    });
    const [avatarPreview, setAvatarPreview] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await authAPI.getProfile();
            setUser(response.data);
            setFormData({
                name: response.data.name || '',
                bio: response.data.bio || '',
                avatar: response.data.avatar || ''
            });
            setAvatarPreview(response.data.avatar || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be smaller than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            // For now, we'll use a base64 string since we don't have a backend endpoint yet
            // In a real app, you'd upload to your backend or cloud storage
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            setFormData(prev => ({ ...prev, avatar: base64 }));
            toast.success('Avatar updated! Click "Save Changes" to confirm.');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Failed to upload avatar');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarPreview('');
        setFormData(prev => ({ ...prev, avatar: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await userAPI.updateProfile(formData);
            toast.success('Profile updated successfully!');
            // Refresh profile
            await fetchProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your public profile information.</p>
            </div>

            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="p-6 sm:p-8 space-y-8">

                    {/* Avatar Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-900 shadow-lg">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="h-12 w-12 text-slate-400" />
                                )}
                            </div>
                            {uploadingAvatar && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                disabled={uploadingAvatar}
                                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Change Avatar"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                            {avatarPreview && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    className="absolute top-0 right-0 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                    title="Remove Avatar"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Profile Photo</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Click the camera icon to upload a new photo.
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                JPG, PNG or GIF. Max size 5MB.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                                    placeholder="Your Name"
                                />
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Bio
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    rows={3}
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all resize-none"
                                    placeholder="Tell us a little about yourself..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
