"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalEvents: number
  eventsOnPage: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  totalEvents,
  eventsOnPage,
  isLoading,
  onPageChange,
}: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Não mostrar paginação se não há eventos ou apenas uma página
  if (totalEvents === 0 || totalPages <= 1) {
    return null
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Informações - Mobile otimizado */}
      <div className="text-center">
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            <span className="font-medium">{eventsOnPage}</span> de <span className="font-medium">{totalEvents}</span>{" "}
            eventos
          </div>
          <div className="text-xs text-gray-500">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      </div>

      {/* Controles de Paginação */}
      <div className="flex justify-center items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1 || isLoading}
          className="h-9 px-3 text-sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden xs:inline">Anterior</span>
          <span className="xs:hidden">Ant</span>
        </Button>

        {/* Indicador de páginas para mobile */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className={`h-8 w-8 p-0 text-xs ${
                  pageNum === currentPage ? "bg-red-600 hover:bg-red-700 text-white" : "hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages || isLoading}
          className="h-9 px-3 text-sm"
        >
          <span className="hidden xs:inline">Próximo</span>
          <span className="xs:hidden">Prox</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
