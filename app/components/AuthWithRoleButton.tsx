"use client";

import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import RoleModal from './RoleModal';

export default function AuthWithRoleButton({ mode = 'signup', children, className }: { mode?: 'signup'|'signin', children: React.ReactNode, className?: string }) {
  const clerk = useClerk();
  const [open, setOpen] = useState(false);

  const onConfirm = (role: 'student'|'teacher') => {
    try {
      localStorage.setItem('pending_role', role);
    } catch (_) {}

    // do not open Clerk here — wait for modal to finish closing (onCloseComplete)
  };

  const handleCloseComplete = (confirmed: boolean) => {
    // unmount the modal
    setOpen(false);
    // only open Clerk if the user explicitly confirmed a role
    if (confirmed) {
      if (mode === 'signup') {
        clerk.openSignUp();
      } else {
        clerk.openSignIn();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      {open && <RoleModal onConfirm={onConfirm} onCloseComplete={handleCloseComplete} />}
      {/* Use a non-button wrapper so we don't accidentally nest buttons when children are buttons */}
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={className}
      >
        {children}
      </span>
    </>
  );
}
