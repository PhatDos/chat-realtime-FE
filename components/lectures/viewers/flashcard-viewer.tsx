"use client";

import { useState } from "react";
import { Flashcard } from "@/services/lectures/lecture.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return <div className="text-center text-muted-foreground">No flashcards</div>;
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
      <div className="text-sm text-muted-foreground">
        Card {currentIndex + 1} of {flashcards.length}
      </div>

      <Card
        onClick={() => setIsFlipped(!isFlipped)}
        className="h-64 cursor-pointer flex items-center justify-center p-6 bg-gradient-to-br from-primary to-secondary hover:shadow-lg transition-shadow"
      >
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-4">
            {isFlipped ? "Answer" : "Question"}
          </div>
          <div className="text-2xl font-semibold line-clamp-3">
            {isFlipped ? current.backText : current.frontText}
          </div>
        </div>
      </Card>

      <div className="flex gap-2 justify-between">
        <Button onClick={handlePrev} variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button onClick={handleNext} variant="outline">
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
