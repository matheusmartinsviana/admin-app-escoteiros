import { type NextRequest, NextResponse } from "next/server"
import { ensureDbInitialized } from "@/lib/db"

const SECRET_PASSWORD = "escoteiros2024@admin"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { secretPassword } = body
    const userId = Number.parseInt(params.id)

    // Verificar senha secreta
    if (secretPassword !== SECRET_PASSWORD) {
      return NextResponse.json({ error: "Acesso negado - Senha secreta incorreta" }, { status: 403 })
    }

    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID de usuário inválido" }, { status: 400 })
    }

    await ensureDbInitialized()
    const { db } = await import("@/lib/db")

    // Verificar se usuário existe
    const existingUser = await db.query("SELECT id, email FROM users WHERE id = $1", [userId])

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Não permitir deletar o último usuário admin
    const userCount = await db.query("SELECT COUNT(*) as count FROM users")
    if (Number.parseInt(userCount.rows[0].count) <= 1) {
      return NextResponse.json({ error: "Não é possível deletar o último usuário administrador" }, { status: 400 })
    }

    // Deletar usuário
    await db.query("DELETE FROM users WHERE id = $1", [userId])

    console.log("Usuário deletado:", existingUser.rows[0].email)

    return NextResponse.json({
      message: "Usuário deletado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
