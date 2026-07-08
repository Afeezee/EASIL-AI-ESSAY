
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { InvokeLLM, UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Quiz } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
    Upload,
    FileText,
    Sparkles,
    AlertCircle,
    CheckCircle,
    Loader2,
    Settings,
    Eye,
    Code,
    Share,
    Copy,
    Check,
    ExternalLink
} from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";

export default function InstructorUpload() {
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [generatedQuiz, setGeneratedQuiz] = useState(null);
    const [savedQuiz, setSavedQuiz] = useState(null); // New state to hold the saved quiz object
    const [showPreview, setShowPreview] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        difficulty: "medium",
        shortAnswerDuration: 15,
        essayDuration: 25,
        shortAnswerCount: 3,
        essayCount: 2
    });

    const [uploadedFile, setUploadedFile] = useState(null);
    const [markingGuide, setMarkingGuide] = useState("");
    const [extractedContent, setExtractedContent] = useState("");

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setError("");
        setSuccess("");

        try {
            // Upload the file
            const { file_url, file_type } = await UploadFile({ file });
            setUploadedFile({ name: file.name, url: file_url, type: file_type || file.name.split('.').pop()?.toUpperCase() || 'document' });

            // Extract content from the file
            const extractResult = await ExtractDataFromUploadedFile({
                file_url,
                json_schema: {
                    type: "object",
                    properties: {
                        content: { type: "string", description: "The full text content from the document" }
                    }
                }
            });

            if (extractResult.status === "success" && extractResult.output) {
                setExtractedContent(extractResult.output.content);
                setSuccess(`Successfully uploaded and extracted content from ${file.name}`);
            } else {
                throw new Error("Failed to extract content from the uploaded file");
            }
        } catch (err) {
            const message = err?.message || 'Unknown upload error';
            setError(`Upload failed: ${message}`);
            console.error("Upload error:", err);
        }

        setIsUploading(false);
    };

    const generateQuiz = async () => {
        if (!extractedContent || !formData.title) {
            setError("Please upload a file and provide an assessment title");
            return;
        }

        setIsGenerating(true);
        setError("");

        try {
            const totalQuestions = formData.shortAnswerCount + formData.essayCount;

            const prompt = `Generate a comprehensive assessment based on the following course material. Create exactly ${totalQuestions} questions with the specified distribution:

REQUIREMENTS:
- ${formData.shortAnswerCount} Short Answer Questions (${formData.shortAnswerDuration} minutes allocated)
- ${formData.essayCount} Essay Questions (${formData.essayDuration} minutes allocated)

Assessment Details:
- Title: ${formData.title}
- Description: ${formData.description}
- Difficulty: ${formData.difficulty}
- Short Answer Duration: ${formData.shortAnswerDuration} minutes
- Essay Duration: ${formData.essayDuration} minutes

${markingGuide ? `Marking Guide: ${markingGuide}` : ''}

Course Material:
${extractedContent.substring(0, 8000)}

For each question, provide:
1. Clear, well-written, unambiguous question text with a single defensible interpretation
2. For Short Answer: the correct_answer field must be a complete model answer listing EVERY key point required for full marks, phrased as distinct concepts (separated by semicolons), including common synonyms students might use
3. For Essay: a rubric with 3-5 NUMBERED criteria, each with an explicit point allocation that sums exactly to max_score (e.g. "1. Defines X correctly (3 points); 2. Explains the mechanism of Y (4 points); 3. Gives a relevant example (3 points)")
4. A brief explanation of the correct answer that a student can learn from

Quality requirements:
- Questions must test understanding and application, not just memorization
- Every question must be answerable from the course material provided
- Difficulty must match the ${formData.difficulty} level consistently across all questions
- Rubrics must be objective enough that two different examiners would award the same score`;

            const response = await InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        questions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    type: { type: "string", enum: ["short_answer", "essay"] },
                                    question: { type: "string" },
                                    correct_answer: { type: "string" },
                                    rubric: { type: "string" },
                                    max_score: { type: "number" },
                                    explanation: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            // Add IDs to questions if not present
            const questionsWithIds = response.questions.map((q, index) => ({
                ...q,
                id: q.id || `q_${index + 1}`
            }));

            const quizData = {
                title: response.title || formData.title,
                description: response.description || formData.description,
                difficulty: formData.difficulty,
                short_answer_duration: formData.shortAnswerDuration,
                essay_duration: formData.essayDuration,
                source_material: extractedContent.substring(0, 2000),
                marking_guide: markingGuide,
                questions: questionsWithIds,
                total_questions: totalQuestions,
                question_counts: {
                    short_answer: formData.shortAnswerCount,
                    essay: formData.essayCount
                }
            };

            setGeneratedQuiz(quizData);
            setSuccess("Assessment generated successfully! Review and save when ready.");
        } catch (err) {
            setError("Failed to generate assessment. Please try again.");
            console.error("Generation error:", err);
        }

        setIsGenerating(false);
    };

    const saveQuiz = async () => {
        if (!generatedQuiz) return;

        try {
            const savedAssessment = await Quiz.create(generatedQuiz);
            setSavedQuiz(savedAssessment); // Store the saved quiz in state
            setSuccess("Assessment saved successfully! Share the link with your students.");
        } catch (err) {
            setError("Failed to save assessment. Please try again.");
            console.error("Save error:", err);
        }
    };

    const copyStudentLink = async () => {
        if (!savedQuiz) return;
        const studentUrl = `${window.location.origin}${createPageUrl("QuizTake")}?quizId=${savedQuiz.id}`;
        const ok = await copyTextToClipboard(studentUrl);
        if (ok) {
            setLinkCopied(true);
            setSuccess("Student link copied to clipboard!");
            setTimeout(() => setLinkCopied(false), 2500);
        } else {
            setError("Could not copy automatically — please select the link text and copy it manually.");
        }
    };

    const openStudentLink = () => {
        if (!savedQuiz) return;
        const studentUrl = `${window.location.origin}${createPageUrl("QuizTake")}?quizId=${savedQuiz.id}`;
        window.open(studentUrl, '_blank');
    };

    const renderQuizPreview = () => {
        if (!generatedQuiz) return null;

        const totalDuration = (generatedQuiz.short_answer_duration || 0) + (generatedQuiz.essay_duration || 0);

        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{generatedQuiz.title}</h3>
                    <p className="text-slate-700 mb-4">{generatedQuiz.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white/50 p-3 rounded-lg">
                            <div className="font-semibold text-orange-600">Short Answer</div>
                            <div className="text-slate-700">{generatedQuiz.questions.filter(q => q.type === 'short_answer').length} questions</div>
                        </div>
                        <div className="bg-white/50 p-3 rounded-lg">
                            <div className="font-semibold text-purple-600">Essay</div>
                            <div className="text-slate-700">{generatedQuiz.questions.filter(q => q.type === 'essay').length} questions</div>
                        </div>
                        <div className="bg-white/50 p-3 rounded-lg">
                            <div className="font-semibold text-indigo-600">Total Duration</div>
                            <div className="text-slate-700">{totalDuration} minutes</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {generatedQuiz.questions.slice(0, 3).map((question, index) => (
                        <Card key={question.id} className="border border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900 mb-2">{question.question}</p>
                                        <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md inline-block">
                                            {question.type.replace('_', ' ').toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {generatedQuiz.questions.length > 3 && (
                        <div className="text-center text-slate-500 text-sm">
                            ... and {generatedQuiz.questions.length - 3} more questions
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Create Your Assessment with EASIL</h1>
                    <p className="text-xl text-slate-600">Upload course materials and generate AI-powered grading for short answer and essay questions.</p>
                </div>

                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6 border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                )}

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5 text-purple-600" />
                                Upload Course Material
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="file-upload" className="text-sm font-medium text-slate-700">
                                    Course Document
                                </Label>
                                <p className="text-sm text-slate-500 mt-1">
                                    Supports PDF, DOC/DOCX, TXT, Markdown, and JSON files.
                                </p>
                                <div className="mt-2">
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,.md,.json"
                                        onChange={handleFileUpload}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer cursor-pointer border border-slate-300 rounded-lg"
                                        disabled={isUploading}
                                    />
                                </div>
                                {uploadedFile && (
                                    <div className="mt-3 space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-green-700 font-medium">{uploadedFile.name}</span>
                                            <span className="text-xs text-green-600">{uploadedFile.type || 'document uploaded'}</span>
                                        </div>
                                        {extractedContent ? (
                                            <div className="rounded-md border border-green-200 bg-white/80 p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">Extracted preview</p>
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-6">
                                                    {extractedContent.slice(0, 1200)}{extractedContent.length > 1200 ? '…' : ''}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="marking-guide" className="text-sm font-medium text-slate-700">
                                    Marking Guide (Optional)
                                </Label>
                                <Textarea
                                    id="marking-guide"
                                    placeholder="Enter any specific marking criteria or focus areas..."
                                    value={markingGuide}
                                    onChange={(e) => setMarkingGuide(e.target.value)}
                                    className="mt-2 min-h-[100px]"
                                />
                            </div>

                            {isUploading && (
                                <div className="flex items-center gap-2 text-purple-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Processing file...</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assessment Configuration */}
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-violet-600" />
                                Assessment Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label htmlFor="title">Assessment Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="Enter assessment title..."
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Brief description of the assessment..."
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="difficulty">Difficulty Level</Label>
                                    <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                                        <SelectTrigger className="mt-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-semibold text-purple-900">Question Configuration</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="sa-count">Short Answer Questions</Label>
                                        <Input
                                            id="sa-count"
                                            type="number"
                                            min="0"
                                            max="20"
                                            value={formData.shortAnswerCount}
                                            onChange={(e) => setFormData({...formData, shortAnswerCount: parseInt(e.target.value) || 0})}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="essay-count">Essay Questions</Label>
                                        <Input
                                            id="essay-count"
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={formData.essayCount}
                                            onChange={(e) => setFormData({...formData, essayCount: parseInt(e.target.value) || 0})}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-semibold text-purple-900">Time Allocation</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="sa-duration">Short Answer Time (minutes)</Label>
                                        <Input
                                            id="sa-duration"
                                            type="number"
                                            min="5"
                                            max="120"
                                            value={formData.shortAnswerDuration}
                                            onChange={(e) => setFormData({...formData, shortAnswerDuration: parseInt(e.target.value) || 5})}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Time for all short answer questions</p>
                                    </div>

                                    <div>
                                        <Label htmlFor="essay-duration">Essay Time (minutes)</Label>
                                        <Input
                                            id="essay-duration"
                                            type="number"
                                            min="10"
                                            max="180"
                                            value={formData.essayDuration}
                                            onChange={(e) => setFormData({...formData, essayDuration: parseInt(e.target.value) || 10})}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Time for all essay questions</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                    <p className="text-sm text-purple-700">
                                        <strong>Total Time:</strong> {formData.shortAnswerCount > 0 && formData.essayCount > 0
                                            ? `${formData.shortAnswerDuration + formData.essayDuration} minutes`
                                            : formData.shortAnswerCount > 0
                                                ? `${formData.shortAnswerDuration} minutes`
                                                : `${formData.essayDuration} minutes`}
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={generateQuiz}
                                disabled={!extractedContent || !formData.title || isGenerating}
                                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 py-6 text-lg font-medium"
                            >
                                {isGenerating ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating Assessment...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        Generate Assessment
                                    </div>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Generated Assessment Preview */}
                {generatedQuiz && (
                    <Card className="mt-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Generated Assessment Preview
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowPreview(!showPreview)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        {showPreview ? 'Hide' : 'Show'} Preview
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowDebug(!showDebug)}
                                    >
                                        <Code className="w-4 h-4 mr-2" />
                                        JSON
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {showPreview && renderQuizPreview()}

                            {showDebug && (
                                <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                                    <pre className="text-xs overflow-auto max-h-96">
                                        {JSON.stringify(generatedQuiz, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="flex gap-4 mt-6">
                                <Button
                                    onClick={saveQuiz}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3 font-medium"
                                    disabled={savedQuiz} // Disable if already saved
                                >
                                    {savedQuiz ? 'Assessment Saved' : 'Save Assessment'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={generateQuiz}
                                    disabled={isGenerating}
                                    className="px-6"
                                >
                                    Regenerate
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Student Link Section */}
                {savedQuiz && (
                    <Card className="mt-8 shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share className="w-5 h-5 text-green-600" />
                                Share Assessment with Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-white rounded-lg border border-green-200">
                                <p className="text-sm text-slate-600 mb-3">Students can access this assessment directly using the link below:</p>
                                <div className="flex gap-2">
                                    <Input
                                        value={`${window.location.origin}${createPageUrl("QuizTake")}?quizId=${savedQuiz.id}`}
                                        readOnly
                                        className="flex-1 bg-slate-50 text-xs"
                                    />
                                    <Button
                                        onClick={copyStudentLink}
                                        size="sm"
                                        variant="outline"
                                        className={`flex items-center gap-2 ${linkCopied ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-50' : ''}`}
                                    >
                                        {linkCopied ? (
                                            <>
                                                <Check className="w-4 h-4 text-green-600" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={openStudentLink}
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">
                                Share this link with your students. They'll be able to enter their information and take the assessment directly.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
