import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
    Upload,
    FileQuestion,
    PenTool,
    Download,
    Shield,
    HelpCircle,
    CheckCircle,
    AlertCircle,
    Info,
    ClipboardList,
    BarChart3,
    Sparkles
} from "lucide-react";

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }
    })
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.05 }
    }
};

export default function Help() {
    const faqs = [
        {
            question: "What file formats are supported for upload?",
            answer: "EASIL currently supports PDF files for course material uploads. The system works best with text-based documents. Support for other formats like DOCX is coming soon."
        },
        {
            question: "How does the AI grading work?",
            answer: "Short answer questions use a smart token-overlap scoring system to award partial credit. Essay questions are graded by a powerful AI against the specific rubric you define, providing both a score and constructive feedback."
        },
        {
            question: "What question types can be generated?",
            answer: "EASIL focuses on deep understanding by generating Short Answer and Essay questions. You can specify the exact number of each type when creating your assessment."
        },
        {
            question: "How do I view student performance analytics?",
            answer: "Navigate to the Analytics page to view comprehensive performance data across all your assessments. You can see individual student scores, pass/fail rates, and export detailed reports in multiple formats."
        },
        {
            question: "What export formats are available?",
            answer: "JSON exports contain complete assessment and results data. CSV exports provide flattened data perfect for spreadsheet analysis. DOCX exports create nicely formatted reports with all details, scores, and feedback. Analytics can be exported for each assessment individually."
        },
        {
            question: "How is the pass/fail threshold determined?",
            answer: "Students scoring below 40% are marked as 'Fail', while those scoring 40% and above are marked as 'Pass'. This threshold ensures a reasonable standard while allowing for partial credit on complex questions."
        },
        {
            question: "Is my data secure and private?",
            answer: "Yes, your uploaded materials and generated assessments are stored securely. We take data privacy seriously. Please review our privacy practices for more details."
        }
    ];

    const steps = [
        {
            icon: Upload,
            title: "Upload Course Material",
            description: "Upload your PDF files. Optionally add a marking guide for more targeted question generation.",
            tips: ["Use clear, well-structured documents", "Include key concepts and definitions", "Add marking guides for better targeting"],
            gradient: "from-purple-500 to-violet-600"
        },
        {
            icon: FileQuestion,
            title: "Configure & Generate Questions",
            description: "Set the number of Short Answer and Essay questions, define difficulty, and generate your AI-powered assessment.",
            tips: ["Balance question types for comprehensive assessment", "Choose appropriate difficulty for your audience", "Review generated questions before saving"],
            gradient: "from-violet-500 to-indigo-600"
        },
        {
            icon: PenTool,
            title: "Students Respond & Get Graded",
            description: "Students complete the assessment sections with AI-powered grading providing instant feedback and scores.",
            tips: ["Share the assessment link with students", "Allow adequate time for thoughtful responses", "Encourage detailed answers for better AI grading"],
            gradient: "from-indigo-500 to-blue-600"
        },
        {
            icon: ClipboardList,
            title: "View Analytics & Insights",
            description: "Access comprehensive analytics showing student performance patterns, pass/fail rates, and detailed breakdowns for each assessment.",
            tips: ["Monitor class performance trends", "Identify areas where students struggle", "Use analytics to improve future assessments"],
            gradient: "from-emerald-500 to-teal-600"
        },
        {
            icon: Download,
            title: "Export & Share Results",
            description: "Export individual results or comprehensive analytics in multiple formats for record keeping and further analysis.",
            tips: ["Use CSV exports for data analysis", "Keep DOCX reports for formal documentation", "Share performance insights with stakeholders"],
            gradient: "from-amber-500 to-orange-600"
        }
    ];

    return (
        <div className="min-h-screen py-8 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-20 -right-32 w-80 h-80 bg-blue-200/15 rounded-full blur-3xl animate-blob pointer-events-none" />
            <div className="absolute bottom-40 -left-20 w-64 h-64 bg-indigo-200/15 rounded-full blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '4s' }} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    className="text-center mb-14"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold mb-5 border border-indigo-200/50">
                        <Sparkles className="w-4 h-4" />
                        Documentation & Help
                    </motion.div>
                    <motion.h1 variants={fadeInUp} custom={1} className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Help & Documentation
                    </motion.h1>
                    <motion.p variants={fadeInUp} custom={2} className="text-xl text-slate-600 max-w-3xl mx-auto">
                        Everything you need to know about using EASIL for AI-powered assessment and analytics
                    </motion.p>
                </motion.div>

                {/* How it Works */}
                <section className="mb-16">
                    <motion.h2
                        className="text-2xl font-bold text-slate-900 mb-8 text-center"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        How It Works
                    </motion.h2>
                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        variants={staggerContainer}
                    >
                        {steps.map((step, index) => (
                            <motion.div key={index} variants={fadeInUp} custom={index}>
                                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm card-hover h-full">
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                                                <step.icon className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Step {index + 1}</div>
                                                <CardTitle className="text-lg font-bold text-slate-900">
                                                    {step.title}
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700 mb-4">{step.description}</p>
                                        <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-4 rounded-xl border border-slate-100">
                                            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                                                <Info className="w-4 h-4 text-blue-600" />
                                                Pro Tips
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {step.tips.map((tip, tipIndex) => (
                                                    <li key={tipIndex} className="text-sm text-slate-600 flex items-start gap-2">
                                                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                        {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* Features Overview */}
                <motion.section
                    className="mb-16"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp}>
                        <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl font-extrabold text-slate-900 text-center">
                                    Key Features & Capabilities
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { icon: Upload, title: "Smart Document Processing", desc: "Extract content from PDFs automatically with intelligent parsing", gradient: "from-blue-500 to-cyan-500" },
                                        { icon: FileQuestion, title: "Mixed Question Types", desc: "Generate Short Answer and Essay questions tailored to your content", gradient: "from-indigo-500 to-violet-500" },
                                        { icon: PenTool, title: "AI Essay Grading", desc: "Automated essay scoring with detailed rubrics and feedback", gradient: "from-purple-500 to-pink-500" },
                                        { icon: ClipboardList, title: "Assessment Analytics", desc: "Comprehensive performance tracking across all assessments", gradient: "from-emerald-500 to-green-500" },
                                        { icon: BarChart3, title: "Performance Insights", desc: "Pass/fail rates, average scores, and trend analysis", gradient: "from-amber-500 to-orange-500" },
                                        { icon: Download, title: "Multiple Export Formats", desc: "JSON, CSV, and formatted DOCX reports for all data", gradient: "from-rose-500 to-red-500" }
                                    ].map((feat, i) => (
                                        <motion.div
                                            key={i}
                                            variants={fadeInUp}
                                            custom={i}
                                            className="text-center p-5 rounded-2xl hover:bg-white/60 transition-all duration-300 group"
                                        >
                                            <div className={`w-14 h-14 bg-gradient-to-br ${feat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                                                <feat.icon className="w-7 h-7 text-white" />
                                            </div>
                                            <h3 className="font-bold text-slate-900 mb-2">{feat.title}</h3>
                                            <p className="text-sm text-slate-600">{feat.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.section>

                {/* FAQ Section */}
                <section className="mb-16">
                    <motion.h2
                        className="text-2xl font-bold text-slate-900 mb-8 text-center"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        Frequently Asked Questions
                    </motion.h2>
                    <motion.div
                        className="space-y-4"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        variants={staggerContainer}
                    >
                        {faqs.map((faq, index) => (
                            <motion.div key={index} variants={fadeInUp} custom={index}>
                                <Card className="shadow-md border-0 bg-white/85 backdrop-blur-sm card-hover">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <HelpCircle className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 mb-2">{faq.question}</h3>
                                                <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* Best Practices */}
                <motion.section
                    className="mb-16"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeInUp}
                >
                    <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30">
                        <CardHeader>
                            <CardTitle className="text-xl font-extrabold text-slate-900 text-center flex items-center justify-center gap-2">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                                Best Practices for Optimal Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-4 text-lg">Document Preparation</h3>
                                    <ul className="space-y-3">
                                        {[
                                            "Use well-structured documents with clear headings",
                                            "Include key concepts, definitions, and examples",
                                            "Ensure text is readable and not image-based"
                                        ].map((tip, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                </div>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-4 text-lg">Assessment & Analytics</h3>
                                    <ul className="space-y-3">
                                        {[
                                            "Balance question types for comprehensive assessment",
                                            "Review analytics regularly to identify learning gaps",
                                            "Use export features for detailed analysis and reporting"
                                        ].map((tip, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                </div>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.section>

                {/* Privacy & Security */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeInUp}
                >
                    <Card className="shadow-xl border-0 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
                        <CardHeader>
                            <CardTitle className="text-xl font-extrabold text-slate-900 text-center flex items-center justify-center gap-2">
                                <Shield className="w-6 h-6 text-blue-600" />
                                Privacy & Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <AlertCircle className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2">Data Handling</h3>
                                        <p className="text-slate-700 text-sm">
                                            Your uploaded documents, generated assessments, and student performance data are processed securely.
                                            All analytics and assessment data remain private to your account.
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <AlertCircle className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2">Recommendations</h3>
                                        <p className="text-slate-700 text-sm">
                                            For highly sensitive materials, review generated content before distribution.
                                            Consider using anonymized or sample content for initial testing. Student data in analytics
                                            can be exported and managed according to your institution's privacy policies.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.section>
            </div>
        </div>
    );
}