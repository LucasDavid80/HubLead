"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, getDocs, query, where, updateDoc, doc, getDoc, arrayUnion, increment } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, Phone, Mail, Lock, Coins, Star, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

type Demanda = {
    id: string
    titulo: string
    descricao: string
    status: string
    leads_revelados_para?: string[]
    contato?: {
        nome: string
        telefone: string
        email: string
    }
}

type UserProfile = {
    role: string
    tipo: 'comum' | 'patrocinador'
    saldo: number
}

export default function FornecedorDashboard() {
    const [demandas, setDemandas] = useState<Demanda[]>([])
    const [perfil, setPerfil] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [buyingId, setBuyingId] = useState<string | null>(null)
    const [busca, setBusca] = useState("")
    const router = useRouter()

    const handleLogout = async () => {
        await signOut(auth)
        router.push("/")
    }

    // 1. Busca perfil e demandas aprovadas
    useEffect(() => {
        const init = async () => {
            const user = auth.currentUser
            if (!user) return router.push("/")

            const userDocRef = doc(db, "users", user.uid)
            const userSnap = await getDoc(userDocRef)

            if (!userSnap.exists() || userSnap.data().role !== 'fornecedor') {
                alert("Acesso exclusivo para fornecedores")
                return router.push("/")
            }
            setPerfil(userSnap.data() as UserProfile)

            const q = query(collection(db, "demandas"), where("status", "==", "aprovada"))
            const querySnapshot = await getDocs(q)
            const lista: Demanda[] = []

            querySnapshot.forEach((doc) => {
                const data = doc.data()
                lista.push({
                    id: doc.id,
                    ...data,
                    leads_revelados_para: data.leads_revelados_para || [],
                    contato: { nome: "Cliente Teste", telefone: "(11) 99999-9999", email: "cliente@email.com" }
                } as Demanda)
            })
            setDemandas(lista)
            setLoading(false)
        }
        init()
    }, [router])

    // 2. A Lógica de "Comprar" o Lead
    const liberarContato = async (demanda: Demanda) => {
        const user = auth.currentUser
        if (!user || !perfil) return

        if (demanda.leads_revelados_para?.includes(user.uid)) return

        if (perfil.tipo === 'comum' && perfil.saldo <= 0) {
            alert("Saldo insuficiente! Recarregue seus créditos.")
            return
        }

        if (!confirm(perfil.tipo === 'patrocinador' ? "Liberar contato (Grátis para VIP)?" : "Descontar 1 crédito para ver contato?")) return

        setBuyingId(demanda.id)

        try {
            const batchPromises = []

            // A. Adiciona o fornecedor na lista de quem viu essa demanda
            const demandaRef = doc(db, "demandas", demanda.id)
            batchPromises.push(updateDoc(demandaRef, {
                leads_revelados_para: arrayUnion(user.uid)
            }))

            // B. Se não for VIP, desconta o saldo
            if (perfil.tipo !== 'patrocinador') {
                const userRef = doc(db, "users", user.uid)
                batchPromises.push(updateDoc(userRef, {
                    saldo: increment(-1)
                }))
                setPerfil({ ...perfil, saldo: perfil.saldo - 1 })
            }

            await Promise.all(batchPromises)

            setDemandas(demandas.map(d => {
                if (d.id === demanda.id) {
                    return { ...d, leads_revelados_para: [...(d.leads_revelados_para || []), user.uid] }
                }
                return d
            }))

        } catch (error) {
            console.error(error)
            alert("Erro ao processar transação")
        } finally {
            setBuyingId(null)
        }
    }

    // --- Renderização Principal ---

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-slate-500 animate-pulse">Carregando painel...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar com Saldo */}
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-slate-900">HubLead <span className="text-slate-500 font-normal">| Oportunidades</span></h1>

                <div className="flex items-center gap-4">
                    {perfil?.tipo === 'patrocinador' ? (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1 px-3 py-1">
                            <Star className="w-3 h-3 fill-purple-700" /> Acesso VIP Ilimitado
                        </Badge>
                    ) : (
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border">
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span className="font-bold text-slate-700">{perfil?.saldo ?? 0} Créditos</span>
                        </div>
                    )}

                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </nav>

            <main className="p-6 max-w-5xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Mural de Leads Disponíveis</h2>

                {/* Barra de Busca */}
                <div className="mb-8 relative w-full max-w-4xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="O que você está procurando? (Ex: Cimento, Pintor, Frete...)"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="pl-10 h-12 text-lg bg-white shadow-sm border-slate-200 w-full rounded-xl focus-visible:ring-slate-400"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 ml-1">
                        Filtrando por título e descrição em tempo real.
                    </p>
                </div>

                {/* Lista de Cards */}
                {demandas.length === 0 ? (
                    <Alert>
                        <AlertDescription>Nenhuma oportunidade disponível no momento.</AlertDescription>
                    </Alert>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {demandas
                            .filter(d => d.titulo.toLowerCase().includes(busca.toLowerCase()) || d.descricao.toLowerCase().includes(busca.toLowerCase()))
                            .map((demanda) => {
                                const user = auth.currentUser
                                const jaComprou = user && demanda.leads_revelados_para?.includes(user.uid)

                                // --- SOLUÇÃO DO ERRO ---
                                // Extraímos o JSX complexo para variáveis simples
                                const ConteudoLiberado = (
                                    <div className="bg-green-50 p-3 rounded-md border border-green-100 space-y-2 animate-in fade-in">
                                        <div className="flex items-center gap-2 text-green-800 font-medium">
                                            <Phone className="w-4 h-4" /> {demanda.contato?.telefone}
                                        </div>
                                        <div className="flex items-center gap-2 text-green-800 font-medium">
                                            <Mail className="w-4 h-4" /> {demanda.contato?.email}
                                        </div>
                                    </div>
                                )

                                const ConteudoBloqueado = (
                                    <div className="bg-slate-50 p-3 rounded-md border border-slate-100 flex items-center justify-center gap-2 text-slate-400">
                                        <Lock className="w-4 h-4" /> Contato Bloqueado
                                    </div>
                                )

                                const BotaoTexto = perfil?.tipo === 'patrocinador'
                                    ? <>Liberar Lead (Grátis VIP)</>
                                    : <>Liberar Lead (-1 Crédito)</>

                                return (
                                    <Card key={demanda.id} className={`
        border-l-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1
        ${jaComprou ? 'border-l-green-500 border-green-200' : 'border-l-slate-300 hover:border-blue-400'}`}>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex justify-between">
                                                {demanda.titulo}
                                                {jaComprou && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Liberado</Badge>}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{demanda.descricao}</p>

                                            {/* Agora o ternário fica super limpo! */}
                                            {jaComprou ? ConteudoLiberado : ConteudoBloqueado}
                                        </CardContent>
                                        <CardFooter>
                                            {!jaComprou && (
                                                <Button
                                                    className="w-full shadow-blue-200 hover:shadow-blue-400 hover:shadow-lg transition-all"
                                                    onClick={() => liberarContato(demanda)}
                                                    disabled={!!buyingId}
                                                >
                                                    {BotaoTexto}
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                    </div>
                )}
            </main>
        </div>
    )
}