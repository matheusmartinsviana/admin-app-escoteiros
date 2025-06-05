import { NextResponse } from "next/server"
import { sql, ensureDbInitialized } from "@/lib/db"

export async function GET() {
  try {
    console.log("Testing database connection...")

    // Test basic connection
    await sql`SELECT 1 as test`
    console.log("Basic connection: OK")

    // Test database initialization
    await ensureDbInitialized()
    console.log("Database initialization: OK")

    // Test events table
    const eventsCount = await sql`SELECT COUNT(*) as count FROM events`
    console.log("Events count:", eventsCount[0]?.count)

    // Test users table
    const usersCount = await sql`SELECT COUNT(*) as count FROM users`
    console.log("Users count:", usersCount[0]?.count)

    return NextResponse.json({
      status: "success",
      message: "Database connection and tables are working",
      data: {
        eventsCount: eventsCount[0]?.count || 0,
        usersCount: usersCount[0]?.count || 0,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Database test failed:", error)

    return NextResponse.json(
      {
        status: "error",
        message: "Database test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
