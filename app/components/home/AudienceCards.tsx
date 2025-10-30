"use client";

import React, { useEffect, useRef, useState } from "react";
import { User, GraduationCap, BookOpen, Calendar, TrendingUp } from "lucide-react";

export default function AudienceCards() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -100px 0px" }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="audience-sections"
      className="mt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Section Header */}
      <div
        className={`text-center mb-12 transition-all duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
        style={{ transitionDelay: "100ms" }}
      >
        <h2
          id="audience-sections"
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight"
        >
          Designed for every role
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Whether you&rsquo;re teaching or learning — we&rsquo;ve got you covered.
        </p>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Teacher Card - Slide from Left */}
        <article
          className={`
            group relative p-8 rounded-3xl bg-white border border-emerald-700 md:border-gray-100 shadow-sm
            hover:shadow-xl transition-all duration-300 hover:-translate-y-1
            focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2
            ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-24 opacity-0"}
          `}
          tabIndex={0}
          style={{
            transition: "transform 800ms ease-out, opacity 800ms ease-out",
            transitionDelay: "300ms",
          }}
        >
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none">
            <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out origin-bottom-left" />
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-50/0 to-emerald-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110">
                <GraduationCap className="w-7 h-7 text-emerald-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Teachers</h3>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 flex-1">
              Create professional profiles, publish courses, and manage learners.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1 transition-colors group-hover:bg-emerald-100">
                <User className="w-3 h-3" />
                Profile
              </span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1 transition-colors group-hover:bg-emerald-100">
                <BookOpen className="w-3 h-3" />
                Courses
              </span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1 transition-colors group-hover:bg-emerald-100">
                <Calendar className="w-3 h-3" />
                Bookings
              </span>
            </div>
          </div>
        </article>

        {/* Student Card - Slide from Right */}
        <article
          className={`
            group relative p-8 rounded-3xl bg-white border border-purple-700 md:border-gray-100 shadow-sm
            hover:shadow-xl transition-all duration-300 hover:-translate-y-1
            focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2
            ${isVisible ? "translate-x-0 opacity-100" : "translate-x-24 opacity-0"}
          `}
          tabIndex={0}
          style={{
            transition: "transform 800ms ease-out, opacity 800ms ease-out",
            transitionDelay: "400ms",
          }}
        >
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none">
            <div className="absolute inset-0 rounded-3xl border-2 border-indigo-500 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out origin-bottom-left" />
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-50/0 to-indigo-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110">
                <GraduationCap className="w-7 h-7 text-indigo-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Students</h3>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 flex-1">
              Discover mentors, book sessions, and track your learning progress.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium flex items-center gap-1 transition-colors group-hover:bg-indigo-100">
                <User className="w-3 h-3" />
                Find Tutors
              </span>
              <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium flex items-center gap-1 transition-colors group-hover:bg-indigo-100">
                <Calendar className="w-3 h-3" />
                Bookings
              </span>
              <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium flex items-center gap-1 transition-colors group-hover:bg-indigo-100">
                <TrendingUp className="w-3 h-3" />
                Progress
              </span>
            </div>
          </div>
        </article>
      </div>

      <div className="h-12 md:h-16" />
    </section>
  );
}