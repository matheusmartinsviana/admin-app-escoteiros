"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Filter, ChevronDown } from "lucide-react"

interface ActionsBarProps {
  onCreateEvent: () => void
  onFilterChange: (filter: string) => void
  currentFilter?: string
}

export default function ActionsBar({ onCreateEvent, onFilterChange, currentFilter = "" }: ActionsBarProps) {
  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case "andamento":
        return "Em andamento"
      case "realizado":
        return "Realizados"
      case "cancelado":
        return "Cancelados"
      default:
        return "Todos os eventos"
    }
  }

  return (
    <div className="flex flex-col gap-3 mb-4 sm:mb-6">
      {/* Botão Criar Evento - Sempre em destaque */}
      <Button
        onClick={onCreateEvent}
        className="bg-red-600 hover:bg-red-700 active:bg-red-800 w-full h-11 sm:h-10 text-sm sm:text-base font-medium shadow-sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Incluir novo evento
      </Button>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto h-10 justify-between text-sm border-gray-300 hover:border-gray-400"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="truncate">{getFilterLabel(currentFilter)}</span>
              </div>
              <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem onClick={() => onFilterChange("")} className={currentFilter === "" ? "bg-gray-100" : ""}>
              Todos os eventos
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFilterChange("andamento")}
              className={currentFilter === "andamento" ? "bg-gray-100" : ""}
            >
              Em andamento
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFilterChange("realizado")}
              className={currentFilter === "realizado" ? "bg-gray-100" : ""}
            >
              Realizados
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFilterChange("cancelado")}
              className={currentFilter === "cancelado" ? "bg-gray-100" : ""}
            >
              Cancelados
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
