"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/types";
import { generateEventInvite } from "@/lib/invite-generator";

export function useDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<number | null>(null);

  const router = useRouter();

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      console.log("Checking authentication...");

      const response = await fetch("/api/auth/verify", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Auth check response status:", response.status);

      const data = await response.json();
      console.log("Auth check data:", data);

      if (data.authenticated) {
        setIsAuthenticated(true);
        console.log("User authenticated:", data.userId);
      } else {
        console.log("User not authenticated:", data.error);
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setError("Erro ao verificar autenticação. Redirecionando...");
      setTimeout(() => router.push("/login"), 2000);
    }
  }, [router]);

  // Fetch events from API
  const fetchEvents = useCallback(
    async (page = 1, status = "", showLoader = true) => {
      try {
        console.log(
          "Fetching events - Page:",
          page,
          "Status:",
          status,
          "Show loader:",
          showLoader
        );

        if (showLoader) {
          setIsLoadingEvents(true);
        }
        setError("");

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "8",
        });

        if (status) {
          params.append("status", status);
        }

        console.log("Request URL:", `/api/events?${params}`);

        const response = await fetch(`/api/events?${params}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log("Events data received:", data);

          setEvents(data.events || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalEvents(data.pagination?.total || 0);
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Erro desconhecido" }));
          console.error("Error response:", errorData);

          setError(
            errorData.error || `Erro ao carregar eventos (${response.status})`
          );

          // If unauthorized, redirect to login
          if (response.status === 401) {
            console.log("Unauthorized - redirecting to login");
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Network error fetching events:", error);
        setError(
          "Erro de conexão ao carregar eventos. Verifique sua internet."
        );
      } finally {
        setIsLoading(false);
        setIsLoadingEvents(false);
      }
    },
    [router]
  );

  // Handle event creation
  const handleCreateEvent = useCallback(
    async (eventData: any) => {
      try {
        setError("");
        console.log("Creating event with data:", eventData);

        // Check auth before creating
        const authResponse = await fetch("/api/auth/verify");
        if (!authResponse.ok) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
          credentials: "include",
        });

        const responseData = await response.json();

        if (response.ok) {
          console.log("Event created successfully:", responseData);
          await fetchEvents(currentPage, statusFilter, false);
          return { success: true };
        } else {
          console.error("Error creating event:", responseData);

          if (response.status === 401) {
            router.push("/login");
            throw new Error("Sessão expirada. Redirecionando para login...");
          }

          throw new Error(responseData.error || "Erro ao criar evento");
        }
      } catch (error: any) {
        console.error("Error creating event:", error);
        setError(error.message || "Erro ao criar evento");
        throw error;
      }
    },
    [currentPage, statusFilter, fetchEvents, router]
  );

  // Handle event update
  const handleUpdateEvent = useCallback(
    async (eventId: number, eventData: any) => {
      try {
        setError("");
        console.log("Updating event with data:", eventData);
        console.log("Status being sent:", eventData.status);

        // Check auth before updating
        const authResponse = await fetch("/api/auth/verify");
        if (!authResponse.ok) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        const response = await fetch(`/api/events/${eventId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
          credentials: "include",
        });

        const responseData = await response.json();
        console.log("Update response:", responseData);

        if (response.ok) {
          console.log("Event updated successfully:", responseData);
          await fetchEvents(currentPage, statusFilter, false);
          return { success: true };
        } else {
          console.error("Error updating event:", responseData);

          if (response.status === 401) {
            router.push("/login");
            throw new Error("Sessão expirada. Redirecionando para login...");
          }

          throw new Error(responseData.error || "Erro ao atualizar evento");
        }
      } catch (error: any) {
        console.error("Error updating event:", error);
        setError(error.message || "Erro ao atualizar evento");
        throw error;
      }
    },
    [currentPage, statusFilter, fetchEvents, router]
  );

  // Handle event deletion
  const handleDeleteEvent = useCallback(
    async (eventId: number) => {
      try {
        setError("");

        // Check auth before deleting
        const authResponse = await fetch("/api/auth/verify");
        if (!authResponse.ok) {
          setError("Sessão expirada. Faça login novamente.");
          router.push("/login");
          return { success: false };
        }

        const response = await fetch(`/api/events/${eventId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          await fetchEvents(currentPage, statusFilter, false);
          return { success: true, message: "Evento excluído com sucesso!" };
        } else {
          const errorData = await response.json();

          if (response.status === 401) {
            router.push("/login");
            setError("Sessão expirada. Redirecionando para login...");
          } else {
            setError(errorData.error || "Erro ao excluir evento");
          }
          return { success: false };
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        setError("Erro ao excluir evento");
        return { success: false };
      }
    },
    [currentPage, statusFilter, fetchEvents, router]
  );

  // Handle event copy
  const handleCopyEvent = useCallback(async (event: Event) => {
    try {
      // Generate invite using utility function
      const inviteMessage = generateEventInvite(event);

      // Copy to clipboard
      await navigator.clipboard.writeText(inviteMessage);

      // Show visual feedback
      setCopiedEventId(event.id);
      setTimeout(() => setCopiedEventId(null), 2000);

      return {
        success: true,
        message: "Convite copiado para a área de transferência!",
      };
    } catch (error) {
      console.error("Error copying event:", error);
      return { success: false, message: "Erro ao copiar convite do evento" };
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, [router]);

  // Initialize dashboard
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch events when dependencies change
  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents(currentPage, statusFilter);
    }
  }, [currentPage, statusFilter, isAuthenticated, fetchEvents]);

  return {
    // State
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

    // Actions
    setCurrentPage,
    setStatusFilter,
    setError,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleCopyEvent,
    handleLogout,
    fetchEvents,
  };
}
