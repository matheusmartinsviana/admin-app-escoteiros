"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Lock, AlertCircle, Loader2, RefreshCw } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isInitializing, setIsInitializing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setIsInitializing(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsInitializing(false)
        router.push("/dashboard")
      } else {
        setError(data.error || "Erro ao fazer login")
      }
    } catch (error) {
      setError("Erro de conexão")
    } finally {
      setIsLoading(false)
      setIsInitializing(false)
    }
  }

  const fillDefaultCredentials = () => {
    setEmail("admin@escoteiros.com")
    setPassword("admin123")
  }

  const resetAdminUser = async () => {
    setIsResetting(true)
    setError("")

    try {
      const response = await fetch("/api/reset-admin", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setError("")
        fillDefaultCredentials()
        alert("Usuário administrador resetado com sucesso! Tente fazer login agora.")
      } else {
        setError(data.error || "Erro ao resetar usuário")
      }
    } catch (error) {
      setError("Erro de conexão ao resetar usuário")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-white">
      {/* Mobile: Full width, Desktop: Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white relative z-10 min-h-screen lg:min-h-auto">
        <div
          className={`w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8 transition-all duration-1000 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="text-center flex flex-col items-center">
            <div
              className={`mb-3 sm:mb-4 w-16 h-16 sm:w-20 sm:h-20 relative transition-all duration-1200 ease-out delay-300 ${
                isVisible ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 rotate-12"
              }`}
            >
              <Image
                src="/images/logo.png"
                alt="Logo Escoteiros Pirabeiraba"
                fill
                className="object-contain drop-shadow-lg"
              />
            </div>
            <div
              className={`transition-all duration-1000 ease-out delay-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Grupo de Escoteiros de</h1>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Pirabeiraba</h2>
            </div>
          </div>

          <Card
            className={`border-0 shadow-xl transition-all duration-1000 ease-out delay-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm animate-pulse bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 group-focus-within:text-red-500" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 sm:pl-10 h-12 sm:h-12 bg-gray-50 border-gray-200 transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 text-base"
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 group-focus-within:text-red-500" />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 sm:pl-10 h-12 sm:h-12 bg-gray-50 border-gray-200 transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 hover:border-gray-300 text-base"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 sm:h-12 bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isInitializing ? "Inicializando..." : "Entrando..."}
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop only: Right side - Decorative circles */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white">
        {/* Animated red circles */}
        <div
          className={`absolute -right-32 -top-32 w-96 h-96 rounded-full bg-red-500 opacity-20 transition-all duration-2000 ease-out ${
            isVisible ? "scale-100 translate-x-0 translate-y-0" : "scale-0 translate-x-32 translate-y-32"
          }`}
          style={{
            animation: isVisible ? "float 6s ease-in-out infinite" : "none",
          }}
        />

        <div
          className={`absolute -right-16 top-16 w-80 h-80 rounded-full bg-red-600 opacity-15 transition-all duration-2500 ease-out delay-300 ${
            isVisible ? "scale-100 translate-x-0 translate-y-0" : "scale-0 translate-x-24 translate-y-24"
          }`}
          style={{
            animation: isVisible ? "float 8s ease-in-out infinite reverse" : "none",
          }}
        />

        <div
          className={`absolute right-16 top-32 w-64 h-64 rounded-full bg-red-700 opacity-10 transition-all duration-3000 ease-out delay-600 ${
            isVisible ? "scale-100 translate-x-0 translate-y-0" : "scale-0 translate-x-16 translate-y-16"
          }`}
          style={{
            animation: isVisible ? "float 10s ease-in-out infinite" : "none",
          }}
        />

        <div
          className={`absolute right-32 bottom-32 w-32 h-32 rounded-full bg-red-400 opacity-25 transition-all duration-2000 ease-out delay-900 ${
            isVisible ? "scale-100 translate-x-0 translate-y-0" : "scale-0 translate-x-16 translate-y-16"
          }`}
          style={{
            animation: isVisible ? "float 7s ease-in-out infinite reverse" : "none",
          }}
        />

        <div
          className={`absolute right-8 bottom-8 w-20 h-20 rounded-full bg-red-500 opacity-30 transition-all duration-1500 ease-out delay-1200 ${
            isVisible ? "scale-100 translate-x-0 translate-y-0" : "scale-0 translate-x-8 translate-y-8"
          }`}
          style={{
            animation: isVisible ? "float 5s ease-in-out infinite" : "none",
          }}
        />

        <div
          className={`absolute right-40 top-60 w-16 h-16 rounded-full bg-red-300 opacity-20 transition-all duration-1800 ease-out delay-1500 ${
            isVisible ? "scale-100 translate-x-0 translate-y-0" : "scale-0 translate-x-8 translate-y-8"
          }`}
          style={{
            animation: isVisible ? "float 9s ease-in-out infinite" : "none",
          }}
        />

        <div
          className={`absolute right-24 bottom-16 w-12 h-12 rounded-full bg-red-600 opacity-15 transition-all duration-1600 ease-out delay-1800 ${
            isVisible ? "scale-100 translate-x-0 translate-y-0" : "scale-0 translate-x-6 translate-y-6"
          }`}
          style={{
            animation: isVisible ? "float 11s ease-in-out infinite reverse" : "none",
          }}
        />
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-10px) translateX(5px);
          }
          50% {
            transform: translateY(-20px) translateX(0px);
          }
          75% {
            transform: translateY(-10px) translateX(-5px);
          }
        }
      `}</style>
    </div>
  )
}
