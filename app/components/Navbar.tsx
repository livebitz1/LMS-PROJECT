"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import AuthWithRoleButton from "./AuthWithRoleButton";
import { NavbarIcons } from "./NavbarIcons";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // fetch server-side user (synced by SyncUser) to determine role for conditional links
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/users', { method: 'GET', credentials: 'same-origin' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setRole(data?.user?.role ?? null);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
        {/* Left: Logo (playful badge) */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-400 shadow-sm" aria-hidden>
              {/* simple doodle icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#08341A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="12.5" r="1.2" fill="#08221B" />
              </svg>
            </span>

            <span className="text-lg font-bold tracking-tight text-slate-900">LMS Pro</span>
          </Link>
        </div>

        {/* Center: Navigation links (desktop only) */}
        <nav role="navigation" aria-label="Primary" className="hidden md:flex items-center justify-center">
          <ul className="flex gap-6 text-sm md:text-base items-center">
            <li>
              <Link href="/" className="relative group inline-block">
                <span className="absolute inset-0 bg-black transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                <span className="relative z-10 flex items-center gap-2 px-2 py-1 text-slate-800 group-hover:text-white transition-colors">
                  <NavbarIcons.home className="w-5 h-5" /> Home
                </span>
              </Link>
            </li>
            <li>
              <Link href="/courses" className="relative group inline-block">
                <span className="absolute inset-0 bg-black transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                <span className="relative z-10 flex items-center gap-2 px-2 py-1 text-slate-800 group-hover:text-white transition-colors">
                  <NavbarIcons.courses className="w-5 h-5" /> Courses
                </span>
              </Link>
            </li>
            <li>
              <Link href="/mentors" className="relative group inline-block">
                <span className="absolute inset-0 bg-black transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                <span className="relative z-10 flex items-center gap-2 px-2 py-1 text-slate-800 group-hover:text-white transition-colors">
                  <NavbarIcons.mentors className="w-5 h-5" /> Mentors
                </span>
              </Link>
            </li>

            {/* Teacher dashboard link (visible when server role indicates teacher) */}
            {role === 'teacher' && (
              <>
                <li>
                  <Link href="/teacher/dashboard" className="relative group inline-block no-underline hover:no-underline">
                    <span className="absolute inset-0 bg-emerald-500 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                    <span className="relative z-10 flex items-center gap-2 px-2 py-1 text-slate-800 group-hover:text-white transition-colors whitespace-nowrap no-underline">
                      <NavbarIcons.teacherDashboard className="w-5 h-5" /> teacher-dashboard
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/teacher/bookings" className="relative group inline-block no-underline hover:no-underline">
                    <span className="absolute inset-0 bg-emerald-400 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                    <span className="relative z-10 flex items-center gap-2 px-2 py-1 text-slate-800 group-hover:text-white transition-colors whitespace-nowrap no-underline">
                      <NavbarIcons.bookings className="w-5 h-5" /> Bookings
                    </span>
                  </Link>
                </li>
              </>
            )}
            {/* Learner dashboard link (visible when server role indicates student) */}
            {role === 'student' && (
              <li>
                <Link href="/learner/dashboard" className="relative group inline-block no-underline hover:no-underline">
                  <span className="absolute inset-0 bg-emerald-400 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                  <span className="relative z-10 flex items-center gap-2 px-2 py-1 text-slate-800 group-hover:text-white transition-colors whitespace-nowrap no-underline">
                    <NavbarIcons.learnerDashboard className="w-5 h-5" /> learner-dashboard
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Mobile controls: sign up/user + hamburger at top-right */}
        <div className="md:hidden">
          <div className="absolute right-4 top-4 flex items-center gap-0 z-40">
            <div className="flex items-center gap-0">
              <SignedOut>
                <AuthWithRoleButton mode="signup">
                  <span className="px-3 py-2 rounded-md bg-white text-black text-sm font-semibold shadow-sm border border-gray-200">Sign up</span>
                </AuthWithRoleButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center justify-center w-12 h-12">
                  <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-12 h-12 rounded-full' } }} />
                </div>
              </SignedIn>
            </div>
            <button
              onClick={() => setOpen((s) => !s)}
              aria-expanded={open}
              aria-label="Open menu"
              className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 bg-white shadow-sm ml-2"
            >
              <svg className={`w-7 h-7 transition-transform ${open ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right: sketchy Sign up button only */}
        <div className="hidden md:flex justify-end">
          <SignedOut>
            <AuthWithRoleButton mode="signup">
              <button
                className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold shadow-[0_6px_0_rgba(0,0,0,0.08)] border-2 border-black/10 hover:scale-[1.02] transition-transform"
                aria-label="Sign up"
                title="Sign up"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <span className="inline-flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M3 12h18" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M16 7l5 5-5 5" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Sign up</span>
                </span>
              </button>
            </AuthWithRoleButton>
          </SignedOut>

          <SignedIn>
            <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-10 h-10 rounded-md' } }} />
          </SignedIn>
        </div>
      </div>

      {/* Mobile menu panel - pushes content down */}
      {open && (
        <div className="md:hidden bg-white shadow-lg border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <ul className="flex flex-col gap-3">
              <li><Link href="/" className="block px-3 py-2 rounded-md text-slate-800 hover:bg-black hover:text-white flex items-center gap-2"><NavbarIcons.home className="w-5 h-5" /> Home</Link></li>
              <li><Link href="/courses" className="block px-3 py-2 rounded-md text-slate-800 hover:bg-black hover:text-white flex items-center gap-2"><NavbarIcons.courses className="w-5 h-5" /> Courses</Link></li>
              <li><Link href="/mentors" className="block px-3 py-2 rounded-md text-slate-800 hover:bg-black hover:text-white flex items-center gap-2"><NavbarIcons.mentors className="w-5 h-5" /> Mentors</Link></li>
              {role === 'teacher' && (
                <>
                  <li><Link href="/teacher/dashboard" className="block px-3 py-2 rounded-md text-slate-800 hover:bg-emerald-500 hover:text-white whitespace-nowrap no-underline hover:no-underline flex items-center gap-2"><NavbarIcons.teacherDashboard className="w-5 h-5" /> teacher-dashboard</Link></li>
                  <li><Link href="/teacher/bookings" className="block px-3 py-2 rounded-md text-slate-800 hover:bg-emerald-400 hover:text-white whitespace-nowrap no-underline hover:no-underline flex items-center gap-2"><NavbarIcons.bookings className="w-5 h-5" /> Bookings</Link></li>
                </>
              )}
              {role === 'student' && (
                <li><Link href="/learner/dashboard" className="block px-3 py-2 rounded-md text-slate-800 hover:bg-emerald-400 hover:text-white whitespace-nowrap no-underline hover:no-underline flex items-center gap-2"><NavbarIcons.learnerDashboard className="w-5 h-5" /> learner-dashboard</Link></li>
              )}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}