"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LogOut, CheckCircle, Users, ShoppingBag, Search, Trash2, Filter } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// Tipos atualizados
type Demanda = {
    id: string
    titulo: string
    descricao: string
    status: string
    leads_revelados_para?: string[]
    criadorEmail?: string
    criadoEm?: any
}

type UserData = {
    id: string
    email: string
    role: string
    saldo?: number
    criadoEm?: any
}

export default function AdminDashboard() {
    // Estados Globais
    const [demandas, setDemandas] = useState<Demanda[]>([]) // Agora guarda TODAS
    const [users, setUsers] = useState<UserData[]>([]) // Nova lista de usuários
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ pendentes: 0, ativas: 0, totalLeads: 0, totalUsuarios: 0 })
    const [chartData, setChartData] = useState<{ name: string, total: number }[]>([])

    // Estados de Filtro
    const [filtroUser, setFiltroUser] = useState("")
    const [filtroDemanda, setFiltroDemanda] = useState("")

    const router = useRouter()

    const handleLogout = async () => {
        await signOut(auth)
        router.push("/")
    }

    const fetchDados = async () => {
        try {
            setLoading(true)

            // 1. Busca TODAS as Demandas
            const querySnapshot = await getDocs(collection(db, "demandas"))
            const listaCompleta: Demanda[] = []

            let countPendentes = 0
            let countAtivas = 0
            let countLeads = 0

            // Agrupamento para o gráfico
            const agrupamentoPorMes: Record<string, number> = {}
            const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

            querySnapshot.forEach((doc) => {
                const data = doc.data()
                // Monta o objeto completo
                listaCompleta.push({ id: doc.id, ...data } as Demanda)

                // Contadores
                if (data.status === "pendente") countPendentes++
                if (data.status === "aprovada") countAtivas++
                if (data.leads_revelados_para) countLeads += data.leads_revelados_para.length

                // Lógica do gráfico (Preservada do seu código)
                const dataCriacao = data.criadoEm ? data.criadoEm.toDate() : new Date()
                const nomeMes = mesesNomes[dataCriacao.getMonth()]
                agrupamentoPorMes[nomeMes] = (agrupamentoPorMes[nomeMes] || 0) + 1
            })

            // Ordena por data (mais novas primeiro)
            listaCompleta.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))

            // 2. Busca Usuários Completos
            const usersSnapshot = await getDocs(collection(db, "users"))
            const listaUsers: UserData[] = []
            usersSnapshot.forEach((doc) => {
                listaUsers.push({ id: doc.id, ...doc.data() } as UserData)
            })

            // 3. Atualiza Estados
            setDemandas(listaCompleta)
            setUsers(listaUsers)

            setStats({
                pendentes: countPendentes,
                ativas: countAtivas,
                totalLeads: countLeads,
                totalUsuarios: usersSnapshot.size
            })

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
        if (!confirm("Aprovar demanda para o mural público?")) return
        try {
            await updateDoc(doc(db, "demandas", id), { status: "aprovada", aprovadoEm: new Date() })
            fetchDados() // Recarrega
        } catch (error) {
            alert("Erro ao aprovar")
        }
    }

    const excluirDemanda = async (id: string) => {
        if (!confirm("Tem certeza que deseja EXCLUIR essa demanda?")) return
        try {
            await deleteDoc(doc(db, "demandas", id))
            fetchDados()
        } catch (error) {
            alert("Erro ao excluir")
        }
    }

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) router.push("/login")
            else fetchDados()
        })
        return () => unsubscribe()
    }, [router])

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-slate-900">HubLead <span className="text-slate-500 text-sm">| Admin</span></h1>
                <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
            </nav>

            <main className="p-6 max-w-7xl mx-auto space-y-8">

                {/* KPI Cards (Sempre visíveis) */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Oportunidades Ativas</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.ativas}</div>
                            <p className="text-xs text-muted-foreground">Disponíveis no mural</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Leads Revelados</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalLeads}</div>
                            <p className="text-xs text-muted-foreground">Contatos vendidos</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Base de Usuários</CardTitle>
                            <Users className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
                            <p className="text-xs text-muted-foreground">Cadastrados totais</p>
                        </CardContent>
                    </Card>
                </div>

                {/* SISTEMA DE ABAS PRINCIPAL */}
                <Tabs defaultValue="visao-geral" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 bg-slate-200">
                        <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
                        <TabsTrigger value="todas-demandas">Todas Demandas</TabsTrigger>
                        <TabsTrigger value="usuarios">Usuários</TabsTrigger>
                    </TabsList>

                    {/* ABA 1: VISÃO GERAL (Seu código original adaptado) */}
                    <TabsContent value="visao-geral" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-7">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Volume de Demandas</CardTitle>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chartData}>
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Fila de Aprovação</CardTitle>
                                    <CardDescription>{stats.pendentes} demandas aguardando</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {demandas.filter(d => d.status === 'pendente').length === 0 ? (
                                            <p className="text-sm text-slate-500 text-center py-4">Fila limpa! Tudo aprovado.</p>
                                        ) : (
                                            demandas.filter(d => d.status === 'pendente').slice(0, 5).map((demanda) => (
                                                <div key={demanda.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                                    <div className="space-y-1 max-w-[60%]">
                                                        <p className="text-sm font-medium leading-none truncate">{demanda.titulo}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{demanda.descricao}</p>
                                                    </div>
                                                    <Button size="sm" onClick={() => aprovarDemanda(demanda.id)} className="bg-green-600 hover:bg-green-700">
                                                        Aprovar
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ABA 2: TODAS AS DEMANDAS (NOVO) */}
                    <TabsContent value="todas-demandas">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Gerenciar Demandas</CardTitle>
                                    <CardDescription>Visualize, aprove ou exclua qualquer pedido.</CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input placeholder="Buscar por título..." className="pl-8" value={filtroDemanda} onChange={e => setFiltroDemanda(e.target.value)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100 text-slate-700 font-medium">
                                            <tr>
                                                <th className="p-4">Status</th>
                                                <th className="p-4">Título</th>
                                                <th className="p-4">Criador</th>
                                                <th className="p-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {demandas.filter(d => d.titulo.toLowerCase().includes(filtroDemanda.toLowerCase())).map((demanda) => (
                                                <tr key={demanda.id} className="border-b last:border-0 hover:bg-slate-50">
                                                    <td className="p-4">
                                                        {demanda.status === 'aprovada'
                                                            ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativa</Badge>
                                                            : <Badge variant="outline" className="text-amber-600 border-amber-200">Pendente</Badge>
                                                        }
                                                    </td>
                                                    <td className="p-4 font-medium">{demanda.titulo}</td>
                                                    <td className="p-4 text-slate-500">{demanda.criadorEmail || "N/A"}</td>
                                                    <td className="p-4 text-right space-x-2">
                                                        {demanda.status === 'pendente' && (
                                                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => aprovarDemanda(demanda.id)}>
                                                                <CheckCircle className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => excluirDemanda(demanda.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ABA 3: USUÁRIOS (NOVO) */}
                    <TabsContent value="usuarios">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Base de Usuários</CardTitle>
                                    <CardDescription>Lista completa de cadastros.</CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input placeholder="Buscar por email..." className="pl-8" value={filtroUser} onChange={e => setFiltroUser(e.target.value)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100 text-slate-700 font-medium">
                                            <tr>
                                                <th className="p-4">Email</th>
                                                <th className="p-4">Perfil</th>
                                                <th className="p-4">Saldo</th>
                                                <th className="p-4">Data Cadastro</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.filter(u => u.email.toLowerCase().includes(filtroUser.toLowerCase())).map((user) => (
                                                <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50">
                                                    <td className="p-4 font-medium">{user.email}</td>
                                                    <td className="p-4">
                                                        <Badge variant="secondary" className={user.role === 'fornecedor' ? 'bg-blue-50 text-blue-700' : ''}>
                                                            {user.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 font-bold text-slate-600">
                                                        {user.saldo !== undefined ? user.saldo : '-'}
                                                    </td>
                                                    <td className="p-4 text-slate-500">
                                                        {user.criadoEm?.seconds ? new Date(user.criadoEm.seconds * 1000).toLocaleDateString() : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </main>
        </div>
    )
}