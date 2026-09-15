import "dotenv/config";
import { auth } from "../auth";
import { db } from "../db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@pressforge.local";
  const password = process.env.ADMIN_PASSWORD || "Admin123456!";
  const name = "Site Administrator";

  console.log(`Checking admin user: ${email}...`);

  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);

  if (!existing.length) {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });
    console.log(`User created via Better-Auth.`);
  }

  await db.update(user).set({ role: "admin" }).where(eq(user.email, email));

  console.log("\n==========================================");
  console.log("PressForge Administrator Credentials Ready");
  console.log("==========================================");
  console.log(`Login URL: http://localhost:3000/cms-admin`);
  console.log(`Email:     ${email}`);
  console.log(`Password:  ${password}`);
  console.log(`Role:      admin`);
  console.log("==========================================\n");
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("Error creating admin account:", err);
  process.exit(1);
});
