import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Token não encontrado", authenticated: false }, { status: 401 })
    }

    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Token inválido", authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      message: "Token válido",
      authenticated: true,
      userId: payload.userId,
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Erro na verificação", authenticated: false }, { status: 500 })
  }
}
