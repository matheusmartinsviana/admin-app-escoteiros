import { type NextRequest, NextResponse } from "next/server"
import { sql, ensureDbInitialized } from "@/lib/db"
import { verifyPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized before any operation
    await ensureDbInitialized()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Find user by email
    let users
    try {
      users = await sql`
        SELECT * FROM users WHERE email = ${email}
      `
    } catch (dbError: any) {
      console.error("Database error during login:", dbError)
      return NextResponse.json({ error: "Erro ao consultar o banco de dados" }, { status: 500 })
    }

    if (users.length === 0) {
      return NextResponse.json(
        {
          error: "Usuário não encontrado. Tente resetar o usuário administrador.",
        },
        { status: 401 },
      )
    }

    const user = users[0]
    console.log("User found:", { id: user.id, email: user.email, name: user.name })

    const isValidPassword = await verifyPassword(password, user.password)
    console.log("Password validation result:", isValidPassword)

    if (!isValidPassword) {
      return NextResponse.json(
        {
          error: "Senha incorreta. Verifique suas credenciais ou reset o usuário administrador.",
        },
        { status: 401 },
      )
    }

    const token = await generateToken(user.id)
    console.log("Generated token:", token ? "Success" : "Failed")

    const response = NextResponse.json({
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })

    // Set cookie with more permissive settings for development
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: false, // Allow HTTP in development
      sameSite: "lax", // More permissive
      maxAge: 86400, // 24 hours
      path: "/", // Ensure cookie is available for all paths
    })

    console.log("Cookie set successfully")

    return response
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor. Tente resetar o usuário administrador.",
      },
      { status: 500 },
    )
  }
}
