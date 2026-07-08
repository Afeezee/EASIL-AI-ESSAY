
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Quiz } from "@/api/entities";
import { QuizAttempt } from "@/api/entities";
import { GradeEssay } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertCircle,
    Loader2,
    PenTool,
    BookOpen
} from "lucide-react";

import Timer from "../components/quiz/Timer";

// Totals are always recomputed from the full answers array — never accumulated
// incrementally — so scores stay consistent even after retries or timeouts.
function computeTotals(allAnswers) {
    const total = allAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    const max = allAnswers.reduce((sum, a) => sum + (a.max_score || 0), 0);
    return {
        total_score: total,
        max_possible_score: max,
        percentage: max > 0 ? Math.round((total / max) * 100) : 0
    };
}

export default function QuizEssay() {
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [essayQuestions, setEssayQuestions] = useState([]);
    const [currentEssayIndex, setCurrentEssayIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [timeLeft, setTimeLeft] = useState(null);
    // Graded essay answers accumulated locally; written to the attempt as we go.
    const essayAnswersRef = useRef([]);
    const finishingRef = useRef(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const urlQuizId = urlParams.get('quizId');
                const urlAttemptId = urlParams.get('attemptId');

                const quizId = urlQuizId || localStorage.getItem('currentQuizId');
                const attemptId = urlAttemptId || localStorage.getItem('currentAttemptId');

                if (!quizId || !attemptId) {
                    setError("Assessment session not found. Please start an assessment first.");
                    return;
                }

                const [quizList, attemptList] = await Promise.all([Quiz.list(), QuizAttempt.list()]);
                const foundQuiz = quizList.find(q => q.id === quizId);
                const foundAttempt = attemptList.find(a => a.id === attemptId);

                if (!foundQuiz || !foundAttempt) {
                    setError("Assessment or attempt data could not be loaded.");
                    return;
                }

                setQuiz(foundQuiz);
                setAttempt(foundAttempt);
                setEssayQuestions(foundQuiz.questions.filter(q => q.type === 'essay'));

                // Resume timer with essay duration
                const remainingEssayTime = localStorage.getItem('remainingEssayTime');
                if (remainingEssayTime && parseInt(remainingEssayTime, 10) > 0) {
                    setTimeLeft(parseInt(remainingEssayTime, 10));
                } else if (foundQuiz.essay_duration) {
                    setTimeLeft(foundQuiz.essay_duration * 60);
                }

                localStorage.setItem('currentQuizId', quizId);
                localStorage.setItem('currentAttemptId', attemptId);
            } catch (err) {
                setError("Failed to load assessment data. Please try again.");
                console.error("Load error:", err);
            }
        };

        loadData();
    }, []);

    // Persist all essay answers to the attempt and (when done) mark the WHOLE
    // assessment completed. Unanswered essays are recorded as 0 so the maximum
    // score always reflects the full assessment.
    const persistProgress = useCallback(async (isFinal) => {
        if (!attempt) return;

        const baseAnswers = Array.isArray(attempt.answers) ? attempt.answers : [];
        let combined = [...baseAnswers, ...essayAnswersRef.current];

        if (isFinal) {
            const answeredIds = new Set(combined.map(a => a.question_id));
            for (const q of essayQuestions) {
                if (!answeredIds.has(q.id)) {
                    combined.push({
                        question_id: q.id,
                        answer: "",
                        is_correct: false,
                        score: 0,
                        max_score: q.max_score || 10,
                        feedback: "No answer provided"
                    });
                }
            }
        }

        const totals = computeTotals(combined);
        await QuizAttempt.update(attempt.id, {
            answers: combined,
            ...totals,
            ...(isFinal ? { status: "completed", time_completed: new Date().toISOString() } : {})
        });
    }, [attempt, essayQuestions]);

    const finishAssessment = useCallback(async () => {
        if (finishingRef.current) return;
        finishingRef.current = true;
        try {
            await persistProgress(true);
        } catch (err) {
            console.error("Finalize error:", err);
        }
        localStorage.removeItem('remainingEssayTime');

        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('quizId') || localStorage.getItem('currentQuizId');
        const attemptId = urlParams.get('attemptId') || localStorage.getItem('currentAttemptId');

        if (quizId && attemptId) {
            navigate(`${createPageUrl("Review")}?quizId=${quizId}&attemptId=${attemptId}`);
        } else {
            navigate(createPageUrl("Review"));
        }
    }, [persistProgress, navigate]);

    // Grade the current essay on the server (strict, rubric-anchored, guardrailed)
    // and move on. Feedback is NOT shown here — results appear only in the final
    // review, after the whole assessment is completed.
    const submitCurrentEssay = useCallback(async ({ auto = false } = {}) => {
        const question = essayQuestions[currentEssayIndex];
        if (!question) return;

        const answerText = currentAnswer.trim();

        if (!answerText && !auto) {
            setError("Please write your answer before submitting.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            let graded = { score: 0, feedback: "No answer provided" };
            if (answerText) {
                graded = await GradeEssay({
                    question: question.question,
                    rubric: question.rubric,
                    max_score: question.max_score || 10,
                    answer: answerText
                });
            }

            essayAnswersRef.current.push({
                question_id: question.id,
                answer: answerText,
                score: graded.score,
                feedback: graded.feedback,
                max_score: question.max_score || 10,
                is_correct: graded.score >= (question.max_score || 10) / 2
            });

            if (currentEssayIndex < essayQuestions.length - 1 && !auto) {
                await persistProgress(false);
                setCurrentEssayIndex(prev => prev + 1);
                setCurrentAnswer("");
                setIsSubmitting(false);
            } else {
                await finishAssessment();
            }
        } catch (err) {
            console.error("Grading error:", err);
            if (auto) {
                // Time is up — never trap the student. Record for instructor review.
                essayAnswersRef.current.push({
                    question_id: question.id,
                    answer: answerText,
                    score: 0,
                    feedback: "Automatic grading was unavailable at submission time. This answer is recorded and should be reviewed by the instructor.",
                    max_score: question.max_score || 10,
                    is_correct: false
                });
                await finishAssessment();
            } else {
                setError(err.message || "Failed to grade this essay. Please try submitting again.");
                setIsSubmitting(false);
            }
        }
    }, [essayQuestions, currentEssayIndex, currentAnswer, persistProgress, finishAssessment]);

    const handleForceSubmit = useCallback(async () => {
        if (finishingRef.current || isSubmitting) return;
        await submitCurrentEssay({ auto: true });
    }, [submitCurrentEssay, isSubmitting, finishingRef]);

    useEffect(() => {
        if (timeLeft === null || isSubmitting) return;

        if (timeLeft <= 0) {
            localStorage.removeItem('remainingEssayTime');
            handleForceSubmit();
            return;
        }

        localStorage.setItem('remainingEssayTime', timeLeft.toString());

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, isSubmitting, handleForceSubmit]);

    if (error && !quiz) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <Alert className="max-w-xl mx-auto border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!quiz || essayQuestions.length === 0) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                    <p className="mt-4 text-slate-600">Loading essay questions...</p>
                </div>
            </div>
        );
    }

    const question = essayQuestions[currentEssayIndex];
    if (!question) {
        return (
            <div className="min-h-screen py-8 flex items-center justify-center">
                <Alert className="max-w-xl mx-auto border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">No more essay questions found or an error occurred.</AlertDescription>
                </Alert>
            </div>
        );
    }

    const isLastEssay = currentEssayIndex === essayQuestions.length - 1;

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Essay Questions</h1>
                        <p className="text-xl text-slate-600">Provide thoughtful and detailed answers. Results are shown after you finish the whole assessment.</p>
                    </div>
                    {timeLeft !== null && (
                        <Timer
                            timeLeft={timeLeft}
                            onTimeUp={handleForceSubmit}
                        />
                    )}
                </div>

                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                )}

                <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Question {currentEssayIndex + 1} of {essayQuestions.length}</CardTitle>
                            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                                Max Score: {question.max_score}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-xl font-semibold text-slate-900 leading-relaxed">{question.question}</p>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                                Grading Rubric
                            </h4>
                            <p className="text-slate-700 text-sm">{question.rubric}</p>
                        </div>

                        <Textarea
                            placeholder="Type your essay answer here..."
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            className="min-h-[250px] text-base"
                            disabled={isSubmitting}
                        />

                        <div className="flex justify-end">
                            <Button
                                onClick={() => submitCurrentEssay()}
                                disabled={!currentAnswer.trim() || isSubmitting}
                                className="bg-gradient-to-r from-purple-600 to-violet-600"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
                                    </>
                                ) : (
                                    <>
                                        <PenTool className="w-4 h-4 mr-2" /> {isLastEssay ? "Submit & Finish Assessment" : "Submit & Next Essay"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
