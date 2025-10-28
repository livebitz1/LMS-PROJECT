"use client";

import React, { useEffect, useRef, useState } from "react";
import { User, GraduationCap, BookOpen, Calendar, TrendingUp } from "lucide-react";

export default function AudienceCards() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Trigger scroll-in animation
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
          Whether you're teaching or learning — we’ve got you covered.
        </p>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Teacher Card */}
        <article
          className={`
            group relative p-8 rounded-3xl bg-white border border-gray-100
            shadow-sm transition-all duration-300 ease-out
            will-change-transform
            ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-24 opacity-0"}
          `}
          tabIndex={0}
          style={{
            transition: "transform 800ms ease-out, opacity 800ms ease-out, box-shadow 300ms ease-out",
            transitionDelay: "300ms",
          }}
        >
          {/* Gradient Overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-50/0 to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ willChange: "opacity" }}
          />

          {/* Hover Lift & Shadow */}
          <div
            className="relative h-full flex flex-col transition-transform duration-300 group-hover:-translate-y-1.5"
            style={{ willChange: "transform" }}
          >
            <div className="flex items-center gap-4 mb-6">
              {/* Icon with Pop-Up Animation */}
              <div
                className={`
                  flex-shrink-0 w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner
                  transition-all duration-500 ease-out
                  ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}
                `}
                style={{
                  transformOrigin: "center",
                  transitionDelay: "500ms",
                }}
              >
                <GraduationCap className="w-7 h-7 text-emerald-700" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">For Teachers</h3>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 flex-1">
              Create professional profiles, publish courses, and manage learners.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1 transition-colors duration-200 hover:bg-emerald-100">
                <User className="w-3 h-3" />
                Profile
              </span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1 transition-colors duration-200 hover:bg-emerald-100">
                <BookOpen className="w-3 h-3" />
                Courses
              </span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1 transition-colors duration-200 hover:bg-emerald-100">
                <Calendar className="w-3 h-3" />
                Bookings
              </span>
            </div>
          </div>

          {/* Focus Ring */}
          <div className="pointer-events-none absolute -inset-px rounded-3xl ring-2 ring-emerald-500 ring-offset-2 opacity-0 focus-within:opacity-100 transition-opacity duration-200" />
        </article>

        {/* Student Card */}
        <article
          className={`
            group relative p-8 rounded-3xl bg-white border border-gray-100
            shadow-sm transition-all duration-300 ease-out
            will-change-transform
            ${isVisible ? "translate-x-0 opacity-100" : "translate-x-24 opacity-0"}
          `}
          tabIndex={0}
          style={{
            transition: "transform 800ms ease-out, opacity 800ms ease-out, box-shadow 300ms ease-out",
            transitionDelay: "400ms",
          }}
        >
          {/* Gradient Overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-50/0 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ willChange: "opacity" }}
          />

          {/* Hover Lift & Shadow */}
          <div
            className="relative h-full flex flex-col transition-transform duration-300 group-hover:-translate-y-1.5"
            style={{ willChange: "transform" }}
          >
            <div className="flex items-center gap-4 mb-6">
              {/* Icon with Pop-Up Animation */}
              <div
                className={`
                  flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner
                  transition-all duration-500 ease-out
                  ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}
                `}
                style={{
                  transformOrigin: "center",
                  transitionDelay: "600ms",
                }}
              >
                <GraduationCap className="w-7 h-7 text-indigo-700" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">For Students</h3>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 flex-1">
              Discover mentors, book sessions, and track your learning progress.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium flex items-center gap-1 transition-colors duration-200 hover:bg-indigo-100">
                <User className="w-3 h-3" />
                Find Tutors
              </span>
              <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium flex items-center gap-1 transition-colors duration-200 hover:bg-indigo-100">
                <Calendar className="w-3 h-3" />
                Bookings
              </span>
              <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium flex items-center gap-1 transition-colors duration-200 hover:bg-indigo-100">
                <TrendingUp className="w-3 h-3" />
                Progress
              </span>
            </div>
          </div>

          {/* Focus Ring */}
          <div className="pointer-events-none absolute -inset-px rounded-3xl ring-2 ring-indigo-500 ring-offset-2 opacity-0 focus-within:opacity-100 transition-opacity duration-200" />
        </article>
      </div>

      <div className="h-12 md:h-16" />
    </section>
  );
}