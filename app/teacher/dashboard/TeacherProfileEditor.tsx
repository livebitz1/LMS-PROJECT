"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const subjectsRef = useRef<HTMLDivElement | null>(null);
  const [contact, setContact] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const contactRef = useRef<HTMLInputElement | null>(null);
  const [linkedin, setLinkedin] = useState('');

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

    // Prefill displayName: prefer explicit profile.displayName, otherwise derive from user's name
    let derived = profile.displayName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (!derived) derived = user.name ?? '';
    setDisplayName(derived);
  }, [profile, user.firstName, user.lastName, user.name]);

  const handleSave = async () => {
    // Subjects must have at least one selected
    if (!Array.isArray(subjects) || subjects.length === 0) {
      setSubjectError('Please choose at least one specialty from the list before continuing. This helps students find you for the right subjects.');
      setTimeout(() => {
        subjectsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        subjectsRef.current?.focus?.();
      }, 50);
      return;
    }
    // clear subject error when valid
    setSubjectError(null);

    // Client-side validation for required Contact field
    const trimmedContact = (contact ?? '').toString().trim();
    if (!trimmedContact) {
      setContactError('Contact number is required to allow students to reach you. Please provide a phone number to proceed.');
      // focus and scroll to the contact input for quick correction
      setTimeout(() => {
        contactRef.current?.focus();
        contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    if (trimmedContact.length < 6 || trimmedContact.length > 60) {
      setContactError('The contact number looks invalid. Please enter a valid phone number (6–60 characters).');
      setTimeout(() => {
        contactRef.current?.focus();
        contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    // clear any previous error
    setContactError(null);

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
          <Input
            ref={contactRef}
            value={contact}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setContact(e.target.value); if (contactError) setContactError(null); }}
            placeholder="Phone number (required)"
            aria-invalid={contactError ? 'true' : 'false'}
            aria-describedby={contactError ? 'contact-error' : undefined}
          />
          {contactError ? (
            <p id="contact-error" className="mt-1 text-sm text-red-600">{contactError}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Provide a contact number so students can reach you. This is required.</p>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">LinkedIn (optional)</label>
          <Input value={linkedin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkedin(e.target.value)} placeholder="LinkedIn URL (optional)" />
          <p className="text-xs text-slate-500 mt-1">Optional — add your LinkedIn profile for students to view your professional background.</p>
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Subjects / Specialties</label>
        <div ref={subjectsRef} tabIndex={-1} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALLOWED_SUBJECTS.map((s) => {
            const selected = subjects.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSubjects((prev) => {
                    const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
                    // clear subject error when user interacts
                    if (next.length > 0) setSubjectError(null);
                    return next;
                  });
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
        {subjectError ? (
          <p className="mt-2 text-sm text-red-600" role="alert">{subjectError}</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Choose one or more from the list. Adding custom specializations is not allowed.</p>
        )}
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
