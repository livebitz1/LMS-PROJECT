"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Stethoscope, GraduationCap, Beaker } from "lucide-react";

export default function PopularSubjects() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Scroll-in Animation Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="popular-subjects"
      className="mt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Header - Fade In */}
      <div
        className={`text-center mb-10 transition-all duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
        style={{ transitionDelay: "100ms" }}
      >
        <h2
          id="popular-subjects"
          className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
        >
          Popular Subjects
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl mx-auto">
          Expert mentorship across competitive exams and school curriculum
        </p>
      </div>

      {/* Scrollable Container */}
      <div className="relative group">
        {/* Nav Buttons */}
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:text-emerald-600 hover:border-emerald-300"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={scrollRight}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:text-emerald-600 hover:border-emerald-300"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Cards - Staggered Animation */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto snap-x snap-mandatory flex gap-4 pb-6 no-scrollbar scroll-smooth"
        >
          {subjects.map((subject, idx) => (
            <article
              key={idx}
              className={`
                group snap-center flex-shrink-0 w-[300px] h-[320px] bg-white rounded-xl border border-black shadow-sm flex flex-col
                transition-all duration-700 ease-out
                ${isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}
              `}
              style={{ transitionDelay: `${200 + idx * 120}ms` }}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border-2 border-black transform-gpu transition-transform duration-200 ease-out group-hover:scale-105 group-hover:-translate-y-1">
                    <subject.icon className="w-5 h-5 text-emerald-600 transition-colors duration-200 group-hover:text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {subject.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-tight">
                      {subject.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Button List */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 scrollbar-compact">
                {subject.buttons.map((btn, i) => (
                  <button
                    key={i}
                    className="w-full text-left text-xs font-medium px-3 py-1.5 rounded-md bg-gray-50 text-slate-700 border border-black hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all duration-200 ease-out transform-gpu hover:-translate-y-1 hover:shadow-lg active:translate-y-0 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Dots - Fade In */}
        <div
          className={`flex justify-center gap-1.5 mt-5 transition-all duration-1000 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          {subjects.map((_, idx) => (
            <div
              key={idx}
              className="w-1.5 h-1.5 rounded-full bg-slate-300"
            />
          ))}
        </div>
      </div>

      {/* Custom Scrollbar */}
      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-compact::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-compact::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-compact::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 2px;
        }
        .scrollbar-compact::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
      `}</style>
    </section>
  );
}

// === SUBJECTS (unchanged) ===
const subjects = [
  {
    title: "JEE Mains & Advanced",
    description: "Top mentorship for engineering exams.",
    icon: BookOpen,
    buttons: [
      "MATHS - JEE MAINS & ADVANCED",
      "PHYSICS - JEE MAINS & ADVANCED",
      "CHEMISTRY - JEE MAINS & ADVANCED",
    ],
  },
  {
    title: "NEET",
    description: "Guidance for medical entrance.",
    icon: Stethoscope,
    buttons: ["PHYSICS - NEET", "CHEMISTRY - NEET", "BIOLOGY - NEET"],
  },
  {
    title: "11th & 12th",
    description: "Support for senior school.",
    icon: GraduationCap,
    buttons: [
      "PHYSICS - (11 AND 12)",
      "CHEMISTRY - (11 AND 12)",
      "BIOLOGY - (11 AND 12)",
      "MATHS - (11 AND 12)",
    ],
  },
  {
    title: "Middle & Lower Grades",
    description: "Foundational subjects.",
    icon: Beaker,
    buttons: [
      "SCIENCE - 8th",
      "MATHS - 8th",
      "PHYSICS - 9th",
      "CHEMISTRY - 9th",
      "BIOLOGY - 9th",
      "MATHS - 9th",
      "PHYSICS - 10th",
      "CHEMISTRY - 10th",
      "BIOLOGY - 10th",
      "MATHS - 10th",
    ],
  },
];