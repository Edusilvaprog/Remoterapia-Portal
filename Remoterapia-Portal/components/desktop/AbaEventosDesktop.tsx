'use client'
import React from 'react'

interface AbaEventosDesktopProps {
  alunoData: any
  setView: (v: string) => void
  showToast: (msg: string, type: 'success'|'warning'|'error'|'info') => void
}

export default function AbaEventosDesktop({
  alunoData,
  setView,
  showToast
}: AbaEventosDesktopProps) {
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20 w-full">
      
      {/* NOSSOS CLUBES */}
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nossos Clubes</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        
        {/* Clube Mensalista */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm border-t-4 border-t-sky-600 hover:shadow-md transition-shadow">
          <div className="text-xl font-black text-slate-800">Clube Mensalista</div>
          <div className="text-3xl font-black text-sky-600 my-3">
            R$ 150<span className="text-base text-slate-400 font-bold">/mês</span>
          </div>
          <div className="text-sm text-slate-500 font-medium leading-loose">
            ✓ 2 remadas semanais livres<br/>
            ✓ Equipamento completo incluso<br/>
            ✓ Armário para pertences no local
          </div>
          <button 
            onClick={() => showToast('Modal de assinatura em breve', 'info')}
            className="w-full mt-5 py-3 rounded-xl text-xs font-black uppercase tracking-wide bg-gradient-to-br from-sky-600 to-blue-800 text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all border-none cursor-pointer"
          >
            Assinar Clube Mensalista
          </button>
        </div>

        {/* Clube Guardaria */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm border-t-4 border-t-teal-600 hover:shadow-md transition-shadow">
          <div className="text-xl font-black text-slate-800">Clube Guardaria</div>
          <div className="text-3xl font-black text-teal-600 my-3">
            R$ 150<span className="text-base text-slate-400 font-bold">/mês</span>
          </div>
          <div className="text-sm text-slate-500 font-medium leading-loose">
            ✓ Vaga para sua embarcação na areia<br/>
            ✓ Apoio na entrada e saída do mar<br/>
            ✓ Ducha de água doce após o treino
          </div>
          <button 
            onClick={() => showToast('Modal de assinatura em breve', 'info')}
            className="w-full mt-5 py-3 rounded-xl text-xs font-black uppercase tracking-wide bg-gradient-to-br from-teal-600 to-emerald-800 text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all border-none cursor-pointer"
          >
            Assinar Clube Guardaria
          </button>
        </div>

      </div>

      {/* EVENTOS OFICIAIS */}
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Eventos Oficiais</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Expedição */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="w-full aspect-[16/9] bg-gradient-to-br from-sky-700 to-blue-900 flex items-end p-3">
            <span className="inline-flex items-center gap-1.5 bg-black/50 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-sm border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              8 vagas restantes
            </span>
          </div>
          <div className="p-5">
            <div className="text-lg font-black uppercase text-slate-800 tracking-tight">Expedição Ilha das Palmas</div>
            <div className="text-sm text-sky-600 font-bold mt-1">Sáb, 28 Set • 05:15</div>
            
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full text-[9px] font-bold">✓ Café Caiçara</span>
              <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full text-[9px] font-bold">✓ Caiaque Solo/Duplo</span>
              <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full text-[9px] font-bold">✓ Fotos GoPro</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Valor da Inscrição</span>
              <div className="text-xl font-black text-slate-800">R$ 120,00</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button 
                onClick={() => showToast('Detalhes em breve', 'info')}
                className="py-3 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Ver Detalhes
              </button>
              <button 
                onClick={() => showToast('Checkout em breve', 'info')}
                className="py-3 rounded-xl text-[11px] font-black uppercase tracking-wide bg-gradient-to-br from-sky-600 to-blue-800 text-white shadow-sm hover:brightness-110 transition-colors"
              >
                Garantir Vaga 🚀
              </button>
            </div>
          </div>
        </div>

        {/* Remada Noturna */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="w-full aspect-[16/9] bg-gradient-to-br from-indigo-700 to-indigo-950 flex items-end p-3">
            <span className="inline-flex items-center gap-1.5 bg-black/50 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-sm border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              14 vagas restantes
            </span>
          </div>
          <div className="p-5">
            <div className="text-lg font-black uppercase text-slate-800 tracking-tight">Remada Noturna Lua Cheia</div>
            <div className="text-sm text-sky-600 font-bold mt-1">Sex, 10 Out • 19:30</div>
            
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full text-[9px] font-bold">✓ Iluminação LED</span>
              <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full text-[9px] font-bold">✓ Equipamento Completo</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Valor da Inscrição</span>
              <div className="text-xl font-black text-slate-800">R$ 90,00</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button 
                onClick={() => showToast('Detalhes em breve', 'info')}
                className="py-3 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Ver Detalhes
              </button>
              <button 
                onClick={() => showToast('Checkout em breve', 'info')}
                className="py-3 rounded-xl text-[11px] font-black uppercase tracking-wide bg-gradient-to-br from-sky-600 to-blue-800 text-white shadow-sm hover:brightness-110 transition-colors"
              >
                Garantir Vaga 🚀
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}