"use client";

import React, { useState } from 'react';

export default function AdminGateClient() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!password) { setError('Please enter the admin password'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin701/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Auth failed');
      // reload to let cookie take effect
      window.location.reload();
    } catch (err) {
      setError(String((err as Error)?.message ?? err));
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-lg border bg-white">
      <h2 className="text-xl font-semibold mb-2">Admin access required</h2>
      <p className="text-sm text-slate-600 mb-4">Enter the administrator password to access this area.</p>
      <form onSubmit={submit} className="space-y-3">
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" className="w-full px-3 py-2 border rounded-md" />
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <div className="flex items-center gap-2">
          <button type="submit" disabled={loading} className="px-3 py-2 rounded-md bg-emerald-600 text-white">{loading ? 'Checking...' : 'Enter'}</button>
          <button type="button" onClick={() => { setPassword(''); setError(null); }} className="px-3 py-2 rounded-md bg-slate-100">Clear</button>
        </div>
      </form>
    </div>
  );
}
