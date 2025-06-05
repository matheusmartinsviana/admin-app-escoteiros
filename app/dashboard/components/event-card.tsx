"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Copy, MoreVertical, Check, Calendar, Clock, MapPin } from "lucide-react"
import type { Event } from "@/lib/types"

interface EventCardProps {
  event: Event
  onEdit: (event: Event) => void
  onDelete: (eventId: number, eventTitle: string) => void
  onCopy: (event: Event) => void
  copiedEventId: number | null
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "realizado":
      return <Badge className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1">Realizado</Badge>
    case "cancelado":
      return <Badge className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1">Cancelado</Badge>
    case "andamento":
      return <Badge className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1">Em Andamento</Badge>
    default:
      return <Badge className="text-xs font-medium px-2 py-1">{status}</Badge>
  }
}

const formatDateForDisplay = (dateString: string) => {
  try {
    const [year, month, day] = dateString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString
  }
}

const formatTime = (timeString: string) => {
  try {
    return timeString.slice(0, 5)
  } catch (error) {
    console.error("Error formatting time:", error)
    return timeString
  }
}

export default function EventCard({ event, onEdit, onDelete, onCopy, copiedEventId }: EventCardProps) {
  return (
    <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200">
      <CardContent className="p-4">
        {/* Header com título e menu */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-900 text-base leading-tight flex-1 pr-3 line-clamp-2">
            {event.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0 hover:bg-gray-100 active:bg-gray-200"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(event)} className="text-sm">
                <Edit className="h-4 w-4 mr-3" />
                Editar evento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy(event)} className="text-sm">
                <Copy className="h-4 w-4 mr-3" />
                Copiar convite
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(event.id, event.title)}
                className="text-red-600 focus:text-red-600 text-sm"
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Excluir evento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Informações do evento */}
        <div className="space-y-2 mb-3">
          {/* Data e hora */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{formatDateForDisplay(event.event_date)}</span>
            <Clock className="h-4 w-4 flex-shrink-0 ml-2" />
            <span>{formatTime(event.event_time)}</span>
          </div>

          {/* Localização */}
          {event.location && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{event.location}</span>
            </div>
          )}

          {/* Descrição */}
          {event.description && <div className="text-sm text-gray-600 line-clamp-2 mt-2">{event.description}</div>}
        </div>

        {/* Footer com status e feedback */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="flex items-center">{getStatusBadge(event.status)}</div>

          {copiedEventId === event.id && (
            <div className="flex items-center text-green-600 text-sm font-medium">
              <Check className="h-4 w-4 mr-1" />
              Copiado!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
