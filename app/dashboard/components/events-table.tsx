"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Copy, Check, Calendar, Clock, MapPin } from "lucide-react"
import type { Event } from "@/lib/types"

interface EventsTableProps {
  events: Event[]
  onEdit: (event: Event) => void
  onDelete: (eventId: number, eventTitle: string) => void
  onCopy: (event: Event) => void
  copiedEventId: number | null
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "realizado":
      return <Badge className="bg-green-100 text-green-800 text-xs font-medium">Realizado</Badge>
    case "cancelado":
      return <Badge className="bg-red-100 text-red-800 text-xs font-medium">Cancelado</Badge>
    case "andamento":
      return <Badge className="bg-blue-100 text-blue-800 text-xs font-medium">Em Andamento</Badge>
    default:
      return <Badge className="text-xs font-medium">{status}</Badge>
  }
}

const formatDateForDisplay = (dateString: string) => {
  try {
    const [year, month, day] = dateString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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

export default function EventsTable({ events, onEdit, onDelete, onCopy, copiedEventId }: EventsTableProps) {
  return (
    <Card className="hidden lg:block shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900 px-6 py-4">Evento</TableHead>
                <TableHead className="font-semibold text-gray-900 px-6 py-4 min-w-[140px]">Data e Hora</TableHead>
                <TableHead className="font-semibold text-gray-900 px-6 py-4 min-w-[200px]">Localização</TableHead>
                <TableHead className="font-semibold text-gray-900 px-6 py-4 min-w-[120px]">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 px-6 py-4 w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 text-gray-300" />
                      <span>Nenhum evento encontrado</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 mb-1">{event.title}</div>
                        {event.description && (
                          <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">{event.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{formatDateForDisplay(event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{formatTime(event.event_time)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {event.location && (
                        <div className="flex items-start gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2 max-w-xs">{event.location}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">{getStatusBadge(event.status)}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(event)}
                          title="Editar evento"
                          className="h-8 w-8 p-0 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(event.id, event.title)}
                          title="Excluir evento"
                          className="h-8 w-8 p-0 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopy(event)}
                          title="Copiar convite do evento"
                          className="h-8 w-8 p-0 hover:bg-green-50 relative"
                        >
                          {copiedEventId === event.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
