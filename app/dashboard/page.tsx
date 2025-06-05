"use client"

import { useState } from "react"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import type { Event } from "@/lib/types"
import EventModal from "./components/event-modal"
import Toast from "./components/toast"
import DashboardHeader from "./components/dashboard-header"
import ActionsBar from "./components/actions-bar"
import EventsList from "./components/events-list"
import EventsTable from "./components/events-table"
import Pagination from "./components/pagination"
import ErrorMessage from "./components/error-message"
import { DashboardSkeleton, EventCardSkeleton, EventTableSkeleton } from "./components/skeleton-loaders"
import { useDashboard } from "./hooks/use-dashboard"
import DebugInfo from "./components/debug-info"

export default function DashboardPage() {
  const {
    events,
    currentPage,
    totalPages,
    totalEvents,
    statusFilter,
    isLoading,
    isLoadingEvents,
    error,
    isAuthenticated,
    copiedEventId,
    setCurrentPage,
    setStatusFilter,
    setError,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleCopyEvent,
    handleLogout,
  } = useDashboard()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  })

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    variant?: "danger" | "warning" | "success" | "info"
    confirmText?: string
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, isVisible: true })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }))
  }

  const showConfirmModal = (
    title: string,
    description: string,
    onConfirm: () => void,
    variant: "danger" | "warning" | "success" | "info" = "danger",
    confirmText = "Confirmar",
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      onConfirm,
      variant,
      confirmText,
    })
  }

  const hideConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
  }

  const handleCreateEventClick = () => {
    setEditingEvent(null)
    setIsModalOpen(true)
    setError("")
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setIsModalOpen(true)
    setError("")
  }

  const confirmDeleteEvent = (eventId: number, eventTitle: string) => {
    showConfirmModal(
      "Excluir Evento",
      `Tem certeza que deseja excluir o evento "${eventTitle}"? Esta ação não pode ser desfeita.`,
      () => handleDeleteEventConfirmed(eventId),
      "danger",
      "Excluir",
    )
  }

  const handleDeleteEventConfirmed = async (eventId: number) => {
    const result = await handleDeleteEvent(eventId)
    if (result.success) {
      showToast(result.message || "Evento excluído com sucesso!", "success")
    }
  }

  const handleCopyEventClick = async (event: Event) => {
    const result = await handleCopyEvent(event)
    showToast(result.message, result.success ? "success" : "error")
  }

  const confirmLogout = () => {
    showConfirmModal(
      "Sair do Sistema",
      "Tem certeza que deseja sair do sistema? Você precisará fazer login novamente.",
      handleLogout,
      "warning",
      "Sair",
    )
  }

  const handleEventSave = async (eventData: any) => {
    try {
      if (editingEvent) {
        await handleUpdateEvent(editingEvent.id, eventData)
        showToast("Evento atualizado com sucesso!", "success")
      } else {
        await handleCreateEvent(eventData)
        showToast("Evento criado com sucesso!", "success")
      }
      setIsModalOpen(false)
      setEditingEvent(null)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingEvent(null)
    setError("")
  }

  // Show full dashboard skeleton during initial load
  if (isLoading || !isAuthenticated) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader onLogout={confirmLogout} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8">
        {/* Error Message */}
        <ErrorMessage message={error} />

        {/* Debug Info (only in development) */}
        <DebugInfo
          events={events}
          error={error}
          isLoading={isLoading}
          isAuthenticated={isAuthenticated}
          currentPage={currentPage}
          totalPages={totalPages}
          totalEvents={totalEvents}
        />

        {/* Actions Bar */}
        <ActionsBar
          onCreateEvent={handleCreateEventClick}
          onFilterChange={setStatusFilter}
          currentFilter={statusFilter}
        />

        {/* Events Content */}
        {isLoadingEvents ? (
          <>
            {/* Mobile Skeleton */}
            <div className="block lg:hidden">
              <EventCardSkeleton />
            </div>
            {/* Desktop Skeleton */}
            <div className="hidden lg:block">
              <EventTableSkeleton />
            </div>
          </>
        ) : (
          <>
            {/* Mobile View - Event Cards */}
            <EventsList
              events={events}
              onEdit={handleEditEvent}
              onDelete={confirmDeleteEvent}
              onCopy={handleCopyEventClick}
              copiedEventId={copiedEventId}
            />

            {/* Desktop View - Events Table */}
            <EventsTable
              events={events}
              onEdit={handleEditEvent}
              onDelete={confirmDeleteEvent}
              onCopy={handleCopyEventClick}
              copiedEventId={copiedEventId}
            />
          </>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalEvents={totalEvents}
          eventsOnPage={events.length}
          isLoading={isLoadingEvents}
          onPageChange={setCurrentPage}
        />
      </main>

      {/* Event Modal */}
      <EventModal isOpen={isModalOpen} onClose={handleModalClose} onSave={handleEventSave} event={editingEvent} />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={hideConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
      />

      {/* Toast Notification */}
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  )
}
