import { type NextRequest, NextResponse } from "next/server";
import { sql, ensureDbInitialized } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// Configuração do CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://escoteiro-pirabeiraba.vercel.app",
];

// Função para verificar se a origem é permitida
const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Configuração do CORS
    const origin = request.headers.get("origin") || "";
    const headers = new Headers();

    if (isAllowedOrigin(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "PUT, OPTIONS");
      headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }

    await ensureDbInitialized();

    // Verify authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const eventData = await request.json();
    const eventId = Number.parseInt(params.id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "ID do evento inválido" },
        { status: 400 }
      );
    }

    // Validação dos dados
    if (!eventData.title || !eventData.title.trim()) {
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

    if (!eventData.location || !eventData.location.trim()) {
      return NextResponse.json(
        { error: "Localização é obrigatória" },
        { status: 400 }
      );
    }

    console.log("Updating event with data:", eventData);

    const result = await sql`
      UPDATE events 
      SET title = ${eventData.title.trim()}, 
          description = ${eventData.description?.trim() || ""}, 
          event_date = ${eventData.event_date}, 
          event_time = ${eventData.event_time},
          location = ${
            eventData.location?.trim() || "Sede do Grupo Escoteiro Pirabeiraba"
          },
          status = ${eventData.status || "andamento"},
          image_url = ${eventData.image_url || ""},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${eventId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    console.log("Event updated successfully:", result[0]);

    return NextResponse.json(result[0], { headers });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      {
        error: "Erro ao atualizar evento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Configuração do CORS
    const origin = request.headers.get("origin") || "";
    const headers = new Headers();

    if (isAllowedOrigin(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "DELETE, OPTIONS");
      headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }

    await ensureDbInitialized();

    // Verify authentication
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const eventId = Number.parseInt(params.id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "ID do evento inválido" },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM events WHERE id = ${eventId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Evento excluído com sucesso" },
      { headers }
    );
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      {
        error: "Erro ao excluir evento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const headers = new Headers();

  if (isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return new NextResponse(null, { headers });
}
