"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import RoleModal from "./RoleModal";

export default function SyncUser() {
  const { isSignedIn, user } = useUser();
  const clerk = useClerk();
  const [roleFromStorage, setRoleFromStorage] = useState<string | null>(null);
  const [hasRole, setHasRole] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // read pending role and any 'require role selection' flag from localStorage on mount
  useEffect(() => {
    try {
      const pending = localStorage.getItem('pending_role');
      if (pending) {
        setRoleFromStorage(pending);
      }
      const require = localStorage.getItem('require_role_selection');
      if (require) {
        setShowRoleModal(true);
      }
    } catch {}
  }, []);

  // If user is signed in and we already have a pending role (from before sign-in), set it as hasRole so sync runs
  useEffect(() => {
    if (isSignedIn && roleFromStorage && !hasRole) {
      setHasRole(roleFromStorage);
      // if a pending role existed, we don't need the 'require' flag anymore
      try { localStorage.removeItem('require_role_selection'); } catch {}
    }
  }, [isSignedIn, roleFromStorage, hasRole]);

  // If user signs in without selecting a role first, check server; if server has role, use it; otherwise show role modal
  useEffect(() => {
    if (isSignedIn && !roleFromStorage && !hasRole) {
      // check server if this Clerk user already has a role stored
      (async () => {
        try {
          const res = await fetch('/api/users', { method: 'GET', credentials: 'same-origin' });
          if (res.ok) {
            const data = await res.json();
            const serverUser = data?.user;
            if (serverUser && serverUser.role) {
              // server already knows this user's role, populate and skip showing modal
              setHasRole(serverUser.role);
              // remove any persisted requirement
              try { localStorage.removeItem('require_role_selection'); } catch {}
              return;
            }
          }
        } catch {}

        // user signed in but no pending role and server doesn't have one — show role modal (do NOT sign out)
        try {
          // persist requirement so the modal will reopen after refresh
          localStorage.setItem('require_role_selection', '1');
        } catch {}
        setShowRoleModal(true);
      })();
    }
  }, [isSignedIn, roleFromStorage, hasRole, clerk]);

  // When hasRole is set and user is signed in, sync to server
  useEffect(() => {
    if (!isSignedIn || !user || !hasRole) return;

    (async () => {
      try {
        const u = user as {
          emailAddresses?: { id: string; emailAddress: string }[];
          primaryEmailAddressId?: string;
          firstName?: string | null;
          lastName?: string | null;
          fullName?: string | null;
          username?: string | null;
          profileImageUrl?: string | null;
          imageUrl?: string | null;
        };

        // pick primary email
        const emailObj = (u.emailAddresses || []).find((e) => e.id === u.primaryEmailAddressId) || (u.emailAddresses || [])[0];

        const payload = {
          email: emailObj?.emailAddress ?? null,
          firstName: u.firstName ?? null,
          lastName: u.lastName ?? null,
          fullName: u.fullName ?? u.username ?? null,
          profileImageUrl: (u.profileImageUrl ?? u.imageUrl) ?? null,
          role: hasRole,
        };

        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("SyncUser: failed to sync user to database", res.status, text);
        } else {
          console.log("SyncUser: user synced to database");
          // remove pending role after successful sync
          try { localStorage.removeItem('pending_role'); } catch {}
          // remove the persisted requirement as we've finished role selection
          try { localStorage.removeItem('require_role_selection'); } catch {}
          setRoleFromStorage(null);
        }
      } catch (err) {
        console.error("SyncUser: failed to sync user to database", err);
      }
    })();
  }, [isSignedIn, user, hasRole]);

  const onConfirmRole = (r: 'student' | 'teacher') => {
    // If user is already signed in, set role immediately (no need to open Clerk)
    if (isSignedIn) {
      setHasRole(r);
      setShowRoleModal(false);
      try { localStorage.removeItem('require_role_selection'); } catch {}
      return;
    }

    // If user is not signed in yet, store pending role and open Clerk sign-in
    try { localStorage.setItem('pending_role', r); } catch {}
    setRoleFromStorage(r);
    setShowRoleModal(false);
    try { localStorage.removeItem('require_role_selection'); } catch {}
    try {
      clerk.openSignIn();
    } catch (err) {
      console.error('Failed to open Clerk sign-in:', err);
    }
  };

  return (
    <>
      {showRoleModal && <RoleModal onConfirm={onConfirmRole} />}
    </>
  );
}
