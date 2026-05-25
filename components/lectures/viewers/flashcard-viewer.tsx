"use client";

import { useState } from "react";
import { Flashcard } from "@/services/lectures/lecture.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return <div className="text-center text-slate-300">No flashcards</div>;
  }

  const current = flashcards[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setIsFlipped(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setIsFlipped(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-300">
        Card {currentIndex + 1} of {flashcards.length}
      </div>

      <div className="h-64 w-full" style={{ perspective: "1200px" }}>
        <motion.button
          type="button"
          onClick={() => setIsFlipped((prev) => !prev)}
          aria-label={isFlipped ? "Show question" : "Show answer"}
          className="relative h-full w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Card
            className="absolute inset-0 flex items-center justify-center overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 shadow-xl backdrop-blur-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-center">
              <div className="mb-4 text-xs uppercase tracking-[0.3em] text-indigo-200/80">
                Question
              </div>
              <div className="text-2xl font-semibold leading-snug text-white line-clamp-3">
                {current.frontText}
              </div>
            </div>
          </Card>

          <Card
            className="absolute inset-0 flex items-center justify-center overflow-hidden border border-emerald-300/20 bg-gradient-to-br from-emerald-400/20 via-cyan-400/10 to-white/0 p-6 shadow-xl backdrop-blur-sm"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="text-center">
              <div className="mb-4 text-xs uppercase tracking-[0.3em] text-emerald-100/80">
                Answer
              </div>
              <div className="text-2xl font-semibold leading-snug text-white line-clamp-3">
                {current.backText}
              </div>
            </div>
          </Card>
        </motion.button>
      </div>

      <div className="flex gap-2 justify-between">
        <Button onClick={handlePrev} variant="outline" className="border-white/10 text-slate-200">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button onClick={handleNext} variant="outline" className="border-white/10 text-slate-200">
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
