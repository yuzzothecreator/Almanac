/**
 * Optional demo seeder for EMPTY databases.
 *
 * This project currently shares your existing Almanac Supabase database
 * (304+ events already present). Do NOT run this against that DB unless
 * you intentionally want demo rows.
 *
 * Safe usage on a fresh database:
 *   npm run db:seed
 */
import "dotenv/config";
import { createHash } from "crypto";
import { addDays, format } from "date-fns";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client/client";

function day(offset: number) {
  return new Date(format(addDays(new Date(), offset), "yyyy-MM-dd"));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (process.env.ALLOW_DEMO_SEED !== "1") {
    throw new Error(
      "Refusing to seed. Set ALLOW_DEMO_SEED=1 to confirm (avoids wiping shared data)."
    );
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const passwordHash = createHash("sha256").update("password123").digest("hex");

  const admin = await prisma.user.upsert({
    where: { email: "admin@almanac.app" },
    update: {
      full_name: "Almanac Admin",
      role: "super_admin",
      is_verified: true,
    },
    create: {
      email: "admin@almanac.app",
      full_name: "Almanac Admin",
      password_hash: passwordHash,
      role: "super_admin",
      is_verified: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "alex@university.edu" },
    update: {
      full_name: "Alex Morgan",
      role: "student",
      is_verified: true,
    },
    create: {
      email: "alex@university.edu",
      full_name: "Alex Morgan",
      password_hash: passwordHash,
      role: "student",
      is_verified: true,
    },
  });

  await prisma.event.deleteMany({ where: { created_by: "seed" } });

  const events = await Promise.all([
    prisma.event.create({
      data: {
        created_by: "seed",
        title: "Opening Convocation Ceremony",
        description:
          "Welcome the new academic year with faculty, staff, and incoming students.",
        date: day(3),
        start_time: "09:00",
        end_time: "11:30",
        venue: "Main Auditorium",
        organizer: "Office of the Vice Chancellor",
        category: "academic",
        status: "published",
        priority: "high",
        department: "Administration",
        is_featured: true,
      },
    }),
    prisma.event.create({
      data: {
        created_by: "seed",
        title: "Inter-Faculty Football Finals",
        description: "Championship match between Engineering and Business faculties.",
        date: day(5),
        start_time: "15:00",
        end_time: "17:00",
        venue: "University Stadium",
        organizer: "Sports Council",
        category: "sports",
        status: "published",
        priority: "medium",
        department: "Sports",
        is_featured: true,
      },
    }),
    prisma.event.create({
      data: {
        created_by: "seed",
        title: "AI & Innovation Seminar",
        description:
          "Industry leaders discuss the future of AI in education and research.",
        date: day(7),
        start_time: "10:00",
        end_time: "13:00",
        venue: "ICT Lecture Theatre",
        organizer: "Computing Department",
        category: "seminars",
        status: "published",
        priority: "medium",
        department: "Computing",
        is_featured: true,
      },
    }),
  ]);

  console.log("Demo seed complete:");
  console.log(`  users: ${admin.email}, ${student.email}`);
  console.log(`  seed events: ${events.length}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
