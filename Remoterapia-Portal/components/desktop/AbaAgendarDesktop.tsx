'use client'
import React, { useState } from 'react'

interface AbaAgendarDesktopProps {
  alunoData: any
  caiaques: any[]
  lockers: any[]
  disponiveisSemana: number
  setView: (v: string) => void
  showToast: (msg: string, type: 'success'|'warning'|'error'|'info') => void
  fetchPainel: () => Promise<void>
}

export default function AbaAgendarDesktop({
  alunoData,
  caiaques,
  lockers,
  disponiveisSemana,
  setView,
  showToast,
  fetchPainel
}: AbaAgendarDesktopProps) {
  
  // 1: Data, 2: Turno, 3: Barco, 4: Locker, 5: Resumo
  const [passoAtual, setPassoAtual] = useState(1)
  const [reserva, setReserva] = useState({
    data: '',
    turno: '',
    embarcacao: '',
    locker: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Função mágica do Acordeão: quando seleciona algo, esconde e reseta os passos seguintes
  const selecionarOpcao = (passo: number, campo: string, valor: string) => {
    setReserva(prev => ({ ...prev, [campo]: valor }))
    // Se selecionou algo num passo que estava aberto ou anterior, avança e reseta os da frente
    setPassoAtual(passo + 1)
    
    // Limpar seleções futuras
    setReserva(prev => {
      const nova = { ...prev, [campo]: valor }
      if (passo < 4) nova.locker = ''
      if (passo < 3) nova.embarcacao = ''
      if (passo < 2) nova.turno = ''
      return nova
    })
  }

  // Gera dias do mês (simplificado para o protótipo)
  const gerarDias = () => {
    const dias = []
    // offset 2 dias (começa na terça)
    for(let i=0; i<2; i++) dias.push(null)
    for(let i=1; i<=30; i++) dias.push(i)
    return dias
  }

  const dias = gerarDias()

  const handleConfirmar = async () => {
    setIsSubmitting(true)
    setTimeout(() => {
      showToast('Agendamento confirmado com sucesso!', 'success')
      setView('inicio')
      fetchPainel()
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        
        {/* COLUNA ESQUERDA: Calendário + Turno */}
        <div className="flex flex-col gap-4">
          
          {/* PASSO 1: CALENDÁRIO */}
          <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300 ${passoAtual === 1 ? 'ring-2 ring-sky-500/30' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <div className="text-base font-black uppercase text-slate-800 tracking-wide">Setembro 2026</div>
              <div className="flex gap-1">
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg font-bold">{'<'}</button>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg font-bold">{'>'}</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map(d => (
                <span key={d} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d}</span>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {dias.map((d, i) => {
                if (d === null) return <div key={i} className="aspect-square flex items-center justify-center text-slate-300 font-bold opacity-40"></div>
                
                const dataString = `2026-09-${String(d).padStart(2,'0')}`
                const isSelected = reserva.data === dataString
                const isPast = d < 22 // mock
                const isManutencao = d === 22 || d === 29

                if (isPast || isManutencao) {
                  return (
                    <div key={i} className="aspect-square flex items-center justify-center text-sm font-bold text-slate-300 opacity-40 rounded-xl" title={isManutencao ? 'Manutenção' : ''}>
                      {d}
                    </div>
                  )
                }

                return (
                  <div 
                    key={i} 
                    onClick={() => selecionarOpcao(1, 'data', dataString)}
                    className={`aspect-square flex items-center justify-center text-sm font-bold rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-sky-600 text-white shadow-md scale-105 ring-2 ring-sky-600 ring-offset-1 font-black z-10' 
                        : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600 border border-transparent hover:border-sky-200'
                    }`}
                  >
                    {d}
                  </div>
                )
              })}
            </div>
          </div>

          {/* PASSO 2: TURNO */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${passoAtual >= 2 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${passoAtual === 2 ? 'ring-2 ring-sky-500/30' : ''}`}>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Turno da Saída</div>
              <div className="grid grid-cols-2 gap-2">
                {['06:00 às 08:00', '08:00 às 10:00'].map(t => (
                  <div 
                    key={t}
                    onClick={() => selecionarOpcao(2, 'turno', t)}
                    className={`py-3 px-4 rounded-xl text-xs font-black border-2 cursor-pointer transition-all text-center ${
                      reserva.turno === t 
                        ? 'bg-gradient-to-br from-sky-600 to-blue-800 text-white border-sky-600 shadow-md scale-[1.02]' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-sky-300'
                    }`}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* COLUNA DIREITA: Barco + Locker + Resumo */}
        <div className="flex flex-col gap-4">
          
          {/* PASSO 3: BARCO */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${passoAtual >= 3 ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${passoAtual === 3 ? 'ring-2 ring-sky-500/30' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Embarcação</span>
                <span className="bg-sky-50 text-sky-600 border border-sky-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">3 livres</span>
              </div>
              
              <div className="flex flex-col gap-2">
                {[
                  { id: 'c1', nome: 'Caiaque Oceânico 1', status: 'LIVRE' },
                  { id: 'c2', nome: 'Caiaque Oceânico 2', status: 'LIVRE' },
                  { id: 'd1', nome: 'Caiaque Duplo 1', status: 'LIVRE' },
                  { id: 'c3', nome: 'Caiaque Oceânico 3', status: 'Manutenção' },
                ].map(b => {
                  const isSelected = reserva.embarcacao === b.nome
                  const isBlocked = b.status !== 'LIVRE'
                  return (
                    <div 
                      key={b.id}
                      onClick={() => !isBlocked && selecionarOpcao(3, 'embarcacao', b.nome)}
                      className={`p-3.5 rounded-xl flex items-center justify-between border-2 transition-all ${
                        isBlocked ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed' :
                        isSelected ? 'bg-sky-50 border-sky-500 shadow-sm cursor-pointer' : 'bg-white border-slate-100 hover:border-sky-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-extrabold text-slate-800">{b.nome}</div>
                        <div className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${isBlocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {isBlocked ? `• ${b.status}` : '• LIVRE'}
                        </div>
                      </div>
                      {!isBlocked && (
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* PASSO 4: LOCKER */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${passoAtual >= 4 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${passoAtual === 4 ? 'ring-2 ring-sky-500/30' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Guarda-Volumes</span>
                <span className="bg-sky-50 text-sky-600 border border-sky-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">6 livres</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {['01','02','04','05','07','09'].map(l => (
                  <div 
                    key={l}
                    onClick={() => selecionarOpcao(4, 'locker', l)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 cursor-pointer transition-all ${
                      reserva.locker === l 
                        ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm ring-2 ring-sky-500/20' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-sky-300 hover:bg-sky-50/50'
                    }`}
                  >
                    <span className="text-sm opacity-50 mb-0.5">🔒</span>
                    <span className="text-xs font-black">#{l}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => selecionarOpcao(4, 'locker', 'Nenhum')}
                className={`mt-3 w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border-2 ${
                  reserva.locker === 'Nenhum' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                Não preciso de locker
              </button>
            </div>
          </div>

          {/* PASSO 5: RESUMO */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${passoAtual >= 5 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white border border-blue-500/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full"></div>
              
              <div className="text-[10px] font-black text-sky-300 uppercase tracking-widest mb-4">Resumo Executivo</div>
              
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-white/10 rounded-xl p-3 border border-white/5">
                  <div className="text-[8px] font-bold text-sky-300 uppercase tracking-widest">Data & Turno</div>
                  <div className="text-sm font-black mt-1">{reserva.data ? reserva.data.split('-').reverse().join('/') : '--'}</div>
                  <div className="text-[11px] text-white/60 font-medium">{reserva.turno || '--'}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/5">
                  <div className="text-[8px] font-bold text-sky-300 uppercase tracking-widest">Embarcação & Locker</div>
                  <div className="text-sm font-black mt-1 truncate">{reserva.embarcacao || '--'}</div>
                  <div className="text-[11px] text-white/60 font-medium">Locker: {reserva.locker || '--'}</div>
                </div>
              </div>

              <button 
                disabled={isSubmitting || passoAtual < 5}
                onClick={handleConfirmar}
                className="w-full py-4 rounded-xl text-[13px] font-black uppercase tracking-widest bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all border-none cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento 🚀'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}