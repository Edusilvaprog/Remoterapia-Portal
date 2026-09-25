
'use client'
import { Home, CalendarPlus, Compass, History, UserCircle2, MessageCircle, X, CalendarClock, CreditCard } from 'lucide-react'
import { Dispatch, SetStateAction, useState, useRef, useEffect } from 'react'

interface BottomNavProps {
  view: string
  setView: Dispatch<SetStateAction<any>>
  alunoData?: any
}

export default function BottomNav({ view, setView, alunoData }: BottomNavProps) {
  const isSelected = (v: string) => view === v
  const [waMenuOpen, setWaMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setWaMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      {/* Botão WhatsApp Flutuante Ancorado com Menu */}
      <div ref={menuRef} className="absolute bottom-20 right-4 z-40 pointer-events-none flex flex-col items-end">
        {/* Menu do WhatsApp */}
        <div className={`wa-fab-menu bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 mb-3 w-48 ${waMenuOpen ? 'open' : ''}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-2">Como podemos ajudar?</p>
            <a href="https://wa.me/5513997421804?text=Olá, equipe Remoterapia! Tenho uma dúvida sobre meus Agendamentos." target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-sm font-semibold text-slate-700 dark:text-slate-300 pointer-events-auto">
                <CalendarClock className="w-4 h-4 text-sky-500" /> Agendamentos
            </a>
            <a href="https://wa.me/5513997421804?text=Olá, equipe Remoterapia! Tenho uma dúvida sobre Planos e Assinaturas." target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-sm font-semibold text-slate-700 dark:text-slate-300 pointer-events-auto">
                <CreditCard className="w-4 h-4 text-emerald-500" /> Assinaturas
            </a>
            <a href="https://wa.me/5513997421804?text=Olá, equipe Remoterapia! Preciso de ajuda com outro assunto." target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-sm font-semibold text-slate-700 dark:text-slate-300 pointer-events-auto">
                <MessageCircle className="w-4 h-4 text-slate-400" /> Outra Dúvida
            </a>
        </div>

        {/* Botão Principal com SVG Original */}
        <button 
          onClick={() => setWaMenuOpen(!waMenuOpen)}
          className={`pointer-events-auto w-12 h-12 ${waMenuOpen ? 'bg-slate-800' : 'bg-[#25D366] hover:bg-[#20bd5a]'} text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all border-2 border-white dark:border-slate-800 cursor-pointer`}
          title="Falar no WhatsApp"
        >
          {waMenuOpen ? <X className="w-6 h-6" /> : (
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Barra Inferior Modelo 1 - Floating Glass Pro */}
      <div className="absolute bottom-3 left-0 right-0 z-50 pointer-events-none flex justify-center px-4">
        <nav className="w-full max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 flex justify-between items-center rounded-[2rem] shadow-xl shadow-slate-950/20 p-1.5 pointer-events-auto transition-colors duration-300">
          <button type="button" onClick={() => setView('home')} className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${isSelected('home') ? 'bg-gradient-to-r from-[#0284c7] to-[#034480] text-white font-black shadow-md shadow-sky-600/30' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 font-bold'}`}>
            <Home className="w-5 h-5" /><span className="text-[9px] uppercase tracking-wider mt-0.5">Início</span>
          </button>
          {alunoData && ['mensalista', 'guardaria', 'combo_mensalista_guardaria'].includes(alunoData.tipo_plano) && (
            <button type="button" onClick={() => setView('agendar')} className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${isSelected('agendar') ? 'bg-gradient-to-r from-[#0284c7] to-[#034480] text-white font-black shadow-md shadow-sky-600/30' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 font-bold'}`}>
              <CalendarPlus className="w-5 h-5" /><span className="text-[9px] uppercase tracking-wider mt-0.5">Agendar</span>
            </button>
          )}
          <button type="button" onClick={() => setView('eventos')} className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${isSelected('eventos') ? 'bg-gradient-to-r from-[#0284c7] to-[#034480] text-white font-black shadow-md shadow-sky-600/30' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 font-bold'}`}>
            <Compass className="w-5 h-5" /><span className="text-[9px] uppercase tracking-wider mt-0.5">Eventos</span>
          </button>
          <button type="button" onClick={() => setView('historico')} className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${isSelected('historico') ? 'bg-gradient-to-r from-[#0284c7] to-[#034480] text-white font-black shadow-md shadow-sky-600/30' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 font-bold'}`}>
            <History className="w-5 h-5" /><span className="text-[9px] uppercase tracking-wider mt-0.5">Histórico</span>
          </button>
          <button type="button" onClick={() => setView('perfil')} className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${isSelected('perfil') ? 'bg-gradient-to-r from-[#0284c7] to-[#034480] text-white font-black shadow-md shadow-sky-600/30' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 font-bold'}`}>
            <UserCircle2 className="w-5 h-5" /><span className="text-[9px] uppercase tracking-wider mt-0.5">Perfil</span>
          </button>
        </nav>
      </div>
    </>
  )
}
