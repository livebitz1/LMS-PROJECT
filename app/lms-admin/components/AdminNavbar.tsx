"use client";

import Link from 'next/link';

export default function AdminNavbar({ title = 'Admin' }: { title?: string }) {

  return (
    <header className="bg-white border-b py-3">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold">LMS Pro</Link>
          <span className="text-sm text-slate-600">{title}</span>
        </div>

        <nav className="flex items-center gap-3">
          <Link href="/lms-admin/dashboard" className="px-3 py-2 rounded-md hover:bg-slate-100">Dashboard</Link>
          <Link href="/lms-admin/users" className="px-3 py-2 rounded-md hover:bg-slate-100">Users</Link>
          <Link href="/lms-admin/courses" className="px-3 py-2 rounded-md hover:bg-slate-100">Courses</Link>
        </nav>
      </div>
    </header>
  );
}
