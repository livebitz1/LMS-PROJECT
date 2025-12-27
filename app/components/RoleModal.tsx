"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

export default function RoleModal({ onConfirm, onCloseComplete }:{ onConfirm: (role: 'student'|'teacher') => void, onCloseComplete?: (confirmed: boolean) => void }){
  const [role, setRole] = useState<'student'|'teacher' | null>(null);
  const [show, setShow] = useState(true);
  // new state to orchestrate a graceful close animation before unmount
  const [closing, setClosing] = useState(false);
  // local flag to indicate whether the user confirmed (pressed Continue)
  const [confirmed, setConfirmed] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [anchorPos, setAnchorPos] = useState<{top: number, left: number} | null>(null);

  useEffect(() => {
    // Try to position the modal below the Get Started button if present
    try {
      const anchor = document.getElementById('get-started-button');
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        // offset slightly above the original position so modal feels more centered
        const rawTop = rect.bottom + 12 + window.scrollY - 40; // shift up by 40px
        const minTop = 36; // don't place too close to the viewport top
        const top = Math.max(minTop, rawTop);
        const left = rect.left + rect.width / 2 + window.scrollX; // center relative to anchor

        // measure panel height (fallback to a reasonable default)
        const panelHeight = panelRef.current?.offsetHeight ?? 420;
        const viewportBottom = window.scrollY + window.innerHeight;

        // If the modal would extend beyond the viewport bottom, prefer centering in viewport
        const wouldOverflow = top + panelHeight > viewportBottom - 80; // keep 80px bottom margin
        if (!wouldOverflow) {
          setAnchorPos({ top, left });
        } else {
          // clear anchorPos so the modal will center in the viewport instead
          setAnchorPos(null);
        }
      }
    } catch {
      // ignore
      setAnchorPos(null);
    }

    // focus the panel on open for accessibility
    setTimeout(() => panelRef.current?.focus(), 0);

    // compute shift and add class on the actual collaboration element for reliability
    const panelHeight = panelRef.current?.offsetHeight ?? 420;
    const shift = Math.ceil(panelHeight) + 110; // larger gap to avoid overlap

    try {
      // primary: set variable and class on the collaboration node so it animates reliably
      const coll = document.querySelector('.collaboration-shift') as HTMLElement | null;
      if (coll) {
        coll.style.setProperty('--role-modal-shift', `${shift}px`);
        coll.classList.add('role-modal-active');

        // set an initial inline transform matching the target but WITHOUT a transition
        // so we don't animate into place on mount
        coll.style.transition = '';
        coll.style.transform = `translateY(${shift}px)`;

        // enable the transition on the next frame so subsequent transform changes animate
        requestAnimationFrame(() => {
          try {
            coll.style.transition = 'transform 300ms cubic-bezier(.2,.9,.2,1)';
          } catch {}
        });
      }

      // also add global class for compatibility with existing selectors
      document.documentElement.classList.add('role-modal-open');
      document.body.classList.add('role-modal-open');
    } catch {}

    return () => {
      try {
        // remove class/var from the collaboration node
        const coll = document.querySelector('.collaboration-shift') as HTMLElement | null;
        if (coll) {
          coll.classList.remove('role-modal-active');
          coll.style.removeProperty('--role-modal-shift');
          // remove inline transition/transform so the node returns to its default state
          coll.style.transition = '';
          coll.style.transform = '';
        }

        document.documentElement.classList.remove('role-modal-open');
        document.body.classList.remove('role-modal-open');
        document.documentElement.style.removeProperty('--role-modal-shift');
      } catch {}
    };
  }, []);

  // helper to close with a small delay so the page's collaboration-shift can animate back
  // accepts an explicit flag indicating whether the user confirmed a role selection
  const closeModal = useCallback((finalConfirmed: boolean = false) => {
    if (closing) return;
    setClosing(true);

    try {
      // remove the role-modal-active class so the element transitions back to transform: 0
      const coll = document.querySelector('.collaboration-shift') as HTMLElement | null;
      if (coll) {
        // ensure transition is enabled (should be set on mount), then animate back to 0
        coll.style.transition = coll.style.transition || 'transform 300ms cubic-bezier(.2,.9,.2,1)';
        coll.style.transform = 'translateY(0px)';
        // keep the --role-modal-shift value until after transition finishes
      }

      // also remove global class so CSS rules react immediately
      document.documentElement.classList.remove('role-modal-open');
      document.body.classList.remove('role-modal-open');
    } catch {}

    // force a reflow so the browser registers the class change and will animate
    try { void document.body.offsetHeight; } catch {}

    // after the transform duration, clean up vars and unmount
    setTimeout(() => {
      try {
        const coll = document.querySelector('.collaboration-shift') as HTMLElement | null;
        if (coll) {
          // now it's safe to remove the per-element variable used by the transform
          coll.style.removeProperty('--role-modal-shift');
          coll.classList.remove('role-modal-active');
          coll.style.transition = '';
          coll.style.transform = '';
        }

        // remove any remaining global variable
        document.documentElement.style.removeProperty('--role-modal-shift');
      } catch {}

      setShow(false);
      // notify parent that the modal finished its close sequence so it may unmount
      if (onCloseComplete) { try { onCloseComplete(finalConfirmed); } catch {} }
    }, 340); // match the 300ms transition + buffer
  }, [closing, onCloseComplete]);

  // helper that prevents closing unless the user has explicitly CONFIRMED
  const attemptClose = useCallback((finalConfirmed: boolean = false) => {
    // If the user hasn't selected a role yet, guide them to pick one
    if (!role) {
      setTimeout(() => setConfirmed(false), 900);
      const firstRole = document.querySelector('[role="button"][tabindex="0"]');
      try { (firstRole as HTMLElement | null)?.focus(); } catch {}
      return;
    }

    // If a role is selected but the user hasn't pressed Continue to CONFIRM, block closing
    if (!confirmed) {
      // tell user to press Continue to confirm their choice
      setTimeout(() => setConfirmed(false), 900);
      const continueBtn = document.querySelector('button:not([aria-label])') as HTMLElement | null;
      try { continueBtn?.focus(); } catch {}
      return;
    }

    // User has confirmed -> proceed with normal close flow
    closeModal(finalConfirmed);
  }, [role, confirmed, closeModal]);

  const confirm = useCallback(() => {
    if (!role) return;
    // mark as confirmed and call parent sync handler
    setConfirmed(true);
    onConfirm(role);
    // then start the close animation and graceful unmount, telling parent we confirmed
    closeModal(true);
  }, [role, onConfirm, closeModal]);

  // Remove attemptedClose state
  // Remove nested useEffect and keep only one useEffect for keydown
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') attemptClose(false);
      if (e.key === 'Enter' && role) {
        confirm();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [role, confirm, attemptClose]);

  if (!show) return null;

  const panelStyle: React.CSSProperties | undefined = anchorPos
    ? { position: 'absolute', top: `${anchorPos.top}px`, left: `${anchorPos.left}px`, transform: 'translateX(-50%) translateY(-8px)', zIndex: 60 }
    : undefined;

  // when no anchorPos is provided, center the modal in the viewport
  const innerContainerClass = anchorPos
    ? 'relative w-full h-full pointer-events-none'
    : 'relative w-full h-full pointer-events-none flex items-center justify-center px-4';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop: soft dim, no heavy blur for light theme */}
      <div
        className="absolute inset-0 bg-black/28 pointer-events-auto"
        aria-hidden
        onClick={() => {
          // guard: only allow backdrop to close when user confirmed; otherwise show warning
          if (confirmed) {
            attemptClose(false);
          }
        }}
      />

      <div className={innerContainerClass}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
          aria-describedby="role-modal-desc"
          tabIndex={-1}
          className={`pointer-events-auto relative z-10 w-full ${anchorPos ? 'max-w-sm' : 'max-w-xl'} bg-white rounded-lg shadow-[0_30px_60px_rgba(15,23,42,0.08)] border-4 border-[#fff1d6] p-6 text-slate-900 transition-transform transition-opacity duration-300 ease-out ${closing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
           style={panelStyle}
         >
          <div className="flex items-start gap-4">
            <div className="flex-none w-12 h-12 rounded-md bg-amber-50 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <title>User profile</title>
                <g fill="none" stroke="#0F172A" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 12.5c2.485 0 4.5-2.015 4.5-4.5S14.485 3.5 12 3.5 7.5 5.515 7.5 8s2.015 4.5 4.5 4.5z" />
                  <path d="M4.5 19.5c0-2.485 2.015-4.5 4.5-4.5h6c2.485 0 4.5 2.015 4.5 4.5" />
                </g>
                <g transform="translate(16,1)">
                  <path d="M2.5 5.2l.9 1.9 2.1.2-1.6 1.4.5 2-1.9-1-1.9 1 .5-2L.5 7.3l2.1-.2.9-1.9z" fill="#F6C26B" stroke="#E2A800" strokeWidth="0.5" />
                </g>
              </svg>
            </div>

            <div className="flex-1">
              <h2 id="role-modal-title" className="text-lg font-bold">Who are you signing in as?</h2>
              <p id="role-modal-desc" className="mt-1 text-sm text-slate-600">Select a role to personalize the LMS experience. You must choose one to continue.</p>
              {/* show small persistent hint when no role selected */}
              {!role ? (
                <div className="mt-2 text-xs text-rose-600 font-medium" aria-live="polite">Please choose a role to continue — you cannot close this dialog until you do.</div>
              ) : !confirmed ? (
                <div className="mt-2 text-xs text-amber-600 font-medium" aria-live="polite">Role selected — press Continue to confirm your choice.</div>
              ) : null}
            </div>

            <button
              onClick={() => {
                if (!confirmed) {
                  return;
                }
                attemptClose(false);
              }}
              aria-label="Close"
              className={`ml-2 rounded-md p-2 text-slate-600 ${confirmed ? 'hover:bg-slate-100' : 'opacity-60 pointer-events-none'}`} 
              type="button"
              disabled={!confirmed}
              aria-disabled={!confirmed}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M6 6l12 12M6 18L18 6" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setRole('student')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRole('student'); }}
              className={`p-4 rounded-md border-2 transition-shadow ${role==='student' ? 'bg-amber-50 border-amber-300 shadow-md scale-[1.01]' : 'bg-white border-slate-200 hover:shadow-sm'} cursor-pointer`}
              aria-pressed={role === 'student'}
            >
              <div className="text-sm font-semibold">Student</div>
              <div className="text-xs text-slate-600 mt-2">Access courses, submit assignments, and collaborate with peers and teachers.</div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setRole('teacher')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRole('teacher'); }}
              className={`p-4 rounded-md border-2 transition-shadow ${role==='teacher' ? 'bg-amber-50 border-amber-300 shadow-md scale-[1.01]' : 'bg-white border-slate-200 hover:shadow-sm'} cursor-pointer`}
              aria-pressed={role === 'teacher'}
            >
              <div className="text-sm font-semibold">Teacher</div>
              <div className="text-xs text-slate-600 mt-2">Create courses, grade work, and manage your students&apos; learning.</div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                if (!confirmed) {
                  return;
                }
                attemptClose(false);
              }}
              className={`px-3 py-2 rounded-md text-sm border border-slate-200 ${confirmed ? '' : 'opacity-60 pointer-events-none'}`}
              type="button"
              disabled={!confirmed}
              aria-disabled={!confirmed}
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              disabled={!role}
              className={`px-4 py-2 rounded-md text-sm font-semibold ${role ? 'bg-black text-white' : 'bg-black/10 text-black/40 cursor-not-allowed'}`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
