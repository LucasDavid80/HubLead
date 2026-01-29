"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation" // <--- Importamos useSearchParams
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

// Tipos
type NewUser = {
    email: string | null
    role: string
    criadoEm: Date
    tipo?: string
    saldo?: number
}

interface FirebaseError {
    code?: string
}

// Componente interno com a lógica do formulário (para usar useSearchParams com segurança no Next.js)
function CadastroForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("comprador")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [aceitouTermos, setAceitouTermos] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams() // <--- Lendo a URL
    const prefillPedido = searchParams.get('prefill') // <--- Pegando o pedido da Home

    async function handleRegister(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setError("")

        if (!aceitouTermos) {
            setError("Você precisa aceitar os Termos de Uso e Política de Privacidade.")
            return
        }

        setLoading(true)

        try {
            // 1. Cria usuário
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // 2. Prepara dados
            const userData: NewUser = {
                email: user.email,
                role: role,
                criadoEm: new Date()
            }

            if (role === 'fornecedor') {
                userData.tipo = 'comum'
                userData.saldo = 50
            }

            // 3. Salva no banco
            await setDoc(doc(db, "users", user.uid), userData)

            alert("Conta criada com sucesso!")

            // 4. REDIRECIONAMENTO INTELIGENTE
            if (role === 'comprador') {
                // Se veio da Home com um pedido, repassa ele para o painel
                if (prefillPedido) {
                    router.push(`/comprador?prefill=${encodeURIComponent(prefillPedido)}`)
                } else {
                    router.push('/comprador')
                }
            } else {
                router.push('/fornecedor')
            }

        } catch (err: unknown) {
            console.error(err)
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
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/login" className="text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <span className="text-sm text-slate-500">Voltar para Login</span>
                </div>
                <CardTitle className="text-2xl font-bold text-center text-slate-900">Crie sua conta</CardTitle>
                <CardDescription className="text-center">
                    {prefillPedido ?
                        <span className="text-blue-600 font-medium">Falta pouco para enviar seu pedido!</span>
                        : "Comece a usar o HubLead agora mesmo"}
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
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <div className="flex items-start space-x-2 py-2">
                        <Checkbox
                            id="termos"
                            checked={aceitouTermos}
                            onCheckedChange={(checked) => setAceitouTermos(checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="termos" className="text-sm font-medium leading-none cursor-pointer">
                                Aceito os Termos e Condições
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Concordo com a Política de Privacidade (LGPD).
                            </p>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full bg-slate-900" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Conta Grátis"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-slate-500">
                    Já tem uma conta? <Link href="/login" className="text-slate-900 font-bold hover:underline">Fazer Login</Link>
                </p>
            </CardFooter>
        </Card>
    )
}

// Componente Principal que envolve tudo num Suspense (Necessário para usar useSearchParams)
export default function CadastroPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Suspense fallback={<div className="text-center">Carregando...</div>}>
                <CadastroForm />
            </Suspense>
        </div>
    )
}