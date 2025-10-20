import React from "react"
import AdminNavbar from "../components/AdminNavbar"
import UsersGrid from "../components/UsersGrid"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "../../../lib/prisma"

export const metadata = {
  title: "LMS Admin - Users",
}

export default async function UsersPage() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("lms_admin_auth")?.value
  if (!cookie || cookie !== "1") {
    redirect("/lms-admin/login")
  }

  // fetch users from DB
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } })

  // serialize dates and ensure profileImageUrl is present for the client component
  const usersSerialized = users.map((u) => ({
    id: u.id,
    clerkId: u.clerkId,
    email: u.email,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    profileImageUrl: u.profileImageUrl ?? null,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <>
      <AdminNavbar title="Users" />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
          <div className="flex items-center gap-3">
            <a
              href="/lms-admin/users/export"
              className="px-4 py-2 rounded-md bg-black text-white"
              style={{ color: "#fff" }}
              download
            >
              Export to CSV
            </a>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-2xl p-4 border">
          <UsersGrid users={usersSerialized} />
        </div>
      </main>
    </>
  )
}
