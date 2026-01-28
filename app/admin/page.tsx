"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, CheckCircle, Users, ShoppingBag } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

type Demanda = {
    id: string
    titulo: string
    descricao: string
    status: string
    leads_revelados_para?: string[]
}

export default function AdminDashboard() {
    const [demandas, setDemandas] = useState<Demanda[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ pendentes: 0, ativas: 0, totalLeads: 0, totalUsuarios: 0 })
    const [chartData, setChartData] = useState<{ name: string, total: number }[]>([])
    const router = useRouter()

    const handleLogout = async () => {
        await signOut(auth)
        router.push("/")
    }

    const fetchDados = async () => {
        try {
            setLoading(true) // Opcional: mostra loading enquanto atualiza

            // 1. Busca Demandas
            const querySnapshot = await getDocs(collection(db, "demandas"))

            const listaPendentes: Demanda[] = []
            let countAtivas = 0
            let countLeads = 0

            // Agrupamento para o gráfico
            const agrupamentoPorMes: Record<string, number> = {}
            const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

            querySnapshot.forEach((doc) => {
                const data = doc.data()

                if (data.status === "pendente") listaPendentes.push({ id: doc.id, ...data } as Demanda)
                if (data.status === "aprovada") countAtivas++
                if (data.leads_revelados_para) countLeads += data.leads_revelados_para.length

                // Lógica do gráfico
                const dataCriacao = data.criadoEm ? data.criadoEm.toDate() : new Date()
                const nomeMes = mesesNomes[dataCriacao.getMonth()]
                agrupamentoPorMes[nomeMes] = (agrupamentoPorMes[nomeMes] || 0) + 1
            })

            // 2. Busca Usuários (NOVO)
            const usersSnapshot = await getDocs(collection(db, "users"))
            const countUsers = usersSnapshot.size

            // 3. Atualiza Tudo
            setDemandas(listaPendentes)

            setStats({
                pendentes: listaPendentes.length,
                ativas: countAtivas,
                totalLeads: countLeads,
                totalUsuarios: countUsers // Dado Real
            })

            // Atualiza Gráfico
            const dadosFormatados = Object.keys(agrupamentoPorMes).map(key => ({
                name: key,
                total: agrupamentoPorMes[key]
            }))
            setChartData(dadosFormatados)

        } catch (error) {
            console.error("Erro ao buscar dados:", error)
        } finally {
            setLoading(false)
        }
    }

    const aprovarDemanda = async (id: string) => {
        if (!confirm("Aprovar demanda?")) return
        try {
            await updateDoc(doc(db, "demandas", id), { status: "aprovada", aprovadoEm: new Date() })
            fetchDados() // Recarrega tudo
            alert("Sucesso!")
        } catch (error) {
            alert("Erro ao aprovar")
        }
    }

    useEffect(() => {
        // Verificação simples de auth
        const user = auth.currentUser
        if (!user) router.push("/")
        fetchDados()
    }, [router])

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-900">HubLead <span className="text-slate-500 text-sm">| Admin</span></h1>
                <Button variant="ghost" onClick={handleLogout} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
            </nav>

            <main className="p-6 max-w-6xl mx-auto space-y-8">

                {/* Seção 1: KPIs (Cards de Indicadores Reais) */}
                <div className="grid gap-4 md:grid-cols-3">

                    {/* CARD 1: Demandas Ativas */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Oportunidades Ativas</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.ativas}</div>
                            <p className="text-xs text-muted-foreground">Disponíveis no mural agora</p>
                        </CardContent>
                    </Card>

                    {/* CARD 2: Leads Vendidos */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Leads Revelados</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalLeads}</div>
                            <p className="text-xs text-muted-foreground">Total de contatos liberados</p>
                        </CardContent>
                    </Card>

                    {/* CARD 3: Usuários Totais */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Base de Usuários</CardTitle>
                            <Users className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            {/* Mostra o número real de usuários no banco */}
                            <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
                            <p className="text-xs text-muted-foreground">Cadastrados na plataforma</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Seção 2: Gráfico e Lista (Lado a Lado) */}
                <div className="grid gap-4 md:grid-cols-7">

                    {/* Gráfico (Ocupa 4 colunas) */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Visão Geral de Demandas</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Lista de Pendentes (Ocupa 3 colunas) */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Aprovações Pendentes ({stats.pendentes})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {demandas.length === 0 ? (
                                    <p className="text-sm text-slate-500">Nenhuma pendência.</p>
                                ) : (
                                    demandas.map((demanda) => (
                                        <div key={demanda.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{demanda.titulo}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{demanda.descricao}</p>
                                            </div>
                                            <Button size="sm" onClick={() => aprovarDemanda(demanda.id)}>Aprovar</Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}