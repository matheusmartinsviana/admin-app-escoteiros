import { sql, ensureDbInitialized } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

if (!process.env.ADMIN_SECRET_PASSWORD) {
  throw new Error("ADMIN_SECRET_PASSWORD não configurada");
}

const SECRET_PASSWORD = process.env.ADMIN_SECRET_PASSWORD;

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();

    const users = await sql`
      SELECT id, name, email, created_at
      FROM users
      ORDER BY created_at DESC
    `;

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();

    const body = await request.json();
    const { secretPassword, name, email, password } = body;

    // Verificar senha secreta
    if (secretPassword !== SECRET_PASSWORD) {
      return NextResponse.json(
        { error: "Acesso negado - Senha secreta incorreta" },
        { status: 403 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar novo usuário
    const newUser = await sql`
      INSERT INTO users (name, email, password, created_at)
      VALUES (${name}, ${email}, ${hashedPassword}, NOW())
      RETURNING id, name, email, created_at
    `;

    return NextResponse.json(newUser[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
