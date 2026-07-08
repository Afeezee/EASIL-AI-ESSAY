import React, { useState, useEffect } from "react";
import { Quiz } from "@/api/entities";
import { QuizAttempt } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertCircle,
    CheckCircle,
    XCircle,
    Loader2,
    BarChart3,
    User,
    Mail,
    Hash,
    Download,
    FileJson,
    FileSpreadsheet,
    PenTool,
    FileQuestion,
    Sparkles,
    BookOpen
} from "lucide-react";
import { format } from "date-fns";

export default function Review() {
    const [quiz, setQuiz] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                // Check URL parameters first, then localStorage
                const urlParams = new URLSearchParams(window.location.search);
                const urlQuizId = urlParams.get('quizId');
                const urlAttemptId = urlParams.get('attemptId');

                const quizId = urlQuizId || localStorage.getItem('currentQuizId');
                const attemptId = urlAttemptId || localStorage.getItem('currentAttemptId');

                if (!quizId || !attemptId) {
                    setError("No review data found. Please complete an assessment first.");
                    return;
                }

                const [quizList, attemptList] = await Promise.all([Quiz.list(), QuizAttempt.list()]);
                const foundQuiz = quizList.find(q => q.id === quizId);
                const foundAttempt = attemptList.find(a => a.id === attemptId);

                if (!foundQuiz || !foundAttempt) {
                    setError("Could not load review data.");
                    return;
                }

                setQuiz(foundQuiz);
                setAttempt(foundAttempt);
            } catch (err) {
                setError("Failed to load review data. Please try again.");
                console.error("Load error:", err);
            }
        };

        loadData();
    }, []);

    const downloadFile = (filename, content, contentType) => {
        const blob = new Blob([content], { type: contentType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportJSON = () => {
        const data = { quiz, attempt };
        downloadFile('quiz_review.json', JSON.stringify(data, null, 2), 'application/json');
    };

    const exportCSV = () => {
        const headers = "Question,Type,Your Answer,Score,Max Score,Feedback\n";
        const rows = quiz.questions.map(q => {
            const ans = attempt.answers.find(a => a.question_id === q.id) || {};
            const cleanAnswer = `"${(ans.answer || '').replace(/"/g, '""')}"`;
            const cleanFeedback = `"${(ans.feedback || '').replace(/"/g, '""')}"`;
            return `"${q.question.replace(/"/g, '""')}",${q.type},${cleanAnswer},${ans.score || 0},${ans.max_score || q.max_score || 1},${cleanFeedback}`;
        }).join("\n");
        downloadFile('quiz_results.csv', headers + rows, 'text/csv;charset=utf-8;');
    };

    const exportDOCX = () => {
        const styles = `<style>
            body { font-family: 'Times New Roman', serif; line-height: 1.5; }
            h1, h2, h3 { font-family: Arial, sans-serif; color: #333; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
            .correct { background-color: #e6fffa; color: #38a169; }
            .incorrect { background-color: #fff5f5; color: #e53e3e; }
        </style>`;

        let content = `<h1>${quiz.title} - Results</h1>`;
        content += `<h3>Student: ${attempt.student_name}</h3>`;
        content += `<h3>Final Score: ${attempt.total_score}/${attempt.max_possible_score} (${attempt.percentage}%)</h3>`;
        if (attempt.time_completed) {
            content += `<p>Completed on: ${format(new Date(attempt.time_completed), 'PPP p')}</p>`;
        }
        content += `<hr>`;

        quiz.questions.forEach((q, index) => {
            const ans = attempt.answers.find(a => a.question_id === q.id) || {};
            content += `<h2>Question ${index + 1}: ${q.question}</h2>`;
            content += `<p><strong>Your Answer:</strong> ${ans.answer || 'No answer'}</p>`;
            content += `<p><strong>Feedback:</strong> ${ans.feedback || 'N/A'}</p>`;
            if (q.explanation) content += `<p><strong>Explanation:</strong> ${q.explanation}</p>`;
            content += `<p><strong>Score:</strong> ${ans.score || 0} / ${ans.max_score || q.max_score || 1}</p><hr>`;
        });

        const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'>${styles}</head><body>${content}</body></html>`;
        downloadFile('assessment_report.doc', html, 'application/msword');
    };

    if (error) {
        return <div className="min-h-screen py-8 flex items-center justify-center"><Alert className="max-w-xl mx-auto border-red-200 bg-red-50"><AlertCircle className="h-4 w-4 text-red-600" /><AlertDescription className="text-red-700">{error}</AlertDescription></Alert></div>;
    }

    if (!quiz || !attempt) {
        return <div className="min-h-screen py-8 flex items-center justify-center"><div className="text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /><p className="mt-4 text-slate-600">Loading your results...</p></div></div>;
    }

    // Section subtotals (short answer vs essay), computed from the graded answers.
    const sectionStats = quiz.questions.reduce((acc, q) => {
        const ans = attempt.answers.find(a => a.question_id === q.id) || {};
        const bucket = q.type === 'essay' ? 'essay' : 'shortAnswer';
        acc[bucket].score += ans.score || 0;
        acc[bucket].max += ans.max_score || q.max_score || 1;
        acc[bucket].count += 1;
        return acc;
    }, { shortAnswer: { score: 0, max: 0, count: 0 }, essay: { score: 0, max: 0, count: 0 } });

    const fmtScore = (n) => (Number.isInteger(n) ? n : n.toFixed(1));

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Assessment Review: {quiz.title}</h1>
                    <p className="text-xl text-slate-600">A detailed breakdown of your performance.</p>
                </div>

                {attempt.status === 'in_progress' && (
                    <Alert className="mb-6 border-orange-200 bg-orange-50">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-700">
                            This assessment is still in progress — the essay section has not been completed. Scores below are partial.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Summary & Export */}
                    <div className="lg:col-span-1 space-y-8">
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" />Overall Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <p className="text-6xl font-bold text-blue-600">{attempt.percentage}%</p>
                                    <p className="font-medium text-slate-700">Final Score</p>
                                </div>
                                <div className="flex justify-around text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">{fmtScore(attempt.total_score)}</p>
                                        <p className="text-sm text-slate-500">Points</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">/</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">{fmtScore(attempt.max_possible_score)}</p>
                                        <p className="text-sm text-slate-500">Max Points</p>
                                    </div>
                                </div>

                                {/* Section breakdown */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    {sectionStats.shortAnswer.count > 0 && (
                                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                            <span className="flex items-center gap-2 text-sm font-medium text-orange-700">
                                                <FileQuestion className="w-4 h-4" /> Short Answers
                                            </span>
                                            <span className="text-sm font-bold text-orange-700">
                                                {fmtScore(sectionStats.shortAnswer.score)} / {fmtScore(sectionStats.shortAnswer.max)}
                                            </span>
                                        </div>
                                    )}
                                    {sectionStats.essay.count > 0 && (
                                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                            <span className="flex items-center gap-2 text-sm font-medium text-purple-700">
                                                <PenTool className="w-4 h-4" /> Essays
                                            </span>
                                            <span className="text-sm font-bold text-purple-700">
                                                {fmtScore(sectionStats.essay.score)} / {fmtScore(sectionStats.essay.max)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" />Student Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-500" /><span className="font-medium">{attempt.student_name}</span></div>
                                {attempt.student_email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-500" /><span>{attempt.student_email}</span></div>}
                                {attempt.student_id_number && <div className="flex items-center gap-3"><Hash className="w-4 h-4 text-slate-500" /><span>{attempt.student_id_number}</span></div>}
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5 text-green-600" />Export Results</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button onClick={exportJSON} variant="outline" className="w-full justify-start gap-2"><FileJson className="w-4 h-4" />Export as JSON</Button>
                                <Button onClick={exportCSV} variant="outline" className="w-full justify-start gap-2"><FileSpreadsheet className="w-4 h-4" />Export as CSV</Button>
                                <Button onClick={exportDOCX} variant="outline" className="w-full justify-start gap-2"><FileSpreadsheet className="w-4 h-4" />Export as Report (.doc)</Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Results */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Score Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Question</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Result</TableHead>
                                            <TableHead>Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {quiz.questions.map((q, index) => {
                                            const ans = attempt.answers.find(a => a.question_id === q.id) || {};
                                            const isCorrect = q.type === 'essay' ? (ans.score > ((ans.max_score || q.max_score || 10) / 2)) : ans.is_correct;
                                            return (
                                                <TableRow key={q.id}>
                                                    <TableCell className="font-medium">{index + 1}. {q.question}</TableCell>
                                                    <TableCell>
                                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md whitespace-nowrap">
                                                            {q.type === 'essay' ? 'ESSAY' : 'SHORT ANSWER'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={isCorrect ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                                                            {isCorrect ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                                            {isCorrect ? "Correct" : "Needs Work"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-semibold whitespace-nowrap">{fmtScore(ans.score || 0)} / {fmtScore(ans.max_score || q.max_score || 1)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Question-by-question breakdown with AI feedback and explanations */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                Detailed Feedback &amp; AI Explanations
                            </h3>
                            {quiz.questions.map((q, index) => {
                                const ans = attempt.answers.find(a => a.question_id === q.id) || {};
                                const maxScore = ans.max_score || q.max_score || 1;
                                const isCorrect = q.type === 'essay' ? (ans.score > (maxScore / 2)) : ans.is_correct;
                                return (
                                    <Card key={q.id} className={`border-2 ${isCorrect ? 'border-green-200' : 'border-red-200'} bg-white/90`}>
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <p className="font-semibold text-slate-900">
                                                    {index + 1}. {q.question}
                                                </p>
                                                <span className={`shrink-0 text-sm font-bold px-3 py-1 rounded-full ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {fmtScore(ans.score || 0)} / {fmtScore(maxScore)}
                                                </span>
                                            </div>

                                            <div className="text-sm">
                                                <span className="font-medium text-slate-700">Your answer: </span>
                                                <span className="text-slate-600 whitespace-pre-wrap">{ans.answer || 'No answer provided'}</span>
                                            </div>

                                            {ans.feedback && (
                                                <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm">
                                                    <div className="flex items-start gap-2">
                                                        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <div className="font-medium text-purple-800 mb-1">AI Examiner Feedback</div>
                                                            <div className="text-slate-700">{ans.feedback}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {q.type !== 'essay' && q.correct_answer && (
                                                <div className="text-sm">
                                                    <span className="font-medium text-slate-700">Expected key points: </span>
                                                    <span className="text-green-700">{q.correct_answer}</span>
                                                </div>
                                            )}

                                            {q.explanation && (
                                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                                                    <div className="flex items-start gap-2">
                                                        <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <div className="font-medium text-blue-800 mb-1">Explanation</div>
                                                            <div className="text-slate-700">{q.explanation}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
