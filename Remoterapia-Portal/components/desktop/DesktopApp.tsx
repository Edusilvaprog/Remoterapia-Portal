'use client'
import React from 'react'
import { LogOut, Bell, Settings, Calendar, History, User, MapPin, Search, MessageCircle } from 'lucide-react'
import Image from 'next/image'

// Abas (vamos criar em breve)
import AbaInicioDesktop from './AbaInicioDesktop'
import AbaAgendarDesktop from './AbaAgendarDesktop'
import AbaEventosDesktop from './AbaEventosDesktop'
import AbaHistoricoDesktop from './AbaHistoricoDesktop'
import AbaPerfilDesktop from './AbaPerfilDesktop'

interface DesktopAppProps {
  alunoData: any
  agendamentos: any[]
  caiaques: any[]
  lockers: any[]
  configTabelaClubes: any
  reservasSemana: number
  disponiveisSemana: number
  view: string
  setView: (v: any) => void
  showToast: (msg: string, type: 'success'|'warning'|'error'|'info') => void
  handleLogout: () => void
  fetchPainel: () => Promise<void>
}

export default function DesktopApp({
  alunoData,
  agendamentos,
  caiaques,
  lockers,
  configTabelaClubes,
  reservasSemana,
  disponiveisSemana,
  view,
  setView,
  showToast,
  handleLogout,
  fetchPainel
}: DesktopAppProps) {

  const tabs = [
    { id: 'home', icon: <MapPin className="w-4 h-4" />, label: 'Início' },
    { id: 'agendar', icon: <Calendar className="w-4 h-4" />, label: 'Agendar' },
    { id: 'eventos', icon: <Search className="w-4 h-4" />, label: 'Eventos' },
    { id: 'historico', icon: <History className="w-4 h-4" />, label: 'Histórico' },
    { id: 'perfil', icon: <User className="w-4 h-4" />, label: 'Meu Perfil' }
  ]

  const activeTab = tabs.find(t => t.id === view) || tabs[0]

  return (
    <div className="flex w-full min-h-screen bg-[#e0f2fe] text-slate-900 font-nunito selection:bg-pink-500 selection:text-white">
      
      {/* SIDEBAR */}
      <aside className="w-[240px] fixed left-0 top-0 h-screen bg-gradient-to-b from-[#032b57] to-[#071a33] border-r border-white/5 flex flex-col z-50">
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-sky-300 text-lg">
            ⚓
          </div>
          <div>
            <div className="text-white font-black text-sm tracking-wide">Remoterapia</div>
            <div className="text-white/40 font-bold text-[9px] uppercase tracking-widest">Agendamento</div>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all duration-200 ${
                view === tab.id
                  ? 'bg-gradient-to-br from-sky-600 to-[#034480] text-white shadow-lg shadow-sky-900/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <a
            href="https://wa.me/5513997421804"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Suporte WhatsApp
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        
        {/* HEADER */}
        <header className="h-[64px] fixed top-0 right-0 left-[240px] bg-gradient-to-r from-[#032b57] via-[#0284c7] to-[#034480] border-b border-white/10 flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-black text-sm relative cursor-pointer hover:bg-white/30 transition-colors"
              onClick={() => setView('perfil')}
            >
              {alunoData?.nome ? alunoData.nome.substring(0, 2).toUpperCase() : 'RT'}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#032b57] shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            </div>
            <div>
              <div className="text-[10px] font-black text-sky-200 uppercase tracking-widest">
                OlA, {alunoData?.nome?.split(' ')[0] || 'Aluno'}
              </div>
              <div className="text-white font-black text-base uppercase tracking-wider">
                {activeTab.label}
              </div>
            </div>
          </div>

          <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 gap-1">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors relative">
              <Bell className="w-4 h-4" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-sky-300 shadow-[0_0_6px_#38bdf8]"></div>
            </button>
            <button 
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-300 hover:bg-white/20 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 pt-[64px] p-6 max-w-[1200px] w-full">
          {view === 'home' && (
            <AbaInicioDesktop 
              alunoData={alunoData} 
              agendamentos={agendamentos} 
              config={configTabelaClubes}
              reservasSemana={reservasSemana}
              disponiveisSemana={disponiveisSemana}
              onSolicitarNovo={() => setView('agendar')}
              showToast={showToast}
            />
          )}
          {view === 'agendar' && (
            <AbaAgendarDesktop 
              alunoData={alunoData}
              caiaques={caiaques}
              lockers={lockers}
              disponiveisSemana={disponiveisSemana}
              setView={setView}
              showToast={showToast}
              fetchPainel={fetchPainel}
            />
          )}
          {view === 'eventos' && (
            <AbaEventosDesktop 
              alunoData={alunoData}
              setView={setView}
              showToast={showToast}
            />
          )}
          {view === 'historico' && (
            <AbaHistoricoDesktop 
              agendamentos={agendamentos}
              setView={setView}
              showToast={showToast}
            />
          )}
          {view === 'perfil' && (
            <AbaPerfilDesktop 
              alunoData={alunoData}
              config={configTabelaClubes}
              handleLogout={handleLogout}
              showToast={showToast}
            />
          )}
        </main>

      </div>
    </div>
  )
}
