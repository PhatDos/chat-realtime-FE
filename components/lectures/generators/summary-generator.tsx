"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SummaryTone } from "@/types/lecture";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface SummaryGeneratorProps {
  lectureId: string;
  onGenerate: (tone: SummaryTone) => Promise<void>;
  isGenerating: boolean;
}

export function SummaryGenerator({
  lectureId,
  onGenerate,
  isGenerating,
}: SummaryGeneratorProps) {
  const [tone, setTone] = useState<SummaryTone>(SummaryTone.CONCISE);

  const handleGenerate = async () => {
    await onGenerate(tone);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold text-lg">Generate Summary</h3>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Tone</label>
        <Select value={tone} onValueChange={(value) => setTone(value as SummaryTone)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SummaryTone.CONCISE}>Concise</SelectItem>
            <SelectItem value={SummaryTone.DETAILED}>Detailed</SelectItem>
            <SelectItem value={SummaryTone.SIMPLE}>Simple</SelectItem>
            <SelectItem value={SummaryTone.ACADEMIC}>Academic</SelectItem>
          </SelectContent>
        </Select>
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
          "Generate Summary"
        )}
      </Button>
    </div>
  );
}
