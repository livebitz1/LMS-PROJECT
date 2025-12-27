"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';

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
  linkedin?: string | null;
  contact?: string | null;
  profileImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  // added document fields
  resumeUrl?: string | null;
  idCardUrl?: string | null;
  degreeProofUrl?: string | null;
  docsStatus?: string | null;
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
  const [linkedinError, setLinkedinError] = useState<string | null>(null);
  const linkedinRef = useRef<HTMLInputElement | null>(null);

  // Track last saved snapshot to determine dirty state
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);

  const makeSnapshot = () => JSON.stringify({
    displayName: displayName ?? '',
    bio: bio ?? '',
    degree: degree ?? '',
    experienceYears: experienceYears === '' ? '' : Number(experienceYears),
    hourlyRate: hourlyRate === '' ? '' : Number(hourlyRate),
    subjects: Array.isArray(subjects) ? subjects : [],
    contact: contact ?? '',
    linkedin: linkedin ?? '',
  });

  const isDirty = lastSavedSnapshot !== null ? makeSnapshot() !== lastSavedSnapshot : true;

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

    // Initialize lastSavedSnapshot to current profile values (or defaults)
    setTimeout(() => {
      const snap = JSON.stringify({
        displayName: profile.displayName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ?? '',
        bio: profile.bio ?? '',
        degree: profile.degree ?? '',
        experienceYears: profile.experienceYears ?? '',
        hourlyRate: profile.hourlyRate ?? '',
        subjects: Array.isArray(profile.subjects) ? profile.subjects : profile.subjects ?? [],
        contact: profile.contact ?? '',
        linkedin: profile.linkedin ?? '',
      });
      setLastSavedSnapshot(snap);
    }, 0);
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

    // Validate LinkedIn URL if provided
    const validateLinkedin = (value: string): string | null => {
      const v = (value ?? '').toString().trim();
      if (!v) return null; // optional field
      let candidate = v;
      // if user typed something like 'linkedin.com/in/you' or 'www.linkedin.com/in/you' add scheme
      if (!/^https?:\/\//i.test(candidate)) candidate = 'https://' + candidate;
      try {
        const u = new URL(candidate);
        const host = u.hostname.toLowerCase();
        if (!host.includes('linkedin')) return null; // invalid
        // Normalize to https and remove tracking params
        u.protocol = 'https:';
        u.hash = '';
        u.search = '';
        return u.toString().replace(/\/$/, '');
      } catch {
        return null;
      }
    };

    const normalizedLinkedin = validateLinkedin(linkedin);
    if (linkedin && !normalizedLinkedin) {
      setLinkedinError('Please provide a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/your-name)');
      setSaving(false);
      setTimeout(() => {
        linkedinRef.current?.focus();
        linkedinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setLinkedinError(null);

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
          linkedin: normalizedLinkedin ?? linkedin,
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
      // update lastSaved snapshot so the Save button becomes disabled until changes
      setLastSavedSnapshot(makeSnapshot());
      // clear saved state after a short delay so button returns to normal
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const existingAttempts = (profile as unknown as { docsUploadAttempts?: number | null })?.docsUploadAttempts ?? 0;
  const MAX_TRIES = 3;
  const remainingTries = Math.max(0, MAX_TRIES - existingAttempts);

  // helper to preview image if needed
  const filenameFromUrl = (u?: string | null) => {
    if (!u) return null;
    try {
      const p = new URL(u).pathname.split('/').pop();
      return p ? decodeURIComponent(p) : null;
    } catch {
      // fallback to naive split
      const parts = u.split('/');
      return parts[parts.length - 1] ?? null;
    }
  };

  // Produce a human-friendly filename by removing long random tokens (cloudinary ids)
  const prettyFilename = (raw?: string | null) => {
    const name = raw ? raw : '';
    if (!name) return null;
    // strip extension
    const extMatch = name.match(/(\.[a-z0-9]+)$/i);
    const ext = extMatch ? extMatch[1] : '';
    const base = name.replace(/(\.[a-z0-9]+)$/i, '');
    // split on common separators
    const tokens = base.split(/[_\-\.\s]+/).filter(Boolean);
    // remove tokens that look like cloudinary/public ids: long alphanumeric sequences
    const filtered = tokens.filter((t) => {
      if (/^v?\d+$/.test(t)) return false; // version numbers
      if (/^[a-z0-9]{6,}$/i.test(t)) return false; // long random token
      return true;
    });
    const candidate = filtered.join(' ');
    if (candidate.trim().length === 0) {
      // fallback to short original base
      return base.length > 24 ? base.slice(0, 20) + '...' + ext : base + ext;
    }
    return candidate + ext;
  };

  // If filename looks like a random token, fall back to a friendly field label
  const isLikelyRandomToken = (name?: string | null) => {
    if (!name) return false;
    const base = name.replace(/(\.[a-z0-9]+)$/i, '');
    // consider random if single token 6+ chars with no separators
    if (/^[a-z0-9]{6,}$/i.test(base)) return true;
    return false;
  };

  // Return either the local name, a friendly pretty name, or a prompt telling the user to re-upload
  const displayNameOrUploadPrompt = (localFile: File | null, remoteFilename?: string | null, fieldLabel = 'File') => {
    if (localFile) return localFile.name;
    if (!remoteFilename) return 'No file';
    if (isLikelyRandomToken(remoteFilename)) return `Please upload a ${fieldLabel.toLowerCase()} — filename will appear after upload`;
    return prettyFilename(remoteFilename) ?? 'Uploaded';
  };

  // Refs to hidden inputs so we can trigger them programmatically and support clicking the prompt text
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const idcardInputRef = useRef<HTMLInputElement | null>(null);
  const degreeInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (remainingTries <= 0) {
      setUploadMessage('You have reached the maximum number of document uploads (3). Please contact support.');
      return;
    }
    ref.current?.click();
  };

  // small helper to clear a chosen file
  const clearFile = (which: 'resume' | 'idcard' | 'degree') => {
    if (which === 'resume') setResumeFile(null);
    if (which === 'idcard') setIdCardFile(null);
    if (which === 'degree') setDegreeFile(null);
    setUploadMessage(null);
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
          <Input
            ref={linkedinRef}
            value={linkedin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setLinkedin(e.target.value); if (linkedinError) setLinkedinError(null); }}
            onBlur={() => {
              // attempt to normalize on blur for nicer UX
              const v = (linkedin ?? '').toString().trim();
              if (!v) { setLinkedinError(null); return; }
              let candidate = v;
              if (!/^https?:\/\//i.test(candidate)) candidate = 'https://' + candidate;
              try {
                const u = new URL(candidate);
                if (!u.hostname.toLowerCase().includes('linkedin')) {
                  setLinkedinError('Please enter a LinkedIn profile URL (example: https://www.linkedin.com/in/your-name)');
                  return;
                }
                u.protocol = 'https:';
                u.hash = '';
                u.search = '';
                setLinkedin(u.toString().replace(/\/$/, ''));
                setLinkedinError(null);
              } catch {
                setLinkedinError('Please enter a valid LinkedIn URL');
              }
            }}
            placeholder="LinkedIn URL (optional)"
            aria-invalid={linkedinError ? 'true' : 'false'}
            aria-describedby={linkedinError ? 'linkedin-error' : undefined}
          />
          {linkedinError ? (
            <p id="linkedin-error" className="mt-1 text-sm text-red-600">{linkedinError}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Optional — add your LinkedIn profile for students to view your professional background.</p>
          )}

          {/* Preview link when a valid LinkedIn URL is present */}
          {linkedin && !linkedinError && (
            <div className="mt-2">
              <a href={linkedin} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 underline">View LinkedIn profile</a>
            </div>
          )}
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

      <div>
        <label className="block mb-2 text-sm font-medium">Required documents (Resume, Aadhaar, Degree)</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Resume card */}
          <div className="border rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2" onDrop={(e)=>{ e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) setResumeFile(f); }} onDragOver={(e)=>e.preventDefault()}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Resume</div>
              <div className={`text-xs px-2 py-1 rounded-full ${profile?.docsStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{profile?.docsStatus ?? 'N/A'}</div>
            </div>
            <div className="text-xs text-slate-500">PDF or Word document (visible to admins)</div>
            <div className="flex items-center gap-3">
              <input ref={resumeInputRef} id="resume-file" type="file" accept=".pdf,.doc,.docx" onChange={(e)=>setResumeFile(e.target.files?.[0] ?? null)} className="hidden" disabled={remainingTries <= 0} />
              <label htmlFor="resume-file" className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${remainingTries <= 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'}`}>Choose file</label>
              <button type="button" onClick={()=>triggerFileInput(resumeInputRef)} className="text-xs text-slate-600 min-w-0 truncate text-left" aria-label="Open resume picker" disabled={remainingTries <= 0}>{displayNameOrUploadPrompt(resumeFile, filenameFromUrl(profile?.resumeUrl), 'Resume')}</button>
              {resumeFile && (
                <button type="button" onClick={()=>clearFile('resume')} className="text-xs text-red-600 ml-2">Remove</button>
              )}
            </div>
            {profile?.resumeUrl && (
              <div className="mt-2 text-xs">
                <a href={`/api/admin/approvals/resume/${profile?.id}`} target="_blank" rel="noreferrer" className="text-emerald-600 underline">View uploaded resume</a>
              </div>
            )}
          </div>

          {/* Aadhaar card */}
          <div className="border rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2" onDrop={(e)=>{ e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) setIdCardFile(f); }} onDragOver={(e)=>e.preventDefault()}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Aadhaar</div>
              <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">Image</div>
            </div>
            <div className="text-xs text-slate-500">Clear photo of your ID (jpeg/png)</div>
            <div className="flex items-center gap-3">
              <input ref={idcardInputRef} id="idcard-file" type="file" accept="image/*" onChange={(e)=>setIdCardFile(e.target.files?.[0] ?? null)} className="hidden" disabled={remainingTries <= 0} />
              <label htmlFor="idcard-file" className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${remainingTries <= 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'}`}>Choose image</label>
              <button type="button" onClick={()=>triggerFileInput(idcardInputRef)} className="min-w-0 truncate text-xs text-slate-600 text-left" disabled={remainingTries <= 0}>{displayNameOrUploadPrompt(idCardFile, filenameFromUrl(profile?.idCardUrl), 'Aadhaar')}</button>
              {idCardFile && (
                <button type="button" onClick={()=>clearFile('idcard')} className="text-xs text-red-600 ml-2">Remove</button>
              )}
            </div>
            {idCardFile ? (
              <div className="mt-2 text-xs text-slate-600">Selected: {idCardFile.name}</div>
            ) : profile?.idCardUrl ? (
              <div className="mt-2 text-xs">
                <a href={profile.idCardUrl} target="_blank" rel="noreferrer" className="text-emerald-600 underline">View uploaded Aadhaar</a>
              </div>
            ) : null}
          </div>

          {/* Degree card */}
          <div className="border rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2" onDrop={(e)=>{ e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) setDegreeFile(f); }} onDragOver={(e)=>e.preventDefault()}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Degree proof</div>
              <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">PDF / Image</div>
            </div>
            <div className="text-xs text-slate-500">Upload degree certificate (PDF/image)</div>
            <div className="flex items-center gap-3">
              <input ref={degreeInputRef} id="degree-file" type="file" accept=".pdf,image/*" onChange={(e)=>setDegreeFile(e.target.files?.[0] ?? null)} className="hidden" disabled={remainingTries <= 0} />
              <label htmlFor="degree-file" className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${remainingTries <= 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'}`}>Choose file</label>
              <button type="button" onClick={()=>triggerFileInput(degreeInputRef)} className="min-w-0 truncate text-xs text-slate-600 text-left" disabled={remainingTries <= 0}>{displayNameOrUploadPrompt(degreeFile, filenameFromUrl(profile?.degreeProofUrl), 'Degree')}</button>
              {degreeFile && (
                <button type="button" onClick={()=>clearFile('degree')} className="text-xs text-red-600 ml-2">Remove</button>
              )}
            </div>
            {degreeFile && <div className="mt-2 text-xs text-slate-600">Selected: {degreeFile.name}</div>}
            {profile?.degreeProofUrl && !degreeFile && (
              <div className="mt-2 text-xs">
                <a href={profile.degreeProofUrl} target="_blank" rel="noreferrer" className="text-emerald-600 underline">View uploaded degree</a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">{uploadMessage ?? (remainingTries <= 0 ? 'No uploads left — contact support' : `${remainingTries} upload${remainingTries === 1 ? '' : 's'} left`)}</div>
          <div className="flex items-center gap-2">
            <Button onClick={async () =>{
              setUploadMessage(null);
              if (remainingTries <= 0) { setUploadMessage('You have reached the maximum number of document uploads (3). Please contact support.'); return; }
              // validate before upload
              const typesDoc = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
              const typesImage = ['image/jpeg','image/png','image/webp'];
              if (!resumeFile && !profile?.resumeUrl) { setUploadMessage('Please select a resume file'); return; }
              if (!idCardFile && !profile?.idCardUrl) { setUploadMessage('Please select an Aadhaar image'); return; }
              if (!degreeFile && !profile?.degreeProofUrl) { setUploadMessage('Please select a degree file'); return; }
              if (resumeFile && !typesDoc.includes(resumeFile.type)) { setUploadMessage('Resume must be a PDF or Word document'); return; }
              if (idCardFile && !typesImage.includes(idCardFile.type)) { setUploadMessage('Aadhaar must be an image (jpeg/png/webp)'); return; }
              if (degreeFile && ![...typesImage, 'application/pdf'].includes(degreeFile.type)) { setUploadMessage('Degree must be PDF or image'); return; }

              setUploadingDocs(true);
              try {
                const fd = new FormData();
                if (resumeFile) fd.append('resume', resumeFile as File);
                if (idCardFile) fd.append('idCard', idCardFile as File);
                if (degreeFile) fd.append('degree', degreeFile as File);
                const res = await fetch('/api/teacher/docs', { method: 'POST', body: fd });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error ?? 'Upload failed');
                setUploadMessage('Uploaded successfully and pending verification');
                // refresh profile (server state) so uploaded URLs show
                router.refresh();
                setResumeFile(null);
                setIdCardFile(null);
                setDegreeFile(null);
                // keep loader visible until router refresh has a chance to update tries/status
                await new Promise((r) => setTimeout(r, 900));
                setUploadingDocs(false);
              } catch (err) {
                setUploadMessage(String((err as Error)?.message ?? err));
                setUploadingDocs(false);
              } finally { if (!uploadingDocs) { /* noop - already handled */ } }
            }} disabled={uploadingDocs || remainingTries <= 0}>
              {uploadingDocs ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  <span>Uploading...</span>
                </span>
              ) : remainingTries <= 0 ? 'No uploads left' : `Upload documents (${remainingTries} tries left)`}
            </Button>

            <Button variant="ghost" onClick={() => { setResumeFile(null); setIdCardFile(null); setDegreeFile(null); setUploadMessage(null); }}>Reset</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`relative flex items-center transition-opacity ${(!isDirty || saving) ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
        >
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
