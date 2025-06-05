"use client"

import { AlertCircle } from "lucide-react"

interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div className="mb-4 sm:mb-6 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="break-words">{message}</span>
    </div>
  )
}
