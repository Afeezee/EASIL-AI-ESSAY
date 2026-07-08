
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function QuestionRenderer({
    question,
    currentAnswer,
    onAnswerChange,
    onNext,
    isLast,
    onComplete,
    questionNumber,
    totalQuestions,
    completeLabel = 'Complete Assessment'
}) {
    const renderMCQ = () => (
        <div className="space-y-4">
            <RadioGroup value={currentAnswer} onValueChange={onAnswerChange}>
                {question.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-slate-700">
                            {option}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );

    const renderTrueFalse = () => (
        <div className="space-y-4">
            <RadioGroup value={currentAnswer} onValueChange={onAnswerChange}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="True" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer text-slate-700">True</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value="False" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer text-slate-700">False</Label>
                </div>
            </RadioGroup>
        </div>
    );

    const renderShortAnswer = () => (
        <div className="space-y-4">
            <Textarea
                value={currentAnswer}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Enter your answer here..."
                className="min-h-[120px] resize-none"
            />
            <p className="text-sm text-slate-500">
                Provide a clear and concise answer. It will be graded against the expected key points after you submit the assessment.
            </p>
        </div>
    );

    const handleButtonClick = () => {
        if (isLast) {
            onComplete();
        } else {
            onNext();
        }
    };

    return (
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
                {/* Progress indicator */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-600">
                            Question {questionNumber} of {totalQuestions}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                            {question.type.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                            className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 leading-relaxed">
                        {question.question}
                    </h2>
                </div>

                {/* Answer input */}
                <div className="mb-8">
                    {question.type === 'mcq' && renderMCQ()}
                    {question.type === 'true_false' && renderTrueFalse()}
                    {question.type === 'short_answer' && renderShortAnswer()}
                </div>

                {/* Navigation */}
                <div className="flex justify-end">
                    <Button
                        onClick={handleButtonClick}
                        disabled={!currentAnswer || (typeof currentAnswer === 'string' && !currentAnswer.trim())}
                        className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 px-8 py-3 font-medium"
                    >
                        {isLast ? completeLabel : 'Next Question'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
