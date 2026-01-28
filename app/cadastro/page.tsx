"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

// Interface para garantir a tipagem do usuário
type NewUser = {
    email: string | null
    role: string
    criadoEm: Date
    tipo?: string
    saldo?: number
}

// Interface auxiliar para o erro do Firebase
interface FirebaseError {
    code?: string
}

export default function CadastroPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("comprador")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleRegister(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            // 1. Cria o usuário no Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // 2. Prepara o objeto
            const userData: NewUser = {
                email: user.email,
                role: role,
                criadoEm: new Date()
            }

            // Se for fornecedor, adiciona os campos extras
            if (role === 'fornecedor') {
                userData.tipo = 'comum'
                userData.saldo = 50 // Bônus de boas-vindas
            }

            // 3. Salva no Firestore
            await setDoc(doc(db, "users", user.uid), userData)

            alert("Conta criada com sucesso!")

            // Redireciona
            if (role === 'comprador') router.push('/comprador')
            else router.push('/fornecedor')

        } catch (err: unknown) { // <--- MUDANÇA: Usamos 'unknown' que é mais seguro
            console.error(err)

            // Convertemos o erro desconhecido para nossa interface
            const firebaseError = err as FirebaseError

            if (firebaseError.code === 'auth/email-already-in-use') {
                setError("Este email já está cadastrado.")
            } else if (firebaseError.code === 'auth/weak-password') {
                setError("A senha deve ter pelo menos 6 caracteres.")
            } else {
                setError("Erro ao criar conta. Tente novamente.")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <span className="text-sm text-slate-500">Voltar para Login</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-slate-900">Crie sua conta</CardTitle>
                    <CardDescription className="text-center">
                        Comece a usar o HubLead agora mesmo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">

                        <div className="space-y-2">
                            <Label>Eu quero...</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione seu perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="comprador">Contratar Serviços (Comprador)</SelectItem>
                                    <SelectItem value="fornecedor">Vender Serviços (Fornecedor)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seunome@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Conta Grátis"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-slate-500">
                        Já tem uma conta? <Link href="/" className="text-slate-900 font-bold hover:underline">Fazer Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}