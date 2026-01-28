"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
// Importe o setPersistence e os tipos de persistência
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox" // Instale se não tiver: npx shadcn@latest add checkbox
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [manterConectado, setManterConectado] = useState(true) // Estado do Checkbox
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 1. Define a persistência ANTES de logar
      await setPersistence(auth, manterConectado ? browserLocalPersistence : browserSessionPersistence)

      // 2. Faz o login normal
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 3. Busca role e redireciona (seu código antigo)
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const role = userDoc.data().role
        if (role === 'admin') router.push('/admin')
        else if (role === 'comprador') router.push('/comprador')
        else if (role === 'fornecedor') router.push('/fornecedor')
      } else {
        setError("Usuário sem perfil.")
      }
    } catch (err: unknown) {
      console.error(err)
      setError("Email ou senha incorretos.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-900">HubLead</CardTitle>
          <CardDescription className="text-center">Entre com suas credenciais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {/* AQUI ESTÁ O CHECKBOX NOVO */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="manter"
                checked={manterConectado}
                onCheckedChange={(checked) => setManterConectado(checked as boolean)}
              />
              <Label htmlFor="manter" className="text-sm font-normal cursor-pointer">
                Manter-me conectado
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-slate-900" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <p className="text-sm text-slate-500">
            Novo aqui? <Link href="/cadastro" className="text-slate-900 font-bold hover:underline">Crie sua conta</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}