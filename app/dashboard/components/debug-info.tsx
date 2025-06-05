"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bug, ChevronDown, ChevronUp } from "lucide-react"

interface DebugInfoProps {
  events: any[]
  error: string
  isLoading: boolean
  isAuthenticated: boolean
  currentPage: number
  totalPages: number
  totalEvents: number
}

export default function DebugInfo({
  events,
  error,
  isLoading,
  isAuthenticated,
  currentPage,
  totalPages,
  totalEvents,
}: DebugInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const testConnection = async () => {
    try {
      console.log("Testing API connection...")
      const response = await fetch("/api/auth/verify")
      const data = await response.json()
      console.log("Auth test result:", data)

      const eventsResponse = await fetch("/api/events?page=1&limit=1")
      const eventsData = await eventsResponse.json()
      console.log("Events test result:", eventsData)
    } catch (error) {
      console.error("Connection test failed:", error)
    }
  }

  const initDatabase = async () => {
    try {
      console.log("Initializing database...")
      const response = await fetch("/api/init")
      const data = await response.json()
      console.log("Database init result:", data)
    } catch (error) {
      console.error("Database init failed:", error)
    }
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
            <Bug className="h-4 w-4" />
            Debug Info (Development)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-orange-600 hover:text-orange-700"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Estado:</strong>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>Autenticado: {isAuthenticated ? "✅ Sim" : "❌ Não"}</li>
                  <li>Carregando: {isLoading ? "⏳ Sim" : "✅ Não"}</li>
                  <li>Erro: {error ? "❌ " + error : "✅ Nenhum"}</li>
                  <li>Eventos: {events.length} carregados</li>
                </ul>
              </div>
              <div>
                <strong>Paginação:</strong>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>Página atual: {currentPage}</li>
                  <li>Total páginas: {totalPages}</li>
                  <li>Total eventos: {totalEvents}</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={testConnection} className="text-xs">
                Testar Conexão
              </Button>
              <Button size="sm" variant="outline" onClick={initDatabase} className="text-xs">
                Inicializar DB
              </Button>
            </div>

            {events.length > 0 && (
              <div>
                <strong>Primeiro evento:</strong>
                <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(events[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
