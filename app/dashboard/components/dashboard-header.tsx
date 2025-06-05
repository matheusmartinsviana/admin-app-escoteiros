"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut, Menu } from "lucide-react"

interface DashboardHeaderProps {
  onLogout: () => void
}

export default function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-14 lg:h-16">
          {/* Logo e Título */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 relative flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Logo Escoteiros Pirabeiraba"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 28px, (max-width: 1024px) 32px, 40px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm lg:text-lg font-semibold text-gray-900 truncate">ESCOTEIROS</h1>
              <p className="text-xs sm:text-xs lg:text-sm text-gray-600 truncate">PIRABEIRABA</p>
            </div>
          </div>

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-9">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm hidden xs:inline">Admin</span>
                <Menu className="h-3 w-3 sm:h-4 sm:w-4 xs:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onLogout} className="text-sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
