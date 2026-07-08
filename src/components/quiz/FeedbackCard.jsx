import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function FeedbackCard({ question, userAnswer, isCorrect, explanation }) {
    return (
        <Card className={`border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-slate-900 mb-2">
                            {question.question}
                        </div>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-medium text-slate-700">Your answer: </span>
                                <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                    {userAnswer}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-slate-700">Correct answer: </span>
                                <span className="text-green-700">{question.correct_answer}</span>
                            </div>
                            {explanation && (
                                <div className="mt-3 p-3 bg-white/50 rounded-lg border border-slate-200">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium text-slate-800 mb-1">Explanation:</div>
                                            <div className="text-slate-600">{explanation}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}