
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Quiz } from "@/api/entities";
import { QuizAttempt } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
    Loader2, 
    AlertCircle, 
    Users, 
    FileQuestion, 
    Percent,
    Download,
    FileJson,
    FileSpreadsheet,
    Share2,
    Copy,
    ExternalLink,
    Check,
    Clock
} from "lucide-react";
import { format } from "date-fns";
import { copyTextToClipboard } from "@/lib/clipboard";

export default function AssessmentAnalytics() {
    const [analyticsData, setAnalyticsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copiedQuizId, setCopiedQuizId] = useState(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const user = await User.me();
                if (!user || !user.email) {
                    setError("You must be logged in to view assessment analytics.");
                    setLoading(false);
                    return;
                }

                const instructorQuizzes = await Quiz.filter({ created_by: user.email }, "-created_date");

                if (instructorQuizzes.length === 0) {
                    setLoading(false);
                    return;
                }

                const dataPromises = instructorQuizzes.map(async (quiz) => {
                    const attempts = await QuizAttempt.filter({ quiz_id: quiz.id });
                    const attemptCount = attempts.length;
                    const averageScore = attemptCount > 0 
                        ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attemptCount 
                        : 0;
                    
                    return {
                        ...quiz,
                        attempts,
                        stats: {
                            attemptCount,
                            averageScore: Math.round(averageScore)
                        }
                    };
                });

                const data = await Promise.all(dataPromises);
                setAnalyticsData(data);

            } catch (err) {
                setError("Failed to load analytics data. Please try again.");
                console.error("Analytics load error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, []);

    const copyStudentLink = async (quizId) => {
        const studentUrl = `${window.location.origin}${createPageUrl("QuizTake")}?quizId=${quizId}`;
        const ok = await copyTextToClipboard(studentUrl);
        if (ok) {
            setCopiedQuizId(quizId);
            setTimeout(() => setCopiedQuizId(null), 2500);
        }
    };

    const openStudentLink = (quizId) => {
        const studentUrl = `${window.location.origin}${createPageUrl("QuizTake")}?quizId=${quizId}`;
        window.open(studentUrl, '_blank');
    };

    const downloadFile = (filename, content, contentType) => {
        const blob = new Blob([content], { type: contentType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const exportJSON = (quiz) => {
        const filename = `analytics_${quiz.id}.json`;
        downloadFile(filename, JSON.stringify(quiz, null, 2), 'application/json');
    };

    const exportCSV = (quiz) => {
        const headers = "Student Name,Email,Score,Percentage,Status,Completed On\n";
        const rows = quiz.attempts.map(attempt => {
            const status = (attempt.percentage || 0) < 40 ? 'Fail' : 'Pass';
            const completedDate = attempt.time_completed ? format(new Date(attempt.time_completed), 'yyyy-MM-dd HH:mm') : 'N/A';
            return `"${attempt.student_name || 'N/A'}","${attempt.student_email || 'N/A'}","${attempt.total_score || 0}/${attempt.max_possible_score || 0}","${attempt.percentage || 0}%","${status}","${completedDate}"`;
        }).join("\n");
        const filename = `analytics_${quiz.id}.csv`;
        downloadFile(filename, headers + rows, 'text/csv;charset=utf-8;');
    };

    const exportDOCX = (quiz) => {
        const styles = `<style>
            body { font-family: 'Times New Roman', serif; line-height: 1.5; margin: 20px; }
            h1, h2 { font-family: Arial, sans-serif; color: #333; margin-bottom: 10px; }
            h1 { font-size: 24px; }
            h2 { font-size: 20px; }
            p { margin-bottom: 5px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; table-layout: fixed; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; word-wrap: break-word; }
            th { background-color: #f2f2f2; font-weight: bold; }
        </style>`;

        let content = `<h1>${quiz.title} - Analytics Report</h1>`;
        content += `<p><strong>Description:</strong> ${quiz.description || 'N/A'}</p>`;
        content += `<p><strong>Total Attempts:</strong> ${quiz.stats.attemptCount}</p>`;
        content += `<p><strong>Average Score:</strong> ${quiz.stats.averageScore}%</p>`;
        content += `<p><strong>Number of Questions:</strong> ${quiz.questions?.length || 0}</p>`;
        content += `<p><strong>Duration:</strong> ${quiz.duration || 'N/A'} minutes</p>`; // Added duration to DOCX export
        content += `<h2>All Attempts</h2>`;

        if (quiz.attempts.length > 0) {
            content += '<table>';
            content += '<thead><tr><th>Student Name</th><th>Email</th><th>Score</th><th>Percentage</th><th>Status</th><th>Completed On</th></tr></thead>';
            content += '<tbody>';
            quiz.attempts.forEach(attempt => {
                const status = (attempt.percentage || 0) < 40 ? 'Fail' : 'Pass';
                const completedDate = attempt.time_completed ? format(new Date(attempt.time_completed), 'PPP p') : 'N/A';
                content += `<tr>
                    <td>${attempt.student_name || 'N/A'}</td>
                    <td>${attempt.student_email || 'N/A'}</td>
                    <td>${attempt.total_score || 0} / ${attempt.max_possible_score || 0}</td>
                    <td>${attempt.percentage || 0}%</td>
                    <td>${status}</td>
                    <td>${completedDate}</td>
                </tr>`;
            });
            content += '</tbody></table>';
        } else {
            content += '<p>No students have attempted this assessment yet.</p>';
        }

        const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'>${styles}</head><body>${content}</body></html>`;
        const filename = `report_${quiz.id}.doc`;
        downloadFile(filename, html, 'application/msword');
    };
    
    if (loading) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-4 text-slate-600">Loading your assessment analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Assessment Analytics</h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        Track student performance and share assessments.
                    </p>
                </div>

                {analyticsData.length === 0 ? (
                    <Card className="text-center p-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardTitle>No Assessments Found</CardTitle>
                        <CardDescription className="mt-2">
                            You haven't created any assessments yet. Get started by creating one!
                        </CardDescription>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {analyticsData.map((quiz) => (
                            <Card key={quiz.id} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-2xl font-bold text-slate-900">{quiz.title}</CardTitle>
                                            <CardDescription>{quiz.description}</CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                                    <Download className="w-4 h-4" />
                                                    Export
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => exportJSON(quiz)}>
                                                    <FileJson className="w-4 h-4 mr-2" />
                                                    Export as JSON
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => exportCSV(quiz)}>
                                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                    Export as CSV
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => exportDOCX(quiz)}>
                                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                    Export as Report (.doc)
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                                        <div className="p-3 bg-purple-50 rounded-lg flex items-center gap-3">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            <div>
                                                <div className="text-lg font-bold text-purple-700">{quiz.stats.attemptCount}</div>
                                                <div className="text-xs text-slate-500">Attempts</div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg flex items-center gap-3">
                                            <Percent className="w-5 h-5 text-green-600" />
                                            <div>
                                                <div className="text-lg font-bold text-green-700">{quiz.stats.averageScore}%</div>
                                                <div className="text-xs text-slate-500">Avg. Score</div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-violet-50 rounded-lg flex items-center gap-3">
                                            <FileQuestion className="w-5 h-5 text-violet-600" />
                                            <div>
                                                <div className="text-lg font-bold text-violet-700">{quiz.questions.length}</div>
                                                <div className="text-xs text-slate-500">Questions</div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-indigo-50 rounded-lg flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <div className="text-lg font-bold text-indigo-700">
                                                    {quiz.short_answer_duration || 0}m
                                                </div>
                                                <div className="text-xs text-slate-500">Short Answer</div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-pink-50 rounded-lg flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-pink-600" />
                                            <div>
                                                <div className="text-lg font-bold text-pink-700">
                                                    {quiz.essay_duration || 0}m
                                                </div>
                                                <div className="text-xs text-slate-500">Essay Time</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 bg-slate-50 rounded-lg mb-6 border">
                                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                                            <Share2 className="w-4 h-4 text-blue-600" />
                                            Share Assessment Link
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={`${window.location.origin}${createPageUrl("QuizTake")}?quizId=${quiz.id}`}
                                                readOnly
                                                className="flex-1 bg-white text-xs"
                                            />
                                            <Button
                                                onClick={() => copyStudentLink(quiz.id)}
                                                size="sm"
                                                variant="outline"
                                                className="w-24"
                                            >
                                                {copiedQuizId === quiz.id ? (
                                                    <>
                                                        <Check className="w-4 h-4 mr-2 text-green-600" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4 mr-2" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => openStudentLink(quiz.id)}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {quiz.attempts.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Student Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Score</TableHead>
                                                    <TableHead>Percentage</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Completed On</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {quiz.attempts.map((attempt) => (
                                                    <TableRow key={attempt.id}>
                                                        <TableCell className="font-medium">{attempt.student_name || 'N/A'}</TableCell>
                                                        <TableCell>{attempt.student_email || "N/A"}</TableCell>
                                                        <TableCell>{attempt.total_score || 0} / {attempt.max_possible_score || 0}</TableCell>
                                                        <TableCell className="font-semibold">{attempt.percentage || 0}%</TableCell>
                                                        <TableCell>
                                                            <Badge className={
                                                                (attempt.percentage || 0) < 40 
                                                                ? "bg-red-100 text-red-700 border-red-200" 
                                                                : "bg-green-100 text-green-700 border-green-200"
                                                            }>
                                                                {(attempt.percentage || 0) < 40 ? 'Fail' : 'Pass'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {attempt.time_completed ? format(new Date(attempt.time_completed), 'PPP p') : 'N/A'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-6 text-slate-500">
                                            No students have attempted this assessment yet.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
