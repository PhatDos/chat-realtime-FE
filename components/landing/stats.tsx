"use client";

import CountUp from "../animation/count-up";

export function Stats() {
  const stats = [
    { value: 10, unit: "K+", label: "Study Spaces", sublabel: "organized by teams" },
    { value: 99.9, unit: "%", label: "Reliable Sync", sublabel: "for realtime work" },
    { value: 50, unit: "ms", label: "Fast Retrieval", sublabel: "for AI search" },
    { value: 150, unit: "+", label: "Academic Groups", sublabel: "publicly discoverable" },
  ];

  return (
    <section className="py-16 sm:py-20 border-y border-gray-200 dark:border-gray-700 bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-purple-500 dark:to-pink-500">
                <CountUp
                  from={0}
                  to={stat.value}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text"
                />
                {stat.unit}
              </div>
              <div className="text-base sm:text-lg font-semibold mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {stat.sublabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
