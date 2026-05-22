"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface FlashcardGeneratorProps {
  lectureId: string;
  onGenerate: (count: number) => Promise<void>;
  isGenerating: boolean;
  alreadyGenerated?: boolean;
}

export function FlashcardGenerator({
  lectureId,
  onGenerate,
  isGenerating,
  alreadyGenerated = false,
}: FlashcardGeneratorProps) {
  const [count, setCount] = useState(10);

  const handleGenerate = async () => {
    await onGenerate(count);
  };

  return (
    <div className="space-y-4 p-4 border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.03] rounded-2xl">
      <h3 className="font-semibold text-lg text-white">Generate Flashcards</h3>
      
      <div>
        <label className="text-sm font-medium mb-2 block text-slate-200">Number of Flashcards</label>
        <Input
          type="number"
          min="1"
          max="50"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value))}
          className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-colors"
          disabled={isGenerating || alreadyGenerated}
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || alreadyGenerated}
        className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all duration-200"
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
