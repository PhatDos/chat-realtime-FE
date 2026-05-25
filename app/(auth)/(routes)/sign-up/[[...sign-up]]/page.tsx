"use client";

import { motion } from "framer-motion";
import { SignUp } from "@clerk/nextjs";
import SignInStats from "@/components/auth/signin-stats";

const fadeIn = (delay = 0) => ({
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
    viewport: { once: true },
});

export default function Page() {
    return (
        <div className="relative w-full h-screen overflow-x-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(204,112,112,0.22),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_32%)]" />

            <div className="relative h-screen min-[1100px]:grid min-[1100px]:grid-cols-[63fr_35fr]">
                <section className="!hidden min-[1100px]:!flex items-center justify-center px-6 lg:px-10 xl:px-16">
                    <div className="w-full max-w-5xl space-y-10">
                        <motion.div id="stats" {...fadeIn(0.2)}>
                            <SignInStats />
                        </motion.div>
                    </div>
                </section>

                <section className="flex h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="mb-8 text-center animate-in slide-in-from-top-4 fade-in duration-700">
                            <h1 className="mb-2 bg-gradient-to-r from-[#cc7070] to-[var(--primary-accent)] bg-clip-text text-4xl font-bold text-transparent">
                                Welcome
                            </h1>
                            <p className="text-gray-300">Continue your journey here</p>
                        </div>

                        <div className="transform transition-all duration-500 hover:scale-[1.01]">
                            <SignUp />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}