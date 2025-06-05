export interface User {
  id: number
  email: string
  name: string
  created_at: string
}

export interface Event {
  id: number
  title: string
  description?: string
  event_date: string
  event_time: string
  status: "andamento" | "realizado" | "cancelado"
  image_url?: string
  location?: string
  created_at: string
  updated_at: string
}

export interface CreateEventData {
  title: string
  description?: string
  event_date: string
  event_time: string
  image_url?: string
  location?: string
  status?: "andamento" | "realizado" | "cancelado"
}
