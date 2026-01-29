"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { db, auth } from "@/lib/firebase"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowRight, ShieldCheck, Zap } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

// Tipo simplificado para a vitrine
type DemandaVitrine = {
  id: string
  titulo: string
  descricao: string
  criadoEm: any
}

export default function LandingPage() {
  const [pedido, setPedido] = useState("")
  const [demandas, setDemandas] = useState<DemandaVitrine[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // 1. Verificar se já está logado
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u)
    })
    return () => unsubscribe()
  }, [])

  // 2. Buscar Demandas Aprovadas (Vitrine)
  useEffect(() => {
    const fetchDemandas = async () => {
      try {
        const q = query(
          collection(db, "demandas"),
          where("status", "==", "aprovada"), // Só as aprovadas
          limit(6) // Mostra só as últimas 6 para não pesar
        )

        const snap = await getDocs(q)
        const lista: DemandaVitrine[] = []
        snap.forEach(doc => {
          lista.push({ id: doc.id, ...doc.data() } as DemandaVitrine)
        })
        setDemandas(lista)
      } catch (error) {
        console.error("Erro ao buscar vitrine:", error)
      }
    }
    fetchDemandas()
  }, [])

  // 3. Ação de "Pedir Orçamento"
  const handleComecar = () => {
    if (!pedido.trim()) return alert("Digite o que você precisa!")

    if (user) {
      // Se já logado, vai direto pro painel levando o pedido
      router.push(`/comprador?prefill=${encodeURIComponent(pedido)}`)
    } else {
      // Se não logado, vai pro cadastro levando o pedido
      router.push(`/cadastro?prefill=${encodeURIComponent(pedido)}`)
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* HEADER SIMPLES */}
      <header className="border-b py-4 px-6 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white font-bold p-1 rounded">HL</div>
          <span className="font-bold text-xl tracking-tight">HubLead</span>
        </div>
        <div className="flex gap-4">

          {user ? (
            <Link href={user.email ? "/comprador" : "/login"}>
              <Button variant="outline">Meu Painel</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href="/cadastro">
                <Button className="bg-slate-900">Cadastre-se</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        {/* SEÇÃO 1: HERO (CRIAR DEMANDA) */}
        <section className="py-20 px-6 bg-slate-50 text-center border-b">
          <div className="max-w-3xl mx-auto space-y-6">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-4 py-1 text-sm">
              🚀 Conectando quem precisa com quem faz
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
              O serviço que você precisa, <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500">
                encontrado em minutos.
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Publique sua necessidade gratuitamente e receba orçamentos de fornecedores verificados. Rápido, seguro e sem taxas escondidas.
            </p>

            {/* INPUT DE AÇÃO RÁPIDA */}
            <div className="mt-8 p-2 bg-white rounded-2xl shadow-lg border border-slate-100 max-w-xl mx-auto flex flex-col md:flex-row gap-2">
              <Input
                placeholder="Ex: Preciso de um eletricista urgente..."
                className="border-0 shadow-none text-lg h-12 focus-visible:ring-0"
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComecar()}
              />
              <Button
                size="lg"
                className="bg-slate-900 h-12 px-8 text-md font-bold hover:bg-slate-800"
                onClick={handleComecar}
              >
                Pedir Orçamento
              </Button>
            </div>

            <div className="flex justify-center gap-8 pt-6 text-sm text-slate-500">
              <div className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-green-600" /> Dados Seguros (LGPD)</div>
              <div className="flex items-center gap-1"><Zap className="w-4 h-4 text-amber-500" /> Resposta Rápida</div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: VITRINE (DEMANDAS APROVADAS) */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Oportunidades Recentes</h2>
                <p className="text-slate-500 mt-2">Veja o que os compradores estão buscando agora.</p>
              </div>
              <Link href="/cadastro">
                <Button variant="outline" className="hidden md:flex gap-2">
                  Sou Fornecedor <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* GRID DE CARDS */}
            <div className="grid md:grid-cols-3 gap-6">
              {demandas.length === 0 ? (
                <p className="text-slate-400 col-span-3 text-center py-10">
                  Carregando oportunidades...
                </p>
              ) : (
                demandas.map((demanda) => (
                  <Card key={demanda.id} className="group hover:border-slate-400 transition-all cursor-default">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          Serviço
                        </Badge>
                        <span className="text-xs text-slate-400">Há pouco tempo</span>
                      </div>
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {demanda.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-500 text-sm line-clamp-3">
                        {demanda.descricao}
                      </p>
                    </CardContent>
                    <CardFooter className="border-t pt-4 bg-slate-50/50">
                      <div className="w-full flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" /> Verificado
                        </span>
                        <Link href="/cadastro">
                          <Button size="sm" variant="secondary" className="h-8 text-xs">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>

            <div className="mt-12 text-center">
              <Link href="/cadastro">
                <Button size="lg" variant="outline" className="border-slate-300 text-slate-700">
                  Ver todas as oportunidades
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-center">
        <p>&copy; 2026 HubLead. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}