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

    // Create admin user if it doesn't exist
    const existingAdmin = await sql`
      SELECT id FROM users WHERE email = ${process.env.ADMIN_EMAIL}
    `;

    if (existingAdmin.length === 0) {
      await sql`
        INSERT INTO users (email, password, name)
        VALUES (${process.env.ADMIN_EMAIL}, ${hashedPassword}, 'Administrador')
      `;
    }

    return Response.json({
      message: "Database initialized successfully!",
      credentials: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
      status: "ready",
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    return Response.json(
      {
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
