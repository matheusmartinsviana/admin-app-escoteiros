import { NextResponse } from "next/server"
import { ensureDbInitialized } from "@/lib/db"

export async function GET() {
  try {
    await ensureDbInitialized()

    return NextResponse.json({
      message: "Database initialized successfully!",
      credentials: {
        email: "admin@escoteiros.com",
        password: "admin123",
      },
      status: "ready",
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
