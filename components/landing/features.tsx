"use client";

import { Shield, Zap, Users, Lock, Globe, Smartphone } from "lucide-react";
import BlurText from "../animation/blur-text";

export function Features() {
  const features = [
    {
      icon: Zap,
      title: "Realtime Collaboration",
      description:
        "Keep teams aligned with fast chat, voice, and shared workspace updates.",
    },
    {
      icon: Shield,
      title: "Privacy Controls",
      description:
        "Visibility settings keep private classes and team spaces protected.",
    },
    {
      icon: Users,
      title: "Study Groups & Teams",
      description:
        "Create servers for classes, capstone teams, clubs, and project squads.",
    },
    {
      icon: Lock,
      title: "Academic Newsfeed",
      description: "Share announcements, resources, and project updates in one place.",
    },
    {
      icon: Globe,
      title: "AI-assisted Search",
      description: "Search discussions semantically to find the right context faster.",
    },
    {
      icon: Smartphone,
      title: "Video Sessions",
      description: "Support meetings, rehearsals, and remote study sessions anywhere.",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 sm:py-28 bg-[var(--background)] text-[var(--foreground)] transition-colors"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-black dark:text-white">
            <BlurText
              text="Everything students need to collaborate and learn"
              delay={150}
              animateBy="words"
              direction="top"
              className="!block text-center mx-auto"
            />
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            A focused academic collaboration platform combining realtime communication, social sharing, and AI-assisted knowledge retrieval.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-700 
                           hover:border-transparent hover:bg-gradient-to-tr hover:from-blue-100 hover:to-cyan-200
                           dark:hover:from-purple-800 dark:hover:to-pink-600 transition-all duration-300"
              >
                <div
                  className="p-3 rounded-xl w-fit mb-4 
                                bg-blue-50 dark:bg-purple-900 group-hover:bg-gradient-to-tr group-hover:from-blue-200 group-hover:to-cyan-400
                                dark:group-hover:from-purple-700 dark:group-hover:to-pink-500 transition-colors"
                >
                  <Icon className="h-6 w-6 text-blue-500 dark:text-purple-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
