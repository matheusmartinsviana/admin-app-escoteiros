"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, X, AlertCircle, MapPin, Calendar, Clock, FileText, ImageIcon } from "lucide-react"
import type { Event, CreateEventData } from "@/lib/types"
import LocationPicker from "./location-picker"

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: CreateEventData) => Promise<void>
  event?: Event | null
}

// Function to resize image
const resizeImage = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      const resizedDataUrl = canvas.toDataURL("image/jpeg", quality)
      resolve(resizedDataUrl)
    }

    img.crossOrigin = "anonymous"
    img.src = URL.createObjectURL(file)
  })
}

// Function to format date for input
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return ""

  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  // Try to parse and format
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  } catch {
    return ""
  }
}

// Function to format time for input
const formatTimeForInput = (timeString: string): string => {
  if (!timeString) return ""

  // If it's already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString
  }

  // If it has seconds, remove them
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
    return timeString.slice(0, 5)
  }

  return timeString
}

// Function to validate date
const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false

  const date = new Date(dateString + "T00:00:00")
  return !isNaN(date.getTime())
}

// Function to validate time
const isValidTime = (timeString: string): boolean => {
  if (!timeString) return false

  const timeRegex = /^\d{2}:\d{2}$/
  if (!timeRegex.test(timeString)) return false

  const [hours, minutes] = timeString.split(":").map(Number)
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

export default function EventModal({ isOpen, onClose, onSave, event }: EventModalProps) {
  const [formData, setFormData] = useState<CreateEventData>({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    image_url: "",
    location: "",
  })
  const [status, setStatus] = useState<string>("andamento")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const handleLocationSelect = useCallback((location: string) => {
    setFormData((prev) => ({ ...prev, location }))
    setFieldErrors((prev) => ({ ...prev, location: "" }))
    setShowLocationPicker(false)
  }, [])

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        event_date: formatDateForInput(event.event_date),
        event_time: formatTimeForInput(event.event_time),
        image_url: event.image_url || "",
        location: event.location || "",
      })
      setStatus(event.status)
    } else {
      setFormData({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        image_url: "",
        location: "",
      })
      setStatus("andamento")
    }
    setError("")
    setFieldErrors({})
  }, [event, isOpen])

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    // Validate title
    if (!formData.title.trim()) {
      errors.title = "Título é obrigatório"
    }

    // Validate date
    if (!formData.event_date) {
      errors.event_date = "Data é obrigatória"
    } else if (!isValidDate(formData.event_date)) {
      errors.event_date = "Data inválida. Use o formato DD/MM/AAAA"
    } else {
      // Check if date is not in the past (only for new events)
      if (!event) {
        const eventDate = new Date(formData.event_date + "T00:00:00")
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (eventDate < today) {
          errors.event_date = "Data não pode ser no passado"
        }
      }
    }

    // Validate time
    if (!formData.event_time) {
      errors.event_time = "Horário é obrigatório"
    } else if (!isValidTime(formData.event_time)) {
      errors.event_time = "Horário inválido. Use o formato HH:MM"
    }

    // Validate location
    if (!formData.location?.trim()) {
      errors.location = "Localização é obrigatória"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Validate form
      if (!validateForm()) {
        throw new Error("Por favor, corrija os erros no formulário")
      }

      const eventData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || "",
        location: formData.location?.trim() || "",
        status: event ? status : "andamento",
      }

      console.log("Submitting event data:", eventData)

      await onSave(eventData)
      onClose()
    } catch (error: any) {
      setError(error.message || "Erro ao salvar evento")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, event_date: value }))

    // Clear field error when user starts typing
    if (fieldErrors.event_date) {
      setFieldErrors((prev) => ({ ...prev, event_date: "" }))
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, event_time: value }))

    // Clear field error when user starts typing
    if (fieldErrors.event_time) {
      setFieldErrors((prev) => ({ ...prev, event_time: "" }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsProcessingImage(true)
      setError("")

      try {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Imagem muito grande. Máximo 5MB.")
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Arquivo deve ser uma imagem.")
        }

        // Resize image to reduce size
        const resizedImage = await resizeImage(file, 800, 600, 0.7)

        // Check if resized image is still too large (limit to ~100KB for base64)
        if (resizedImage.length > 150000) {
          // Try with lower quality
          const smallerImage = await resizeImage(file, 600, 400, 0.5)
          setFormData((prev) => ({
            ...prev,
            image_url: smallerImage,
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            image_url: resizedImage,
          }))
        }
      } catch (error: any) {
        setError(error.message || "Erro ao processar imagem")
      } finally {
        setIsProcessingImage(false)
      }
    }
  }

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden mx-2 sm:mx-4 p-0">
          <div className="max-h-[90vh] overflow-y-auto modal-scroll">
            <div className="p-4 sm:p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg sm:text-xl font-semibold">
                  {event ? "Editar evento" : "Incluir novo evento"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 form-mobile">
                {error && (
                  <div className="flex items-start gap-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                {/* Título */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Título do evento <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                      if (fieldErrors.title) {
                        setFieldErrors((prev) => ({ ...prev, title: "" }))
                      }
                    }}
                    placeholder="Nome do evento"
                    required
                    className={`h-12 text-base ${fieldErrors.title ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  {fieldErrors.title && <p className="text-red-500 text-xs">{fieldErrors.title}</p>}
                </div>

                {/* Upload de Imagem */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Capa do evento
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 hover:border-gray-400 transition-colors upload-area">
                    {formData.image_url ? (
                      <div className="relative">
                        <img
                          src={formData.image_url || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-32 sm:h-40 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg touch-target"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3 sm:py-4">
                        <Upload className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2" />
                        <label className="cursor-pointer touch-target inline-block py-2">
                          <span className="text-sm font-medium text-red-600 hover:text-red-500">
                            {isProcessingImage ? "Processando..." : "Adicionar imagem do evento"}
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isProcessingImage}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data e Hora */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={handleDateChange}
                      min={event ? undefined : getTodayDate()}
                      required
                      className={`h-12 text-base ${fieldErrors.event_date ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    {fieldErrors.event_date && <p className="text-red-500 text-xs">{fieldErrors.event_date}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horário <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="time"
                      value={formData.event_time}
                      onChange={handleTimeChange}
                      required
                      className={`h-12 text-base ${fieldErrors.event_time ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    {fieldErrors.event_time && <p className="text-red-500 text-xs">{fieldErrors.event_time}</p>}
                  </div>
                </div>

                {/* Localização */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localização <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      value={formData.location}
                      readOnly
                      placeholder="Toque para selecionar a localização"
                      required
                      className={`h-12 text-base pr-12 cursor-pointer ${fieldErrors.location ? "border-red-500" : ""}`}
                      onClick={() => setShowLocationPicker(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(true)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-700 touch-target h-full flex items-center justify-center pr-2"
                    >
                      <MapPin className="h-5 w-5" />
                    </button>
                  </div>
                  {fieldErrors.location && <p className="text-red-500 text-xs">{fieldErrors.location}</p>}
                  <p className="text-xs text-gray-500">Toque para selecionar no mapa ou digitar manualmente</p>
                </div>

                {/* Status (apenas para edição) */}
                {event && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Status do evento</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="andamento">Em Andamento</SelectItem>
                        <SelectItem value="realizado">Realizado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Descrição */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do evento (opcional)"
                    rows={3}
                    className="text-base resize-none min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">{formData.description?.length || 0}/500 caracteres</p>
                </div>

                {/* Botões */}
                <div className="flex flex-col gap-3 pt-4 border-t sticky bottom-0 bg-white">
                  <Button
                    type="submit"
                    className="h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-base font-medium touch-target"
                    disabled={isSubmitting || isProcessingImage}
                  >
                    {isSubmitting ? "Salvando..." : event ? "Atualizar evento" : "Cadastrar evento"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="h-12 text-base touch-target"
                    disabled={isSubmitting || isProcessingImage}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Picker Modal */}
      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={formData.location}
      />
    </>
  )
}
