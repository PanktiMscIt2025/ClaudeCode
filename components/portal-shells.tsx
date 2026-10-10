"use client";

// Nav definitions live in a client module because icon components can't cross the server→client boundary as props.
import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Book, Chart, Download, Folder, History, Home, Inbox, Upload } from "@/components/icons";

const facultyNav: NavItem[] = [
  { href: "/faculty", label: "Dashboard", icon: Home },
  { href: "/faculty/courses", label: "Courses", icon: Folder, prefix: true },
  { href: "/faculty/submissions", label: "Submissions", icon: Inbox, prefix: true },
  { href: "/faculty/export", label: "Marks export", icon: Download },
];

const studentNav: NavItem[] = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student/assignment", label: "Assignment", icon: Book },
  { href: "/student/submit", label: "Submit", icon: Upload },
  { href: "/student/history", label: "History", icon: History },
  { href: "/student/marks", label: "Marks", icon: Chart },
];

export function FacultyShell({ user, children }: { user: { name: string; sub: string }; children: ReactNode }) {
  return (
    <AppShell nav={facultyNav} user={user} roleLabel="Faculty">
      {children}
    </AppShell>
  );
}

export function StudentShell({ user, children }: { user: { name: string; sub: string }; children: ReactNode }) {
  return (
    <AppShell nav={studentNav} user={user} roleLabel="Student" bottomNav>
      {children}
    </AppShell>
  );
}
