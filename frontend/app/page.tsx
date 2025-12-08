'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, Shield, Zap, Users, ArrowRight, CheckCircle, 
  Menu, X, Sparkles, Globe, Lock, Smartphone, Clock, Send,
  ChevronRight, Star, TrendingUp, Heart
} from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Real-time messaging with sub-second latency",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Bank-level Security",
      description: "End-to-end encryption for all your conversations",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Access",
      description: "Connect with anyone, anywhere in the world",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Cross-platform",
      description: "Seamless experience across all devices",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-100 dark:bg-purple-900/20"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "24/7 Availability",
      description: "Always online, always connected",
      color: "from-indigo-500 to-violet-500",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20"
    },
    {
      icon: <Send className="h-6 w-6" />,
      title: "Instant Delivery",
      description: "Messages delivered instantly, no delays",
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-pink-300 dark:bg-pink-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur"></div>
              <MessageSquare className="relative h-8 w-8 sm:h-10 sm:w-10 text-white p-1.5 sm:p-2 rounded-xl" />
            </div>
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              QuickChat
            </span>
            <div className="hidden sm:flex items-center px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium">
              <Sparkles className="h-3 w-3 mr-1" />
              FREE
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-6">
              <Link href="#features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                Features
              </Link>
              <Link href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                Testimonials
              </Link>
            </div>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
            <ThemeToggle />
            <Link 
              href="/login" 
              className="px-5 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link 
              href="/register"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 space-y-3 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4">
            <div className="space-y-3">
              <Link 
                href="#features" 
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#testimonials" 
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </Link>
            </div>
            <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex flex-col space-y-2 pt-2">
              <Link 
                href="/login" 
                className="block px-4 py-2 text-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                href="/register"
                className="block px-4 py-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium mb-6 sm:mb-8">
              <Sparkles className="h-4 w-4 mr-2" />
              Join our growing community
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8">
              <span className="block text-gray-900 dark:text-white">Chat. Connect.</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Collaborate in Real-time
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 sm:mb-12 px-4">
              Experience the future of communication with lightning-fast messaging, 
              seamless collaboration, and enterprise-grade security.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16">
              <Link 
                href="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center justify-center text-base sm:text-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="#features"
                className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:shadow-lg"
              >
                Explore Features
              </Link>
            </div>

            {/* Stats - UPDATED */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-16 sm:mb-24">
              {[
                { label: "Active Users", value: "10+", icon: <Users className="h-5 w-5" /> },
                { label: "Messages Daily", value: "1000+", icon: <Send className="h-5 w-5" /> },
                { label: "Uptime", value: "99.9%", icon: <TrendingUp className="h-5 w-5" /> },
                { label: "Rating", value: "4.9/5", icon: <Star className="h-5 w-5" /> }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - SIMPLIFIED */}
      {/* <section id="features" className="relative py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Seamless Communication
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Powerful features designed for modern conversations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-transparent transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl from-blue-500 to-purple-500"></div>
                <div className="relative">
                  <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4`}>
                    <div className={`bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Demo Preview */}
      <section className="relative py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl sm:rounded-4xl p-6 sm:p-8 lg:p-12 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
              <div className="lg:w-1/2">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                  See QuickChat in Action
                </h3>
                <p className="text-gray-300 mb-6">
                  Experience real-time messaging, file sharing, and collaboration features 
                  that make communication effortless and enjoyable.
                </p>
                <ul className="space-y-3 mb-8">
                  {['Real-time messaging', 'File sharing', 'Friends system', 'Online status', 'Theme toggle'].map((item, idx) => (
                    <li key={idx} className="flex items-center text-gray-300">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/register"
                  className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Try It Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <div className="lg:w-1/2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-30"></div>
                  <div className="relative bg-gray-800 rounded-2xl p-2 border border-gray-700">
                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-t-xl">
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="text-sm text-gray-400">quickchat-app-woad.vercel.app</div>
                    </div>
                    <div className="p-6 bg-gray-900 rounded-b-xl">
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-br-none max-w-xs">
                            Hey! Ready for our chat? 🎯
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-gray-700 text-white p-3 rounded-2xl rounded-bl-none max-w-xs">
                            Yes! Just finished setting up my profile 📊
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-br-none max-w-xs">
                            Perfect! Let's connect 🚀
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 sm:p-12 lg:p-16 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Start Chatting?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join our community and experience modern communication
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/register"
                  className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-2xl hover:shadow-3xl flex items-center justify-center"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <p className="text-blue-100/80 text-sm mt-6">
                No credit card required • Free forever for basic features
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 sm:py-12 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">QuickChat</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mb-6 md:mb-0">
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Contact
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} QuickChat. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}