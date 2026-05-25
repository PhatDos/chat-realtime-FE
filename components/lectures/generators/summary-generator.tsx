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
  alreadyGenerated?: boolean;
}

export function SummaryGenerator({
  lectureId,
  onGenerate,
  isGenerating,
  alreadyGenerated = false,
}: SummaryGeneratorProps) {
  const [tone, setTone] = useState<SummaryTone>(SummaryTone.CONCISE);

  const handleGenerate = async () => {
    await onGenerate(tone);
  };

  return (
    <div className="space-y-4 p-4 border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.03] rounded-2xl">
      <h3 className="font-semibold text-lg text-white">Generate Summary</h3>
      
      <div>
        <label className="text-sm font-medium mb-2 block text-slate-200">Tone</label>
        <Select value={tone} onValueChange={(value) => setTone(value as SummaryTone)}>
          <SelectTrigger className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-colors" disabled={isGenerating || alreadyGenerated}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999] border-white/10 bg-slate-900 shadow-2xl shadow-black/50">
            <SelectItem value={SummaryTone.CONCISE} className="text-slate-200">Concise</SelectItem>
            <SelectItem value={SummaryTone.DETAILED} className="text-slate-200">Detailed</SelectItem>
            <SelectItem value={SummaryTone.SIMPLE} className="text-slate-200">Simple</SelectItem>
            <SelectItem value={SummaryTone.ACADEMIC} className="text-slate-200">Academic</SelectItem>
          </SelectContent>
        </Select>
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
          "Generate Summary"
        )}
      </Button>
    </div>
  );
}
