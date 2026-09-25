'use client'
import React, { useState } from 'react'
import { CalendarDays, Filter, RefreshCcw, Navigation, CheckCircle2, AlertTriangle, XCircle, MoreVertical, Clock } from 'lucide-react'

interface AbaHistoricoDesktopProps {
  agendamentos: any[]
  setView: (v: string) => void
  showToast: (msg: string, type: 'success'|'warning'|'error'|'info') => void
}

export default function AbaHistoricoDesktop({
  agendamentos,
  setView,
  showToast
}: AbaHistoricoDesktopProps) {

  const [filtro, setFiltro] = useState<'todas' | 'concluidas' | 'canceladas'>('todas')

  // Mock se agendamentos for vazio
  const historico = agendamentos?.length > 0 ? agendamentos : [
    { id: 1, data_reserva: '2026-09-10', horario_reserva: '06:00 - 08:00', embarcacao: 'Caiaque Solo', status: 'concluido' },
    { id: 2, data_reserva: '2026-09-03', horario_reserva: '08:00 - 10:00', embarcacao: 'Caiaque Duplo', status: 'concluido' },
    { id: 3, data_reserva: '2026-08-28', horario_reserva: '06:00 - 08:00', embarcacao: 'Caiaque Solo', status: 'cancelado' }
  ]

  const filtrados = historico.filter(h => {
    if (filtro === 'todas') return true
    if (filtro === 'concluidas') return h.status === 'concluido'
    if (filtro === 'canceladas') return h.status === 'cancelado' || h.status === 'desistencia'
    return true
  })

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER E FILTROS */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#032b57] tracking-tight">Seu Histórico</h1>
          <p className="text-slate-500 font-medium">Acompanhe todas as suas remadas passadas e cancelamentos.</p>
        </div>
        
        {/* Filtros Dropdown Style ou Botões */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400 mr-2" />
          <button 
            onClick={() => setFiltro('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filtro === 'todas' ? 'bg-[#032b57] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFiltro('concluidas')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filtro === 'concluidas' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50'}`}
          >
            Concluídas
          </button>
          <button 
            onClick={() => setFiltro('canceladas')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filtro === 'canceladas' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50'}`}
          >
            Canceladas
          </button>
        </div>
      </div>

      {/* LISTA DE HISTÓRICO EM FORMATO DE TABELA/CARDS LARGOS */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Cabeçalho da Tabela (Visível só em telas maiores) */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-5 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest">
          <div className="col-span-3">Data</div>
          <div className="col-span-4">Embarcação / Turno</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Ação</div>
        </div>

        {/* Linhas */}
        <div className="flex flex-col divide-y divide-slate-100">
          {filtrados.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-medium">Nenhum registro encontrado para este filtro.</div>
          ) : (
            filtrados.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-sky-50/50 transition-colors">
                
                {/* Data */}
                <div className="col-span-3 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.status === 'concluido' ? 'bg-emerald-100 text-emerald-600' :
                    item.status === 'cancelado' || item.status === 'desistencia' ? 'bg-rose-100 text-rose-600' :
                    'bg-sky-100 text-sky-600'
                  }`}>
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-slate-800">{item.data_reserva}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remada Padrão</div>
                  </div>
                </div>

                {/* Embarcação / Turno */}
                <div className="col-span-4 flex flex-col justify-center">
                  <div className="font-bold text-slate-700 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-sky-500" />
                    {item.embarcacao || 'Caiaque Indefinido'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {item.horario_reserva || 'Horário Livre'}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-3 flex items-center">
                  {item.status === 'concluido' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4" /> Concluída
                    </span>
                  )}
                  {(item.status === 'cancelado' || item.status === 'desistencia') && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black uppercase tracking-wide">
                      <XCircle className="w-4 h-4" /> Cancelada
                    </span>
                  )}
                  {item.status !== 'concluido' && item.status !== 'cancelado' && item.status !== 'desistencia' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-xs font-black uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4" /> Outro
                    </span>
                  )}
                </div>

                {/* Ação */}
                <div className="col-span-2 flex items-center justify-end">
                  {item.status === 'concluido' ? (
                    <button 
                      onClick={() => { setView('agendar'); showToast('Bora agendar de novo!', 'info'); }}
                      className="text-[#0284c7] hover:bg-sky-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      <RefreshCcw className="w-4 h-4" /> Repetir
                    </button>
                  ) : (
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}