// Creates the first faculty account from SEED_FACULTY_* env vars. Safe to run repeatedly.
import { db } from "../lib/server/db";
import { hashPassword } from "../lib/server/password";

async function main() {
  const email = (process.env.SEED_FACULTY_EMAIL ?? "faculty@college.edu").trim().toLowerCase();
  const name = process.env.SEED_FACULTY_NAME ?? "Faculty Admin";
  const password = process.env.SEED_FACULTY_PASSWORD ?? "ChangeMe-2026";

  const existing = await db.user.findUnique({ where: { loginId: email } });
  if (existing) {
    console.log(`Faculty ${email} already exists; nothing changed.`);
    return;
  }
  await db.user.create({
    data: {
      role: "FACULTY",
      loginId: email,
      name,
      passwordHash: await hashPassword(password),
      // The sample password from .env.example must be replaced on first sign-in.
      mustChangePassword: password === "ChangeMe-2026",
    },
  });
  console.log(`Created faculty account ${email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
