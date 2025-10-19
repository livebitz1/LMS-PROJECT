import React from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'LMS Admin - Dashboard',
};

export default async function DashboardPage() {
  // Server-side cookie check for admin auth (await cookies() per Next.js dynamic APIs requirement)
  const cookieStore = await cookies();
  const cookie = cookieStore.get('lms_admin_auth')?.value;
  if (!cookie || cookie !== '1') {
    // redirect to admin login if not authenticated
    redirect('/lms-admin/login');
  }

  return (
    <>
      <AdminNavbar title="Admin Dashboard" />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="mb-6 text-slate-700">Manage your LMS data here.</p>
      </main>
    </>
  );
}
