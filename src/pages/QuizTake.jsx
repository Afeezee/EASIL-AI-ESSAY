
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Quiz } from "@/api/entities";
import { QuizAttempt } from "@/api/entities";
import { GradeShortAnswers } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertCircle,
    Clock,
    User,
    FileQuestion,
    Trophy,
    BarChart3,
    Loader2
} from "lucide-react";

import QuestionRenderer from "../components/quiz/QuestionRenderer";
import Timer from "../components/quiz/Timer";

export default function QuizTake() {
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [hasEssays, setHasEssays] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [studentInfo, setStudentInfo] = useState({ name: "", email: "", idNumber: "" });
    const [showStudentForm, setShowStudentForm] = useState(true);
    const [error, setError] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Kept so a failed submission (e.g. brief network drop) can be retried without data loss.
    const [pendingAnswers, setPendingAnswers] = useState(null);

    // Submit the short-answer section. Grading happens SERVER-SIDE with strict,
    // rubric-anchored prompts — no scores are computed (or shown) on the client.
    // The attempt stays "in_progress" when essays follow; the assessment only
    // completes as a whole.
    const completeQuizWithAnswers = useCallback(async (finalAnswers) => {
        if (!quiz) {
            setError("Failed to submit: quiz data missing.");
            return;
        }

        setIsSubmitting(true);
        setError("");
        setPendingAnswers(finalAnswers);

        try {
            const items = quiz.questions.map(question => ({
                question_id: question.id,
                question: question.question,
                expected_key_points: question.correct_answer || "",
                student_answer: (finalAnswers[question.id] || "").trim()
            }));

            const { results } = await GradeShortAnswers({ items });

            const gradedAnswers = quiz.questions.map(question => {
                const graded = results.find(r => r.question_id === question.id) || {};
                return {
                    question_id: question.id,
                    answer: finalAnswers[question.id] || "",
                    is_correct: !!graded.is_correct,
                    score: typeof graded.score === 'number' ? graded.score : 0,
                    max_score: 1,
                    feedback: graded.feedback || "No answer provided"
                };
            });

            const totalScore = gradedAnswers.reduce((sum, a) => sum + a.score, 0);
            const maxScore = gradedAnswers.length;
            const endTime = new Date();

            const attemptData = {
                quiz_id: quiz.id,
                student_name: studentInfo.name,
                student_email: studentInfo.email || "",
                student_id_number: studentInfo.idNumber || "",
                answers: gradedAnswers,
                total_score: totalScore,
                max_possible_score: maxScore,
                percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
                time_started: startTime ? startTime.toISOString() : new Date().toISOString(),
                // Only a quiz with no essay section is complete at this point.
                time_completed: hasEssays ? null : endTime.toISOString(),
                status: hasEssays ? "in_progress" : "completed"
            };

            const savedAttempt = await QuizAttempt.create(attemptData);
            localStorage.setItem('currentAttemptId', savedAttempt.id);
            localStorage.removeItem('remainingEssayTime');

            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('quizId') || quiz.id;

            if (hasEssays) {
                navigate(`${createPageUrl("QuizEssay")}?quizId=${quizId}&attemptId=${savedAttempt.id}`);
            } else {
                navigate(`${createPageUrl("Review")}?quizId=${quizId}&attemptId=${savedAttempt.id}`);
            }
        } catch (err) {
            setError("Failed to submit your answers. Please check your connection and use the Retry button below.");
            console.error("Submit error:", err);
            setIsSubmitting(false);
        }
    }, [quiz, hasEssays, studentInfo, startTime, navigate]);

    const completeQuiz = useCallback(async () => {
        if (!quiz || !quiz.questions || quiz.questions.length === 0) return;
        if (isSubmitting) return;

        const currentQ = quiz.questions[currentQuestionIndex];
        const finalAnswers = { ...answers };
        if (currentQ && currentAnswer.trim() && !finalAnswers[currentQ.id]) {
            finalAnswers[currentQ.id] = currentAnswer;
        }
        setTimeLeft(null); // stop the timer during submission
        await completeQuizWithAnswers(finalAnswers);
    }, [quiz, currentQuestionIndex, answers, currentAnswer, completeQuizWithAnswers, isSubmitting]);

    const loadQuiz = useCallback(async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const urlQuizId = urlParams.get('quizId');

            let targetQuizId = urlQuizId;

            if (!targetQuizId) {
                targetQuizId = localStorage.getItem('currentQuizId');
            }

            if (!targetQuizId) {
                setError("No assessment found. Please use the link provided by your instructor.");
                return;
            }

            const quizList = await Quiz.list();
            const foundQuiz = quizList.find(q => q.id === targetQuizId);

            if (!foundQuiz) {
                setError("Assessment not found. Please check the link provided by your instructor.");
                return;
            }

            const hasEssayQuestions = foundQuiz.questions.some(q => q.type === 'essay');
            setHasEssays(hasEssayQuestions);

            const nonEssayQuestions = foundQuiz.questions.filter(q => q.type !== 'essay');
            setQuiz({
                ...foundQuiz,
                questions: nonEssayQuestions
            });

            // Set timer based on section - short answer duration for this section
            if (foundQuiz.short_answer_duration && nonEssayQuestions.length > 0) {
                setTimeLeft(foundQuiz.short_answer_duration * 60);
            } else {
                setTimeLeft(null);
            }

            localStorage.setItem('currentQuizId', foundQuiz.id);
            localStorage.removeItem('remainingEssayTime');
        } catch (err) {
            setError("Failed to load assessment. Please try again.");
            console.error("Load error:", err);
        }
    }, []);

    useEffect(() => {
        loadQuiz();
    }, [loadQuiz]);

    useEffect(() => {
        if (timeLeft === null || showStudentForm || isSubmitting) return;

        if (timeLeft <= 0) {
            completeQuiz();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, showStudentForm, isSubmitting, completeQuiz]);

    const startQuiz = useCallback(() => {
        if (!studentInfo.name) {
            setError("Please enter your name to start the assessment.");
            return;
        }
        setShowStudentForm(false);
        setStartTime(new Date());
        setError("");
    }, [studentInfo.name]);

    const handleAnswerChange = useCallback((answer) => {
        setCurrentAnswer(answer);
    }, []);

    const nextQuestion = useCallback(() => {
        if (!currentAnswer.trim()) {
            setError("Please provide an answer before proceeding.");
            return;
        }
        setError("");

        if (!quiz || !quiz.questions || quiz.questions.length === 0) {
            setError("Quiz questions not loaded correctly.");
            return;
        }

        const question = quiz.questions[currentQuestionIndex];

        // Store the raw answer only — grading happens on the server at submission.
        setAnswers(prevAnswers => {
            const updatedAnswers = {
                ...prevAnswers,
                [question.id]: currentAnswer
            };

            if (currentQuestionIndex === quiz.questions.length - 1) {
                setTimeout(() => completeQuizWithAnswers(updatedAnswers), 50);
            }

            return updatedAnswers;
        });

        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setCurrentAnswer("");
        }
    }, [currentAnswer, quiz, currentQuestionIndex, completeQuizWithAnswers]);

    if (error && !quiz) {
        return (
            <div className="min-h-screen py-8">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="min-h-screen py-8">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="animate-pulse">
                        <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4" />
                        <div className="h-4 bg-slate-200 rounded w-48 mx-auto mb-2" />
                        <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    if (showStudentForm) {
        return (
            <div className="min-h-screen py-8">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileQuestion className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-slate-900">{quiz.title}</CardTitle>
                            <p className="text-slate-600">{quiz.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-xl">
                                <h3 className="font-semibold text-slate-900 mb-4">Assessment Information</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FileQuestion className="w-4 h-4 text-purple-600" />
                                        <span>{quiz.questions.length + (hasEssays ? 1 : 0) > quiz.questions.length ? `${quiz.questions.length} Short Answer + Essays` : `${quiz.questions.length} Questions`}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-green-600" />
                                        <span>
                                            {hasEssays
                                                ? `${(quiz.short_answer_duration || 15) + (quiz.essay_duration || 25)} Minutes Total`
                                                : `${quiz.short_answer_duration || 15} Minutes`
                                            }
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                                        <span>{quiz.difficulty} Difficulty</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-orange-600" />
                                        <span>AI Graded</span>
                                    </div>
                                </div>
                                {hasEssays && (
                                    <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                        <p className="text-sm text-purple-700">
                                            <strong>Time Breakdown:</strong> {quiz.short_answer_duration || 15} min for short answers, {quiz.essay_duration || 25} min for essays
                                        </p>
                                        <p className="text-sm text-purple-700 mt-1">
                                            Your results will be shown after you complete the <strong>entire</strong> assessment (both sections).
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="student-name" className="text-sm font-medium text-slate-700">
                                        Your Name *
                                    </Label>
                                    <Input
                                        id="student-name"
                                        value={studentInfo.name}
                                        onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                                        placeholder="Enter your full name"
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="student-email" className="text-sm font-medium text-slate-700">
                                        Email (Optional)
                                    </Label>
                                    <Input
                                        id="student-email"
                                        type="email"
                                        value={studentInfo.email}
                                        onChange={(e) => setStudentInfo({...studentInfo, email: e.target.value})}
                                        placeholder="Enter your email address"
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="student-id" className="text-sm font-medium text-slate-700">
                                        Student ID (Optional)
                                    </Label>
                                    <Input
                                        id="student-id"
                                        value={studentInfo.idNumber}
                                        onChange={(e) => setStudentInfo({...studentInfo, idNumber: e.target.value})}
                                        placeholder="Enter your student ID number"
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            {error && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                onClick={startQuiz}
                                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 py-6 text-lg font-medium"
                            >
                                <User className="w-5 h-5 mr-2" />
                                Start Assessment
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (isSubmitting) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <Card className="max-w-md mx-auto shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                    <CardContent className="p-10 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-600 mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Submitting your answers…</h2>
                        <p className="text-slate-600">
                            Your responses are being securely graded.
                            {hasEssays ? " The essay section is next." : " Your results are coming up."}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
                        <p className="text-slate-600">Answer each question carefully</p>
                    </div>
                    {timeLeft !== null && (
                        <Timer
                            timeLeft={timeLeft}
                            onTimeUp={completeQuiz}
                        />
                    )}
                </div>

                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700 flex items-center justify-between gap-4">
                            <span>{error}</span>
                            {pendingAnswers && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => completeQuizWithAnswers(pendingAnswers)}
                                    className="border-red-300 text-red-700 hover:bg-red-100 shrink-0"
                                >
                                    Retry Submission
                                </Button>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <QuestionRenderer
                    question={quiz.questions[currentQuestionIndex]}
                    currentAnswer={currentAnswer}
                    onAnswerChange={handleAnswerChange}
                    onNext={nextQuestion}
                    isLast={currentQuestionIndex === quiz.questions.length - 1}
                    onComplete={nextQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={quiz.questions.length}
                    completeLabel={hasEssays ? "Submit & Continue to Essays" : "Submit Assessment"}
                />
            </div>
        </div>
    );
}
