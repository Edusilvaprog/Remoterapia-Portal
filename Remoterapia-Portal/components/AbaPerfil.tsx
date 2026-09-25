'use client'

import React, { useState, useEffect } from 'react'
import { 
  Lock, 
  MessageCircle, 
  Smartphone, 
  LogOut, 
  ChevronRight, 
  Camera,
  Compass,
  Clock,
  ShieldCheck,
  Calendar
} from 'lucide-react'

interface AlunoData {
  id?: string | number
  nome?: string
  telefone?: string
  tipo_plano?: string
  dia_vencimento?: number | string
  foto_url?: string
  tipo_embarcacao?: string
  modelo_embarcacao?: string
  cor_embarcacao?: string
  status?: string
  [key: string]: any
}

interface AbaPerfilProps {
  alunoData: AlunoData | null
  agendamentos?: any[]
  onAbrirTrocarSenha: () => void
  onInstalarApp: () => void
  onLogout: () => void
  onTrocarFoto?: () => void
  onIrParaEventos?: () => void
}

export default function AbaPerfil({
  alunoData,
  agendamentos = [],
  onAbrirTrocarSenha,
  onInstalarApp,
  onLogout,
  onTrocarFoto,
  onIrParaEventos
}: AbaPerfilProps) {
  const [modalAssinatura, setModalAssinatura] = useState(false)
  const [modalMeusEventos, setModalMeusEventos] = useState(false)
  const [modalRoteiro, setModalRoteiro] = useState<any>(null)
  const [isAtendimentoOnline, setIsAtendimentoOnline] = useState(true)
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)
  const [cancelamentoAgendado, setCancelamentoAgendado] = useState(false)

  // 1. Verificação de Horário Comercial de Atendimento (Terça a Domingo das 06:00 às 18:00)
  useEffect(() => {
    const verificarHorario = () => {
      const now = new Date()
      const diaSemana = now.getDay() // 0 = Domingo, 1 = Segunda (fechado)
      const hora = now.getHours()
      const online = (diaSemana !== 1) && (hora >= 6 && hora < 18)
      setIsAtendimentoOnline(online)
    }

    verificarHorario()
    const timer = setInterval(verificarHorario, 60000)
    return () => clearInterval(timer)
  }, [])

  // 2. Classificação precisa dos Perfis
  const plano = (alunoData?.tipo_plano || '').toLowerCase()
  const temGuardaria = plano.includes('guardaria')
  const isMensalista = plano.includes('mensalista')
  const isCombo = temGuardaria && isMensalista
  const isApenasGuardaria = temGuardaria && !isMensalista
  const isApenasMensalista = isMensalista && !temGuardaria
  const isAluno = !temGuardaria && !isMensalista

  const diaVenc = alunoData?.dia_vencimento 
    ? String(alunoData.dia_vencimento).padStart(2, '0') 
    : '05'

  // Monograma de Iniciais
  const nomeAluno = alunoData?.nome || 'Aluno Remoterapia'
  const partesNome = nomeAluno.trim().split(' ')
  const iniciais = partesNome.length >= 2 
    ? `${partesNome[0][0]}${partesNome[partesNome.length - 1][0]}`.toUpperCase()
    : nomeAluno.slice(0, 2).toUpperCase()

  // Eventos em que o aluno está inscrito
  const eventosInscritos = agendamentos.filter((a: any) => a.is_evento || a.titulo_evento)

  // Links oficiais de WhatsApp
  const suporteWhatsappUrl = `https://wa.me/5513997421804?text=${encodeURIComponent(
    `Olá! Sou o aluno ${nomeAluno} (ID #${alunoData?.id || ''}) e preciso de suporte com minha conta.`
  )}`

  const cancelarAssinaturaWhatsappUrl = `https://wa.me/5513997421804?text=${encodeURIComponent(
    `Olá! Sou o aluno ${nomeAluno} e gostaria de atendimento referente à minha assinatura/plano.`
  )}`

  const matricula = alunoData?.id 
    ? (typeof alunoData.id === 'string' && alunoData.id.length > 8
        ? `#REM-${alunoData.id.slice(-4).toUpperCase()}`
        : `#REM-${String(alunoData.id).padStart(4, '0')}`)
    : '#REM-0001'

  const formatarTelefone = (tel?: string) => {
    if (!tel) return 'Telefone não cadastrado'
    const limpo = tel.replace(/\D/g, '')
    if (limpo.length === 11) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`
    }
    if (limpo.length === 10) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`
    }
    return tel
  }

  // Status financeiro
  const statusPagamento = (alunoData?.status_pagamento || 'ativo').toLowerCase()
  const isPendente = statusPagamento === 'pendente' || statusPagamento === 'vencido'
  const isCancelado = alunoData?.status === 'bloqueado' || alunoData?.status === 'inativo' || statusPagamento === 'cancelado'

  const rotuloClassificacao = isApenasMensalista 
    ? 'Mensalista' 
    : isApenasGuardaria 
    ? 'Guardaria' 
    : isCombo
    ? 'Mensalista & Guardaria'
    : 'Cliente'

  return (
    <div className="space-y-3 animate-fade-in pb-2">
      
      {/* 1. CARD PRINCIPAL BRANCO: IDENTIFICAÇÃO DO ALUNO */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3.5">
          
          {/* FOTO OU MONOGRAMA COM BOTÃO DE CÂMERA INTEGRADO */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#034480] p-0.5 shadow-md flex items-center justify-center">
              {alunoData?.foto_url ? (
                <img 
                  src={alunoData.foto_url} 
                  alt={nomeAluno} 
                  className="w-full h-full object-cover rounded-[0.9rem]"
                />
              ) : (
                <div className="w-full h-full bg-[#034480] text-white flex items-center justify-center rounded-[0.9rem] font-black text-base tracking-wider">
                  {iniciais}
                </div>
              )}
            </div>

            <button 
              type="button" 
              onClick={onTrocarFoto}
              title="Alterar Foto de Perfil"
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0284c7] hover:bg-[#034480] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 transition active:scale-95 cursor-pointer"
            >
              <Camera className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* DADOS CADASTRAIS (CLASSIFICAÇÃO, MATRÍCULA E TELEFONE COM MÁSCARA) */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-400 border border-sky-200 dark:border-sky-800 tracking-wider">
                {rotuloClassificacao}
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">
                {matricula}
              </span>
            </div>
            
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate mt-1">
              {nomeAluno}
            </h2>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              {formatarTelefone(alunoData?.telefone)}
            </p>
          </div>
        </div>

        {/* 2. ÁREA DE SERVIÇO / PLANOS */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          
          {/* CASO A: CLIENTE (SEM ASSINATURA) */}
          {isAluno && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                  Clubes Remoterapia
                </p>
                <p className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Conheça os planos Mensalista e Guardaria.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalAssinatura(true)}
                className="px-3 py-2 bg-[#034480] hover:bg-[#0284c7] text-white text-[9.5px] font-black uppercase rounded-xl shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
              >
                Conhecer ➔
              </button>
            </div>
          )}

          {/* CASO B: MENSALISTA */}
          {isApenasMensalista && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3 h-3 text-[#0284c7]" />
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Plano</span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">Clube Mensalista</p>
                  <p className="text-[9.5px] font-semibold text-[#0284c7] dark:text-sky-400 mt-0.5">2 remadas por semana</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Vencimento</span>
                  </div>
                  <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 leading-none ${
                    isCancelado
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      : isPendente
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    {isCancelado ? 'Cancelado' : isPendente ? 'Pendente' : 'Em dia'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">Dia {diaVenc}</p>
                  <p className="text-[9.5px] font-semibold text-slate-400 mt-0.5">Mensal</p>
                </div>
              </div>
            </div>
          )}

          {/* CASO C: GUARDARIA */}
          {isApenasGuardaria && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3 h-3 text-[#0284c7]" />
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Plano</span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">Guardaria</p>
                  <p className="text-[9.5px] font-semibold text-[#0284c7] dark:text-sky-400 mt-0.5">
                    {alunoData?.tipo_embarcacao || 'Caiaque'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Vencimento</span>
                  </div>
                  <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 leading-none ${
                    isCancelado
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      : isPendente
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    {isCancelado ? 'Cancelado' : isPendente ? 'Pendente' : 'Em dia'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">Dia {diaVenc}</p>
                  <p className="text-[9.5px] font-semibold text-slate-400 mt-0.5">Mensal</p>
                </div>
              </div>
            </div>
          )}

          {/* CASO D: COMBO (MENSALISTA + GUARDARIA) */}
          {isCombo && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3 h-3 text-[#0284c7]" />
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Plano</span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">Mensalista & Guardaria</p>
                  <p className="text-[9.5px] font-semibold text-[#0284c7] dark:text-sky-400 mt-0.5">2 remadas + {alunoData?.tipo_embarcacao || 'Caiaque'}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Vencimento</span>
                  </div>
                  <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 leading-none ${
                    isCancelado
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      : isPendente
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    {isCancelado ? 'Cancelado' : isPendente ? 'Pendente' : 'Em dia'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">Dia {diaVenc}</p>
                  <p className="text-[9.5px] font-semibold text-slate-400 mt-0.5">Mensal</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3. LISTA DE AÇÕES INSTITUCIONAIS UNIFICADAS (SEM FAIXAS LATERAIS) */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        
        {/* AÇÃO 1: MINHA ASSINATURA */}
        <button 
          type="button" 
          onClick={() => setModalAssinatura(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[#034480] dark:text-sky-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white block leading-tight">
                Minha Assinatura
              </span>
              <span className="text-[9.5px] font-medium text-slate-400">
                Plano atual e mensalidade
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* AÇÃO 2: MEUS EVENTOS */}
        <button 
          type="button" 
          onClick={() => setModalMeusEventos(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[#034480] dark:text-sky-400 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white block leading-tight">
                Meus Eventos
              </span>
              <span className="text-[9.5px] font-medium text-slate-400">
                Inscrições confirmadas e roteiros
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* AÇÃO 3: MUDAR SENHA DE ACESSO */}
        <button 
          type="button" 
          onClick={onAbrirTrocarSenha}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white block leading-tight">
                Mudar Senha
              </span>
              <span className="text-[9.5px] font-medium text-slate-400">
                Atualizar senha da conta
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* AÇÃO 4: SUPORTE (COM STATUS REAL ONLINE/OFFLINE) */}
        <a 
          href={suporteWhatsappUrl}
          target="_blank" 
          rel="noreferrer"
          className="w-full flex items-center justify-between p-3.5 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 active:scale-[0.99] transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50 shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white leading-tight">
                  Suporte
                </span>
                <span className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  isAtendimentoOnline
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}>
                  {isAtendimentoOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <span className="text-[9.5px] font-medium text-slate-400">
                Atendimento via WhatsApp
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
        </a>

        {/* AÇÃO 5: INSTALAR APLICATIVO NO CELULAR (PWA) */}
        <button 
          type="button" 
          onClick={onInstalarApp}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[#0284c7] flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white block leading-tight">
                Instalar Aplicativo
              </span>
              <span className="text-[9.5px] font-medium text-slate-400">
                Adicionar atalho na tela inicial
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* AÇÃO 6: ENCERRAR SESSÃO */}
        <button 
          type="button" 
          onClick={onLogout}
          className="w-full flex items-center justify-between p-3.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-[0.99] transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center border border-rose-100 dark:border-rose-900/40 shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-500 block leading-tight">
                Encerrar Sessão
              </span>
              <span className="text-[9.5px] font-medium text-rose-400">
                Sair da conta neste aparelho
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-300 dark:text-rose-600 shrink-0" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAIS EM FORMATO BOTTOM SHEET DESLIZANTES                             */}
      {/* ========================================================================= */}



      {/* MODAL 1: MINHA ASSINATURA */}
      {modalAssinatura && (
        <div 
          className="fixed inset-0 z-[100] flex items-start pt-16 justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setModalAssinatura(false)
            setConfirmandoCancelamento(false)
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-b shadow-2xl w-full max-w-md border-t border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden slide-down-enter"
          >
            {/* Puxador de Bottom Sheet */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-[#0284c7] border border-sky-200 dark:border-sky-800">
                  ASSINATURA
                </span>
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white mt-1">
                  {isAluno 
                    ? 'Clubes Remoterapia' 
                    : isCombo 
                      ? 'Mensalista + Guardaria' 
                      : isApenasGuardaria 
                        ? 'Clube Guardaria' 
                        : 'Clube Mensalista'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setModalAssinatura(false)
                  setConfirmandoCancelamento(false)
                }} 
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center justify-center text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto no-scrollbar space-y-3.5">
              
              {/* CASO 1: SEM ASSINATURA ATIVA (CLIENTE) */}
              {isAluno && (
                <>
                  {/* PLANO MENSALISTA */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <span className="text-[8.5px] font-black uppercase text-slate-400 block">Clubes Remoterapia</span>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">Clube Mensalista</h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                          2 remadas por semana com caiaque e colete inclusos.
                        </p>
                      </div>
                      <div className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900 shrink-0">
                        <span className="text-xs font-black text-[#034480] dark:text-sky-400">R$ 150</span>
                        <span className="text-[9px] font-bold text-slate-400">/mês</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setModalAssinatura(false)
                        onIrParaEventos?.()
                      }} 
                      className="w-full py-2.5 bg-[#034480] hover:bg-[#0284c7] text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
                    >
                      Assinar Clube Mensalista
                    </button>
                  </div>

                  {/* PLANO GUARDARIA */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <span className="text-[8.5px] font-black uppercase text-slate-400 block">Clubes Remoterapia</span>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">Clube Guardaria</h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Vaga na areia para seu caiaque ou prancha com apoio e ducha doce.
                        </p>
                      </div>
                      <div className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900 shrink-0">
                        <span className="text-xs font-black text-[#034480] dark:text-sky-400">R$ 150</span>
                        <span className="text-[9px] font-bold text-slate-400">/mês</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setModalAssinatura(false)
                        onIrParaEventos?.()
                      }} 
                      className="w-full py-2.5 bg-[#034480] hover:bg-[#0284c7] text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
                    >
                      Assinar Clube Guardaria
                    </button>
                  </div>
                </>
              )}

              {/* CASO 2: ASSINANTE ATIVO */}
              {!isAluno && (
                <>
                  {/* RESUMO DO PLANO */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                            {isCombo 
                              ? 'Mensalista + Guardaria' 
                              : isApenasGuardaria 
                                ? 'Clube Guardaria' 
                                : 'Clube Mensalista'}
                          </h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                            cancelamentoAgendado
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          }`}>
                            <span className="w-1 h-1 rounded-full bg-current"></span>
                            {cancelamentoAgendado ? `Encerra dia ${diaVenc}` : 'Ativo'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">
                          {isApenasGuardaria 
                            ? 'Vaga de caiaque na areia com apoio e ducha doce.'
                            : '2 remadas por semana com caiaque e colete inclusos.'}
                        </p>
                      </div>

                      <div className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900 shrink-0">
                        <span className="text-xs font-black text-[#034480] dark:text-sky-400">R$ 150</span>
                        <span className="text-[9px] font-bold text-slate-400">/mês</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 block">Vencimento</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">Dia {diaVenc}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 block">Situação</span>
                        <span className={`text-xs font-black ${cancelamentoAgendado ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {cancelamentoAgendado ? `Cancela dia ${diaVenc}` : 'Em dia'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ESTADO 1: BOTÃO PARA INICIAR CANCELAMENTO */}
                  {!confirmandoCancelamento && !cancelamentoAgendado && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-2">
                      <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider block">
                        Gerenciar Assinatura
                      </span>
                      <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Você pode cancelar a qualquer momento sem fidelidade.
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setConfirmandoCancelamento(true)}
                        className="w-full py-2.5 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        Cancelar Assinatura
                      </button>
                    </div>
                  )}

                  {/* ESTADO 2: DIÁLOGO DE CONFIRMAÇÃO */}
                  {confirmandoCancelamento && (
                    <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2.5 animate-scale-in">
                      <div className="text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-wide">
                        Confirmar cancelamento da assinatura?
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        Você continuará com acesso normal até o dia <strong>{diaVenc}</strong>. Após essa data, sua assinatura será encerrada e você não receberá novas cobranças.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button 
                          type="button" 
                          onClick={() => setConfirmandoCancelamento(false)} 
                          className="py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-[10px] uppercase border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                        >
                          Voltar
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setConfirmandoCancelamento(false)
                            setCancelamentoAgendado(true)
                          }} 
                          className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-[10px] uppercase transition cursor-pointer"
                        >
                          Confirmar cancelamento
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ESTADO 3: CANCELAMENTO AGENDADO (SEM BOTÃO DE REATIVAR) */}
                  {cancelamentoAgendado && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                          ● Cancelamento agendado
                        </span>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                          Até dia {diaVenc}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Sua assinatura permanecerá disponível até dia {diaVenc}. Após essa data, o plano será encerrado definitivamente e nenhuma nova cobrança será realizada. Para retornar no futuro, será necessário assinar um novo plano.
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setModalAssinatura(false)} 
                        className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
                      >
                        Entendido
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MEUS EVENTOS & INSCRIÇÕES */}
      {modalMeusEventos && (
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setModalMeusEventos(false)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl w-full max-w-md border-t border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden slide-up-enter"
          >
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#034480] dark:text-sky-400 border border-blue-200 dark:border-blue-800">
                  MINHAS INSCRIÇÕES
                </span>
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white mt-1">
                  Meus Eventos
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setModalMeusEventos(false)} 
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center justify-center text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto no-scrollbar space-y-3.5">
              {eventosInscritos.length > 0 ? (
                eventosInscritos.map((ev: any, idx: number) => {
                  const titulo = ev.titulo_evento || ev.observacoes?.split('·')?.[0]?.replace('Evento:', '')?.trim() || 'Remada Especial'
                  const voucher = ev.observacoes?.match(/Voucher:\s*([^\s·]+)/)?.[1] || `#EV-${ev.id || 8841}`
                  const dataFormatada = ev.data_reserva 
                    ? new Date(ev.data_reserva + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
                    : 'Data Agendada'

                  return (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          ● Vaga Confirmada
                        </span>
                        <span className="text-[8.5px] font-mono font-bold text-slate-400">{voucher}</span>
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                          <img 
                            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=300&auto=format&fit=crop" 
                            alt={titulo} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white leading-tight truncate">
                            {titulo}
                          </h4>
                          <p className="text-[9px] font-bold text-[#0284c7] dark:text-sky-400 mt-0.5">
                            Canto do Forte · Praia Grande
                          </p>
                          <p className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {dataFormatada} · {ev.horario_reserva || '06:00'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button 
                          type="button" 
                          onClick={() => setModalRoteiro({ titulo, voucher, data: dataFormatada, hora: ev.horario_reserva })}
                          className="py-2.5 bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 hover:bg-sky-100 font-black rounded-xl text-[9px] uppercase tracking-wider transition border border-sky-200 dark:border-sky-800 cursor-pointer"
                        >
                          Ver Roteiro
                        </button>
                        <a 
                          href={`https://wa.me/5513997421804?text=${encodeURIComponent(`Olá! Gostaria de informações ou auxílio/reembolso sobre a inscrição ${voucher} (${titulo}). Aluno: ${nomeAluno}`)}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-black rounded-xl text-[9px] uppercase tracking-wider transition text-center border border-rose-200 dark:border-rose-900"
                        >
                          Reembolso
                        </a>
                      </div>
                    </div>
                  )
                })
              ) : (
                /* EMPTY STATE QUANDO NÃO HÁ EVENTOS */
                <div className="p-6 text-center space-y-3 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">
                      Nenhuma inscrição ativa no momento
                    </h4>
                    <p className="text-[9.5px] font-medium text-slate-400 mt-1 max-w-xs mx-auto">
                      Suas inscrições em eventos e expedições aparecerão aqui.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setModalMeusEventos(false)
                      onIrParaEventos?.()
                    }} 
                    className="px-4 py-2.5 bg-gradient-to-r from-[#0284c7] to-[#034480] text-white text-[9.5px] font-black rounded-xl uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    Explorar Próximos Eventos ➔
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2.5: ROTEIRO DA SAÍDA */}
      {modalRoteiro && (
        <div 
          className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setModalRoteiro(null)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl w-full max-w-md border-t border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden slide-up-enter"
          >
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-[#0284c7] border border-sky-200 dark:border-sky-800">
                  PROGRAMAÇÃO
                </span>
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white mt-1 truncate max-w-[280px]">
                  {modalRoteiro.titulo}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setModalRoteiro(null)} 
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center justify-center text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto no-scrollbar space-y-3.5">
              
              {/* CRONOGRAMA DA SAÍDA */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="text-[9px] font-black uppercase text-[#0284c7] dark:text-sky-400 block tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Cronograma da Saída
                </span>
                <div className="space-y-2 text-[9.5px]">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#0284c7] text-white text-[8px] font-black shrink-0">05:15</span>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Ponto de Encontro:</strong> Recepção no Canto do Forte e regulagem dos coletes salva-vidas.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#0284c7] text-white text-[8px] font-black shrink-0">05:30</span>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Entrada na Água:</strong> Início da remada em grupo para contemplação do nascer do sol.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#0284c7] text-white text-[8px] font-black shrink-0">07:00</span>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Café Caiçara:</strong> Pausa na areia com frutas frescas, água de coco e pães.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#0284c7] text-white text-[8px] font-black shrink-0">07:45</span>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Retorno:</strong> Encerramento da atividade, ducha de água doce e fotos do grupo.
                    </p>
                  </div>
                </div>
              </div>

              {/* EQUIPAMENTOS FORNECIDOS */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                  Equipamentos Fornecidos
                </span>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  • Caiaque individual ou duplo revisado<br />
                  • Remo e colete salva-vidas homologado<br />
                  • Instrutor experiente acompanhando todo o trajeto
                </p>
              </div>

              {/* RECOMENDAÇÕES */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                  Recomendações
                </span>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Recomendamos traje de banho ou lycra UV, protetor solar, garrafa de hidratação e bolsa impermeável para celular. O uso do colete salva-vidas é obrigatório durante todo o trajeto.
                </p>
              </div>

              <button 
                type="button" 
                onClick={() => setModalRoteiro(null)} 
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Voltar para Minhas Inscrições
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
