'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function AppearancePage() {
    const { theme, setTheme } = useTheme();
    // We need to wait for mount to avoid hydration mismatch
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Appearance</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Customize the look and feel of the app.</p>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                </div>
            </div>
        );
    }

    const themes = [
        { id: 'light', name: 'Light', icon: Sun },
        { id: 'dark', name: 'Dark', icon: Moon },
        { id: 'system', name: 'System', icon: Monitor },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Appearance</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Customize the look and feel of the app.</p>
            </div>

            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm p-6 sm:p-8">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Theme Preference</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {themes.map((t) => {
                        const Icon = t.icon;
                        const isActive = theme === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${isActive
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-black'
                                    }`}
                            >
                                <div className={`p-3 rounded-full mb-3 ${isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className={`font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {t.name}
                                </span>
                                {isActive && (
                                    <div className="mt-2 text-blue-600">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        You are currently using the <span className="font-semibold text-slate-900 dark:text-white capitalize">{theme}</span> theme.
                        {theme === 'system' && ' We will adjust automatically based on your device settings.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
