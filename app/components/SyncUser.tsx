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

  // read pending role from localStorage on mount
  useEffect(() => {
    try {
      const pending = localStorage.getItem('pending_role');
      if (pending) {
        setRoleFromStorage(pending);
      }
    } catch (_) {}
  }, []);

  // If user is signed in and we already have a pending role (from before sign-in), set it as hasRole so sync runs
  useEffect(() => {
    if (isSignedIn && roleFromStorage && !hasRole) {
      setHasRole(roleFromStorage);
    }
  }, [isSignedIn, roleFromStorage, hasRole]);

  // If user signs in without selecting a role first, sign them out and force role selection
  useEffect(() => {
    if (isSignedIn && !roleFromStorage && !hasRole) {
      // user signed in but no pending role — force sign out and show modal
      (async () => {
        try {
          await clerk.signOut();
        } catch (err) {
          // ignore
        }
        setShowRoleModal(true);
      })();
    }
  }, [isSignedIn, roleFromStorage, hasRole, clerk]);

  // When hasRole is set and user is signed in, sync to server
  useEffect(() => {
    if (!isSignedIn || !user || !hasRole) return;

    (async () => {
      try {
        const u: any = user as any;

        // pick primary email
        const emailObj = (u.emailAddresses || []).find((e: any) => e.id === u.primaryEmailAddressId) || (u.emailAddresses || [])[0];

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
          try { localStorage.removeItem('pending_role'); } catch (_) {}
          setRoleFromStorage(null);
        }
      } catch (err) {
        console.error("SyncUser: failed to sync user to database", err);
      }
    })();
  }, [isSignedIn, user, hasRole]);

  const onConfirmRole = (r: 'student' | 'teacher') => {
    try { localStorage.setItem('pending_role', r); } catch (_) {}
    setRoleFromStorage(r);
    setShowRoleModal(false);
    // open Clerk sign-in so user can authenticate with the selected role pending
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
