'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Users, Settings } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import { useEffect, useState } from 'react';

export default function MobileNav() {
    const pathname = usePathname();
    // We need to wait for mount to avoid hydration mismatch with useMediaQuery
    const [mounted, setMounted] = useState(false);
    const isMobile = useMediaQuery({ maxWidth: 768 });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only show on mobile and if mounted
    if (!mounted || !isMobile) return null;

    // Don't show on auth pages
    if (pathname.includes('/login') || pathname.includes('/register')) return null;

    // Don't show inside active chat (on mobile, chat takes full screen)
    // But we might want it on the chat list page. 
    // /chat -> Chat List (Show Nav)
    // /chat/[id] -> Specific Chat (Hide Nav to maximize space)
    const isChatDetails = pathname.startsWith('/chat/') && pathname !== '/chat';

    if (isChatDetails) return null;

    const navItems = [
        { name: 'Chats', href: '/chat', icon: MessageSquare },
        { name: 'Friends', href: '/friends', icon: Users },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                                }`}
                        >
                            <item.icon className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
