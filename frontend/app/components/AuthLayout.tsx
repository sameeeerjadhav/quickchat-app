'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const pathname = usePathname();
    const isLogin = pathname === '/login';

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-black transition-colors duration-300">
            {/* Left Side - Form Area */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-16 justify-between relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                    <ThemeToggle />
                </div>

                {/* Main Content */}
                <div className="max-w-md w-full mx-auto py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <Image
                                src="/logo.png"
                                alt="QuickChat Logo"
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-xl"
                            />
                            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">QuickChat</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                            {title}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
                            {subtitle}
                        </p>

                        {children}
                    </motion.div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                    {isLogin ? (
                        <>
                            Don't have an account?{' '}
                            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                                Sign up for free
                            </Link>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                                Sign in
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Right Side - Visual Area */}
            <div className="hidden lg:flex w-1/2 bg-slate-50 dark:bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                {/* Background Gradients */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                </div>

                {/* Abstract Glass Card Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-lg aspect-square"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-3xl blur-2xl transform rotate-6 scale-95 opacity-50 dark:opacity-40"></div>
                    <div className="relative h-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col justify-between overflow-hidden ring-1 ring-white/20 dark:ring-white/5">
                        <div className="space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/50 dark:bg-slate-900/50 flex items-center justify-center shadow-lg p-2">
                                <Image
                                    src="/logo.png"
                                    alt="QuickChat Logo"
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-contain rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-2/3 bg-slate-900/10 dark:bg-white/10 rounded-full"></div>
                                <div className="h-4 w-1/2 bg-slate-900/10 dark:bg-white/10 rounded-full"></div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5 backdrop-blur-sm self-end max-w-[80%] rounded-tr-none">
                                <p className="text-sm text-slate-700 dark:text-slate-300">Deployment successful! 🚀</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-600 text-white self-start max-w-[80%] rounded-tl-none shadow-lg shadow-blue-600/20">
                                <p className="text-sm">That was incredibly fast. The new latency updates are amazing.</p>
                            </div>
                        </div>

                        <div className="mt-auto pt-8">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 z-${10 - i} flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400`}>
                                        {i === 4 ? '+2k' : ''}
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                                Join 2,000+ developers shipping faster.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
