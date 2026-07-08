
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
    Upload,
    FileQuestion,
    PenTool,
    BarChart3,
    Sparkles,
    CheckCircle,
    ArrowRight,
    BookOpen,
    Users,
    Clock,
    ClipboardList,
    Zap,
    Brain,
    Star
} from "lucide-react";

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
    })
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: (i = 0) => ({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" }
    })
};

export default function Home() {
    const features = [
        {
            icon: Upload,
            title: "Upload & Generate",
            description: "Upload your course materials and generate comprehensive essay and short-answer questions using advanced AI.",
            gradient: "from-purple-500 to-violet-600"
        },
        {
            icon: FileQuestion,
            title: "Interactive Answering",
            description: "Students answer questions with a clean, focused interface designed for thoughtful responses.",
            gradient: "from-violet-500 to-indigo-600"
        },
        {
            icon: PenTool,
            title: "AI-Powered Grading",
            description: "Automated grading for both short answers and long-form essays with detailed rubrics and personalized feedback.",
            gradient: "from-indigo-500 to-blue-600"
        },
        {
            icon: ClipboardList,
            title: "Assessment Analytics",
            description: "Track student performance across all assessments with comprehensive analytics and exportable reports.",
            gradient: "from-emerald-500 to-teal-600"
        },
        {
            icon: BarChart3,
            title: "Detailed Export Options",
            description: "Export results in JSON, CSV, and formatted reports with performance insights and pass/fail analytics.",
            gradient: "from-amber-500 to-orange-600"
        }
    ];

    const benefits = [
        "Generate essay prompts from any course material in seconds",
        "Support for Short Answer and Essay question types",
        "Automated, rubric-based grading with detailed feedback",
        "Comprehensive analytics dashboard for instructor insights",
        "Track student performance across multiple assessments",
        "Export results in JSON, CSV, and formatted reports",
        "Timed assessments with automatic submission",
        "Mobile-responsive design for any device",
        "Secure and private - your data stays safe"
    ];

    const stats = [
        { icon: BookOpen, value: "5 Min", label: "Question Generation", color: "purple" },
        { icon: Users, value: "Any Size", label: "Class Support", color: "violet" },
        { icon: Clock, value: "Instant", label: "Auto Grading", color: "indigo" },
        { icon: ClipboardList, value: "Real-time", label: "Analytics", color: "emerald" }
    ];

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated background blobs */}
            <div className="absolute top-20 -left-32 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-blob pointer-events-none" />
            <div className="absolute top-60 -right-32 w-80 h-80 bg-violet-300/20 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-indigo-300/15 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '4s' }} />

            {/* Floating decorative particles */}
            <div className="absolute top-32 left-[15%] w-3 h-3 bg-purple-400/40 rounded-full animate-particle pointer-events-none" />
            <div className="absolute top-48 right-[20%] w-2 h-2 bg-violet-400/50 rounded-full animate-particle pointer-events-none" style={{ animationDelay: '1s' }} />
            <div className="absolute top-72 left-[60%] w-4 h-4 bg-indigo-400/30 rounded-full animate-particle pointer-events-none" style={{ animationDelay: '3s' }} />
            <div className="absolute top-96 left-[30%] w-2 h-2 bg-purple-500/40 rounded-full animate-particle pointer-events-none" style={{ animationDelay: '5s' }} />

            {/* Hero Section */}
            <section className="relative py-20 lg:py-32">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        className="max-w-4xl mx-auto"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        {/* Badge */}
                        <motion.div variants={fadeInUp} custom={0}>
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm border border-purple-200/50">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                AI-Powered Assessment & Analytics
                                <Zap className="w-4 h-4 text-amber-500" />
                            </div>
                        </motion.div>

                        {/* Hero Title */}
                        <motion.h1
                            variants={fadeInUp}
                            custom={1}
                            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight"
                        >
                            Transform Your Materials into
                            <motion.span
                                className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-shift"
                                style={{ backgroundSize: '200% auto' }}
                            >
                                Insightful Assessments
                            </motion.span>
                        </motion.h1>

                        {/* Hero Description */}
                        <motion.p
                            variants={fadeInUp}
                            custom={2}
                            className="text-lg sm:text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed"
                        >
                            EASIL transforms your course materials into dynamic assessments with shareable links, comprehensive analytics, and automated grading — making it easy to distribute, manage, and analyze student performance.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            variants={fadeInUp}
                            custom={3}
                            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
                        >
                            <Link to={createPageUrl("InstructorUpload")}>
                                <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300 group">
                                    Get Started Now
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
                                </Button>
                            </Link>

                            <Link to={createPageUrl("Help")}>
                                <Button variant="outline" className="border-2 border-slate-300 hover:border-purple-400 px-8 py-6 rounded-2xl text-lg font-semibold transition-all duration-300 hover:bg-purple-50/50 hover:-translate-y-0.5">
                                    <BookOpen className="w-5 h-5 mr-2" />
                                    Learn More
                                </Button>
                            </Link>
                        </motion.div>

                        {/* Stats Grid */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    variants={scaleIn}
                                    custom={index + 4}
                                    className="text-center group"
                                >
                                    <div className={`w-14 h-14 bg-${stat.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                        <stat.icon className={`w-7 h-7 text-${stat.color}-600`} />
                                    </div>
                                    <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
                                    <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/60 to-white/40 pointer-events-none" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={staggerContainer}
                    >
                        <motion.h2
                            variants={fadeInUp}
                            className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight"
                        >
                            Everything You Need for
                            <span className="block text-gradient">Modern Assessment & Analytics</span>
                        </motion.h2>
                        <motion.p variants={fadeInUp} custom={1} className="text-xl text-slate-600 max-w-3xl mx-auto">
                            From question generation to comprehensive performance analytics, EASIL provides a complete solution.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        variants={staggerContainer}
                    >
                        {features.map((feature, index) => (
                            <motion.div key={index} variants={fadeInUp} custom={index}>
                                <Card className="group card-hover border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white/95 h-full">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                                                <feature.icon className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold text-slate-900 mb-1">
                                                    {feature.title}
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-600 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={staggerContainer}
                        >
                            <motion.h2
                                variants={fadeInUp}
                                className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight"
                            >
                                Why Choose
                                <span className="text-gradient"> EASIL?</span>
                            </motion.h2>
                            <motion.p
                                variants={fadeInUp}
                                custom={1}
                                className="text-lg text-slate-600 leading-relaxed mb-8"
                            >
                                Built for educators who want to save time while gaining deep insights into student understanding and performance patterns.
                            </motion.p>

                            <motion.div
                                className="space-y-3"
                                variants={staggerContainer}
                            >
                                {benefits.map((benefit, index) => (
                                    <motion.div
                                        key={index}
                                        variants={fadeInUp}
                                        custom={index + 2}
                                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors duration-300 group"
                                    >
                                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-slate-700 font-medium">{benefit}</span>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <motion.div variants={fadeInUp} custom={12}>
                                <Link to={createPageUrl("InstructorUpload")} className="inline-block mt-8">
                                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-5 rounded-2xl font-semibold shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 text-lg">
                                        <Star className="w-5 h-5 mr-2" />
                                        Start Creating Assessments
                                    </Button>
                                </Link>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            className="relative"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={scaleIn}
                        >
                            {/* Decorative rotating ring */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[350px] h-[350px] border border-purple-200/30 rounded-full animate-spin-slow" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[280px] h-[280px] border border-violet-200/20 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/80 to-violet-400/80 rounded-3xl transform rotate-3 shadow-2xl" />
                            <div className="relative bg-white rounded-3xl p-10 shadow-2xl animate-glow-pulse">
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-8 shadow-xl animate-float">
                                        <img
                                            src="/easil-logo.png"
                                            alt="EASIL"
                                            className="w-full h-full object-cover object-center scale-[1.6]"
                                        />
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 mb-4">
                                        Ready to Get Started?
                                    </h3>
                                    <p className="text-slate-600 mb-8 leading-relaxed">
                                        Join thousands of educators who are already using AI to enhance their teaching and gain insights into student performance.
                                    </p>
                                    <Link to={createPageUrl("InstructorUpload")}>
                                        <Button variant="outline" className="w-full border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 py-5 rounded-xl font-semibold transition-all duration-300 text-purple-700 hover:text-purple-800">
                                            <Brain className="w-5 h-5 mr-2" />
                                            Upload Your First Document
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
