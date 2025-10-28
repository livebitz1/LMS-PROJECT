"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type User = {
  id: string;
  clerkId: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  role?: string | null;
  createdAt: string;
};

type Profile = {
  id: string;
  userId: string;
  displayName?: string | null;
  hourlyRate?: number | null;
  bio?: string | null;
  degree?: string | null;
  experienceYears?: number | null;
  subjects?: string[] | null;
  skills?: string[] | null;
  linkedin?: string | null;
  contact?: string | null;
  profileImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function TeacherProfileEditor({ user, profile }: { user: User; profile?: Profile | null }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New fields
  const [degree, setDegree] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');
  // Subjects are limited to a predefined list — teacher can only choose from these
  const ALLOWED_SUBJECTS = [
    'MATHS - JEE MAINS & ADVANCED',
    'PHYSICS - JEE MAINS & ADVANCED',
    'CHEMISTRY - JEE MAINS & ADVANCED',
    'PHYSICS - NEET',
    'CHEMISTRY - NEET',
    'BIOLOGY - NEET',
    'PHYSICS - (11 AND 12)',
    'CHEMISTRY - (11 AND 12)',
    'BIOLOGY - (11 AND 12)',
    'MATHS - (11 AND 12)',
    'SCIENCE - 8th',
    'MATHS - 8th',
    'PHYSICS - 9th',
    'CHEMISTRY - 9th',
    'BIOLOGY - 9th',
    'MATHS - 9th',
    'PHYSICS - 10th',
    'CHEMISTRY - 10th',
    'BIOLOGY - 10th',
    'MATHS - 10th',
  ] as const;

  const [subjects, setSubjects] = useState<string[]>([]);
  const [contact, setContact] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio ?? '');
    setDegree(profile.degree ?? '');
    setExperienceYears(profile.experienceYears ?? '');
    setHourlyRate(profile.hourlyRate ?? '');
    setSubjects(Array.isArray(profile.subjects) ? profile.subjects : profile.subjects ?? []);
    setLinkedin(profile.linkedin ?? '');
    // contact field prefills from profile.contact if available
    setContact(profile.contact ?? '');
    setSkills(Array.isArray(profile.skills) ? profile.skills : profile.skills ?? []);

    // Prefill displayName: prefer explicit profile.displayName, otherwise derive from user's name
    let derived = profile.displayName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (!derived) derived = user.name ?? '';
    setDisplayName(derived);
  }, [profile, user.firstName, user.lastName, user.name]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (!skills.includes(s)) setSkills((p) => [...p, s]);
    setSkillInput('');
  };

  const removeSkill = (s: string) => setSkills((p) => p.filter((k) => k !== s));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          bio,
          degree,
          experienceYears: experienceYears === '' ? undefined : experienceYears,
          hourlyRate: hourlyRate === '' ? undefined : hourlyRate,
          // subjects is a controlled array of allowed values
          subjects: subjects,
          contact,
          linkedin,
          skills,
        }),
      });
      if (!res.ok) {
        let details = 'Unknown error';
        try {
          const payload = await res.json();
          details = payload?.details || JSON.stringify(payload) || details;
        } catch { 
          const text = await res.text().catch(() => '');
          details = text || details;
        }
        console.error('Save failed:', details);
        // show a simple inline failure toast using alert as a fallback
        alert('Save failed: ' + String(details).slice(0, 200));
        return;
      }

      // Refresh server props and show success state with animated tick
      router.refresh();
      setSaved(true);
      // clear saved state after a short delay so button returns to normal
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={`/api/teacher/avatar/${user.clerkId}`} alt={user.name ?? user.email} />
          <AvatarFallback>{(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
            <Input value={displayName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)} placeholder="Public display name (shown on Mentors)" />
          </div>
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Professional bio</label>
        <Textarea value={bio} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)} placeholder="Short bio for your public profile" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block mb-2 text-sm font-medium">Degree</label>
          <Input value={degree} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDegree(e.target.value)} placeholder="e.g. M.Ed, PhD" />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Experience (years)</label>
          <Input
            type="number"
            value={experienceYears}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 5"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Hourly rate (USD/hr)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={hourlyRate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 30.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block mb-2 text-sm font-medium">Contact (required)</label>
          <Input value={contact} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContact(e.target.value)} placeholder="Phone number (required)" />
          <p className="text-xs text-slate-500 mt-1">Provide a contact number so students can reach you. This is required.</p>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">LinkedIn (optional)</label>
          <Input value={linkedin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkedin(e.target.value)} placeholder="LinkedIn URL (optional)" />
          <p className="text-xs text-slate-500 mt-1">Optional — add your LinkedIn profile for students to view your professional background.</p>
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Subjects / Specialties</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALLOWED_SUBJECTS.map((s) => {
            const selected = subjects.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
                }}
                className={`text-sm text-left px-3 py-2 rounded-lg border ${selected ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-800 border-emerald-100'} transition`}
                aria-pressed={selected}
                title={selected ? 'Click to remove' : 'Click to add'}
              >
                {s}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">Choose one or more from the list. Adding custom specializations is not allowed.</p>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Skills</label>
        <div className="flex gap-2 items-center">
          <Input value={skillInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkillInput(e.target.value)} placeholder="Add a skill and press Enter or click Add" onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>)=>{ if(e.key=== 'Enter'){ e.preventDefault(); addSkill(); } }} />
          <Button onClick={addSkill} size="sm">Add</Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <Badge key={s} className="flex items-center gap-2">
              <span>{s}</span>
              <button aria-label={`Remove ${s}`} onClick={() => removeSkill(s)} className="ml-2 text-xs opacity-70">×</button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Button onClick={handleSave} disabled={saving || saved} className="relative flex items-center">
          {/* Saving state */}
          {saving && (
            <span className="mr-2 inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          )}

          {/* Saved state - animated check */}
          {saved ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white animate-[scale_0.25s_ease-out]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="#16A34A" />
                <path d="M7.5 12.5l2.5 2.5L16.5 9.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Profile saved</span>
            </span>
          ) : (
            <span>{saving ? 'Saving...' : 'Save profile'}</span>
          )}
        </Button>

        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </div>
  );
}
