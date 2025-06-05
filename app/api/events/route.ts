import { type NextRequest, NextResponse } from "next/server"
import { sql, ensureDbInitialized } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import type { CreateEventData } from "@/lib/types"

// Constants for pagination
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 8

// Function to validate date format and value
const isValidDate = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  return !!dateString && dateRegex.test(dateString) && !isNaN(new Date(dateString + "T00:00:00").getTime())
}

// Function to validate time format and value
const isValidTime = (timeString: string): boolean => {
  const timeRegex = /^\d{2}:\d{2}$/
  if (!timeString) return false

  const [hours, minutes] = timeString.split(":").map(Number)
  return timeRegex.test(timeString) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

// Function to fetch events with pagination and status filter
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/events - Starting request")

    await ensureDbInitialized()
    console.log("Database initialized successfully")

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || String(DEFAULT_PAGE))
    const limit = Number.parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT))
    const offset = (page - 1) * limit

    console.log("Request params:", { status, page, limit, offset })

    // Update event statuses based on current date
    try {
      await sql`
        UPDATE events 
        SET status = 'realizado', updated_at = CURRENT_TIMESTAMP
        WHERE event_date < CURRENT_DATE AND status = 'andamento'
      `
      console.log("Event statuses updated successfully")
    } catch (updateError) {
      console.error("Error updating event statuses:", updateError)
      // Continue execution even if update fails
    }

    // Construct queries with proper parameterization
    let eventsQuery
    let countQuery

    if (status) {
      console.log("Filtering by status:", status)
      eventsQuery = sql`
        SELECT * FROM events 
        WHERE status = ${status} 
        ORDER BY event_date DESC, event_time DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      countQuery = sql`
        SELECT COUNT(*) as total FROM events 
        WHERE status = ${status}
      `
    } else {
      console.log("Fetching all events")
      eventsQuery = sql`
        SELECT * FROM events 
        ORDER BY event_date DESC, event_time DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      countQuery = sql`
        SELECT COUNT(*) as total FROM events
      `
    }

    // Execute queries
    console.log("Executing database queries...")
    const [events, totalResult] = await Promise.all([eventsQuery, countQuery])

    console.log("Events found:", events.length)
    console.log("Total events:", totalResult[0]?.total)

    const total = Number.parseInt(totalResult[0]?.total || "0")

    const response = {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    console.log("Sending response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in GET /api/events:", error)

    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    const errorStack = error instanceof Error ? error.stack : "No stack trace"

    console.error("Error details:", { message: errorMessage, stack: errorStack })

    return NextResponse.json(
      {
        error: "Erro ao buscar eventos",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Function to create a new event
export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized()

    // Get and verify token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Não autorizado - Token não encontrado" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Não autorizado - Token inválido" }, { status: 401 })
    }

    // Parse event data from request body
    const eventData: CreateEventData = await request.json()

    // Validate event data
    if (!eventData.title || !eventData.title.trim()) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 })
    }

    if (!eventData.event_date) {
      return NextResponse.json({ error: "Data é obrigatória" }, { status: 400 })
    }

    if (!eventData.event_time) {
      return NextResponse.json({ error: "Horário é obrigatório" }, { status: 400 })
    }

    if (!eventData.location || !eventData.location.trim()) {
      return NextResponse.json({ error: "Localização é obrigatória" }, { status: 400 })
    }

    if (!isValidDate(eventData.event_date)) {
      return NextResponse.json({ error: "Data inválida. Use o formato AAAA-MM-DD" }, { status: 400 })
    }

    if (!isValidTime(eventData.event_time)) {
      return NextResponse.json({ error: "Horário inválido. Use o formato HH:MM" }, { status: 400 })
    }

    if (eventData.image_url && eventData.image_url.length > 200000) {
      return NextResponse.json({ error: "Imagem muito grande. Tente uma imagem menor." }, { status: 400 })
    }

    if (eventData.description && eventData.description.length > 1000) {
      return NextResponse.json({ error: "Descrição muito longa. Máximo 1000 caracteres." }, { status: 400 })
    }

    // Create event in database
    const result = await sql`
      INSERT INTO events (title, description, event_date, event_time, image_url, location, status)
      VALUES (
        ${eventData.title.trim()}, 
        ${eventData.description?.trim() || ""}, 
        ${eventData.event_date}, 
        ${eventData.event_time}, 
        ${eventData.image_url || ""},
        ${eventData.location?.trim() || "Sede do Grupo Escoteiro Pirabeiraba"},
        'andamento'
      )
      RETURNING *
    `

    // Return created event
    console.log("Event created successfully:", result[0].id)
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating event:", error)

    // Handle specific database errors
    if (error.message?.includes("value too long")) {
      return NextResponse.json(
        {
          error: "Dados muito grandes",
          details: "Imagem ou descrição muito grande. Tente reduzir o tamanho.",
        },
        { status: 400 },
      )
    }

    if (error.message?.includes("invalid input syntax")) {
      return NextResponse.json(
        {
          error: "Formato de data ou hora inválido",
          details: "Verifique se a data está no formato AAAA-MM-DD e a hora no formato HH:MM",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Erro ao criar evento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
