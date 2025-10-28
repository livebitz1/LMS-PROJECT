"use client";

import GetStartedButton from "../GetStartedButton";
import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Sparkles, Users, Target } from "lucide-react";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(6, 78, 59, 0.06) 0%, transparent 50%)
        `,
      }}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            transform: "translateZ(0)",
          }}
        />
      </div>

      {/* Mouse-following Gradient Orb */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        animate={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(16, 185, 129, 0.12), transparent 80%)`,
        }}
        transition={{ type: "tween", ease: "easeOut" }}
      />

      {/* Main Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 text-center px-6 sm:px-8 md:px-12 lg:px-16 max-w-5xl mx-auto"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm border border-emerald-200"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Era of Collaborative Learning</span>
        </motion.div>

        {/* Main Heading - Split & Animated */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="block bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-700 bg-clip-text text-transparent"
          >
            Learn together,
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent mt-2"
          >
            teach better.
          </motion.span>
        </h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-6 text-lg sm:text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light"
        >
          A collaborative LMS where students and teachers{" "}
          <span className="font-medium text-slate-800">create</span>,{" "}
          <span className="font-medium text-emerald-700">share</span> and{" "}
          <span className="font-medium text-teal-700">track</span> learning — all in one place.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-10 flex items-center justify-center"
        >
          <GetStartedButton />
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>10K+ Active Students</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            <span>95% Success Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span>AI-Powered Insights</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />

      {/* Responsive Adjustments */}
      <style jsx>{`
        @media (max-width: 640px) {
          h1 {
            font-size: 3.5rem !important;
          }
          p {
            font-size: 1.125rem !important;
          }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          h1 {
            font-size: 4.5rem !important;
          }
        }
      `}</style>
    </section>
  );
}