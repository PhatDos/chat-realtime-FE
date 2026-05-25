"use client";

import { motion } from "framer-motion";
import CountUp from "../animation/count-up";

export default function SignInStats() {
  const stats = [
    { value: 130, unit: "", label: "Active Users", sublabel: "worldwide" },
    { value: 99.9, unit: "%", label: "Uptime", sublabel: "guaranteed" },
    { value: 50, unit: "ms", label: "Latency", sublabel: "average" },
  ];

  return (
    <section className="relative overflow-visible bg-transparent py-24 text-gray-100 sm:py-32">
      {/* decorative blurred blobs */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.16, scale: 1 }}
        transition={{ duration: 1.2 }}
        className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-tr from-[#7c3aed]/70 to-[#06b6d4]/60 blur-3xl"
      />

      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.12, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.2 }}
        className="pointer-events-none absolute -bottom-10 right-8 w-72 h-72 rounded-full bg-gradient-to-br from-[#cc7070]/40 to-[#0f3460]/40 blur-3xl"
      />

      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: -16, rotate: 8 }}
        animate={{ opacity: 0.45, y: 0, rotate: 12 }}
        transition={{ duration: 1.1, delay: 0.1 }}
        className="pointer-events-none absolute right-20 top-8 h-16 w-16 rounded-2xl border border-sky-200/30 bg-sky-200/10"
      />

      <motion.div
        aria-hidden
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 0.5, x: 0 }}
        transition={{ duration: 1.1, delay: 0.25 }}
        className="pointer-events-none absolute bottom-8 left-20 h-14 w-14 rounded-full border border-rose-200/40 bg-rose-200/10"
      />

      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
          Join a fast, private community
        </h2>
        <p className="mx-auto max-w-xl text-base text-gray-300">
          Connect instantly with people around the world - low latency, high
          reliability, and privacy-first by design. Build your space with
          channels, voice rooms, and seamless collaboration.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
          >
            Real-time Messaging
          </button>
          <button
            type="button"
            className="rounded-full border border-sky-300/30 bg-sky-300/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/20"
          >
            Voice Channels
          </button>
          <button
            type="button"
            className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-300/20"
          >
            Secure & Private
          </button>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 * index }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center"
            >
              <div className="mb-2 bg-gradient-to-r from-[#7dd3fc] to-[#c084fc] bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
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
              <div className="mb-1 text-base font-semibold text-gray-200 sm:text-lg">
                {stat.label}
              </div>
              <div className="text-sm text-gray-400">{stat.sublabel}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
