"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation" // Adicione useSearchParams
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, Clock, CheckCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Demanda = {
    id: string
    titulo: string
    descricao: string
    status: string
    leads_revelados_para?: string[]
    criadoEm: { seconds: number }
}

export default function CompradorDashboard() {
    const [titulo, setTitulo] = useState("")
    const [descricao, setDescricao] = useState("")
    const [minhasDemandas, setMinhasDemandas] = useState<Demanda[]>([])
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogout = async () => {
        await signOut(auth)
        router.push("/")
    }

    // Busca demandas do usuário logado
    const fetchDemandas = async (uid: string) => {
        try {
            // Nota: Para ordenar por data no Firebase, as vezes precisa criar índice.
            // Aqui vamos simplificar e ordenar no Javascript se der erro de índice.
            const q = query(
                collection(db, "demandas"),
                where("criadorId", "==", uid)
            )

            const querySnapshot = await getDocs(q)
            const lista: Demanda[] = []
            querySnapshot.forEach((doc) => {
                lista.push({ id: doc.id, ...doc.data() } as Demanda)
            })

            // Ordenação simples no cliente (Mais novas primeiro)
            setMinhasDemandas(lista.toSorted((a, b) => b.criadoEm?.seconds - a.criadoEm?.seconds))
        } catch (error) {
            console.error("Erro ao buscar", error)
        }
    }

    const searchParams = useSearchParams() // Hook para ler a URL
    const prefillTitulo = searchParams.get('prefill') // Pega o texto da Home

    // Efeito para preencher automático ao carregar
    useEffect(() => {
        if (prefillTitulo) {
            setTitulo(prefillTitulo)
            // Opcional: Limpar a URL para ficar bonita
            window.history.replaceState(null, '', '/comprador')
        }
    }, [prefillTitulo])

    const criarDemanda = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            const user = auth.currentUser
            if (!user) return

            await addDoc(collection(db, "demandas"), {
                titulo,
                descricao,
                status: "pendente", // Começa sempre pendente para o admin aprovar
                criadorId: user.uid,
                criadorEmail: user.email,
                leads_revelados_para: [], // Ninguém viu ainda
                criadoEm: new Date()
            })

            setTitulo("")
            setDescricao("")
            alert("Demanda enviada para análise do Admin!")
            fetchDemandas(user.uid) // Atualiza a lista

        } catch (error) {
            console.error(error)
            alert("Erro ao criar demanda")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-slate-900">HubLead <span className="text-slate-500 font-normal">| Área do Comprador</span></h1>
                <Button variant="ghost" onClick={handleLogout} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
            </nav>

            <main className="p-6 max-w-4xl mx-auto grid gap-8 md:grid-cols-2">

                {/* Lado Esquerdo: Nova Demanda */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Nova Solicitação</h2>
                        <p className="text-slate-500">Descreva o que você precisa e receba contatos.</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>O que você precisa?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={criarDemanda} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Título do Pedido</Label>
                                    <Input
                                        placeholder="Ex: Preciso de orçamento para 50 tijolos"
                                        value={titulo}
                                        onChange={e => setTitulo(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição Detalhada</Label>
                                    <Textarea
                                        placeholder="Detalhe marcas, prazos e local de entrega..."
                                        className="h-32"
                                        value={descricao}
                                        onChange={e => setDescricao(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-slate-900" disabled={loading}>
                                    {loading ? "Enviando..." : "Enviar Pedido"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Lado Direito: Histórico */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Seus Pedidos</h2>
                        <p className="text-slate-500">Acompanhe o status das suas solicitações.</p>
                    </div>

                    <div className="space-y-4 h-125 overflow-y-auto pr-2">
                        {minhasDemandas.length === 0 ? (
                            <Alert>
                                <AlertDescription>Você ainda não criou nenhuma demanda.</AlertDescription>
                            </Alert>
                        ) : (
                            minhasDemandas.map((demanda) => (
                                <Card key={demanda.id}
                                    className="transition-all duration-300 hover:shadow-md hover:border-blue-300 border-slate-200 group cursor-default">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-slate-900 leading-tight">{demanda.titulo}</h3>
                                            {demanda.status === 'aprovada' ? (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Ativa
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 gap-1">
                                                    <Clock className="w-3 h-3" /> Em Análise
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-500 line-clamp-2">{demanda.descricao}</p>

                                        <div className="pt-2 border-t flex justify-between items-center text-xs text-slate-400">
                                            <span>Visualizações de contatos:</span>
                                            <strong className="text-slate-700 text-sm">{demanda.leads_revelados_para?.length || 0}</strong>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

            </main>
        </div>
    )
}