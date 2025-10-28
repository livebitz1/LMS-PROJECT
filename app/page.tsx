"use client";

import Link from "next/link";
import GetStartedButton from "./components/GetStartedButton";
import Navbar from "./components/Navbar";
import Hero from "./components/home/Hero";
import FeaturesGrid from "./components/home/FeaturesGrid";
import AudienceCards from "./components/home/AudienceCards";
import PopularSubjects from "./components/home/PopularSubjects";

export default function Home() {
  const FEATURES = [
    {
      id: "courses",
      title: "Courses",
      desc: "Create, organize and share course material with rich content and modules.",
      href: "/courses",
    },
    {
      id: "assignments",
      title: "Assignments",
      desc: "Assign homework, collect submissions, and give feedback inline.",
      href: "/assignments",
    },
    {
      id: "messaging",
      title: "Messaging",
      desc: "Direct messaging and group discussions to keep students and teachers connected.",
      href: "/messages",
    },
    {
      id: "gradebook",
      title: "Gradebook",
      desc: "Track progress, grades, and analytics for each student and course.",
      href: "/gradebook",
    },
  ];

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* Navbar component */}
      <Navbar />

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <Hero />

        {/* Features / collaboration surface */}
        <FeaturesGrid />

        <AudienceCards />

        {/* Popular subjects - upgraded professional cards */}
        <PopularSubjects />

        <div className="mt-8 border-t pt-6 flex items-center justify-between text-sm text-gray-600">
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <span>•</span>
            <Link href="/stories" className="hover:underline">Customer Stories</Link>
          </div>

          <Link href="/onboarding" className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200">→</Link>
        </div>
      </main>
    </div>
  );
}
