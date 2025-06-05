"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Search, Check, X, Loader2, FileText, AlertCircle } from "lucide-react"

interface LocationPickerProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: string, coordinates?: { lat: number; lng: number }) => void
  initialLocation?: string
}

interface MapLocation {
  address: string
  lat: number
  lng: number
}

// Declaração para TypeScript reconhecer a API do Mapbox
declare global {
  interface Window {
    mapboxgl: any
  }
}

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoibWF0aGV1c212aWFuYSIsImEiOiJjbTZmdWx1MG4wOW1rMnJvbWczZTdjZXIzIn0.1qVyDaB9I5WadI0SXnTpRA"

export default function LocationPicker({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation = "",
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(initialLocation)
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MapLocation[]>([])
  const [mapCenter, setMapCenter] = useState([-48.8487, -26.3044]) // Joinville, SC [lng, lat]
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isUsingManualInput, setIsUsingManualInput] = useState(false)
  const [manualAddress, setManualAddress] = useState(initialLocation)
  const [mapError, setMapError] = useState<string>("")
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Verificar se o Mapbox já está carregado
  useEffect(() => {
    if (typeof window !== "undefined" && window.mapboxgl) {
      setIsScriptLoaded(true)
      setIsMapLoaded(true)
    }
  }, [])

  // Inicializar mapa quando o componente abre e o Mapbox está carregado
  useEffect(() => {
    if (isOpen && isScriptLoaded && mapRef.current && !mapInstanceRef.current) {
      console.log("Tentando inicializar o mapa...")
      initializeMap()
    }
  }, [isOpen, isScriptLoaded])

  // Atualizar query de busca quando a localização inicial muda
  useEffect(() => {
    if (initialLocation) {
      setSearchQuery(initialLocation)
      setManualAddress(initialLocation)
      if (isScriptLoaded) {
        geocodeAddress(initialLocation)
      }
    }
  }, [initialLocation, isScriptLoaded])

  // Cleanup do mapa quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          markerRef.current = null
        } catch (error) {
          console.error("Erro ao limpar o mapa:", error)
        }
      }
    }
  }, [])

  const initializeMap = () => {
    try {
      console.log("Inicializando mapa...")
      console.log("Mapbox disponível:", !!window.mapboxgl)
      console.log("Container disponível:", !!mapRef.current)

      if (!window.mapboxgl) {
        setMapError("Mapbox GL JS não está carregado")
        console.error("Mapbox GL JS não está carregado")
        return
      }

      if (!mapRef.current) {
        setMapError("Container do mapa não encontrado")
        console.error("Container do mapa não encontrado")
        return
      }

      window.mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

      // Criar o mapa
      const map = new window.mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: mapCenter,
        zoom: 15,
        attributionControl: false,
      })

      console.log("Mapa criado:", map)
      mapInstanceRef.current = map

      // Criar o marcador
      const marker = new window.mapboxgl.Marker({
        draggable: true,
        color: "#dc2626", // Cor vermelha para combinar com o tema
      })
        .setLngLat(mapCenter)
        .addTo(map)

      markerRef.current = marker
      console.log("Marcador criado:", marker)

      // Evento de clique no mapa
      map.on("click", (e) => {
        console.log("Clique no mapa:", e.lngLat)
        const { lng, lat } = e.lngLat
        updateMarkerPosition([lng, lat])
        reverseGeocode(lng, lat)
      })

      // Evento de arrastar o marcador
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat()
        console.log("Marcador arrastado:", lngLat)
        reverseGeocode(lngLat.lng, lngLat.lat)
      })

      // Eventos do mapa
      map.on("load", () => {
        console.log("Mapa carregado com sucesso")
        setMapError("")
        setIsMapLoaded(true)
      })

      map.on("error", (e) => {
        console.error("Erro no mapa:", e)
        setMapError("Erro ao carregar o mapa")
      })

      // Se tiver localização inicial, geocodificar
      if (initialLocation) {
        geocodeAddress(initialLocation)
      }
    } catch (error) {
      console.error("Erro ao inicializar o mapa:", error)
      setMapError(`Erro ao inicializar o mapa: ${error}`)
    }
  }

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return

    setIsSearching(true)

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=br&limit=1`,
      )

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const [lng, lat] = feature.center

        setMapCenter([lng, lat])
        updateMarkerPosition([lng, lat])

        setSelectedLocation({
          address: feature.place_name,
          lat,
          lng,
        })

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter([lng, lat])
          mapInstanceRef.current.setZoom(16)
        }
      }
    } catch (error) {
      console.error("Erro na geocodificação:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const reverseGeocode = async (lng: number, lat: number) => {
    setIsSearching(true)

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=br`,
      )

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        setSelectedLocation({
          address: feature.place_name,
          lat,
          lng,
        })
      } else {
        // Se falhar, use coordenadas como endereço
        setSelectedLocation({
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
        })
      }
    } catch (error) {
      console.error("Erro na geocodificação reversa:", error)
      setSelectedLocation({
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng,
      })
    } finally {
      setIsSearching(false)
    }
  }

  const updateMarkerPosition = (lngLat: [number, number]) => {
    if (markerRef.current) {
      markerRef.current.setLngLat(lngLat)
    }
  }

  const searchLocation = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=br&limit=5&types=place,locality,neighborhood,address,poi`,
      )

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const results = data.features.map((feature: any) => ({
          address: feature.place_name,
          lat: feature.center[1],
          lng: feature.center[0],
          center: feature.center,
        }))

        setSearchResults(results)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("Erro na busca:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = () => {
    searchLocation(searchQuery)
  }

  const handleResultSelect = (result: any) => {
    const [lng, lat] = result.center

    setSelectedLocation({
      address: result.address,
      lat,
      lng,
    })

    setMapCenter([lng, lat])
    updateMarkerPosition([lng, lat])

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([lng, lat])
      mapInstanceRef.current.setZoom(16)
    }

    setSearchResults([])
  }

  const handleConfirm = () => {
    if (isUsingManualInput && manualAddress) {
      onLocationSelect(manualAddress)
    } else if (selectedLocation) {
      onLocationSelect(selectedLocation.address, { lat: selectedLocation.lat, lng: selectedLocation.lng })
    }
    onClose()
  }

  const handleCancel = () => {
    setSelectedLocation(null)
    setSearchResults([])
    setSearchQuery(initialLocation)
    setManualAddress(initialLocation)
    onClose()
  }

  const toggleManualInput = () => {
    setIsUsingManualInput(!isUsingManualInput)
    if (!isUsingManualInput && selectedLocation) {
      setManualAddress(selectedLocation.address)
    }
  }

  // Função para inicializar quando o script do Mapbox é carregado
  const handleMapboxLoaded = () => {
    console.log("Script do Mapbox carregado")
    setIsScriptLoaded(true)
    if (isOpen && mapRef.current) {
      setTimeout(() => {
        initializeMap()
      }, 100) // Pequeno delay para garantir que tudo está pronto
    }
  }

  const retryMapLoad = () => {
    setMapError("")
    setIsMapLoaded(false)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
    setTimeout(() => {
      initializeMap()
    }, 500)
  }

  return (
    <>
      {/* CSS do Mapbox - carregado primeiro */}
      {typeof window !== "undefined" && (
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css" rel="stylesheet" />
      )}

      {/* Script do Mapbox GL JS */}
      {typeof window !== "undefined" && !window.mapboxgl && (
        <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js" onLoad={handleMapboxLoaded} async />
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-4 sm:p-6 border-b">
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Selecionar Localização
              </DialogTitle>
            </DialogHeader>

            <div className="p-4 space-y-4">
              {/* Alternar entre mapa e entrada manual */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={toggleManualInput} className="text-xs">
                  {isUsingManualInput ? "Usar Mapa" : "Entrada Manual"}
                </Button>
              </div>

              {isUsingManualInput ? (
                /* Entrada manual */
                <div className="space-y-2">
                  <label className="text-sm font-medium">Digite o endereço manualmente:</label>
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

                  {/* Container do mapa */}
                  <div className="h-[40vh] sm:h-[50vh] w-full border rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                    {mapError ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center p-4">
                          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                          <p className="text-sm text-red-600 mb-2">{mapError}</p>
                          <Button onClick={retryMapLoad} size="sm" variant="outline">
                            Tentar Novamente
                          </Button>
                        </div>
                      </div>
                    ) : !isScriptLoaded ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Carregando Mapbox...</p>
                        </div>
                      </div>
                    ) : (
                      <div
                        ref={mapRef}
                        className="w-full h-full map-container"
                        style={{
                          minHeight: "300px",
                          position: "relative",
                        }}
                      />
                    )}
                  </div>

                  {/* Instruções */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Dica:</strong> Clique no mapa ou arraste o marcador para selecionar uma localização
                      precisa
                    </p>
                  </div>
                </>
              )}

              {/* Localização selecionada */}
              {!isUsingManualInput && selectedLocation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Localização Selecionada:</p>
                      <p className="text-sm text-green-700 break-words">{selectedLocation.address}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Coordenadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Localização manual */}
              {isUsingManualInput && manualAddress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">Endereço Manual:</p>
                      <p className="text-sm text-blue-700 break-words">{manualAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-2 pt-4 sticky bottom-0 bg-white border-t mt-4 action-buttons">
                <Button variant="outline" onClick={handleCancel} className="flex-1 h-12 touch-target">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={(!selectedLocation && !isUsingManualInput) || (isUsingManualInput && !manualAddress.trim())}
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
    </>
  )
}
