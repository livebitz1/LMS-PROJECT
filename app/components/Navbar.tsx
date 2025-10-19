"use client";

import Link from "next/link";
import { SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <header className="border-b border-gray-100 bg-white/60 backdrop-blur-sm">
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

        {/* Center: Navigation links (playful, doodly minimal) */}
        <nav role="navigation" aria-label="Primary" className="flex items-center justify-center">
          <ul className="flex gap-6 text-sm md:text-base items-center">
            <li>
              <Link href="/" className="relative group inline-block">
                <span className="absolute inset-0 bg-black transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                <span className="relative z-10 px-2 py-1 text-slate-800 group-hover:text-white transition-colors">Home</span>
              </Link>
            </li>

            <li>
              <Link href="/courses" className="relative group inline-block">
                <span className="absolute inset-0 bg-black transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                <span className="relative z-10 px-2 py-1 text-slate-800 group-hover:text-white transition-colors">Courses</span>
              </Link>
            </li>

            <li>
              <Link href="/assignments" className="relative group inline-block">
                <span className="absolute inset-0 bg-black transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                <span className="relative z-10 px-2 py-1 text-slate-800 group-hover:text-white transition-colors">Assignments</span>
              </Link>
            </li>

            <li>
              <Link href="/messages" className="relative group inline-block">
                <span className="absolute inset-0 bg-black transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                <span className="relative z-10 px-2 py-1 text-slate-800 group-hover:text-white transition-colors">Messaging</span>
              </Link>
            </li>

            <li>
              <Link href="/gradebook" className="relative group inline-block">
                <span className="absolute inset-0 bg-black transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-200 rounded-md" aria-hidden />
                <span className="relative z-10 px-2 py-1 text-slate-800 group-hover:text-white transition-colors">Gradebook</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right: sketchy Sign up button only */}
        <div className="flex justify-end">
          <SignedOut>
            <SignUpButton mode="modal">
              <button
                className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold shadow-[0_6px_0_rgba(0,0,0,0.08)] border-2 border-black/10 hover:scale-[1.02] transition-transform"
                aria-label="Sign up"
                title="Sign up"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* slight hand-drawn corner via SVG */}
                <span className="inline-flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M3 12h18" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M16 7l5 5-5 5" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Sign up</span>
                </span>
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-10 h-10 rounded-md' } }} />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
