import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../../.env") });

const requiredEnvVars = [
  "DATABASE_URL",
  "BOOTSTRAP_SUPER_ADMIN_EMAIL",
  "BOOTSTRAP_SUPER_ADMIN_NAME",
  "BOOTSTRAP_ORG_NAME",
] as const;

const getRequiredEnv = (name: (typeof requiredEnvVars)[number]) => {
  const value = process.env[name]?.trim();

  if (!value) {
    return null;
  }

  return value;
};

const missing = requiredEnvVars.filter((name) => !getRequiredEnv(name));

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const databaseUrl = getRequiredEnv("DATABASE_URL")!;
const email = getRequiredEnv("BOOTSTRAP_SUPER_ADMIN_EMAIL")!;
const displayName = getRequiredEnv("BOOTSTRAP_SUPER_ADMIN_NAME")!;
const orgName = getRequiredEnv("BOOTSTRAP_ORG_NAME")!;

const adapter = new PrismaPg({ connectionString: databaseUrl });
const db = new PrismaClient({ adapter, log: ["error"] });

const main = async () => {
  const existingSuperAdmin = await db.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { email: true },
  });

  if (existingSuperAdmin) {
    console.error(
      `Refusing to bootstrap: SUPER_ADMIN already exists (${existingSuperAdmin.email}).`,
    );
    process.exitCode = 1;
    return;
  }

  const org =
    (await db.org.findFirst({ where: { displayName: orgName } })) ??
    (await db.org.create({ data: { displayName: orgName } }));

  const existingUser = await db.user.findFirst({
    where: { email, orgId: org.id },
    select: { id: true },
  });

  const user = existingUser
    ? await db.user.update({
        where: { id: existingUser.id },
        data: {
          displayName,
          role: "SUPER_ADMIN",
          orgId: org.id,
          clerkUserId: null,
        },
      })
    : await db.user.create({
        data: {
          email,
          displayName,
          role: "SUPER_ADMIN",
          orgId: org.id,
          clerkUserId: null,
        },
      });

  console.log("Bootstrapped Super Admin");
  console.log(`User: ${user.email}`);
  console.log(`Org: ${org.displayName}`);
  console.log("Clerk link: pending user.created webhook");
};

main()
  .catch((error: unknown) => {
    console.error("Failed to bootstrap Super Admin");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
