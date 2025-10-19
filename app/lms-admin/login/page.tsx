"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/lms-admin/dashboard');
    } else {
      const j = await res.json().catch(() => null);
      setError(j?.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm">Admin Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="px-3 py-2 border rounded-md" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button type="submit" disabled={loading} className="mt-2 px-4 py-2 rounded-md bg-black text-white">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  );
}
