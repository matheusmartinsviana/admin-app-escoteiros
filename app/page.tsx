"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useDashboard } from "./dashboard/hooks/use-dashboard"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const {
    isAuthenticated,
  } = useDashboard()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  return null


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="mb-6 w-32 h-32 relative">
          <Image src="/images/logo.png" alt="Logo Escoteiros Pirabeiraba" fill className="object-contain" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Grupo de Escoteiros de Pirabeiraba</h1>
        <p className="text-xl text-gray-600">Sistema de Gerenciamento de Eventos</p>
      </div>

      <div className="flex gap-4">
        <Link href="/login">
          <Button className="bg-red-600 hover:bg-red-700">Acessar o Sistema</Button>
        </Link>
      </div>
    </div>
  )
}
