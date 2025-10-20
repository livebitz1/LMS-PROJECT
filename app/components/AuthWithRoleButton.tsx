"use client";

import { useClerk } from '@clerk/nextjs';

export default function AuthWithRoleButton({ mode = 'signup', children, className }: { mode?: 'signup'|'signin', children: React.ReactNode, className?: string }) {
  const clerk = useClerk();

  const handleOpenAuth = () => {
    try {
      if (mode === 'signup') clerk.openSignUp();
      else clerk.openSignIn();
    } catch (_) {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpenAuth();
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleOpenAuth}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </span>
  );
}
