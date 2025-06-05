import { type NextRequest, NextResponse } from "next/server"
import { ensureDbInitialized } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

const SECRET_PASSWORD = "escoteiros2024@admin"

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized()

    const { db } = await import("@/lib/db")

    const result = await db.query(`
      SELECT id, name, email, created_at 
      FROM users 
      ORDER BY created_at DESC
    `)

    return NextResponse.json({
      users: result.rows,
    })
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secretPassword, name, email, password } = body

    // Verificar senha secreta
    if (secretPassword !== SECRET_PASSWORD) {
      return NextResponse.json({ error: "Acesso negado - Senha secreta incorreta" }, { status: 403 })
    }

    // Validar dados
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
    }

    await ensureDbInitialized()
    const { db } = await import("@/lib/db")

    // Verificar se email já existe
    const existingUser = await db.query("SELECT id FROM users WHERE email = $1", [email])

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Criar usuário
    const result = await db.query(
      `INSERT INTO users (name, email, password, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword],
    )

    console.log("Usuário criado com sucesso:", result.rows[0])

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
