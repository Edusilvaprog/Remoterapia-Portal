'use client'
import React from 'react'
import { Shield, CalendarDays, MessageCircle, LogOut, Smartphone, Lock } from 'lucide-react'

interface AbaPerfilDesktopProps {
  alunoData: any
  config: any
  handleLogout: () => void
  showToast: (msg: string, type: 'success'|'warning'|'error'|'info') => void
}

export default function AbaPerfilDesktop({
  alunoData,
  config,
  handleLogout,
  showToast
}: AbaPerfilDesktopProps) {

  const iniciais = alunoData?.nome ? alunoData.nome.split(' ').map((n:string) => n[0]).slice(0,2).join('').toUpperCase() : 'JS'

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1200px] mx-auto">
      
      {/* BANNER */}
      <div className="bg-gradient-to-br from-[#032b57] via-[#0284c7] to-[#034480] rounded-[1.4rem] p-6 text-white flex flex-col md:flex-row items-center md:items-start gap-5 mb-4 shadow-sm border border-sky-800/30">
        
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-3xl font-black text-white border-2 border-white/30 shadow-inner">
            {iniciais}
          </div>
          <div 
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center cursor-pointer shadow-md text-slate-800 hover:scale-110 transition-transform"
            title="Editar foto"
            onClick={() => showToast('Editar foto em breve', 'info')}
          >
            📷
          </div>
        </div>

        {/* Info Principal */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <span className="inline-block bg-white/15 text-white border border-white/20 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mb-1">
            {alunoData?.tipo_plano || 'Mensalista'}
          </span>
          <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mt-1">
            Matrícula #REM-{String(alunoData?.id || '0000').padStart(4, '0')}
          </div>
          <div className="text-xl md:text-2xl font-black mt-1 tracking-tight truncate">
            {alunoData?.nome || 'João Silva'}
          </div>
          <div className="text-xs text-white/70 mt-1 font-medium">
            {alunoData?.telefone || '(13) 99742-1804'} • {alunoData?.email}
          </div>
        </div>

        {/* Cards de Status (Direita) */}
        <div className="flex flex-wrap md:flex-nowrap gap-3 shrink-0 mt-4 md:mt-0 w-full md:w-auto justify-center">
          <div className="bg-white/10 border border-white/15 rounded-2xl py-3 px-5 text-center flex-1 md:flex-none">
            <div className="text-xl md:text-2xl font-black text-white">R$ {config?.valor_mensalidade || 150}</div>
            <div className="text-[9px] text-white/50 font-bold uppercase tracking-widest mt-1">Mensal</div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl py-3 px-5 text-center flex-1 md:flex-none">
            <div className="text-xl md:text-2xl font-black text-white">{alunoData?.dia_vencimento || 15}</div>
            <div className="text-[9px] text-white/50 font-bold uppercase tracking-widest mt-1">Dia Venc.</div>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl py-3 px-5 text-center flex-1 md:flex-none">
            <div className="text-sm md:text-base font-black text-emerald-400 mt-1">Em dia</div>
            <div className="text-[9px] text-white/50 font-bold uppercase tracking-widest mt-1">Status</div>
          </div>
        </div>

      </div>

      {/* GRID DE AÇÕES 3 COLUNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        
        {/* Minha Assinatura */}
        <div 
          onClick={() => showToast('Gerenciar assinatura em breve', 'info')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-sky-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-800">Minha Assinatura</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Plano atual e mensalidade</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Gerencie seu plano, altere o dia de vencimento ou solicite cancelamento sem fidelidade.
          </div>
        </div>

        {/* Meus Eventos */}
        <div 
          onClick={() => showToast('Meus eventos em breve', 'info')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-pink-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-800">Meus Eventos</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Inscrições e roteiros</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Veja seus ingressos confirmados, vouchers e cronograma detalhado das saídas.
          </div>
        </div>

        {/* Mudar Senha */}
        <div 
          onClick={() => showToast('Mudar senha em breve', 'info')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-800">Mudar Senha</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Credenciais de acesso</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Atualize sua senha com requisitos de segurança: 8+ caracteres, maiúscula e número.
          </div>
        </div>

        {/* Suporte */}
        <div 
          onClick={() => window.open('https://wa.me/5513997421804', '_blank')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-800">Suporte</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Atendimento WhatsApp</div>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online • Ter a Dom 06h–18h
          </div>
        </div>

        {/* Instalar App */}
        <div 
          onClick={() => showToast('Instruções de instalação em breve', 'info')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-sky-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-slate-800">Instalar Aplicativo</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Atalho na tela inicial</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Adicione o Remoterapia como app nativo no seu celular, sem baixar da loja.
          </div>
        </div>

        {/* Sair */}
        <div 
          onClick={() => { if(confirm('Encerrar sessão?')) handleLogout() }}
          className="bg-white border border-rose-200 rounded-2xl p-5 hover:shadow-md hover:bg-rose-50/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-rose-600">Encerrar Sessão</div>
              <div className="text-[10px] font-bold text-rose-400/80 uppercase tracking-wide">Sair deste aparelho</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Desconecte sua conta. Será necessário fazer login novamente na próxima vez.
          </div>
        </div>

      </div>

    </div>
  )
}