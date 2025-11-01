"use client";

import React, { useState } from 'react';
import Image from 'next/image';

type Student = { profileImageUrl?: string | null; name?: string | null };

export default function BookingItemClient({ id, studentName, message, createdAt, student }: { id: string; studentName: string; message?: string | null; createdAt: string; student?: Student | null }) {
  const [status, setStatus] = useState<string | null>(() => {
    if (!message) return null;
    try {
      const m = JSON.parse(message);
      return (m && typeof m.status === 'string') ? m.status : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const parseMessage = () => {
    if (!message) return { text: '', timeRequested: null, raw: null as null };
    try {
      const m = JSON.parse(message) as unknown;
      const asRecord = typeof m === 'object' && m !== null ? m as Record<string, unknown> : {};
      return { text: (asRecord['text'] ?? '') as string, timeRequested: (asRecord['timeRequested'] ?? null) as string | null, raw: asRecord };
    } catch {
      return { text: message, timeRequested: null, raw: null };
    }
  };

  const { text, timeRequested, raw } = parseMessage();

  const doAction = async (action: 'accept' | 'reject') => {
    if (loading) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('bookingId', id);
      fd.append('action', action);
      const res = await fetch('/api/teacher/book/respond', { method: 'POST', body: fd });
      if (!res.ok) {
        const json = await res.json().catch(()=>({}));
        throw new Error(json?.error || 'Failed');
      }
      // optimistic update
      setStatus(action === 'accept' ? 'ACCEPTED' : 'REJECTED');
      // try to follow any redirect (the route redirects to /teacher/bookings)
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        // refresh current page to get latest bookings
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Action failed');
      setLoading(false);
    }
  };

  const statusBadge = () => {
    const s = status ?? (raw && raw.status ? String(raw.status) : 'PENDING');
    const map: Record<string, string> = {
      ACCEPTED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-rose-100 text-rose-800',
      PENDING: 'bg-amber-50 text-amber-800',
    };
    const cls = map[s] ?? 'bg-slate-100 text-slate-700';
    return <div className={`text-xs px-2 py-1 rounded-full ${cls}`}>{s}</div>;
  };

  return (
    <div className="border border-emerald-100 rounded-xl p-4 bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-shrink-0">
        <Image
          src={student?.profileImageUrl || '/default-avatar.png'}
          alt={student?.name || studentName || 'Student'}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border border-emerald-200 shadow-sm"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-slate-900 truncate">{studentName || student?.name || 'Student'}</div>
          <div className="ml-2">{statusBadge()}</div>
        </div>

        {text ? (
          <div className="text-sm text-slate-700 mt-1">{text}</div>
        ) : null}

        {timeRequested ? (
          <div className="text-xs text-slate-400 mt-1">Requested time: {new Date(timeRequested).toLocaleString()}</div>
        ) : null}

        <div className="text-xs text-slate-400 mt-2">Booked on {new Date(createdAt).toLocaleString()}</div>
      </div>

      <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0 flex items-center gap-2">
        {(!status || status === 'PENDING') && (
          <>
            <button onClick={() => doAction('accept')} disabled={loading} className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700">{loading ? '...' : 'Accept'}</button>
            <button onClick={() => doAction('reject')} disabled={loading} className="px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-sm hover:bg-rose-100">Reject</button>
          </>
        )}
      </div>
    </div>
  );
}
