'use client'
import React from 'react'

interface AbaInicioDesktopProps {
  alunoData: any
  agendamentos: any[]
  config: any
  reservasSemana: number
  disponiveisSemana: number
  caiaques?: any[]
  lockers?: any[]
  onSolicitarNovo: () => void
  onCancelarReserva?: (reserva: any) => void
  showToast: (msg: string, type: 'success'|'warning'|'error'|'info') => void
}

export default function AbaInicioDesktop({
  alunoData,
  agendamentos,
  config,
  reservasSemana,
  disponiveisSemana,
  onSolicitarNovo,
  onCancelarReserva,
  showToast
}: AbaInicioDesktopProps) {
  
  const maxMensalista = config?.remadas_semanais || 2
  const reservasAtivas = agendamentos?.filter(a => a.status === 'pendente' || a.status === 'confirmado') || []
  
  const proximasReservas = reservasAtivas
    .filter(a => a.data_reserva >= new Date().toISOString().split('T')[0])
    .sort((a, b) => new Date(a.data_reserva).getTime() - new Date(b.data_reserva).getTime())
    .slice(0, 4)

  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

  const formatDate = (dateStr: string) => {
    if (!dateStr) return { diaSemana: '', dia: '', mes: '' }
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length !== 3) return { diaSemana: '', dia: '', mes: '' }
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    return {
      diaSemana: diasSemana[date.getDay()],
      dia: parts[2],
      mes: meses[date.getMonth()]
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-6xl mx-auto w-full">
      
      {/* COTAS + STATS */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border-t-[3px] border-t-pink-500">
          <div className="text-3xl font-black text-slate-800 tracking-tighter">
            {reservasSemana}<span className="text-sm text-slate-400 font-bold ml-1">/{maxMensalista}</span>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Cotas da Semana</div>
          <div className="flex gap-1.5 mt-2">
            {[...Array(maxMensalista)].map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i < reservasSemana ? 'bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm' : 'bg-slate-100 border border-slate-200'}`}></div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border-t-[3px] border-t-emerald-500">
          <div className="text-3xl font-black text-slate-800 tracking-tighter">
            {reservasAtivas.length}
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Reservas Ativas</div>
          <div className="mt-2">
            <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              Confirmadas
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border-t-[3px] border-t-blue-900 flex flex-col justify-between">
          <div>
             <span className="inline-flex items-center bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {alunoData?.tipo_plano || 'Mensalista'}
            </span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2">Plano Ativo</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-1">Em dia • Venc. {alunoData?.dia_vencimento || 15}</div>
          </div>
        </div>

      </div>

      <button 
        onClick={onSolicitarNovo}
        className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wide bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all mb-5 border-none cursor-pointer"
      >
        Solicitar Novo Agendamento 🚣‍♀️
      </button>

      {/* AGENDAMENTOS */}
      <div className="flex items-center justify-between mb-3 mt-2">
        <span className="inline-flex items-center bg-blue-950 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
          Seus Agendamentos ({reservasAtivas.length})
        </span>
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          Próximas remadas
        </span>
      </div>

      {proximasReservas.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
          <div className="text-4xl mb-2 opacity-50">🏝️</div>
          <p className="text-slate-500 font-bold">Nenhum agendamento futuro encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {proximasReservas.map(res => {
            const { diaSemana, dia, mes } = formatDate(res.data_reserva)
            return (
              <div key={res.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#1D70B8] flex gap-4">
                <div className="text-center min-w-[56px] bg-sky-50 border border-sky-200 rounded-xl py-2 px-1 flex flex-col justify-center shrink-0">
                  <div className="text-[9px] font-black text-sky-600 uppercase">{diaSemana}</div>
                  <div className="text-2xl font-black leading-none text-slate-800 my-1">{dia}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">{mes}</div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clube {alunoData?.tipo_plano || 'Mensalista'}</div>
                  <div className="text-base font-black text-slate-800 truncate">{res.turno}</div>
                  
                  <div className="flex items-center mt-1">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]"></span>
                      {res.status === 'pendente' ? 'Pendente' : 'Confirmado'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-semibold mt-2 truncate">
                    🛶 {res.caiaque || 'A definir'} • 🔒 {res.locker ? `Locker ${res.locker}` : 'S/ Locker'}
                  </div>

                  <button 
                    onClick={() => onCancelarReserva && onCancelarReserva(res)}
                    className="mt-2 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg border border-rose-200 text-rose-500 bg-transparent hover:bg-rose-50 transition-colors"
                  >
                    × Cancelar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}