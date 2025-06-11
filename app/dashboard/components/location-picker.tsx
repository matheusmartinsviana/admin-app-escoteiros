"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Check, X, FileText, Search, Loader2, AlertCircle } from "lucide-react"

interface LocationPickerProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: string) => void
  initialLocation?: string
}

// Token do Mapbox
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function LocationPicker({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation = "",
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(initialLocation)
  const [manualAddress, setManualAddress] = useState(initialLocation)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{ address: string }>>([])
  const [isUsingManualInput, setIsUsingManualInput] = useState(false)
  const [error, setError] = useState<string>("")

  const searchLocation = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    setError("")

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=br&limit=5&types=place,locality,neighborhood,address,poi`,
      )

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const results = data.features.map((feature: any) => ({
          address: feature.place_name,
        }))
        setSearchResults(results)
      } else {
        setSearchResults([])
        setError("Endereço não encontrado. Você pode digitar manualmente.")
        setIsUsingManualInput(true)
      }
    } catch (error) {
      console.error("Erro na busca:", error)
      setSearchResults([])
      setError("Erro ao buscar endereço. Você pode digitar manualmente.")
      setIsUsingManualInput(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = () => {
    searchLocation(searchQuery)
  }

  const handleResultSelect = (result: { address: string }) => {
    setManualAddress(result.address)
    setSearchResults([])
    setIsUsingManualInput(false)
  }

  const handleConfirm = () => {
    if (manualAddress) {
      onLocationSelect(manualAddress)
    }
    onClose()
  }

  const handleCancel = () => {
    setSearchResults([])
    setSearchQuery(initialLocation)
    setManualAddress(initialLocation)
    setIsUsingManualInput(false)
    setError("")
    onClose()
  }

  const toggleManualInput = () => {
    setIsUsingManualInput(!isUsingManualInput)
    setError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-4 sm:p-6 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Selecionar Localização
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Alternar entre busca e entrada manual */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={toggleManualInput} className="text-xs">
                {isUsingManualInput ? "Buscar Endereço" : "Entrada Manual"}
              </Button>
            </div>

            {isUsingManualInput ? (
              /* Entrada manual */
              <div className="space-y-2">
                <label className="text-sm font-medium">Digite o endereço:</label>
                <Input
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123 - Bairro, Cidade - UF"
                  className="h-12 text-base"
                />
                <p className="text-xs text-gray-500">Digite o endereço completo do evento</p>
              </div>
            ) : (
              <>
                {/* Barra de busca */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Digite o endereço ou local..."
                      className="pr-10 h-12 text-base"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-red-600 hover:bg-red-700 h-12 px-6"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>

                {/* Resultados da busca */}
                {searchResults.length > 0 && (
                  <div className="bg-white border rounded-lg max-h-40 overflow-y-auto shadow-sm">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleResultSelect(result)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-2 transition-colors"
                      >
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{result.address}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mensagem de erro */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Localização selecionada */}
            {manualAddress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">Endereço:</p>
                    <p className="text-sm text-blue-700 break-words">{manualAddress}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} className="flex-1 h-12 touch-target">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!manualAddress.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 h-12 touch-target"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
