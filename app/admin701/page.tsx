import AdminNavbar from "./AdminNavbar";
import AdminGateClient from "./AdminGateClient";
import { cookies } from "next/headers";

export const metadata = {
  title: "Admin 701",
  description: "Administrative dashboard — Admin701",
};

export default async function Admin701Page() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("admin_auth")?.value;

  return (
    <main className="min-h-screen bg-white text-slate-900 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {cookie ? <AdminNavbar /> : <AdminGateClient />}
      </div>
    </main>
  );
}
