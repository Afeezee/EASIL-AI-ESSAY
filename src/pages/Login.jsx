import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, LogIn, UserPlus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
    const navigate = useNavigate();
    const { login, register } = useAuth();
    const [mode, setMode] = useState("login"); // "login" | "register"
    const [form, setForm] = useState({ email: "", password: "", full_name: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isRegister = mode === "register";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (isRegister) {
                await register({ email: form.email, password: form.password, full_name: form.full_name });
            } else {
                await login({ email: form.email, password: form.password });
            }
            navigate(createPageUrl("InstructorUpload"));
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-16 flex items-center justify-center relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-300/15 rounded-full blur-3xl animate-blob pointer-events-none" />
            <div className="absolute bottom-20 -right-20 w-64 h-64 bg-violet-300/15 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '3s' }} />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-indigo-300/10 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '6s' }} />

            <motion.div
                className="w-full max-w-md px-4 relative z-10"
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl overflow-hidden">
                    {/* Decorative gradient border at top */}
                    <div className="h-1.5 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />

                    <CardHeader className="text-center pt-8 pb-2">
                        <motion.div
                            className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-5 shadow-xl animate-glow-pulse"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        >
                            <img
                                src="/easil-logo.png"
                                alt="EASIL"
                                className="w-full h-full object-cover object-center scale-[1.6]"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <CardTitle className="text-2xl font-extrabold text-slate-900">
                                {isRegister ? "Create your instructor account" : "Welcome back to EASIL"}
                            </CardTitle>
                            <p className="text-slate-600 mt-2">
                                {isRegister
                                    ? "Sign up to create and manage assessments."
                                    : "Sign in to create assessments and view analytics."}
                            </p>
                        </motion.div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <motion.form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {isRegister && (
                                <div>
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        value={form.full_name}
                                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                        placeholder="Jane Doe"
                                        className="mt-2 h-12 rounded-xl border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all"
                                    />
                                </div>
                            )}
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="you@example.com"
                                    className="mt-2 h-12 rounded-xl border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all"
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="mt-2 h-12 rounded-xl border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all"
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Alert className="border-red-200 bg-red-50 rounded-xl">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : isRegister ? (
                                    <><UserPlus className="w-5 h-5 mr-2" /> Create Account</>
                                ) : (
                                    <><LogIn className="w-5 h-5 mr-2" /> Sign In</>
                                )}
                            </Button>
                        </motion.form>

                        <div className="text-center mt-6 text-sm text-slate-600">
                            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                            <button
                                type="button"
                                onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }}
                                className="text-purple-600 hover:text-purple-800 font-semibold hover:underline transition-colors"
                            >
                                {isRegister ? "Sign in" : "Create one"}
                            </button>
                        </div>

                        {/* Decorative footer */}
                        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Powered by AI</span>
                            <span className="text-slate-300">•</span>
                            <span>Secure & Private</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
