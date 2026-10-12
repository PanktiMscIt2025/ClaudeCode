// Shared by the browser (live checklist) and the server (enforcement).
export const passwordRules = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "case", label: "Upper and lower case letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "num", label: "At least one number", test: (p: string) => /\d/.test(p) },
];

export function isStrongPassword(p: string): boolean {
  return p.length <= 128 && passwordRules.every((r) => r.test(p));
}
