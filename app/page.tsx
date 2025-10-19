"use client";

import { useState } from "react";
import Link from "next/link";
import { SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import GetStartedButton from "./components/GetStartedButton";

export default function Home() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "idle" | "loading" | "success" | "error">("idle");

  function validateEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
      return;
    }

    setStatus("loading");
    // Simulate API call to create an early-access account
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
    setEmail("");
    setTimeout(() => setStatus("idle"), 2500);
  }

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
      {/* Header (unchanged layout elsewhere) */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-3 items-center">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            <div className="font-bold text-lg">LMS Pro</div>
          </div>

          {/* Center: Navigation links */}
          <nav className="flex items-center justify-center gap-6 text-sm text-gray-700">
            <Link href="/" className="hover:text-black">Home</Link>
            <Link href="/courses" className="hover:text-black">Courses</Link>
            <Link href="/assignments" className="hover:text-black">Assignments</Link>
            <Link href="/messages" className="hover:text-black">Messaging</Link>
            <Link href="/gradebook" className="hover:text-black">Gradebook</Link>
            <Link href="/about" className="hidden md:inline hover:text-black">About</Link>
          </nav>

          {/* Right: only sign up button (nothing else) */}
          <div className="flex justify-end">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 rounded-full bg-black text-white text-sm" aria-label="Sign up">Sign up</button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-10 h-10' } }} />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
            Learn together, teach better.
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            A collaborative LMS where students and teachers create, share and track learning — all in one place.
          </p>

          {/* Single Get Started CTA component */}
          <div className="mt-8 flex items-center justify-center">
            <GetStartedButton />
          </div>
        </div>

        {/* Features / collaboration surface */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Collaboration features</h2>
            <Link href="/features" className="text-sm text-gray-600 hover:underline">Explore all</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <Link
                key={f.id}
                href={f.href}
                className="group block relative rounded-2xl p-6 bg-white border border-transparent hover:border-gray-100 shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                aria-labelledby={`feature-${f.id}-title`}
              >
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">{f.title}</div>
                    <h3 id={`feature-${f.id}-title`} className="text-2xl font-semibold text-slate-900 mb-3">{f.title}</h3>
                    <p className="text-sm text-gray-600">{f.desc}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-500 group-hover:text-slate-700 transition">Learn more</div>

                    <span className="ml-4">
                      <span className="sr-only">Open {f.title}</span>
                      <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-right">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </span>
                  </div>
                </div>
                {/* Decorative focus ring element for better contrast on keyboard navigation */}
                <span className="absolute -inset-px rounded-2xl pointer-events-none" aria-hidden />
              </Link>
            ))}
          </div>

          <div className="mt-8 border-t pt-6 flex items-center justify-between text-sm text-gray-600">
            <div className="flex gap-4">
              <Link href="/terms" className="hover:underline">Terms</Link>
              <span>•</span>
              <Link href="/stories" className="hover:underline">Customer Stories</Link>
            </div>

            <Link href="/onboarding" className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200">→</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
