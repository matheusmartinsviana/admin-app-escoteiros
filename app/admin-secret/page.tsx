"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { Trash2, Eye, EyeOff, Shield, UserPlus, Users } from "lucide-react"
import Image from "next/image"

interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export default function AdminSecretPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [secretPassword, setSecretPassword] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Formulário para novo usuário
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
  })

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

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

  // Senha secreta (apenas nós sabemos)
  const SECRET_ACCESS_PASSWORD = "escoteiros2024@admin"

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

  const handleSecretLogin = () => {
    if (secretPassword === SECRET_ACCESS_PASSWORD) {
      setIsAuthenticated(true)
      setError("")
      loadUsers()
    } else {
      setError("Senha secreta incorreta!")
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin-secret/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/admin-secret/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secretPassword: SECRET_ACCESS_PASSWORD,
          ...newUser,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Usuário criado com sucesso!")
        setNewUser({ name: "", email: "", password: "" })
        loadUsers()
      } else {
        setError(data.error || "Erro ao criar usuário")
      }
    } catch (error) {
      setError("Erro ao criar usuário")
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteUser = (userId: number, userName: string) => {
    showConfirmModal(
      "Excluir Usuário",
      `Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita e o usuário perderá acesso ao sistema.`,
      () => handleDeleteUser(userId),
      "danger",
      "Excluir Usuário",
    )
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin-secret/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secretPassword: SECRET_ACCESS_PASSWORD,
        }),
      })

      if (response.ok) {
        setMessage("Usuário excluído com sucesso!")
        loadUsers()
      } else {
        const data = await response.json()
        setError(data.error || "Erro ao excluir usuário")
      }
    } catch (error) {
      setError("Erro ao excluir usuário")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/logo.png"
                alt="Escoteiros Pirabeiraba"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              Área Secreta
            </CardTitle>
            <p className="text-gray-600">Acesso restrito para administradores</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="secret-password">Senha Secreta</Label>
              <div className="relative">
                <Input
                  id="secret-password"
                  type={showPassword ? "text" : "password"}
                  value={secretPassword}
                  onChange={(e) => setSecretPassword(e.target.value)}
                  placeholder="Digite a senha secreta"
                  onKeyPress={(e) => e.key === "Enter" && handleSecretLogin()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

            <Button onClick={handleSecretLogin} className="w-full bg-red-600 hover:bg-red-700">
              <Shield className="h-4 w-4 mr-2" />
              Acessar Área Secreta
            </Button>

            <div className="text-center">
              <Button variant="link" onClick={() => (window.location.href = "/login")} className="text-gray-600">
                Voltar ao Login Normal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/images/logo.png"
                alt="Escoteiros Pirabeiraba"
                width={60}
                height={60}
                className="object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-red-600" />
                  Gerenciamento de Usuários
                </h1>
                <p className="text-gray-600">Área secreta - Acesso restrito</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAuthenticated(false)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Sair da Área Secreta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Criar Novo Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-red-600" />
                Criar Novo Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nome do administrador"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Senha do usuário"
                    required
                  />
                </div>

                {message && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{message}</div>}

                {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

                <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
                  {loading ? "Criando..." : "Criar Usuário"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                Usuários Cadastrados ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhum usuário encontrado</p>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Criado em: {new Date(user.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDeleteUser(user.id, user.name)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  )
}
