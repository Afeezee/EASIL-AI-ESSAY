

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    Home,
    Upload,
    FileQuestion,
    BarChart3,
    HelpCircle,
    Menu,
    X,
    ClipboardList,
    LogIn,
    LogOut,
    ExternalLink,
    Heart,
    Code2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
    { title: "Home", url: createPageUrl("Home"), icon: Home },
    { title: "Create Assessment", url: createPageUrl("InstructorUpload"), icon: Upload },
    { title: "Take Assessment", url: createPageUrl("QuizTake"), icon: FileQuestion },
    { title: "Review", url: createPageUrl("Review"), icon: BarChart3 },
    { title: "Analytics", url: createPageUrl("AssessmentAnalytics"), icon: ClipboardList },
    { title: "Help", url: createPageUrl("Help"), icon: HelpCircle }
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-violet-50">
            {/* Header */}
            <header className="glass border-b border-white/20 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-purple-300/50 transition-shadow duration-300 flex-shrink-0">
                                <img
                                    src="/easil-logo.png"
                                    alt="EASIL"
                                    className="w-full h-full object-cover object-center scale-[1.6]"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gradient">EASIL</h1>
                                <p className="text-[10px] text-slate-500 -mt-1 tracking-wide uppercase font-medium">AI Assessment Platform</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navigationItems.map((item) => (
                                <Link
                                    key={item.title}
                                    to={item.url}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                                        location.pathname === item.url
                                            ? "bg-purple-100 text-purple-700 shadow-sm shadow-purple-200/50"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                                    }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span className="font-medium text-sm">{item.title}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* Auth control (desktop) */}
                        <div className="hidden md:flex items-center gap-3 ml-2">
                            {user ? (
                                <>
                                    <span className="text-sm text-slate-600 max-w-[160px] truncate" title={user.email}>
                                        {user.full_name || user.email}
                                    </span>
                                    <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <Link to={createPageUrl("Login")}>
                                    <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300">
                                        <LogIn className="w-4 h-4" />
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/50 animate-fade-in-up">
                        <nav className="px-4 py-3 space-y-1">
                            {navigationItems.map((item) => (
                                <Link
                                    key={item.title}
                                    to={item.url}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                        location.pathname === item.url
                                            ? "bg-purple-100 text-purple-700"
                                            : "text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.title}</span>
                                </Link>
                            ))}

                            {/* Auth control (mobile) */}
                            <div className="pt-2 mt-2 border-t border-slate-200">
                                {user ? (
                                    <button
                                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span className="font-medium">Logout ({user.full_name || user.email})</span>
                                    </button>
                                ) : (
                                    <Link
                                        to={createPageUrl("Login")}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-purple-700 hover:bg-purple-50"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        <span className="font-medium">Sign In</span>
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Enhanced Footer */}
            <footer className="relative bg-gradient-to-b from-white via-white to-purple-50/50 border-t border-slate-200/50 mt-16 overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col items-center gap-6">
                        {/* Footer Logo */}
                        <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md group-hover:shadow-purple-300/50 transition-shadow duration-300">
                                <img
                                    src="/easil-logo.png"
                                    alt="EASIL"
                                    className="w-full h-full object-cover object-center scale-[1.6]"
                                />
                            </div>
                            <span className="text-lg font-bold text-gradient">EASIL</span>
                        </Link>

                        {/* Tagline */}
                        <p className="text-sm text-slate-500 text-center max-w-md">
                            Transforming educational assessment with AI-powered question generation, automated grading, and comprehensive analytics.
                        </p>

                        {/* Divider */}
                        <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent" />

                        {/* Credit Badge */}
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                Made with <Heart className="w-3 h-3 text-red-400 fill-red-400 inline-block" /> by
                            </p>
                            <a
                                href="https://cereustechnologies.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="credit-badge group"
                            >
                                <Code2 className="w-4 h-4 text-purple-500" />
                                <span className="font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                    Cereus Technologies
                                </span>
                                <ExternalLink className="w-3 h-3 text-purple-400 group-hover:text-purple-600 transition-colors" />
                            </a>
                        </div>

                        {/* Copyright */}
                        <p className="text-xs text-slate-400">
                            © {new Date().getFullYear()} EASIL. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

