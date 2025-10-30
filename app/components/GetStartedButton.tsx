"use client";

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from './GlobalLoadingProvider';

const GetStartedButton = () => {
  const { isSignedIn } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setLoading: setGlobalLoading } = useGlobalLoading();

  const handleClick = useCallback(async () => {
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }
    setLoading(true);
    // set global loading overlay so it persists across client-side navigation
    try { setGlobalLoading(true); } catch {}

    // safety timeout in case navigation hangs (will be cleared when navigation completes)
    const safety = setTimeout(() => {
      console.warn('Navigation taking longer than expected...');
    }, 15000);

    try {
      const res = await fetch('/api/users', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      const role = data?.user?.role;
      if (role === 'student') {
        await router.push('/mentors');
      } else if (role === 'teacher') {
        await router.push('/teacher/dashboard');
      } else {
        // fallback: go home
        await router.push('/');
      }
      // Wait a tiny tick to let navigation begin (component may unmount on navigation)
      await new Promise((r) => setTimeout(r, 80));
    } catch (err) {
      console.error('GetStarted click error', err);
      // attempt fallback navigation
      try { await router.push('/'); } catch (_) { /* ignore */ }
    } finally {
      clearTimeout(safety);
      setLoading(false);
      // keep global loader active until GlobalLoadingProvider detects pathname change
      // set a small delay to allow provider to observe new pathname and hide overlay
      setTimeout(() => { try { setGlobalLoading(false); } catch {} }, 12000);
    }
  }, [isSignedIn, clerk, router]);

  return (
    <StyledWrapper>
      <button
        id="get-started-button"
        aria-haspopup="dialog"
        className="btn"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          <div className="loader" aria-label="Loading" role="status" aria-live="polite">
            <span className="ring" aria-hidden />
            <span className="dot" aria-hidden />
            <span className="sr-only">Loading, please wait…</span>
          </div>
        ) : (
          <>
            <div>GET STARTED</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M11.6801 14.62L14.2401 12.06L11.6801 9.5" stroke="black" strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 12.0601H14.17" stroke="black" strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 4C16.42 4 20 7 20 12C20 17 16.42 20 12 20" stroke="black" strokeWidth={2} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .btn {
    --color: #4dd4ac;
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    transition: all .5s;
    border: none;
    background-color: transparent;
    padding: 6px 8px;
  }

  .btn > div {
    letter-spacing: 2px;
    font-weight: bold;
    background: var(--color);
    border-radius: 2rem;
    color: black;
    padding: 1rem 1.2rem;
    display: inline-block;
  }

  .btn::before {
    content: '';
    z-index: -1;
    background-color: var(--color);
    border: 2px solid black;
    border-radius: 2rem;
    width: 110%;
    height: 100%;
    position: absolute;
    transform: rotate(10deg);
    transition: .5s;
    opacity: 0.2;
    left: 50%;
    top: 50%;
    transform-origin: center;
    transform: translate(-50%, -50%) rotate(10deg);
  }

  .btn:hover {
    cursor: pointer;
    filter: brightness(1.2);
    transform: scale(1.03);
  }

  .btn:hover::before {
    transform: translate(-50%, -50%) rotate(0deg) scale(1.02);
    opacity: 1;
  }

  .btn svg {
    transform: translateX(-40%);
    transition: .35s;
    width: 0;
    opacity: 0;
    height: 20px;
  }

  .btn:hover svg {
    width: 25px;
    transform: translateX(0%);
    opacity: 1;
  }

  .btn:active {
    filter: brightness(1.4);
  }

  .btn[disabled] {
    opacity: 0.6;
    pointer-events: none;
    transform: none;
  }

  /* Professional ring + orbit-dot loader */
  .loader {
    width: 40px;
    height: 40px;
    display: inline-block;
    position: relative;
    z-index: 30;
    margin: 0 6px;
  }
  .loader .ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid rgba(3, 52, 26, 0.08);
    border-top-color: rgba(3, 52, 26, 0.95);
    box-shadow: 0 8px 24px rgba(77,212,172,0.12), inset 0 0 10px rgba(0,0,0,0.02);
    animation: spin 0.9s cubic-bezier(.4,0,.2,1) infinite;
    transform-origin: center;
  }
  .loader .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #08341A; /* dark emerald */
    position: absolute;
    left: 50%;
    top: 50%;
    transform-origin: -14px center;
    transform: rotate(0deg) translateX(14px) rotate(0deg);
    box-shadow: 0 0 12px rgba(13,148,110,0.45);
    animation: orbit 0.9s cubic-bezier(.4,0,.2,1) infinite;
  }
  .sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes orbit { to { transform: rotate(360deg) translateX(14px) rotate(-360deg); } }
`;

export default GetStartedButton;