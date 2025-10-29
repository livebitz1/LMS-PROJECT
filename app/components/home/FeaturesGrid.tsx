"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BookOpen, FileText, MessageSquare, Clipboard } from "lucide-react";

const FEATURES = [
    {
        id: "courses",
        title: "Courses",
        desc: "Create, organize and share course material with rich content and modules.",
    },
    {
        id: "assignments",
        title: "Assignments",
        desc: "Assign homework, collect submissions, and give feedback inline.",
    },
    {
        id: "messaging",
        title: "Messaging",
        desc: "Direct messaging and group discussions to keep students and teachers connected.",
    },
    {
        id: "gradebook",
        title: "Gradebook",
        desc: "Track progress, grades, and analytics for each student and course.",
    },
];

export default function FeaturesGrid() {
    const [isVisible, setIsVisible] = useState(false);
    const [imageVisible, setImageVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    // Observe section for card animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
        );

        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    // Observe image for pop-up animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setImageVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.3, rootMargin: "0px 0px -100px 0px" }
        );

        if (imageRef.current) observer.observe(imageRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={sectionRef}
            className="mt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
            {/* Section Header */}
            <div
                className={`text-center mb-12 transition-all duration-1000 ease-out ${
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: "0ms" }}
            >
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                    Collaboration features
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                    Everything you need to teach, learn, and connect — in one place.
                </p>
            </div>

            {/* Desktop: Staggered 2-Column */}
            <div className="hidden md:grid md:grid-cols-2 gap-8 lg:gap-12">
                {FEATURES.map((feature, idx) => (
                    <div
                        key={feature.id}
                        className={`
              group relative p-6 sm:p-8 rounded-2xl bg-white border border-gray-100
              shadow-sm transition-all duration-700 ease-out
              ${isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}
            `}
                        style={{
                            transitionDelay: `${150 + idx * 120}ms`,
                            transform: isVisible
                                ? idx % 2 === 0
                                    ? "translateY(2rem)"
                                    : "translateY(-2rem)"
                                : "translateY(12rem)",
                        }}
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-50/0 to-emerald-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        <div className="relative flex flex-col h-full">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shadow-inner border-2 border-black">
                                    <FeatureIcon id={feature.id} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
                                        {feature.title}
                                    </p>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                        {feature.title}
                                    </h3>
                                </div>
                            </div>

                            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed flex-1">
                                {feature.desc}
                            </p>

                            <div className="mt-6 flex items-center">
                                <span className="text-sm font-medium text-slate-500 group-hover:text-emerald-700 transition-colors duration-300">
                                    Learn more
                                </span>
                                <div className="ml-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile: Horizontal scrollable square cards */}
            <div className="md:hidden">
                <div
                    className="flex gap-4 overflow-x-auto py-4 px-4 -mx-4"
                    style={{ WebkitOverflowScrolling: "touch" }}
                    aria-label="Features carousel"
                >
                    {FEATURES.map((feature, idx) => (
                        <div
                            key={feature.id}
                            className={`
                                snap-start flex-shrink-0 w-64 sm:w-72 aspect-square 
                                p-5 sm:p-6 rounded-2xl bg-white border border-gray-100 shadow-sm
                                flex flex-col
                                transition-all duration-700 ease-out
                                ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}
                            `}
                            style={{ transitionDelay: `${100 + idx * 80}ms` }}
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center shadow-inner border-2 border-black">
                                        <FeatureIcon id={feature.id} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
                                            {feature.title}
                                        </p>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                                            {feature.title}
                                        </h3>
                                    </div>
                                </div>

                                <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">
                                    {feature.desc}
                                </p>

                                <div className="mt-3">
                                    <span className="text-sm font-medium text-slate-500 group-hover:text-emerald-700 transition-colors">
                                        Learn more
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom spacing */}
            <div className="h-16 md:h-20" />

            {/* IMAGE-1 with Pop-Up Animation */}
            <div
                ref={imageRef}
                className={`
          mt-8 flex justify-center transition-all duration-700 ease-out
          ${imageVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"}
        `}
                style={{
                    transformOrigin: "center",
                    transitionDelay: "100ms",
                }}
            >
                <div className="w-full max-w-7xl rounded-lg shadow-md overflow-hidden">
                    <Image
                        src="/IMAGE-1.png"
                        alt="Collaboration features illustration"
                        width={1600}
                        height={900}
                        className="w-full h-auto object-cover block"
                        style={{
                            animation: imageVisible ? "popBounce 0.6s ease-out forwards" : "none",
                        }}
                        unoptimized
                    />
                </div>
            </div>
        </section>
    );
}

/* ========================================
   Minimal Icon Set (with className support)
   ======================================== */
function FeatureIcon({ id, className }: { id: string; className?: string }) {
    const defaultClass = className || "w-5 h-5";
    const icons: Record<string, React.ReactElement> = {
        courses: <BookOpen className={defaultClass} />,
        assignments: <FileText className={defaultClass} />,
        messaging: <MessageSquare className={defaultClass} />,
        gradebook: <Clipboard className={defaultClass} />,
    };

    return icons[id] || null;
}

/* ========================================
   Pop-Up Bounce Animation
   ======================================== */
const style = `
  @keyframes popBounce {
    0% {
      transform: scale(0.75);
      opacity: 0;
    }
    60% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

/* Inject CSS */
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = style;
  document.head.appendChild(styleEl);
}