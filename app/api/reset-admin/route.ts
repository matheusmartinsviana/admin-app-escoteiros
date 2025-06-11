import { sql, ensureDbInitialized } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: "Credenciais de administrador não configuradas" },
      { status: 500 }
    );
  }

  try {
    await ensureDbInitialized();

    // Hash the password properly
    const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD);

    // Delete existing admin user and create new one
    await sql`
      DELETE FROM users WHERE email = ${process.env.ADMIN_EMAIL}
    `;

    await sql`
      INSERT INTO users (email, password, name)
      VALUES (${process.env.ADMIN_EMAIL}, ${hashedPassword}, 'Administrador')
    `;

    return Response.json({
      message: "Admin reset successfully!",
      credentials: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
      status: "ready",
    });
  } catch (error) {
    console.error("Error resetting admin user:", error);
    return Response.json(
      {
        error: "Failed to reset admin user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
