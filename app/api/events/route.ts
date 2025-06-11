import { type NextRequest, NextResponse } from "next/server";
import { sql, ensureDbInitialized } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import type { CreateEventData } from "@/lib/types";

// Configuração do CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://escoteiro-pirabeiraba.vercel.app",
];

const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
};

// Constantes de paginação
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 8;

// Validação de data
const isValidDate = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return (
    !!dateString &&
    dateRegex.test(dateString) &&
    !isNaN(new Date(dateString + "T00:00:00").getTime())
  );
};

// Validação de horário
const isValidTime = (timeString: string): boolean => {
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeString) return false;

  const [hours, minutes] = timeString.split(":").map(Number);
  return (
    timeRegex.test(timeString) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
};

// GET: Buscar eventos com paginação e filtro de status
export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get("origin") || "";
    const headers = new Headers();

    if (isAllowedOrigin(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }

    await ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page") || DEFAULT_PAGE);
    const limit = Number(searchParams.get("limit") || DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    // Atualiza status de eventos passados
    await sql`
      UPDATE events 
      SET status = 'realizado', updated_at = CURRENT_TIMESTAMP
      WHERE event_date < CURRENT_DATE AND status = 'andamento'
    `;

    let eventsQuery;
    let countQuery;

    if (status) {
      eventsQuery = sql`
        SELECT * FROM events 
        WHERE status = ${status} 
        ORDER BY event_date DESC, event_time DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM events 
        WHERE status = ${status}
      `;
    } else {
      eventsQuery = sql`
        SELECT * FROM events 
        ORDER BY event_date DESC, event_time DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`
        SELECT COUNT(*) as total FROM events
      `;
    }

    const [events, totalResult] = await Promise.all([eventsQuery, countQuery]);
    const total = Number(totalResult[0]?.total || 0);

    return NextResponse.json(
      {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers }
    );
  } catch (error: any) {
    console.error("Erro no GET /api/events:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar eventos",
        details: error?.message || "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST: Criar novo evento
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin") || "";
    const headers = new Headers();

    if (isAllowedOrigin(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }

    await ensureDbInitialized();

    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Não autorizado - Token não encontrado" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Não autorizado - Token inválido" },
        { status: 401 }
      );
    }

    const eventData: CreateEventData = await request.json();

    if (!eventData.title?.trim()) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    if (!eventData.event_date) {
      return NextResponse.json(
        { error: "Data é obrigatória" },
        { status: 400 }
      );
    }

    if (!eventData.event_time) {
      return NextResponse.json(
        { error: "Horário é obrigatório" },
        { status: 400 }
      );
    }

    if (!eventData.location?.trim()) {
      return NextResponse.json(
        { error: "Localização é obrigatória" },
        { status: 400 }
      );
    }

    if (!isValidDate(eventData.event_date)) {
      return NextResponse.json(
        { error: "Data inválida. Use o formato AAAA-MM-DD" },
        { status: 400 }
      );
    }

    if (!isValidTime(eventData.event_time)) {
      return NextResponse.json(
        { error: "Horário inválido. Use o formato HH:MM" },
        { status: 400 }
      );
    }

    if (eventData.image_url && eventData.image_url.length > 200000) {
      return NextResponse.json(
        { error: "Imagem muito grande. Tente uma imagem menor." },
        { status: 400 }
      );
    }

    if (eventData.description && eventData.description.length > 1000) {
      return NextResponse.json(
        { error: "Descrição muito longa. Máximo 1000 caracteres." },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO events (title, description, event_date, event_time, image_url, location, status)
      VALUES (
        ${eventData.title.trim()},
        ${eventData.description?.trim() || ""},
        ${eventData.event_date},
        ${eventData.event_time},
        ${eventData.image_url || ""},
        ${eventData.location.trim()},
        'andamento'
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201, headers });
  } catch (error: any) {
    console.error("Erro ao criar evento:", error);

    if (error.message?.includes("value too long")) {
      return NextResponse.json(
        {
          error: "Dados muito grandes",
          details: "Imagem ou descrição muito grande. Tente reduzir o tamanho.",
        },
        { status: 400 }
      );
    }

    if (error.message?.includes("invalid input syntax")) {
      return NextResponse.json(
        {
          error: "Formato de data ou hora inválido",
          details:
            "Verifique se a data está no formato AAAA-MM-DD e a hora no formato HH:MM",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Erro ao criar evento",
        details: error?.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// OPTIONS: Suporte a preflight request (CORS)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const headers = new Headers();

  if (isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return new NextResponse(null, { headers });
}
