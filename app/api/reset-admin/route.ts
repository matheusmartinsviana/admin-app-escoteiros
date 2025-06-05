import { NextResponse } from "next/server"
import { sql, ensureDbInitialized } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST() {
  try {
    await ensureDbInitialized()

    // Hash the password properly
    const hashedPassword = await hashPassword("admin123")

    // Delete existing admin user and create new one
    await sql`
      DELETE FROM users WHERE email = 'admin@escoteiros.com'
    `

    await sql`
      INSERT INTO users (email, password, name) 
      VALUES ('admin@escoteiros.com', ${hashedPassword}, 'Administrador')
    `

    return NextResponse.json({
      message: "Admin user reset successfully!",
      credentials: {
        email: "admin@escoteiros.com",
        password: "admin123",
      },
    })
  } catch (error) {
    console.error("Error resetting admin user:", error)
    return NextResponse.json(
      {
        error: "Failed to reset admin user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
