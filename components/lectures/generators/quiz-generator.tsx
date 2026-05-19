"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface QuizGeneratorProps {
  lectureId: string;
  onGenerate: (questionCount: number) => Promise<void>;
  isGenerating: boolean;
}

export function QuizGenerator({
  lectureId,
  onGenerate,
  isGenerating,
}: QuizGeneratorProps) {
  const [questionCount, setQuestionCount] = useState(5);

  const handleGenerate = async () => {
    await onGenerate(questionCount);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold text-lg">Generate Quiz</h3>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Number of Questions</label>
        <Input
          type="number"
          min="1"
          max="50"
          value={questionCount}
          onChange={(e) => setQuestionCount(parseInt(e.target.value))}
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Quiz"
        )}
      </Button>
    </div>
  );
}
