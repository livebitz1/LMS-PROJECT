"use client";

import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

type User = {
  id: string;
  clerkId: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  profileImageUrl?: string | null;
  createdAt: string; // ISO string
};

export default function UsersGrid({ users }: { users: User[] }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<{ key: keyof User | null; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');

  const columns: { key: keyof User; label: string }[] = [
    { key: 'clerkId', label: 'Clerk ID' },
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Full Name' },
    { key: 'firstName', label: 'First' },
    { key: 'lastName', label: 'Last' },
    { key: 'role', label: 'Role' },
    { key: 'createdAt', label: 'Created At' },
  ];

  const getInitials = (u: User) => {
    const name = (u.name || `${u.firstName ?? ''} ${u.lastName ?? ''}`).trim() || u.email || '';
    const parts = name.split(/\s+/).filter(Boolean);
    const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    return initials.toUpperCase().slice(0, 2) || name.slice(0, 2).toUpperCase();
  };

  const normalized = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = users.slice();

    // filter by role if selected
    if (roleFilter && roleFilter !== 'all') {
      arr = arr.filter((u) => {
        const r = (u.role || '').toLowerCase();
        if (roleFilter === 'student') return r.includes('student');
        if (roleFilter === 'teacher') return r.includes('teacher');
        return true;
      });
    }

    if (q) {
      arr = arr.filter((u) => (
        (u.clerkId || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (String(u.name || '')).toLowerCase().includes(q) ||
        (String(u.firstName || '')).toLowerCase().includes(q) ||
        (String(u.lastName || '')).toLowerCase().includes(q) ||
        (String(u.role || '')).toLowerCase().includes(q)
      ));
    }

    if (sortBy.key) {
      const key = sortBy.key;
      arr.sort((a, b) => {
        const va = (a[key] ?? '') as any;
        const vb = (b[key] ?? '') as any;
        if (key === 'createdAt') {
          const da = new Date(String(va)).getTime();
          const db = new Date(String(vb)).getTime();
          return sortBy.dir === 'asc' ? da - db : db - da;
        }
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        if (sa < sb) return sortBy.dir === 'asc' ? -1 : 1;
        if (sa > sb) return sortBy.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return arr;
  }, [users, query, sortBy, roleFilter]);

  const total = normalized.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = normalized.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: keyof User) => {
    setPage(1);
    setSortBy((s) => {
      if (s.key === key) {
        return { key, dir: s.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  };

  const toggleSelectAll = () => {
    const allOnPage = pageData.every((u) => selectedIds[u.id]);
    const next = { ...selectedIds };
    if (allOnPage) {
      pageData.forEach((u) => { delete next[u.id]; });
    } else {
      pageData.forEach((u) => { next[u.id] = true; });
    }
    setSelectedIds(next);
  };

  const toggleRow = (id: string) => {
    setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
  };

  const exportCSV = (onlySelected = false) => {
    const rows = (onlySelected ? users.filter(u => selectedIds[u.id]) : users).map(u => ({
      clerkId: u.clerkId,
      email: u.email,
      name: u.name ?? '',
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      role: u.role ?? '',
      profileImageUrl: u.profileImageUrl ?? '',
      createdAt: u.createdAt,
    }));

    if (rows.length === 0) return;

    const header = Object.keys(rows[0] || {}).map(h => `"${h}"`).join(',');
    const csvRows = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...csvRows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = onlySelected ? 'lms-users-selected.csv' : 'lms-users.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Search users (email, name, role...)"
            value={query}
            onChange={(e: any) => { setQuery(e.target.value); setPage(1); }}
            className="w-full sm:w-80"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <label className="mr-2 text-sm">Role</label>
            <Select value={roleFilter} onValueChange={(v: string) => { setRoleFilter(v as any); setPage(1); }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => exportCSV(false)} className="bg-black text-white">Export all</Button>
          <Button variant="outline" onClick={() => exportCSV(true)}>Export selected</Button>
        </div>
      </div>

      {/* Desktop / wide screens: table */}
      <div className="hidden sm:block overflow-auto border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 sticky top-0">
              <TableHead className="p-2 w-12"><Checkbox checked={pageData.length > 0 && pageData.every(u => selectedIds[u.id])} onCheckedChange={toggleSelectAll} aria-label="Select all" /></TableHead>
              <TableHead className="p-2 w-12">Avatar</TableHead>
              {columns.map((col) => (
                <TableHead key={col.key as string} className="p-2 text-left">
                  <button onClick={() => toggleSort(col.key)} className="flex items-center gap-2">
                    <span className="font-medium">{col.label}</span>
                    {sortBy.key === col.key ? (
                      <span className="text-xs">{sortBy.dir === 'asc' ? '▲' : '▼'}</span>
                    ) : null}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((u) => (
              <TableRow key={u.id} className="even:bg-slate-50 hover:bg-slate-100">
                <TableCell className="p-2"><Checkbox checked={!!selectedIds[u.id]} onCheckedChange={() => toggleRow(u.id)} aria-label={`Select ${u.email}`} /></TableCell>

                <TableCell className="p-2">
                  {u.profileImageUrl ? (
                    <Avatar>
                      <AvatarImage src={u.profileImageUrl} alt={u.name ?? u.email} />
                      <AvatarFallback>{getInitials(u)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-700">
                      {getInitials(u)}
                    </div>
                  )}
                </TableCell>

                <TableCell className="p-2 font-mono text-xs max-w-xs truncate">{u.clerkId}</TableCell>
                <TableCell className="p-2">{u.email}</TableCell>
                <TableCell className="p-2">{u.name ?? '-'}</TableCell>
                <TableCell className="p-2">{u.firstName ?? '-'}</TableCell>
                <TableCell className="p-2">{u.lastName ?? '-'}</TableCell>
                <TableCell className="p-2">{u.role ? <Badge variant="secondary">{u.role}</Badge> : '-'}</TableCell>
                <TableCell className="p-2">{new Date(u.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: compact card list */}
      <div className="sm:hidden space-y-3">
        {pageData.map((u) => (
          <Card key={u.id} className="border">
            <CardContent className="p-3 bg-white flex items-start gap-3">
              <div className="flex-shrink-0">
                <Checkbox checked={!!selectedIds[u.id]} onCheckedChange={() => toggleRow(u.id)} aria-label={`Select ${u.email}`} />
              </div>

              <div className="w-12 flex-shrink-0">
                {u.profileImageUrl ? (
                  <Avatar>
                    <AvatarImage src={u.profileImageUrl} alt={u.name ?? u.email} />
                    <AvatarFallback>{getInitials(u)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-700">
                    {getInitials(u)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <div className="font-medium text-sm">{u.name ?? u.email}</div>
                    <div className="text-xs text-slate-600 truncate">{u.email}</div>
                  </div>
                  <div className="text-xs text-slate-500">{u.role ?? '-'}</div>
                </div>

                <div className="mt-2 text-xs text-slate-500">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                <div className="mt-2 text-xs text-slate-500">ID: <span className="font-mono text-[11px]">{u.clerkId}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-600">Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} users</div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setPage(1)} disabled={page === 1} variant="ghost">«</Button>
          <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} variant="ghost">‹</Button>
          <span className="px-2">Page</span>
          <Input value={page} onChange={(e: any) => { const v = Number(e.target.value) || 1; setPage(Math.min(Math.max(1, v), totalPages)); }} className="w-12 text-center" />
          <span className="px-2">of {totalPages}</span>
          <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="ghost">›</Button>
          <Button onClick={() => setPage(totalPages)} disabled={page === totalPages} variant="ghost">»</Button>
        </div>
      </div>
    </div>
  );
}
