'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Settings, Bell, Palette, LogOut, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const navigation = [
        { name: 'Profile', href: '/settings', icon: User },
        // Appearance and Notifications will be sections in the main settings page or separate routes if complex
        // For now, let's keep them as sections on one page or query params, but distinct routes is cleaner for deep linking.
        // Let's stick to a simple sidebar that updates the view or links to sub-routes.
        // If simple, maybe just one page. But the plan said "Layout with sidebar". 
        // Let's make it a proper layout.
        { name: 'Appearance', href: '/settings/appearance', icon: Palette },
        { name: 'Notifications', href: '/settings/notifications', icon: Bell },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black">
            {/* Sidebar for Desktop */}
            <div className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <button
                        onClick={() => router.push('/chat')}
                        className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                        Settings
                    </h1>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-black border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/chat')}
                            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-500" />
                        </button>
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
                    </div>
                </div>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
