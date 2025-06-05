import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to admin-secret without authentication
  if (pathname.startsWith("/admin-secret")) {
    return NextResponse.next()
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      console.log("No token found in cookies")
      if (pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      return NextResponse.json({ error: "Não autorizado - Token não encontrado" }, { status: 401 })
    }

    try {
      const payload = await verifyToken(token)
      if (!payload) {
        console.log("Invalid token")
        if (pathname.startsWith("/dashboard")) {
          return NextResponse.redirect(new URL("/login", request.url))
        }
        return NextResponse.json({ error: "Não autorizado - Token inválido" }, { status: 401 })
      }
      console.log("Token valid for user:", payload.userId)
    } catch (error) {
      console.log("Token verification error:", error)
      if (pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      return NextResponse.json({ error: "Não autorizado - Erro na verificação" }, { status: 401 })
    }
  }

  // Redirect authenticated users away from login
  if (pathname === "/login") {
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      try {
        const payload = await verifyToken(token)
        if (payload) {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      } catch (error) {
        // Token inválido, continuar para login
      }
    }
  }

  // Redirect root to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|api/init|api/reset-admin|api/admin-secret|_next/static|_next/image|favicon.ico).*)"],
}
