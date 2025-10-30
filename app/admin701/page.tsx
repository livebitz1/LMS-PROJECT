import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin 701',
  description: 'Administrative dashboard — Admin701',
};

export default function Admin701Page() {
  return (
    <main className="min-h-screen bg-white text-slate-900 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Admin 701</h1>
          <p className="mt-2 text-sm text-slate-600">Quick administrative utilities and links for site maintainers.</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <article className="rounded-xl border border-emerald-900 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-2">User management</h2>
            <p className="text-sm text-slate-600 mb-4">Quick links to user-related tools (read-only links; actions are implemented in API).</p>
            <ul className="space-y-2">
              <li>
                <Link href="/lms-admin/users" className="inline-block text-emerald-700 hover:underline">Open users (admin)</Link>
              </li>
              <li>
                <Link href="/lms-admin/users/export" className="inline-block text-emerald-700 hover:underline">Export users (CSV)</Link>
              </li>
            </ul>
          </article>

          <article className="rounded-xl border border-emerald-900 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-2">System</h2>
            <p className="text-sm text-slate-600 mb-4">Environment and maintenance utilities.</p>
            <ul className="space-y-2">
              <li>
                <Link href="/api/admin/login" className="inline-block text-emerald-700 hover:underline">Admin: quick login (API)</Link>
              </li>
              <li>
                <Link href="/api/admin/logout" className="inline-block text-emerald-700 hover:underline">Admin: logout (API)</Link>
              </li>
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-xl p-6 border border-slate-100 bg-slate-50">
          <h3 className="text-sm font-medium text-slate-800">Notes</h3>
          <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
            <li>This page is intentionally minimal — integrate auth/role checks as needed.</li>
            <li>Do not expose sensitive operations without server-side protection.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
