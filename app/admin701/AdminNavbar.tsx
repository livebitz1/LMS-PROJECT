"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Dialog, { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type TeacherProfile = {
  id?: string;
  displayName?: string | null;
  subjects?: string[] | null | unknown;
  profileImageUrl?: string | null;
  hourlyRate?: number | null;
  experienceYears?: number | null;
  resumeUrl?: string | null;
  idCardUrl?: string | null;
  degreeProofUrl?: string | null;
  docsStatus?: string | null;
};

type Teacher = {
  id: string;
  clerkId?: string | null;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  createdAt?: string | Date | null;
  teacherProfile?: TeacherProfile | null;
};

type Student = {
  id: string;
  clerkId?: string | null;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  createdAt?: string | Date | null;
};

export default function AdminNavbar() {
  const [tab, setTab] = useState<'teachers' | 'students' | 'approvals'>('teachers');
  const router = useRouter();

  const handleTab = (t: typeof tab) => {
    setTab(t);
    // update hash for deep-linking (keeps server render simple)
    try {
      window.history.replaceState(null, '', `#${t}`);
    } catch {}
  };

  // Teachers data state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    // load teachers when teachers tab becomes active
    if (tab !== 'teachers') return;
    let cancelled = false;

    async function load() {
      setLoadingTeachers(true);
      setTeachersError(null);
      try {
        const res = await fetch('/api/admin/teachers');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load');
        if (!cancelled) setTeachers(json.teachers ?? []);
      } catch (err) {
        if (!cancelled) setTeachersError(String((err as Error)?.message ?? err));
      } finally {
        if (!cancelled) setLoadingTeachers(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const name = (t.name ?? `${t.firstName ?? ''} ${t.lastName ?? ''}`).toLowerCase();
      const email = (t.email ?? '').toLowerCase();
      const subjects = JSON.stringify(t.teacherProfile?.subjects ?? []).toLowerCase();
      return name.includes(q) || email.includes(q) || subjects.includes(q);
    });
  }, [teachers, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  function exportCSV() {
    const headers = ['Name', 'Email', 'FirstName', 'LastName', 'Subjects', 'HourlyRate', 'ExperienceYears', 'ProfileUrl', 'AvatarUrl', 'CreatedAt'];
    const rows = teachers.map((t) => {
      const subjects = t.teacherProfile?.subjects ? (Array.isArray(t.teacherProfile.subjects) ? t.teacherProfile.subjects.join('; ') : JSON.stringify(t.teacherProfile.subjects)) : '';
      const hourly = t.teacherProfile?.hourlyRate ?? '';
      const exp = t.teacherProfile?.experienceYears ?? '';
      const profileUrl = `${location.origin}/teacher/${t.id}`;
      const avatar = t.profileImageUrl ?? t.teacherProfile?.profileImageUrl ?? '';
      const created = t.createdAt ? new Date(t.createdAt).toISOString() : '';
      return [t.name ?? `${t.firstName ?? ''} ${t.lastName ?? ''}`, t.email ?? '', t.firstName ?? '', t.lastName ?? '', subjects, String(hourly), String(exp), profileUrl, avatar, created];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Students data state
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const studentPerPage = 10;

  useEffect(() => {
    if (tab !== 'students') return;
    let cancelled = false;

    async function load() {
      setLoadingStudents(true);
      setStudentsError(null);
      try {
        const res = await fetch('/api/admin/students');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load');
        if (!cancelled) setStudents(json.students ?? []);
      } catch (err) {
        if (!cancelled) setStudentsError(String((err as Error)?.message ?? err));
      } finally {
        if (!cancelled) setLoadingStudents(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tab]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.name ?? `${s.firstName ?? ''} ${s.lastName ?? ''}`).toLowerCase();
      const email = (s.email ?? '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [students, studentQuery]);

  const studentPageCount = Math.max(1, Math.ceil(filteredStudents.length / studentPerPage));
  const studentPageData = useMemo(() => {
    const start = (studentPage - 1) * studentPerPage;
    return filteredStudents.slice(start, start + studentPerPage);
  }, [filteredStudents, studentPage]);

  function exportStudentsCSV() {
    const headers = ['Name', 'Email', 'FirstName', 'LastName', 'ProfileUrl', 'AvatarUrl', 'CreatedAt'];
    const rows = students.map((s) => {
      const profileUrl = `${location.origin}/learner/${s.id}`;
      const avatar = s.profileImageUrl ?? '';
      const created = s.createdAt ? new Date(s.createdAt).toISOString() : '';
      return [s.name ?? `${s.firstName ?? ''} ${s.lastName ?? ''}`, s.email ?? '', s.firstName ?? '', s.lastName ?? '', profileUrl, avatar, created];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Approvals state and types
  type Approval = {
    id: string;
    userId: string;
    resumeUrl?: string | null;
    idCardUrl?: string | null;
    degreeProofUrl?: string | null;
    docsStatus?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    user?: {
      id: string;
      email: string;
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
    } | null;
  };

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);
  const approvalsEventRef = React.useRef<EventSource | null>(null);
  // UI state to support inline reject confirmation per-card
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  // UI state to support inline remove confirmation modal
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== 'approvals') return;
    let cancelled = false;
    async function load() {
      setLoadingApprovals(true);
      setApprovalsError(null);
      try {
        const res = await fetch('/api/admin/approvals');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load approvals');
        if (!cancelled) setApprovals(json.pending ?? []);
      } catch (err) {
        if (!cancelled) setApprovalsError(String((err as Error)?.message ?? err));
      } finally {
        if (!cancelled) setLoadingApprovals(false);
      }
    }
    load();

    // setup SSE to receive realtime approval changes
    try {
      if (approvalsEventRef.current) approvalsEventRef.current.close();
      const es = new EventSource('/api/admin/approvals/sse');
      approvalsEventRef.current = es;
      es.addEventListener('message', (ev) => {
        try {
          const payload = JSON.parse((ev as MessageEvent).data);
          // reload approvals when change detected
          if (payload?.type === 'approval_changed' || payload?.type === 'docs_reuploaded') {
            load();
            // refresh teachers list when approvals change so UI stays in sync
            // trigger teachers reload
            fetch('/api/admin/teachers').then((r) => r.json()).then((j) => { if (j && j.teachers) setTeachers(j.teachers); }).catch(() => {});
          }
        } catch {}
      });
      es.addEventListener('error', () => {
        // reconnect logic could be added here
      });
    } catch {}

    return () => { cancelled = true; if (approvalsEventRef.current) { approvalsEventRef.current.close(); approvalsEventRef.current = null; } };
  }, [tab]);

  async function handleApprovalAction(profileId: string, action: 'approve' | 'reject' | 'remove', reason?: string) {
    try {
      // If caller didn't provide a reason for rejection, fall back to prompt (preserve prior behavior)
      let useReason = reason;
      if (action === 'reject' && typeof useReason === 'undefined') {
        useReason = window.prompt('Optional rejection reason (shown to teacher):') ?? undefined;
      }
      if (action === 'remove') {
        // Confirmation for 'remove' is handled via the admin modal — no native confirm here
      }
      const res = await fetch('/api/admin/approvals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action, reason: useReason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Action failed');

      // Behavior needed:
      // - approve: mark card as VERIFIED and switch button to 'Remove' (card stays in approvals list)
      // - remove: mark card as REMOVED (card stays in approvals list)
      // - reject: remove the card from approvals list
      if (action === 'reject') {
        // remove from local list
        setApprovals((prev) => prev.filter((p) => p.id !== profileId));
      } else {
        // For approve/remove, update the card status in-place so it remains visible
        const updatedProfile = json.profile;
        setApprovals((prev) => prev.map((p) => p.id === profileId ? { ...p, docsStatus: updatedProfile?.docsStatus ?? (action === 'approve' ? 'VERIFIED' : action === 'remove' ? 'REMOVED' : p.docsStatus), updatedAt: updatedProfile?.updatedAt ?? p.updatedAt } : p));
        // refresh teachers list so mentors page reflects changes
        fetch('/api/admin/teachers').then((r) => r.json()).then((j) => { if (j && j.teachers) setTeachers(j.teachers); }).catch(() => {});
      }
    } catch (err) {
      alert('Action failed: ' + String((err as Error)?.message ?? err));
    }
  }

  function subjectsToString(subs: unknown) {
    if (!subs) return '';
    if (Array.isArray(subs)) return subs.join(', ');
    try { return String(subs); } catch { return '' }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-semibold">Admin Console</h2>
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 rounded-md p-1">
            <button
              onClick={() => handleTab('teachers')}
              aria-pressed={tab === 'teachers'}
              className={`px-3 py-1 rounded-md font-medium transition ${tab === 'teachers' ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-white'}`}>
              Teachers
            </button>
            <button
              onClick={() => handleTab('students')}
              aria-pressed={tab === 'students'}
              className={`px-3 py-1 rounded-md font-medium transition ${tab === 'students' ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-white'}`}>
              Students
            </button>
            <button
              onClick={() => handleTab('approvals')}
              aria-pressed={tab === 'approvals'}
              className={`px-3 py-1 rounded-md font-medium transition ${tab === 'approvals' ? 'bg-amber-600 text-white' : 'text-slate-700 hover:bg-white'}`}>
              Teacher Approvals
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/lms-admin/users" className="text-sm text-emerald-700 hover:underline">Open full users admin</Link>
          <button
            onClick={() => router.push('/lms-admin')}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm"
          >Open LMS Admin</button>
        </div>
      </nav>

      <div className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {tab === 'teachers' && (
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Teachers</h3>
                  <p className="text-sm text-slate-600">List of teachers. Search, view and export to Excel (CSV compatible).</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="Search by name, email or subject"
                    className="px-3 py-2 rounded-md border w-full sm:w-64 text-sm"
                  />

                  <button
                    onClick={exportCSV}
                    className="px-3 py-2 rounded-md bg-slate-800 text-white text-sm"
                    disabled={loadingTeachers || teachers.length === 0}
                  >Export Excel</button>
                </div>
              </div>

              <div className="mt-4">
                {loadingTeachers ? (
                  <div className="p-4 rounded-lg border bg-white text-sm">Loading teachers...</div>
                ) : teachersError ? (
                  <div className="p-4 rounded-lg border bg-red-50 text-red-700">Error: {teachersError}</div>
                ) : teachers.length === 0 ? (
                  <div className="p-4 rounded-lg border bg-white text-sm">No teachers found.</div>
                ) : (
                  <>
                    {/* table for larger screens */}
                    <div className="hidden sm:block mt-2 overflow-x-auto rounded-md border">
                      <table className="w-full min-w-[900px] table-auto">
                        <thead className="bg-slate-50 text-left text-sm text-slate-600">
                          <tr>
                            <th className="px-4 py-3">Avatar</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Subjects</th>
                            <th className="px-4 py-3">Hourly</th>
                            <th className="px-4 py-3">Experience</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700">
                          {pageData.map((t) => (
                            <tr key={t.id} className="border-t bg-white">
                              <td className="px-4 py-3">
                                { (t.profileImageUrl ?? t.teacherProfile?.profileImageUrl) ? (
                                    <Image src={(t.profileImageUrl ?? t.teacherProfile?.profileImageUrl) || ''} alt={`${t.name ?? t.firstName ?? ''} avatar`} className="w-10 h-10 rounded-full object-cover" width={40} height={40} />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">No</div>
                                  ) }
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">{t.name ?? `${t.firstName ?? ''} ${t.lastName ?? ''}`}</div>
                                <div className="text-xs text-slate-500">{t.teacherProfile?.displayName ?? ''}</div>
                              </td>
                              <td className="px-4 py-3">{t.email}</td>
                              <td className="px-4 py-3">
                                {subjectsToString(t.teacherProfile?.subjects) || '—'}
                              </td>
                              <td className="px-4 py-3">{t.teacherProfile?.hourlyRate ? `$${t.teacherProfile.hourlyRate}` : '—'}</td>
                              <td className="px-4 py-3">{t.teacherProfile?.experienceYears ?? '—'}</td>
                              <td className="px-4 py-3">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Link href={`/teacher/${t.id}`} className="text-emerald-700 text-sm hover:underline">View</Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* responsive cards for mobile */}
                    <div className="sm:hidden mt-2 space-y-3">
                      {pageData.map((t) => (
                        <div key={t.id} className="p-3 bg-white rounded-md border">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              { (t.profileImageUrl ?? t.teacherProfile?.profileImageUrl) ? (
                                <Image src={(t.profileImageUrl ?? t.teacherProfile?.profileImageUrl) || ''} alt={`${t.name ?? t.firstName ?? ''} avatar`} className="w-12 h-12 rounded-full object-cover" width={48} height={48} />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">No</div>
                              ) }

                              <div>
                                <div className="font-medium">{t.name ?? `${t.firstName ?? ''} ${t.lastName ?? ''}`}</div>
                                <div className="text-xs text-slate-500">{t.email}</div>
                              </div>
                            </div>

                            <div className="text-sm text-slate-600">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</div>
                          </div>
                          <div className="mt-2 text-sm text-slate-700">
                            <div>Subjects: {subjectsToString(t.teacherProfile?.subjects) || '—'}</div>
                            <div>Hourly: {t.teacherProfile?.hourlyRate ? `$${t.teacherProfile.hourlyRate}` : '—'}</div>
                            <div className="mt-2">
                              <Link href={`/teacher/${t.id}`} className="text-emerald-700 text-sm hover:underline">View profile</Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* pagination */}
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="text-slate-600">Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-2 py-1 rounded-md border bg-white text-sm"
                        >Prev</button>
                        <div className="px-3 py-1 border rounded-md bg-white">{page} / {pageCount}</div>
                        <button
                          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                          disabled={page === pageCount}
                          className="px-2 py-1 rounded-md border bg-white text-sm"
                        >Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {tab === 'students' && (
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Students</h3>
                  <p className="text-sm text-slate-600">List of students. Search, view and export to Excel (CSV compatible).</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={studentQuery}
                    onChange={(e) => { setStudentQuery(e.target.value); setStudentPage(1); }}
                    placeholder="Search by name or email"
                    className="px-3 py-2 rounded-md border w-full sm:w-64 text-sm"
                  />

                  <button
                    onClick={exportStudentsCSV}
                    className="px-3 py-2 rounded-md bg-slate-800 text-white text-sm"
                    disabled={loadingStudents || students.length === 0}
                  >Export Excel</button>
                </div>
              </div>

              <div className="mt-4">
                {loadingStudents ? (
                  <div className="p-4 rounded-lg border bg-white text-sm">Loading students...</div>
                ) : studentsError ? (
                  <div className="p-4 rounded-lg border bg-red-50 text-red-700">Error: {studentsError}</div>
                ) : students.length === 0 ? (
                  <div className="p-4 rounded-lg border bg-white text-sm">No students found.</div>
                ) : (
                  <>
                    {/* table for larger screens */}
                    <div className="hidden sm:block mt-2 overflow-x-auto rounded-md border">
                      <table className="w-full min-w-[800px] table-auto">
                        <thead className="bg-slate-50 text-left text-sm text-slate-600">
                          <tr>
                            <th className="px-4 py-3">Avatar</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700">
                          {studentPageData.map((s) => (
                            <tr key={s.id} className="border-t bg-white">
                              <td className="px-4 py-3">
                                { s.profileImageUrl ? (
                                  <Image src={s.profileImageUrl} alt={`${s.name ?? s.firstName ?? ''} avatar`} className="w-10 h-10 rounded-full object-cover" width={40} height={40} />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">No</div>
                                ) }
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">{s.name ?? `${s.firstName ?? ''} ${s.lastName ?? ''}`}</div>
                              </td>
                              <td className="px-4 py-3">{s.email}</td>
                              <td className="px-4 py-3">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Link href={`/learner/${s.id}`} className="text-emerald-700 text-sm hover:underline">View</Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* responsive cards for mobile */}
                    <div className="sm:hidden mt-2 space-y-3">
                      {studentPageData.map((s) => (
                        <div key={s.id} className="p-3 bg-white rounded-md border">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              { s.profileImageUrl ? (
                                <Image src={s.profileImageUrl} alt={`${s.name ?? s.firstName ?? ''} avatar`} className="w-12 h-12 rounded-full object-cover" width={48} height={48} />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">No</div>
                              ) }

                              <div>
                                <div className="font-medium">{s.name ?? `${s.firstName ?? ''} ${s.lastName ?? ''}`}</div>
                                <div className="text-xs text-slate-500">{s.email}</div>
                              </div>
                            </div>

                            <div className="text-sm text-slate-600">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</div>
                          </div>
                          <div className="mt-2 text-sm text-slate-700">
                            <div className="mt-2"><Link href={`/learner/${s.id}`} className="text-emerald-700 text-sm hover:underline">View profile</Link></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* pagination */}
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="text-slate-600">Showing {Math.min((studentPage - 1) * studentPerPage + 1, filteredStudents.length)}–{Math.min(studentPage * studentPerPage, filteredStudents.length)} of {filteredStudents.length}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                          disabled={studentPage === 1}
                          className="px-2 py-1 rounded-md border bg-white text-sm"
                        >Prev</button>
                        <div className="px-3 py-1 border rounded-md bg-white">{studentPage} / {studentPageCount}</div>
                        <button
                          onClick={() => setStudentPage((p) => Math.min(studentPageCount, p + 1))}
                          disabled={studentPage === studentPageCount}
                          className="px-2 py-1 rounded-md border bg-white text-sm"
                        >Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {tab === 'approvals' && (
            <section>
              <h3 className="text-lg font-semibold mb-2">Teacher Approvals</h3>
              <p className="text-sm text-slate-600">Approve or reject pending teacher profiles and documents.</p>

              <div className="mt-4">
                {loadingApprovals ? (
                  <div className="p-4 rounded-lg border bg-white text-sm">Loading pending approvals...</div>
                ) : approvalsError ? (
                  <div className="p-4 rounded-lg border bg-red-50 text-red-700">Error: {approvalsError}</div>
                ) : approvals.length === 0 ? (
                  <div className="p-4 rounded-lg border bg-white text-sm">No pending approvals.</div>
                ) : (
                  <div className="space-y-4">
                    {approvals.map((a) => (
                      <div key={a.id} className="p-4 rounded-lg border bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {a.user?.profileImageUrl ? (
                              <Image src={a.user.profileImageUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover" width={48} height={48} />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm text-slate-500">No</div>
                            )}

                            <div>
                              <div className="font-medium">{a.user?.name ?? `${a.user?.firstName ?? ''} ${a.user?.lastName ?? ''}`}</div>
                              <div className="text-xs text-slate-500">{a.user?.email}</div>
                              <div className="text-xs text-slate-500">Submitted: {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {a.resumeUrl && (
                              <a href={`/api/admin/approvals/resume/${a.id}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline">Resume</a>
                            )}
                            {a.idCardUrl && (
                              <a href={a.idCardUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline">Aadhaar</a>
                            )}
                            {a.degreeProofUrl && (
                              <a href={a.degreeProofUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline">Degree</a>
                            )}

                            <div className="ml-3 px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700 border border-slate-200">
                              Attempts left: {Math.max(0, 3 - ((a as unknown as { docsUploadAttempts?: number })?.docsUploadAttempts ?? 0))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          {a.docsStatus === 'VERIFIED' ? (
                            <button onClick={() => setPendingRemoveId(a.id)} className="px-3 py-2 rounded-md bg-gray-200 text-sm text-red-600">Remove</button>
                          ) : (
                            <button onClick={() => handleApprovalAction(a.id, 'approve')} className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm">Approve</button>
                          )}

                          {/* Inline reject confirmation UI */}
                          {pendingRejectId === a.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Optional rejection reason"
                                className="px-2 py-1 rounded-md border text-sm w-64"
                                aria-label="Rejection reason"
                                disabled={rejectingId === a.id}
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    setRejectingId(a.id);
                                    await handleApprovalAction(a.id, 'reject', rejectReason || undefined);
                                  } finally {
                                    setRejectingId(null);
                                    setPendingRejectId(null);
                                    setRejectReason('');
                                  }
                                }}
                                disabled={rejectingId === a.id}
                                className="px-3 py-2 rounded-md bg-red-600 text-white text-sm"
                              >
                                {rejectingId === a.id ? 'Rejecting...' : 'Confirm Reject'}
                              </button>
                              <button onClick={() => { setPendingRejectId(null); setRejectReason(''); }} disabled={rejectingId === a.id} className="px-3 py-2 rounded-md bg-slate-100 text-sm">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setPendingRejectId(a.id)} className="px-3 py-2 rounded-md bg-red-600 text-white text-sm">Reject</button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Confirmation dialog for reject action */}
                    <Dialog open={!!pendingRejectId} onOpenChange={(open) => { if (!open) { setPendingRejectId(null); setRejectReason(''); } }}>
                      <DialogContent className="sm:max-w-md rounded-xl">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-bold text-slate-900">Confirm rejection</DialogTitle>
                          <DialogDescription className="text-sm text-slate-600 mt-2">Rejecting a teacher will remove their pending approval and notify them (if a reason is provided). This action cannot be undone from this screen.</DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4">
                          {pendingRejectId ? (() => {
                            const profile = approvals.find((x) => x.id === pendingRejectId);
                            if (!profile) return <div className="text-sm text-slate-600">Profile not found.</div>;
                            return (
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                  {profile.user?.profileImageUrl ? (
                                    <Image src={profile.user.profileImageUrl} alt="avatar" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm text-slate-500">No</div>
                                  )}
                                  <div>
                                    <div className="font-medium">{profile.user?.name ?? `${profile.user?.firstName ?? ''} ${profile.user?.lastName ?? ''}`}</div>
                                    <div className="text-xs text-slate-500">{profile.user?.email}</div>
                                  </div>
                                </div>

                                <div className="text-sm">
                                  <div className="mb-1">Uploaded documents:</div>
                                  <div className="flex flex-wrap gap-2">
                                    {profile.resumeUrl && <a href={`/api/admin/approvals/resume/${profile.id}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline">Resume</a>}
                                    {profile.idCardUrl && <a href={profile.idCardUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline">Aadhaar</a>}
                                    {profile.degreeProofUrl && <a href={profile.degreeProofUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline">Degree</a>}
                                  </div>
                                </div>

                                <label className="text-sm text-slate-700">Optional rejection reason (shown to teacher)</label>
                                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full p-2 border rounded-md text-sm" rows={4} />
                              </div>
                            );
                          })() : null}
                        </div>

                        <DialogFooter>
                          <button onClick={() => { setPendingRejectId(null); setRejectReason(''); }} className="px-3 py-2 rounded-md bg-slate-100 text-sm">Cancel</button>
                          <button
                            onClick={async () => {
                              if (!pendingRejectId) return;
                              try {
                                setRejectingId(pendingRejectId);
                                await handleApprovalAction(pendingRejectId, 'reject', rejectReason || undefined);
                                setPendingRejectId(null);
                                setRejectReason('');
                              } finally {
                                setRejectingId(null);
                              }
                            }}
                            disabled={!!rejectingId}
                            className="px-3 py-2 rounded-md bg-red-600 text-white text-sm"
                          >
                            {rejectingId ? 'Rejecting...' : 'Confirm reject'}
                          </button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Remove confirmation dialog */}
                    <Dialog open={!!pendingRemoveId} onOpenChange={(open) => { if (!open) setPendingRemoveId(null); }}>
                      <DialogContent className="sm:max-w-md rounded-xl">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-bold text-slate-900">Confirm removal</DialogTitle>
                          <DialogDescription className="text-sm text-slate-600 mt-2">Removing this teacher will temporarily hide them from the Mentors Page. You can restore their profile at any time in the future.</DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4">
                          {pendingRemoveId ? (() => {
                            const profile = approvals.find((x) => x.id === pendingRemoveId);
                            if (!profile) return <div className="text-sm text-slate-600">Profile not found.</div>;
                            return (
                              <div className="flex items-center gap-3">
                                {profile.user?.profileImageUrl ? (
                                  <Image src={profile.user.profileImageUrl} alt="avatar" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm text-slate-500">No</div>
                                )}
                                <div>
                                  <div className="font-medium">{profile.user?.name ?? `${profile.user?.firstName ?? ''} ${profile.user?.lastName ?? ''}`}</div>
                                  <div className="text-xs text-slate-500">{profile.user?.email}</div>
                                </div>
                              </div>
                            );
                          })() : null}
                        </div>

                        <DialogFooter>
                          <button onClick={() => setPendingRemoveId(null)} className="px-3 py-2 rounded-md bg-slate-100 text-sm">Cancel</button>
                          <button
                            onClick={async () => {
                              if (!pendingRemoveId) return;
                              try {
                                setRemovingId(pendingRemoveId);
                                await handleApprovalAction(pendingRemoveId, 'remove');
                                setPendingRemoveId(null);
                              } finally {
                                setRemovingId(null);
                              }
                            }}
                            disabled={!!removingId}
                            className="px-3 py-2 rounded-md bg-gray-800 text-white text-sm"
                          >
                            {removingId ? 'Removing...' : 'Confirm remove'}
                          </button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                   </div>
                 )}
               </div>
             </section>
           )}
        </div>
      </div>
    </div>
  );
}
