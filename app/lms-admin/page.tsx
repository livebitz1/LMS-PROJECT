"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/lms-admin/dashboard');
      } else {
        const j = await res.json().catch(() => null);
        setError(j?.error || 'Invalid password');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-4">LMS Admin</h1>
      <p className="mb-6 text-slate-700">Enter the admin password to access the dashboard.</p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm">Admin Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-3 py-2 border rounded-md"
          placeholder="Enter admin password"
        />

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex items-center gap-3 mt-2">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-black text-white">
            {loading ? 'Signing in...' : 'Enter'}
          </button>
          <button
            type="button"
            onClick={() => { setPassword(''); setError(null); }}
            className="px-3 py-2 rounded-md border"
          >
            Clear
          </button>
        </div>
      </form>
    </main>
  );
}
