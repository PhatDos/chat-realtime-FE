"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface FlashcardGeneratorProps {
  lectureId: string;
  onGenerate: (count: number) => Promise<void>;
  isGenerating: boolean;
}

export function FlashcardGenerator({
  lectureId,
  onGenerate,
  isGenerating,
}: FlashcardGeneratorProps) {
  const [count, setCount] = useState(10);

  const handleGenerate = async () => {
    await onGenerate(count);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold text-lg">Generate Flashcards</h3>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Number of Flashcards</label>
        <Input
          type="number"
          min="1"
          max="50"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value))}
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
          "Generate Flashcards"
        )}
      </Button>
    </div>
  );
}
