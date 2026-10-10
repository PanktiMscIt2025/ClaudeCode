"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, Input, Select, Table, Td, Th } from "@/components/ui";
import { ReviewBadge, SubmissionBadge } from "@/components/status";
import { ArrowRight, Search } from "@/components/icons";
import type { ReviewRow, SubmissionStatus } from "@/lib/types";

type Filter = "ALL" | "TO_REVIEW" | SubmissionStatus;

/** Searchable, filterable table of students × submission status. */
export function ReviewTable({ rows }: { rows: ReviewRow[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && !`${r.enrollmentNo} ${r.studentName}`.toLowerCase().includes(needle)) return false;
      if (filter === "ALL") return true;
      if (filter === "TO_REVIEW") return r.status === "NEEDS_REVIEW" || r.reviewStatus === "PROVISIONAL";
      return r.status === filter;
    });
  }, [rows, q, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <Input
            type="search"
            placeholder="Search by name or enrollment number"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
            aria-label="Search students"
          />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="sm:w-56" aria-label="Filter by status">
          <option value="ALL">All statuses</option>
          <option value="TO_REVIEW">Needs my review</option>
          <option value="NOT_SUBMITTED">Not submitted</option>
          <option value="EVALUATED">Evaluated</option>
          <option value="NEEDS_REVIEW">Flagged by system</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matching students">Try a different search or filter.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Enrollment</Th>
              <Th>Student</Th>
              <Th>Assignment</Th>
              <Th>Status</Th>
              <Th className="text-right">Score / 30</Th>
              <Th>Review</Th>
              <Th>
                <span className="sr-only">Open</span>
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((r) => (
              <tr key={r.enrollmentNo + r.version} className="transition-colors hover:bg-surface-muted/50">
                <Td className="font-mono text-ink-muted">{r.enrollmentNo}</Td>
                <Td className="font-medium">{r.studentName}</Td>
                <Td>
                  {r.assignmentTitle} <span className="text-xs text-ink-subtle">· {r.version}</span>
                </Td>
                <Td>
                  <SubmissionBadge status={r.status} />
                </Td>
                <Td className="text-right font-semibold tabular-nums">{r.score ?? <span className="font-normal text-ink-subtle">—</span>}</Td>
                <Td>
                  <ReviewBadge status={r.reviewStatus} />
                </Td>
                <Td className="text-right">
                  {r.submissionId && (
                    <Link
                      href={`/faculty/submissions/${r.submissionId}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-ink hover:bg-brand-soft"
                    >
                      Open <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <p className="mt-3 text-xs text-ink-subtle">
        Showing {filtered.length} of {rows.length}
      </p>
    </div>
  );
}
