"use client"

import { Card, CardContent } from "@/components/ui/card"
import EventCard from "./event-card"
import type { Event } from "@/lib/types"

interface EventsListProps {
  events: Event[]
  onEdit: (event: Event) => void
  onDelete: (eventId: number, eventTitle: string) => void
  onCopy: (event: Event) => void
  copiedEventId: number | null
}

export default function EventsList({ events, onEdit, onDelete, onCopy, copiedEventId }: EventsListProps) {
  return (
    <div className="block lg:hidden">
      {events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">Nenhum evento encontrado</CardContent>
        </Card>
      ) : (
        events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={onEdit}
            onDelete={onDelete}
            onCopy={onCopy}
            copiedEventId={copiedEventId}
          />
        ))
      )}
    </div>
  )
}
