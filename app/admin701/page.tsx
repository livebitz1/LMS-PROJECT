import type { Metadata } from 'next';
import AdminNavbar from './AdminNavbar';

export const metadata: Metadata = {
  title: 'Admin 701',
  description: 'Administrative dashboard — Admin701',
};

export default function Admin701Page() {
  return (
    <main className="min-h-screen bg-white text-slate-900 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <AdminNavbar />
      </div>
    </main>
  );
}
