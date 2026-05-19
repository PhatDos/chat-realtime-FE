"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLectureData } from "@/hooks/lectures/use-lecture-data";
import { SummaryGenerator } from "@/components/lectures/generators/summary-generator";
import { FlashcardGenerator } from "@/components/lectures/generators/flashcard-generator";
import { QuizGenerator } from "@/components/lectures/generators/quiz-generator";
import { SummaryViewer } from "@/components/lectures/viewers/summary-viewer";
import { FlashcardViewer } from "@/components/lectures/viewers/flashcard-viewer";
import { QuizTaker } from "@/components/lectures/viewers/quiz-taker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LectureDetailPage() {
  const { lectureId } = useParams();
  const { lecture, loading, generating, fetchLecture, generateSummary, generateFlashcards, generateQuiz } =
    useLectureData(lectureId as string);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchLecture();
  }, [lectureId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">Lecture not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Link href="/lectures">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold">{lecture.title}</h1>
        <p className="text-muted-foreground mt-1">
          Uploaded {new Date(lecture.createdAt).toLocaleDateString()}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Generate Learning Materials</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryGenerator
                lectureId={lecture.id}
                onGenerate={generateSummary}
                isGenerating={generating.summary || false}
              />
              <FlashcardGenerator
                lectureId={lecture.id}
                onGenerate={generateFlashcards}
                isGenerating={generating.flashcards || false}
              />
              <QuizGenerator
                lectureId={lecture.id}
                onGenerate={generateQuiz}
                isGenerating={generating.quiz || false}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          {lecture.summaries && lecture.summaries.length > 0 ? (
            <div className="space-y-4">
              {lecture.summaries.map((summary) => (
                <SummaryViewer key={summary.id} summary={summary} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No summaries generated yet. Generate one from Overview tab.
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flashcards" className="space-y-4">
          {lecture.flashcards && lecture.flashcards.length > 0 ? (
            <FlashcardViewer flashcards={lecture.flashcards} />
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No flashcards generated yet. Generate some from Overview tab.
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quiz" className="space-y-4">
          {lecture.quizzes && lecture.quizzes.length > 0 ? (
            <div className="space-y-4">
              {lecture.quizzes.map((quiz) => (
                <Card key={quiz.id} className="p-6">
                  <h3 className="text-xl font-semibold mb-4">{quiz.title}</h3>
                  <QuizTaker
                    quiz={quiz}
                    onSubmit={async (answers) => {
                      // TODO: Implement quiz submission
                      console.log("Quiz submitted:", answers);
                    }}
                    isSubmitting={false}
                  />
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No quizzes generated yet. Generate one from Overview tab.
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
