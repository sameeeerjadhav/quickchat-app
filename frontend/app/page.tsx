'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageSquare, Shield, Zap, Users, ArrowRight, CheckCircle,
  Menu, X, Globe, Smartphone, Play, Command, Hash, AtSign, Search,
  Star, Github, Twitter, Linkedin
} from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import HeroTypewriter from './components/HeroTypewriter';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Throttle function to limit execution rate
    const throttle = (func: Function, limit: number) => {
      let inThrottle: boolean;
      return function (this: any, ...args: any[]) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.getElementsByClassName("spotlight-card");
      Array.from(cards).forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
        (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
      });
    };

    // Throttle to 60fps (16ms) and use passive listener for better performance
    const throttledHandleMouseMove = throttle(handleMouseMove, 16);

    document.addEventListener("mousemove", throttledHandleMouseMove as EventListener, { passive: true });
    return () => document.removeEventListener("mousemove", throttledHandleMouseMove as EventListener);
  }, []);

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Instant Latency",
      description: "Optimized socket connections ensure message delivery in <50ms globally.",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "End-to-End Encrypted",
      description: "Your data is encrypted at rest and in transit using industry-standard AES-256.",
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Global Infrastructure",
      description: "Distributed edge nodes ensure reliability and uptime regardless of location.",
    },
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Native Performance",
      description: "Responsive design that feels like a native application on any device.",
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600/20 selection:text-blue-600">

      {/* Subtle Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 dark:opacity-20"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="QuickChat Logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-xl"
              />
              <span className="text-lg font-bold tracking-tight">
                QuickChat
              </span>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                Testimonials
              </Link>
              <div className="w-px h-4 bg-slate-200 dark:bg-zinc-900"></div>
              <ThemeToggle />
              <Link
                href="/login"
                className="text-sm font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-800 shadow-xl">
            <div className="p-4 space-y-4">
              <Link
                href="#features"
                className="block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#testimonials"
                className="block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </Link>
              <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-3">
                <Link
                  href="/login"
                  className="block w-full px-4 py-2 text-center text-sm font-medium text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 text-xs font-medium mb-8">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
            v2.0 is now live with improved UI & UX
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.1]">
            Connect with anyone, <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-500 via-white to-neutral-500 dark:from-neutral-500 dark:via-white dark:to-neutral-500 animate-gradient bg-[length:200%_auto] drop-shadow-sm font-extrabold tracking-tight">
              anywhere, instantly.
            </span>
          </h1>

          <HeroTypewriter />

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-black font-semibold rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 fill-current" />
              View Demo
            </Link>
          </div>
        </div>

        {/* Interface Preview */}
        <div className="mt-20 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            {/* App Header */}
            <div className="h-10 border-b border-slate-200 dark:border-zinc-800 flex items-center px-4 justify-between bg-slate-50 dark:bg-zinc-950/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-zinc-800"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-zinc-800"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-zinc-800"></div>
              </div>
              <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
                app.quickchat.com
              </div>
              <div className="w-10"></div>
            </div>

            <div className="flex h-[500px] sm:h-[600px]">
              {/* Sidebar */}
              <div className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black/30">
                <div className="p-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md shadow-sm">
                    <Search className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400">Search messages...</span>
                    <div className="ml-auto text-xs text-slate-400 border border-slate-200 dark:border-zinc-700 rounded px-1">⌘K</div>
                  </div>
                </div>
                <div className="flex-1 px-3 space-y-6 overflow-y-auto">
                  <div>
                    <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Direct Messages</div>
                    <div className="space-y-0.5">
                      {['Priya Sharma', 'Rahul Verma', 'Design Team', 'Engineering'].map((name, i) => (
                        <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-default ${i === 1 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}>
                          <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-green-500' : 'bg-slate-300 dark:bg-zinc-800'}`}></div>
                          <span className="text-sm font-medium">{name}</span>
                          {i === 1 && <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Channels</div>
                    <div className="space-y-0.5">
                      {['general', 'random', 'projects', 'announcements'].map((name, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-default">
                          <Hash className="h-3.5 w-3.5 opacity-50" />
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-zinc-900"></div>
                    <div className="text-sm">
                      <div className="font-medium text-slate-900 dark:text-white">Profile</div>
                      <div className="text-xs text-slate-500">Online</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col bg-white dark:bg-black">
                {/* Header */}
                <div className="h-14 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Rahul Verma</h3>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <Search className="h-4 w-4 hover:text-slate-600 dark:hover:text-slate-300" />
                    <Users className="h-4 w-4 hover:text-slate-600 dark:hover:text-slate-300" />
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-zinc-900 flex-shrink-0"></div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Priya Sharma</span>
                        <span className="text-xs text-slate-400">10:42 AM</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Hey Rahul, did you get a chance to review the Q3 performance reports?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">R</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Rahul Verma</span>
                        <span className="text-xs text-slate-400">10:45 AM</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Yes, I just finished going through them. The metrics look solid.
                      </p>
                      <div className="inline-flex items-center gap-3 p-3 mt-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded">
                          <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">Q3_Report_Final.pdf</div>
                          <div className="text-xs text-slate-500">2.4 MB</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 ml-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center my-4">
                    <span className="text-xs text-slate-400 bg-slate-50 dark:bg-zinc-950 px-2 py-1 rounded">Today</span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-zinc-900 flex-shrink-0"></div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Priya Sharma</span>
                        <span className="text-xs text-slate-400">2:15 PM</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        Perfect. Let's schedule a sync with the design team tomorrow to discuss the next steps.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Message #general..."
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-md py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Command className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex gap-3 text-slate-400">
                      <AtSign className="h-4 w-4 hover:text-slate-600 cursor-pointer" />
                      <Hash className="h-4 w-4 hover:text-slate-600 cursor-pointer" />
                    </div>
                    <span className="text-xs text-slate-400">Press <kbd className="font-mono bg-slate-100 dark:bg-zinc-900 px-1 rounded">Enter</kbd> to send</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Grid Features */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-black relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight text-slate-900 dark:text-white">
              Unfair <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Advantage.
              </span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Don't just build a chat app. Build a communication infrastructure that scales effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Instant Latency",
                description: "Optimized socket connections ensure message delivery in under 50ms globally.",
                gradient: "from-blue-500/10 to-blue-600/5"
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Secure by Design",
                description: "End-to-End AES-256 encryption. Your data is yours alone.",
                gradient: "from-purple-500/10 to-purple-600/5"
              },
              {
                icon: <Globe className="h-6 w-6" />,
                title: "Global Edge",
                description: "Distributed edge network ensures uniformity in speed across 35+ regions.",
                gradient: "from-emerald-500/10 to-emerald-600/5"
              },
              {
                icon: <Smartphone className="h-6 w-6" />,
                title: "Native Feel",
                description: "Fluid animations and gesture support. It feels distinctly native on any device.",
                gradient: "from-rose-500/10 to-rose-600/5"
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 overflow-hidden hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-300 spotlight-card"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-900 dark:text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infinite Marquee Testimonials */}
      <section id="testimonials" className="py-24 bg-white dark:bg-black border-y border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="mb-16 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Trusted by Engineering Teams</h2>
        </div>

        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap flex gap-8 py-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-8">
                {[
                  {
                    quote: "Latency is non-existent. It's wildly fast.",
                    author: "Sarah Chen",
                    role: "CTO, TechFlow",
                  },
                  {
                    quote: "Encryption setup was compliant in days, not weeks.",
                    author: "Michael Ross",
                    role: "Lead Eng, Vercel",
                  },
                  {
                    quote: "The interface is stunning. Productivity boosted.",
                    author: "Elena Rodriguez",
                    role: "PM, Stripe",
                  },
                  {
                    quote: "Cleanest socket implementation I've seen.",
                    author: "David Park",
                    role: "Senior Dev, Uber",
                  },
                  {
                    quote: "Finally, a chat starter kit that doesn't look cheap.",
                    author: "James Wilson",
                    role: "Founder, StartupX",
                  }
                ].map((testimonial, idx) => (
                  <div key={idx} className="inline-block w-[350px] p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors whitespace-normal">
                    <p className="text-slate-700 dark:text-slate-300 mb-4 font-medium leading-relaxed">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800"></div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{testimonial.author}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bold Footer with Watermark */}
      <footer className="bg-slate-50 dark:bg-black pt-24 pb-12 overflow-hidden relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white dark:text-black" />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">QuickChat</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
                High-performance messaging infrastructure for the modern web. Built for speed, designed for scale.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Product</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Community</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">GitHub</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              &copy; 2026 QuickChat Inc. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Twitter className="h-5 w-5" /></Link>
              <Link href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Github className="h-5 w-5" /></Link>
              <Link href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>

        {/* Massive Watermark */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 pointer-events-none select-none overflow-hidden w-full flex justify-center">
          <h1 className="text-[12rem] sm:text-[20rem] font-black text-slate-200/50 dark:text-slate-800/30 tracking-tighter whitespace-nowrap">
            QUICKCHAT
          </h1>
        </div>
      </footer>
    </div>
  );
}
