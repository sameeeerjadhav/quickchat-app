'use client';

import { useState } from 'react';
import { Bell, MessageSquare, UserPlus, Shield, Volume2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationsPage() {
    const { preferences, updatePreferences, requestBrowserPermission } = useNotifications();
    const [isRequesting, setIsRequesting] = useState(false);

    const toggle = async (key: keyof typeof preferences) => {
        // Special handling for browser notifications
        if (key === 'browserNotifications' && !preferences.browserNotifications) {
            setIsRequesting(true);
            const granted = await requestBrowserPermission();
            setIsRequesting(false);

            if (granted) {
                updatePreferences({ [key]: true });
                toast.success('Browser notifications enabled!');
            } else {
                toast.error('Browser notification permission denied');
            }
            return;
        }

        updatePreferences({ [key]: !preferences[key] });
        toast.success(`Preference updated`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage how you receive alerts.</p>
            </div>

            <div className="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-200 dark:divide-slate-800">

                {/* Messages */}
                <div className="p-6 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg h-fit">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-slate-900 dark:text-white">Direct Messages</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Receive notifications when you get a new message.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => toggle('messages')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${preferences.messages ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.messages ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

                {/* Friend Requests */}
                <div className="p-6 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg h-fit">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-slate-900 dark:text-white">Friend Requests</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get alerted when someone sends you a friend request.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => toggle('friendRequests')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${preferences.friendRequests ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.friendRequests ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

                {/* Security */}
                <div className="p-6 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg h-fit">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-slate-900 dark:text-white">Security Alerts</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Receive alerts about login attempts and password changes.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => toggle('security')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${preferences.security ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.security ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

                {/* Sound Notifications */}
                <div className="p-6 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg h-fit">
                            <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-slate-900 dark:text-white">Sound Notifications</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Play a sound when you receive a notification.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => toggle('soundNotifications')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${preferences.soundNotifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.soundNotifications ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

                {/* Browser Notifications */}
                <div className="p-6 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg h-fit">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-slate-900 dark:text-white">Browser Notifications</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Show desktop notifications even when the app isn't open.
                                {typeof window !== 'undefined' && Notification.permission === 'denied' && (
                                    <span className="block text-red-500 text-xs mt-1">
                                        Permission denied. Enable in browser settings.
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => toggle('browserNotifications')}
                        disabled={isRequesting || (typeof window !== 'undefined' && Notification.permission === 'denied')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${preferences.browserNotifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.browserNotifications ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                    <strong>Note:</strong> Notification preferences are saved locally. Your settings will persist across sessions.
                </p>
            </div>
        </div>
    );
}
