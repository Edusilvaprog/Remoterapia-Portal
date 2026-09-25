'use client'
import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, ShieldCheck, Check, User, Compass, MessageCircle } from 'lucide-react'
import { assinarClube } from '../lib/actions/aluno'
import { fetchEventos, processarInscricao, buscarPrecosClubes } from '../lib/actions/eventos'
const SENHA_SEGURA_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

interface ModuloEventosProps {
  onBack: () => void
  isLoggedIn: boolean
  alunoData?: any
  caiaques?: any[]
  onEventoAgendado?: (novoAgendamento: any) => void
  onError: (msg: string) => void
}

export default function ModuloEventos({ onBack, isLoggedIn, alunoData, caiaques = [], onEventoAgendado, onError }: ModuloEventosProps) {
  const [eventos, setEventos] = useState<any[]>([])
  const [loadingEventos, setLoadingEventos] = useState(true)
  const [selectedEvento, setSelectedEvento] = useState<any>(null)
  const [modalClube, setModalClube] = useState<'mensalista' | 'guardaria' | null>(null)
  const [modalCheckout, setModalCheckout] = useState(false)
  const [modalInfoEvento, setModalInfoEvento] = useState<any>(null)
  const [successMsg, setSuccessMsg] = useState<{msg: string, action: () => void} | null>(null)
  const [precos, setPrecos] = useState({ mensalista: 150, guardaria: 150, remadas_semanais: 2, horario_corte: '19:00', dia_manutencao: 'Segunda-feira' })
  const [guardariaDispensada, setGuardariaDispensada] = useState(false)
  
  // Perfil do Aluno para Exibição Condicional dos Clubes:
  // 1. Guardaria: já tem prancha/caiaque guardado (não vê mensalistas nem guardaria)
  // 2. Mensalista: já rema na base (vê apenas guardaria com opção de dispensar)
  // 3. Novo / Avulso: não tem plano (vê ambos os clubes)
  const plano = (alunoData?.tipo_plano || '').toLowerCase()
  const temGuardaria = plano.includes('guardaria')
  const isMensalista = plano.includes('mensalista') && !temGuardaria
  const isAvulsoOuNovo = !alunoData || (!temGuardaria && !isMensalista)
  // Combo removido
  const precoGuardaria = precos.guardaria
  
  // Dados de Adesão
  const [nome, setNome] = useState('')
  const [whats, setWhats] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [vencimento, setVencimento] = useState<number>(5)
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix')
  
  // Dados Guardaria
  const [tipoEmbarcacao, setTipoEmbarcacao] = useState('Caiaque Solo')
  const [marcaModelo, setMarcaModelo] = useState('')
  const [cor, setCor] = useState('')
  
  const [loading, setLoading] = useState(false)

  // Validação da Senha
  const tem8Chars = senha.length >= 8
  const temMaiuscula = /[A-Z]/.test(senha)
  const temNumero = /\d/.test(senha)
  const senhaForte = tem8Chars && temMaiuscula && temNumero

  // Estados para o Checkout do Evento
  const [numParticipantes, setNumParticipantes] = useState(1)
  const [distribuicaoEmbarcacao, setDistribuicaoEmbarcacao] = useState<'duplo' | 'solos'>('duplo')
  const [caiaqueDuploId, setCaiaqueDuploId] = useState('duplo-01')
  const [caiaqueSolo1Id, setCaiaqueSolo1Id] = useState('solo-01')
  const [caiaqueSolo2Id, setCaiaqueSolo2Id] = useState('solo-02')
  const [pagamentoEvento, setPagamentoEvento] = useState<'pix' | 'cartao'>('pix')
  const [nomesAcompanhantes, setNomesAcompanhantes] = useState<string[]>([])

  // Embarcações Reais Vindas da Base (com fallback seguro de lista representativa)
  const caiaquesDuplos = (caiaques || []).filter((c: any) => c.tipo === 'duplo' || c.nome?.toLowerCase().includes('duplo'))
  const caiaquesSolos = (caiaques || []).filter((c: any) => c.tipo !== 'duplo' && !c.nome?.toLowerCase().includes('duplo'))

  const CAIAQUES_BASE = {
    duplos: caiaquesDuplos.length > 0 ? caiaquesDuplos : [
      { id: 'duplo-01', nome: 'Caiaque Duplo Caiçara #01' },
      { id: 'duplo-02', nome: 'Caiaque Duplo Caiçara #02' },
    ],
    solos: caiaquesSolos.length > 0 ? caiaquesSolos : [
      { id: 'solo-01', nome: 'Caiaque Solo Caiçara #01' },
      { id: 'solo-02', nome: 'Caiaque Solo Caiçara #02' },
      { id: 'solo-03', nome: 'Caiaque Solo Caiçara #03' },
      { id: 'sup-01', nome: 'Prancha Stand Up Paddle #01' },
      { id: 'sup-02', nome: 'Prancha Stand Up Paddle #02' },
    ]
  }

  // Carregar eventos e precos do Supabase
  useEffect(() => {
    let isMounted = true
    setLoadingEventos(true)
    
    buscarPrecosClubes().then(p => {
      if (isMounted && p) setPrecos(p)
    })

    fetchEventos().then(res => {
      if (!isMounted) return
      if (res.ok && res.eventos && res.eventos.length > 0) {
        const normalizados = res.eventos.map((ev: any) => ({
          id: ev.id,
          titulo: ev.titulo,
          data_raw: ev.data_evento,
          data: ev.data_evento ? new Date(ev.data_evento + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ev.data,
          hora: ev.horario || ev.hora || '06:00 às 09:00',
          local: ev.local || 'Praia do Gonzaga · Santos',
          ponto_saida: ev.ponto_saida || 'Base Santos · Gonzaga',
          duracao: ev.duracao || '2h30 total',
          nivel: ev.nivel || 'Iniciante',
          preco: Number(ev.preco) || 0,
          vagas_restantes: Math.max(0, (ev.vagas_totais || 10) - (ev.vagas_ocupadas || 0)),
          foto: ev.foto_url || ev.foto || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
          itens: Array.isArray(ev.itens_inclusos) ? ev.itens_inclusos : ['Café Caiçara na Areia', 'Caiaque Solo ou Duplo', 'Colete Homologado', 'Fotos e Vídeos GoPro'],
          roteiro: ev.roteiro || 'Ponto de encontro no Canto do Forte ➔ Instruções e partida ao mar ➔ Remada costeira suave ➔ Parada e Café na Areia ➔ Retorno.',
          o_que_levar: ev.o_que_levar || 'Roupa de banho / lycra UV, protetor solar, toalha, capa impermeável para celular e garrafa de água.',
          descricao: ev.descricao || 'Uma vivência inesquecível de remada na praia com instrutores experientes e suporte completo.',
          politica_cancelamento: ev.politica_cancelamento || 'Cancelamento com reembolso integral permitido até 48 horas antes da saída. Fale pelo suporte WhatsApp.'
        }))
        setEventos(normalizados)
      } else {
        setEventos([])
      }
      setLoadingEventos(false)
    }).catch(() => {
      if (isMounted) setLoadingEventos(false)
    })
    return () => { isMounted = false }
  }, [])

  const handleAbrirCheckout = (ev: any) => {
    setSelectedEvento(ev)
    setNumParticipantes(1)
    setNomesAcompanhantes([])
    setDistribuicaoEmbarcacao('duplo')
    setPagamentoEvento('pix')
    setModalCheckout(true)
  }

  // Identifica se o evento é uma remada que usa a frota de caiaques da base ou se é viagem/clínica/vivência
  const isEventoComCaiaque = (ev: any) => {
    if (!ev) return false
    if (ev.requer_embarcacao !== undefined) return Boolean(ev.requer_embarcacao)
    
    const textoGeral = `${ev.titulo || ''} ${ev.descricao || ''} ${(ev.itens || []).join(' ')}`.toLowerCase()
    const isViagemOuPasseio = textoGeral.includes('viagem') || textoGeral.includes('travessia em escuna') || textoGeral.includes('luau') || textoGeral.includes('clínica')
    const temCaiaqueExplicitamente = textoGeral.includes('caiaque') || textoGeral.includes('remada') || textoGeral.includes('sup')
    
    return temCaiaqueExplicitamente && !isViagemOuPasseio
  }

  const handleConfirmarReservaEvento = async (e: React.FormEvent) => {
    e.preventDefault()
    const titularNome = isLoggedIn ? (alunoData?.nome || 'Aluno') : nome
    const titularWhats = isLoggedIn ? (alunoData?.telefone || '') : whats
    const titularEmail = isLoggedIn ? (alunoData?.email || '') : ''

    if (!isLoggedIn && (!titularNome || !titularWhats)) {
      return onError('Preencha seu nome e WhatsApp.')
    }

    // Se o evento não for de caiaque (ex: viagem), o campo de embarcação é preenchido como "Logística e Embarcação da Expedição Inclusas"
    let resumoEmbarcacao = ''
    if (!isEventoComCaiaque(selectedEvento)) {
      resumoEmbarcacao = 'Expedição / Viagem (Logística Inclusa)'
    } else if (numParticipantes === 1) {
      const achado = CAIAQUES_BASE.solos.find((c: any) => c.id === caiaqueSolo1Id)
      resumoEmbarcacao = achado ? achado.nome : 'Caiaque Solo da Base'
    } else if (distribuicaoEmbarcacao === 'duplo') {
      const achado = CAIAQUES_BASE.duplos.find((c: any) => c.id === caiaqueDuploId)
      resumoEmbarcacao = `${achado ? achado.nome : 'Caiaque Duplo'} (2 pessoas)`
    } else {
      const b1 = CAIAQUES_BASE.solos.find((c: any) => c.id === caiaqueSolo1Id)?.nome || 'Solo #01'
      const b2 = CAIAQUES_BASE.solos.find((c: any) => c.id === caiaqueSolo2Id)?.nome || 'Solo #02'
      resumoEmbarcacao = `Pessoa 1: ${b1} · Pessoa 2: ${b2}`
    }

    setLoading(true)
    const valorTotal = (selectedEvento.preco || 0) * numParticipantes

    try {
      const res = await processarInscricao({
        evento_id: selectedEvento.id,
        mensalista_id: alunoData?.id,
        nome: titularNome,
        telefone: titularWhats,
        email: titularEmail,
        qtd_vagas: numParticipantes,
        embarcacao: resumoEmbarcacao,
        valor_total: valorTotal,
        metodo_pagamento: pagamentoEvento,
        data_evento: selectedEvento.data_raw || selectedEvento.data,
        horario_evento: selectedEvento.hora,
        titulo_evento: selectedEvento.titulo,
        nomes_acompanhantes: nomesAcompanhantes
      })

      if (!res.ok) {
        setLoading(false)
        return onError(res.error || 'Não foi possível concluir a inscrição no evento.')
      }

      const novoAgendamento = res.agendamento || {
        id: `evento-${Date.now()}`,
        data_reserva: selectedEvento.data,
        horario_reserva: selectedEvento.hora,
        titulo_evento: selectedEvento.titulo,
        nomes_acompanhantes: nomesAcompanhantes,
        is_evento: true,
        vagas: numParticipantes,
        status: 'confirmado',
        caiaque_nome: resumoEmbarcacao,
        preco: valorTotal,
        metodo_pagamento: pagamentoEvento,
        observacoes: `Evento: ${selectedEvento.titulo} · Voucher: ${res.voucher} · Barcos: ${resumoEmbarcacao}`
      }

      if (onEventoAgendado) {
        onEventoAgendado(novoAgendamento)
      }
      setModalCheckout(false)
      setSuccessMsg({ 
        msg: `Inscrição confirmada com sucesso! Seu voucher é ${res.voucher}. Embarcações: ${resumoEmbarcacao}.`, 
        action: onBack 
      })
    } catch (err: any) {
      onError(err.message || 'Erro ao processar inscrição.')
    } finally {
      setLoading(false)
    }
  }

  const handleAssinarClube = async (e: React.FormEvent) => {
    e.preventDefault()
    // Se logado, usar dados do alunoData; se não logado, exigir nome/whats/senha
    const nomeEnvio = isLoggedIn ? (alunoData?.nome || nome) : nome
    const whatsEnvio = isLoggedIn ? (alunoData?.telefone || whats) : whats
    
    if (!isLoggedIn) {
      if (!nomeEnvio || !whatsEnvio || !senha) return onError('Preencha todos os campos obrigatórios.')
      if (!senhaForte) return onError('A senha deve ter no mínimo 8 caracteres, com pelo menos 1 maiúscula e 1 número.')
    }
    
    setLoading(true)
    // Verificar se mensalista contratando guardaria no mesmo dia (combo R$300)
    const tipoPlanoEnvio = (false && modalClube === 'guardaria') ? 'combo_mensalista_guardaria' : modalClube!
    
    const res = await assinarClube({
      nome: nomeEnvio,
      telefone: whatsEnvio,
      senha: isLoggedIn ? undefined : senha, // backend must allow undefined pass when logged in or handle it
      tipo_plano: tipoPlanoEnvio,
      dia_vencimento: vencimento,
      metodo_pagamento: metodoPagamento,
      tipo_embarcacao: modalClube === 'guardaria' ? tipoEmbarcacao : undefined,
      marca_modelo: modalClube === 'guardaria' ? marcaModelo : undefined,
      cor_embarcacao: modalClube === 'guardaria' ? cor : undefined
    })

    if (res.ok) {
      setModalClube(null)
      setSuccessMsg({ msg: 'Plano assinado com sucesso!', action: () => window.location.reload() })
    } else {
      onError(res.error || 'Erro ao realizar assinatura.')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-up">

      {/* 1. SE FOR AVULSO / NOVO CLIENTE (OU NÃO LOGADO): EXIBE AMBOS OS CLUBES */}
      {isAvulsoOuNovo && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 mb-2">
            NOSSOS CLUBES
          </h3>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            
            {/* CARD CLUBE MENSALISTA */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-5 rounded-[2.2rem] shadow-xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-3.5 hover:shadow-2xl transition-all">
              <div className="space-y-2.5">
                <div className="flex justify-between items-start gap-1.5">
                  <h4 className="text-[11px] sm:text-[13px] font-black uppercase text-slate-800 dark:text-white leading-tight">
                    Clube<br />Mensalista
                  </h4>
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap border border-slate-200/60 dark:border-slate-700">
                    R$ {precos.mensalista}/mês
                  </span>
                </div>
                
                {/* Tópicos com Checkmarks */}
                <div className="space-y-1.5 py-0.5">
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>2 remadas semanais livres</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>Equipamento completo incluso</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>Armário para pertences no local</span>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setModalClube('mensalista')
                  setNome(alunoData?.nome || '')
                  setWhats(alunoData?.telefone || '')
                  setSenha('')
                }}
                className="w-full py-3 bg-gradient-to-r from-[#0284c7] to-[#034480] text-white font-black rounded-xl text-[10px] sm:text-[11px] uppercase tracking-wider shadow-md hover:opacity-95 active:scale-95 transition cursor-pointer"
              >
                Assinar Clube Mensalista
              </button>
            </div>

            {/* CARD CLUBE GUARDARIA */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-5 rounded-[2.2rem] shadow-xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-3.5 hover:shadow-2xl transition-all">
              <div className="space-y-2.5">
                <div className="flex justify-between items-start gap-1.5">
                  <h4 className="text-[11px] sm:text-[13px] font-black uppercase text-slate-800 dark:text-white leading-tight">
                    Clube<br />Guardaria
                  </h4>
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap border border-slate-200/60 dark:border-slate-700">
                    R$ {precos.guardaria}/mês
                  </span>
                </div>
                
                {/* Tópicos com Checkmarks */}
                <div className="space-y-1.5 py-0.5">
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>Vaga para sua embarcação na areia</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>Apoio na entrada e saída do mar</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>Ducha de água doce após o treino</span>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setModalClube('guardaria')
                  setNome(alunoData?.nome || '')
                  setWhats(alunoData?.telefone || '')
                  setSenha('')
                }}
                className="w-full py-3 bg-gradient-to-r from-[#0284c7] to-[#034480] text-white font-black rounded-xl text-[10px] sm:text-[11px] uppercase tracking-wider shadow-md hover:opacity-95 active:scale-95 transition cursor-pointer"
              >
                Assinar Clube Guardaria
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. SE FOR MENSALISTA: MOSTRA SOMENTE GUARDARIA SEM OPÇÃO DE DISPENSAR */}
      {isMensalista && (
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              CLUBE GUARDARIA
            </h3>
          </div>

          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-5 rounded-[2.2rem] shadow-xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-3.5 hover:shadow-2xl transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-xs sm:text-sm font-black uppercase text-slate-800 dark:text-white leading-tight">
                  Guarda para seu Caiaque ou Prancha
                </h4>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full whitespace-nowrap border border-slate-200/60 dark:border-slate-700">
                  R$ {precos.guardaria}/mês
                </span>
              </div>
              
              <div className="space-y-1.5 py-0.5">
                <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>Vaga na areia com apoio de praia e ducha</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>Válido para caiaque, surfski, canoa ou SUP</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>Suas remadas semanais continuam ativas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button 
                type="button"
                onClick={() => {
                  setModalClube('guardaria')
                  setNome(alunoData?.nome || '')
                  setWhats(alunoData?.telefone || '')
                  setSenha('')
                }}
                className="w-full py-3 bg-gradient-to-r from-[#0284c7] to-[#034480] text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow-md hover:opacity-95 active:scale-95 transition cursor-pointer"
              >
                Assinar Clube Guardaria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SE JÁ TEM GUARDARIA: NÃO EXIBE NENHUM CLUBE (SEGUE DIRETO PARA OS EVENTOS) */}

      {/* SEÇÃO EVENTOS OFICIAIS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1 mb-2 mt-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            PRÓXIMOS EVENTOS
          </h3>
          <span className="text-[9.5px] font-bold text-slate-400">
            {eventos.length} disponíveis
          </span>
        </div>

        {/* SKELETON LOADING */}
        {loadingEventos && (
          <div className="space-y-4">
            {[1, 2].map(n => (
              <div key={n} className="bg-white/60 dark:bg-slate-900/60 rounded-[2.2rem] p-4 border border-slate-200/60 dark:border-slate-800 animate-pulse space-y-3">
                <div className="w-full aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loadingEventos && eventos.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] shadow-sm border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-3 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white">
                Nenhum evento programado no momento
              </h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                As próximas datas de remadas em grupo e expedições serão publicadas diretamente aqui assim que forem abertas.
              </p>
            </div>
          </div>
        )}

        {/* LISTA DE EVENTOS REAIS */}
        {!loadingEventos && eventos.length > 0 && (
          <div className="space-y-4">
            {eventos.map(ev => (
              <div key={ev.id} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.2rem] shadow-xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <img src={ev.foto} alt={ev.titulo} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase shadow-md flex items-center gap-1.5 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {ev.vagas_restantes} vagas restantes
                  </div>
                </div>
                <div className="px-1.5 pb-1 space-y-3">
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-tight leading-tight">
                      {ev.titulo}
                    </h4>
                    <p className="text-xs font-black text-[#0284c7] dark:text-sky-400 mt-1">
                      {ev.data} · {ev.hora}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ev.itens.slice(0, 3).map((it: string, idx: number) => (
                      <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase border border-slate-200/80 dark:border-slate-700 flex items-center gap-1">
                        <span className="text-[#0284c7] font-bold">✓</span> {it}
                      </span>
                    ))}
                  </div>
                  <div className="text-center py-2.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900/40">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Valor da Inscrição</span>
                    <span className="text-xl font-black text-[#0284c7] tracking-tight leading-none mt-0.5 block">R$ {ev.preco},00</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button 
                      onClick={() => setModalInfoEvento(ev)}
                      className="py-2.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-black rounded-xl text-[10px] uppercase tracking-wider border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Compass className="w-3.5 h-3.5" /> Ver Detalhes
                    </button>
                    <button 
                      onClick={() => handleAbrirCheckout(ev)}
                      className="py-2.5 px-2 bg-gradient-to-r from-[#0284c7] to-[#034480] shadow-sky-600/25 hover:brightness-105 text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      Garantir Vaga ➔
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL SUCESSO */}
      {successMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 backdrop-blur-xl p-6 rounded-[2.2rem] shadow-2xl w-full max-w-sm border border-emerald-100 dark:border-emerald-900/50 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-black uppercase text-emerald-600 dark:text-emerald-400">Sucesso!</h3>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{successMsg.msg}</p>
            <button onClick={successMsg.action} className="w-full py-3 bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-wider text-xs">
              OK
            </button>
          </div>
        </div>
      )}

      {/* MODAL ADESÃO CLUBE REFINADO (MENSALISTA E GUARDARIA) */}
      {modalClube && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setModalClube(null)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 backdrop-blur-xl rounded-t-[2.5rem] rounded-b-none shadow-2xl w-full max-w-lg border-t border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-slide-up"
          >
            {/* Puxador de Bottom Sheet */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>
            
            {/* TOPO DO MODAL */}
            {modalClube === 'mensalista' ? (
              <div className="px-5 py-4 border-b flex items-center justify-between shrink-0 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/30 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900 border-sky-100 dark:border-sky-900/30">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-[#0284c7]"></span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Assinar Clube Mensalista
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setModalClube(null)} 
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-[#034480] dark:text-sky-400 border border-sky-200 dark:border-sky-800 mb-1">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                    GUARDARIA COSTEIRA
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white leading-none">
                    Assinatura de Guardaria
                  </h3>
                  <p className="text-[9.5px] font-semibold text-slate-400 mt-0.5">Canto do Forte · Praia Grande</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setModalClube(null)} 
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
            
            <form onSubmit={handleAssinarClube} className="overflow-y-auto no-scrollbar p-5 space-y-4">
              
              {/* BENEFÍCIOS GUARDARIA (SE FOR GUARDARIA) */}
              {modalClube === 'guardaria' && (
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                  <span><strong className="text-emerald-500">✓</strong> Vaga coberta e protegida</span>
                  <span><strong className="text-emerald-500">✓</strong> Ducha de água doce & apoio</span>
                  <span><strong className="text-emerald-500">✓</strong> Acesso livre todos os dias</span>
                </div>
              )}

              {/* 1. SE LOGADO: IDENTIFICAÇÃO DO ALUNO (ZERO DIGITAÇÃO) */}
              {isLoggedIn ? (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#034480] text-white flex items-center justify-center shadow-sm shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block leading-none">
                        ✓ Aluno Identificado
                      </span>
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                        {alunoData?.nome || 'Aluno Remoterapia'}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 leading-none">
                        {alunoData?.telefone || ''}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border shrink-0 bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] border-sky-200 dark:border-sky-900/40`}>
                    Conta Ativa
                  </span>
                </div>
              ) : (
                /* SE NÃO LOGADO: CADASTRO RÁPIDO */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Nome Completo</label>
                    <input 
                      type="text" 
                      required 
                      value={nome} 
                      onChange={e => setNome(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-[#1D70B8] transition" 
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">WhatsApp</label>
                    <input 
                      type="tel" 
                      required 
                      value={whats} 
                      onChange={e => setWhats(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-[#1D70B8] transition" 
                      placeholder="(13) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Criar Senha</label>
                    <div className="relative">
                      <input 
                        type={mostrarSenha ? "text" : "password"} 
                        required 
                        value={senha} 
                        onChange={e => setSenha(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-[#1D70B8] transition" 
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button 
                        type="button" 
                        onClick={() => setMostrarSenha(!mostrarSenha)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SELETOR MODERNO DE CATEGORIA DE EMBARCAÇÃO E IDENTIFICAÇÃO (SE FOR GUARDARIA) */}
              {modalClube === 'guardaria' && (
                <>
                  {/* SELETOR MODERNO DE CATEGORIA DE EMBARCAÇÃO */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Tipo de Embarcação</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Caiaque Solo', 'Caiaque Duplo', 'Stand Up (SUP)', 'Surfski', 'Canoa OC1', 'Outro'].map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setTipoEmbarcacao(tipo)}
                          className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer text-center ${
                            tipoEmbarcacao === tipo
                              ? 'bg-[#0284c7] text-white shadow-md shadow-sky-600/30'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IDENTIFICAÇÃO DA EMBARCAÇÃO */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[9px] font-black uppercase text-[#0284c7] dark:text-sky-400 block">Identificação do Equipamento</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Marca / Modelo</label>
                        <input 
                          type="text" 
                          value={marcaModelo} 
                          onChange={e => setMarcaModelo(e.target.value)} 
                          placeholder="Ex: Brudden Eclipse" 
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Cor Predominante</label>
                        <input 
                          type="text" 
                          value={cor} 
                          onChange={e => setCor(e.target.value)} 
                          placeholder="Ex: Azul e Branco" 
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 3. DIA DO VENCIMENTO (GRADE 4 COLUNAS EXECUTIVA) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Dia de Vencimento</label>
                  <span className="text-[8.5px] font-bold text-slate-400">Ciclo mensal</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 20].map(dia => (
                    <button 
                      key={dia} 
                      type="button" 
                      onClick={() => setVencimento(dia)} 
                      className={`py-2.5 rounded-xl text-xs font-black uppercase transition-all flex flex-col items-center justify-center cursor-pointer ${
                        vencimento === dia 
                          ? 'border-2 border-[#1D70B8] bg-[#1D70B8] text-white shadow-md' 
                          : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`text-[7.5px] font-black uppercase leading-none ${vencimento === dia ? 'opacity-80' : 'text-slate-400'}`}>DIA</span>
                      <span className="text-sm font-black leading-none mt-0.5">{String(dia).padStart(2, '0')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. FORMA DE PAGAMENTO (CARDS EXECUTIVOS PREPARADOS PARA GATEWAY) */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  
                  {/* PIX MENSAL */}
                  <div 
                    onClick={() => setMetodoPagamento('pix')}
                    className={`p-2.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                      metodoPagamento === 'pix' 
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        metodoPagamento === 'pix' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        ❖
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white leading-tight">Pix Mensal</p>
                        <p className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">QR Code / Copia</p>
                      </div>
                    </div>
                    {metodoPagamento === 'pix' && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                    )}
                  </div>

                  {/* CARTÃO DE CRÉDITO */}
                  <div 
                    onClick={() => setMetodoPagamento('cartao')}
                    className={`p-2.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                      metodoPagamento === 'cartao' 
                        ? 'border-[#1D70B8] bg-blue-50/70 dark:bg-blue-950/40 shadow-xs' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        metodoPagamento === 'cartao' ? 'bg-[#1D70B8] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        💳
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white leading-tight">Cartão Crédito</p>
                        <p className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">Recorrente</p>
                      </div>
                    </div>
                    {metodoPagamento === 'cartao' && (
                      <span className="w-4 h-4 rounded-full bg-[#1D70B8] text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                    )}
                  </div>

                </div>
              </div>
              
              {/* 5. RESUMO DE VALOR E BOTÃO DE CONFIRMAÇÃO */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">
                      {false && modalClube === 'guardaria' ? 'Mensalidade Unificada' : 'Mensalidade'}
                    </span>
                    <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400">
                      {false && modalClube === 'guardaria' 
                        ? 'Clube Mensalista + Guardaria' 
                        : modalClube === 'mensalista' 
                          ? '2 remadas por semana inclusas' 
                          : 'Guarda de prancha/caiaque + apoio e ducha'}
                    </span>
                  </div>
                  <div className="text-right">
                    {false && modalClube === 'guardaria' ? (
                      <div>
                        <span className="text-xl font-black text-[#1D70B8] leading-none">R$ 300<span className="text-xs">,00</span></span>
                        <span className="text-[8.5px] font-bold text-slate-400 block">/mês</span>
                      </div>
                    ) : (
                      <div>
                        <span className={`text-xl font-black leading-none ${modalClube === 'mensalista' ? 'text-[#0284c7]' : 'text-[#1D70B8]'}`}>
                          R$ {precoGuardaria}<span className="text-xs">,00</span>
                        </span>
                        <span className="text-[8.5px] font-bold text-slate-400 block">/mês</span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3.5 bg-gradient-to-r from-[#0284c7] to-[#034480] shadow-sky-600/25 text-white font-black rounded-xl uppercase tracking-wider text-xs shadow-md hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <span>Processando...</span>
                  ) : (
                    <>
                      <span>{modalClube === 'mensalista' ? 'Iniciar Assinatura' : 'Confirmar Vaga Guardaria'}</span>
                      <span>➔</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">
                  🔒 Transação Segura · Cancele a qualquer momento
                </p>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES EVENTO (COMPLETO) */}
      {/* MODAL BRIEFING DA EXPEDIÇÃO */}
      {modalInfoEvento && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setModalInfoEvento(null)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] rounded-b-none shadow-2xl w-full max-w-lg border-t border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
          >
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 border border-sky-200 dark:border-sky-800 mb-1">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                  </svg>
                  EVENTO ESPECIAL
                </span>
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white leading-none">
                  {modalInfoEvento.titulo}
                </h3>
                <p className="text-[9.5px] font-semibold text-slate-400 mt-0.5">Canto do Forte · Praia Grande</p>
              </div>
              <button onClick={() => setModalInfoEvento(null)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white font-bold flex items-center justify-center text-xs">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] w-full bg-slate-900">
                <img src={modalInfoEvento.foto} alt="Evento" className="w-full h-full object-cover"/>
                <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-[9px] font-black uppercase border border-white/20">
                  {modalInfoEvento.vagas_restantes} vagas restantes
                </div>
              </div>

              {/* 3 CARDS TÉCNICOS */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[7.5px] font-bold uppercase text-slate-400 block">Ponto de Saída</span>
                  <span className="text-[10px] font-black text-slate-800 dark:text-white mt-0.5 block">{modalInfoEvento.ponto_saida || 'Canto do Forte'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[7.5px] font-bold uppercase text-slate-400 block">Tempo Estimado</span>
                  <span className="text-[10px] font-black text-slate-800 dark:text-white mt-0.5 block">{modalInfoEvento.duracao || '2h30 Total'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[7.5px] font-bold uppercase text-slate-400 block">Nível</span>
                  <span className="text-[10px] font-black text-slate-800 dark:text-white mt-0.5 block">{modalInfoEvento.nivel || 'Iniciante'}</span>
                </div>
              </div>

              {/* PROGRAMAÇÃO DA SAÍDA */}
              <div className="space-y-1.5">
                <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Programação da Saída</span>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {modalInfoEvento.roteiro}
                </div>
              </div>

              {/* SERVIÇOS E EQUIPAMENTOS HOMOLOGADOS */}
              <div className="space-y-1.5">
                <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Serviços e Equipamentos Inclusos</span>
                <div className="space-y-1">
                  {modalInfoEvento.itens?.map((it: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <span className="text-[8px] font-black uppercase text-slate-400 block">Valor da Inscrição</span>
                <span className="text-base font-black text-[#0284c7] dark:text-sky-400">R$ {modalInfoEvento.preco},00</span>
              </div>
              <button 
                onClick={() => { setModalInfoEvento(null); handleAbrirCheckout(modalInfoEvento); }} 
                className="px-5 py-3 bg-gradient-to-r from-[#0284c7] to-[#034480] text-white text-xs font-black rounded-xl uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer"
              >
                Garantir Minha Vaga ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT DO EVENTO (COMPRA E ALOCAÇÃO DE EMBARCAÇÕES) */}
      {modalCheckout && selectedEvento && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setModalCheckout(false)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 backdrop-blur-xl rounded-t-[2.5rem] rounded-b-none shadow-2xl w-full max-w-lg border-t border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-slide-up"
          >
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>
            
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/30 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border-b border-blue-100 dark:border-blue-900/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1D70B8] animate-pulse"></span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Inscrição no Evento
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setModalCheckout(false)} 
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold flex items-center justify-center text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarReservaEvento} className="overflow-y-auto no-scrollbar p-5 space-y-3.5">
              
              {/* Mini Banner do Evento */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-2.5 flex items-center gap-3">
                <div className="w-16 h-13 rounded-xl overflow-hidden shrink-0 relative bg-slate-200 dark:bg-slate-700">
                  <img src={selectedEvento.foto} alt="Evento" className="w-full h-full object-cover"/>
                  <span className="absolute bottom-1 right-1 bg-black/75 text-[7px] font-black text-white px-1.5 py-0.5 rounded-sm">
                    {selectedEvento.vagas_restantes} vagas
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[8px] font-black text-[#0284c7] uppercase tracking-wider block leading-none">
                    {selectedEvento.data} · {selectedEvento.hora}
                  </span>
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white truncate mt-1 leading-tight">
                    {selectedEvento.titulo}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                    R$ {selectedEvento.preco},00 por participante
                  </span>
                </div>
              </div>

              {/* Identificação do Aluno */}
              {isLoggedIn ? (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1D70B8] to-cyan-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block leading-none">
                        Aluno
                      </span>
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                        {alunoData?.nome || 'Aluno Remoterapia'}
                      </p>
                      <p className="text-[8.5px] font-bold text-slate-400 leading-none">
                        {alunoData?.telefone || ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                    Conta Ativa
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Nome Completo</label>
                    <input 
                      type="text" 
                      required 
                      value={nome} 
                      onChange={e => setNome(e.target.value)} 
                      placeholder="Seu nome completo" 
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-[#1D70B8]"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">WhatsApp</label>
                    <input 
                      type="tel" 
                      required 
                      value={whats} 
                      onChange={e => setWhats(e.target.value)} 
                      placeholder="(13) 99999-9999" 
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-[#1D70B8]"
                    />
                  </div>
                </div>
              )}

              {/* Quantidade de Participantes */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Quantidade de Participantes</label>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block leading-tight">Número de pessoas:</span>
                    <span className="text-[8px] font-semibold text-slate-400">R$ {selectedEvento.preco},00 por pessoa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setNumParticipantes(Math.max(1, numParticipantes - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-[#1D70B8] dark:text-cyan-400 w-6 text-center">
                      {numParticipantes}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setNumParticipantes(numParticipantes + 1)}
                      className="w-7 h-7 rounded-lg bg-[#1D70B8] text-white font-black text-xs hover:bg-blue-700 flex items-center justify-center shadow-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Alocação de Embarcações ou Logística de Viagem */}
              {isEventoComCaiaque(selectedEvento) ? (
                <>
                  {numParticipantes === 1 ? (
                    /* 1 PESSOA: DROPDOWN DIRETO DE CAIAQUE SOLO */
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Embarcação Vinculada</label>
                        <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400">Frota Homologada</span>
                      </div>
                      <div className="relative">
                        <select 
                          value={caiaqueSolo1Id}
                          onChange={e => setCaiaqueSolo1Id(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer appearance-none pr-8"
                        >
                          {CAIAQUES_BASE.solos.map(c => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                      </div>
                    </div>
                  ) : numParticipantes === 2 ? (
                    /* 2 PESSOAS: OPÇÃO DE 1 DUPLO OU 2 SOLOS */
                    <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 dark:from-slate-800/60 dark:to-slate-900/60 rounded-2xl p-3 border border-blue-200/80 dark:border-slate-700 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black uppercase tracking-wider text-[#1D70B8] dark:text-cyan-400">Distribuição das Embarcações</label>
                        <span className="text-[8px] font-bold text-slate-400">2 Participantes</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button 
                          type="button" 
                          onClick={() => setDistribuicaoEmbarcacao('duplo')}
                          className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${
                            distribuicaoEmbarcacao === 'duplo' 
                              ? 'bg-[#1D70B8] text-white shadow-xs' 
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                          }`}
                        >
                          1 Caiaque Duplo
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setDistribuicaoEmbarcacao('solos')}
                          className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${
                            distribuicaoEmbarcacao === 'solos' 
                              ? 'bg-[#1D70B8] text-white shadow-xs' 
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                          }`}
                        >
                          Caiaques Solos
                        </button>
                      </div>

                      {distribuicaoEmbarcacao === 'duplo' ? (
                        <div className="space-y-1 pt-1 border-t border-blue-100 dark:border-slate-700">
                          <label className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Selecione o Caiaque Duplo</label>
                          <div className="relative">
                            <select 
                              value={caiaqueDuploId}
                              onChange={e => setCaiaqueDuploId(e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none appearance-none pr-8 cursor-pointer"
                            >
                              {CAIAQUES_BASE.duplos.map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1 border-t border-blue-100 dark:border-slate-700">
                          <div className="space-y-0.5">
                            <label className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-300">Pessoa 1 (Titular)</label>
                            <div className="relative">
                              <select 
                                value={caiaqueSolo1Id}
                                onChange={e => setCaiaqueSolo1Id(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none appearance-none pr-8 cursor-pointer"
                              >
                                {CAIAQUES_BASE.solos.map(c => (
                                  <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-300">Pessoa 2 (Acompanhante)</label>
                            <div className="relative">
                              <select 
                                value={caiaqueSolo2Id}
                                onChange={e => setCaiaqueSolo2Id(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none appearance-none pr-8 cursor-pointer"
                              >
                                {CAIAQUES_BASE.solos.map(c => (
                                  <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 3+ PESSOAS */
                    <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-center">
                      <span className="text-[9px] font-bold text-[#1D70B8] dark:text-cyan-400">
                        ✓ {numParticipantes} vagas reservadas na base · Embarcações alocadas pela equipe de praia
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700">
                  <span className="text-[9px] font-black uppercase text-[#0284c7] dark:text-sky-400 block mb-0.5">
                    Transporte & Logística Inclusos
                  </span>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-snug">
                    Este evento é uma vivência/viagem completa. A logística de embarque coletivo ou transporte já faz parte da sua vaga.
                  </p>
                </div>
              )}

              {/* Forma de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    onClick={() => setPagamentoEvento('pix')}
                    className={`p-2.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                      pagamentoEvento === 'pix' 
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        pagamentoEvento === 'pix' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        ❖
                      </div>
                      <div>
                        <p className="text-[9.5px] font-black uppercase text-slate-900 dark:text-white leading-tight">Pix Instantâneo</p>
                        <p className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">QR Code / Copia</p>
                      </div>
                    </div>
                    {pagamentoEvento === 'pix' && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                    )}
                  </div>

                  <div 
                    onClick={() => setPagamentoEvento('cartao')}
                    className={`p-2.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                      pagamentoEvento === 'cartao' 
                        ? 'border-[#1D70B8] bg-blue-50/70 dark:bg-blue-950/40 shadow-xs' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        pagamentoEvento === 'cartao' ? 'bg-[#1D70B8] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        💳
                      </div>
                      <div>
                        <p className="text-[9.5px] font-black uppercase text-slate-900 dark:text-white leading-tight">Cartão Crédito</p>
                        <p className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">Até 2x sem juros</p>
                      </div>
                    </div>
                    {pagamentoEvento === 'cartao' && (
                      <span className="w-4 h-4 rounded-full bg-[#1D70B8] text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Total a Pagar & Botão Final */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Total a Pagar</span>
                    <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400">
                      {numParticipantes} {numParticipantes === 1 ? 'participante' : 'participantes'} (R$ {selectedEvento.preco} cada)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#0284c7] leading-none">
                      R$ {selectedEvento.preco * numParticipantes}<span className="text-xs">,00</span>
                    </span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-gradient-to-r from-[#1D70B8] to-cyan-600 hover:opacity-95 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Pagar e Garantir {numParticipantes === 1 ? 'Minha Vaga' : 'Vagas'}</span>
                  <span>➔</span>
                </button>
                
                <p className="text-center text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">
                  🔒 Embarcações vinculadas diretamente ao mapa de saída da equipe
                </p>
              </div>

            </form>
          </div>
        </div>
      )}
</div>
  )
}
