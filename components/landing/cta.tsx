"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export function CTA() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    router.push("/setup");
  };

  return (
    <section className="py-20 sm:py-28 bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="max-w-4xl mx-auto text-center rounded-3xl p-12 sm:p-16 border border-gray-200 dark:border-gray-700 
                        bg-gradient-to-br from-blue-50 to-blue-100 dark:from-purple-900 dark:to-purple-700 transition-colors"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-black dark:text-white">
            Ready to build your academic collaboration space?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Bring chat, newsfeed, class groups, video sessions, and AI search into one workspace for students and teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-purple-500 dark:to-pink-500 
                         text-white hover:opacity-90 text-base px-8 h-12"
              onClick={handleGetStarted}
            >
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  Create Your Space
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-6">
            Free forever • No credit card required • Built for student collaboration
          </p>
        </div>
      </div>
    </section>
  );
}
