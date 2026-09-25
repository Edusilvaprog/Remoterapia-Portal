'use server'

import { createClient } from '../supabase/server'
import { cookies } from 'next/headers'

// Retorna eventos abertos
export async function fetchEventos() {
  try {
    const supabase = await createClient()
    const hojeStr = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .in('status', ['aberto'])
      .gte('data_evento', hojeStr)
      .order('data_evento', { ascending: true })
      
    if (error) {
      console.warn('Tabela de eventos ou erro ao carregar eventos:', error.message)
      return { ok: true, eventos: [] }
    }
    return { ok: true, eventos: data || [] }
  } catch (error: any) {
    console.warn('Erro ao conectar eventos:', error.message)
    return { ok: true, eventos: [] }
  }
}

// Processa inscrição 
export async function processarInscricao(payload: {
  evento_id: string
  mensalista_id?: string
  nome: string
  telefone: string
  email?: string
  qtd_vagas: number
  embarcacao?: string
  valor_total: number
  metodo_pagamento: string
  data_evento?: string
  horario_evento?: string
  titulo_evento?: string
  nomes_acompanhantes?: string[]
}) {
  try {
    const supabase = await createClient()
    const { 
      evento_id, 
      mensalista_id, 
      nome, 
      telefone, 
      email, 
      qtd_vagas, 
      embarcacao, 
      valor_total, 
      metodo_pagamento,
      data_evento,
      horario_evento,
      titulo_evento,
      nomes_acompanhantes
    } = payload

    if (!nome || !telefone) {
      return { ok: false, error: 'Nome e telefone são obrigatórios para a inscrição.' }
    }

    // 1. Verifica disponibilidade do evento
    const { data: evento, error: evError } = await supabase
      .from('eventos')
      .select('id, titulo, vagas_total, vagas_ocupadas, data_evento, horario')
      .eq('id', evento_id)
      .maybeSingle()

    if (evento) {
      const vagasDisponiveis = (evento.vagas_total || 10) - (evento.vagas_ocupadas || 0)
      if (qtd_vagas > vagasDisponiveis) {
        return { ok: false, error: `Restam apenas ${vagasDisponiveis} vaga(s) para este evento.` }
      }
    }

    // 2. Verifica duplicidade se for mensalista logado
    if (mensalista_id) {
      const { data: jaInscrito } = await supabase
        .from('inscricoes_eventos')
        .select('id')
        .eq('evento_id', evento_id)
        .eq('mensalista_id', mensalista_id)
        .neq('status_pagamento', 'cancelado')
        .maybeSingle()

      if (jaInscrito) {
        return { ok: false, error: 'Você já possui uma inscrição ativa para este evento.' }
      }
    }

    const voucher = 'RMT-' + Math.floor(100000 + Math.random() * 900000)

    // 3. Salva inscrição na tabela inscricoes_eventos
    const { error: insError } = await supabase
      .from('inscricoes_eventos')
      .insert({
        evento_id,
        mensalista_id: mensalista_id || null,
        nome_completo: nome.toUpperCase().trim(),
        telefone_whatsapp: telefone.replace(/\D/g, ''),
        email: email || null,
        qtd_vagas: qtd_vagas || 1,
        embarcacoes_alocadas: embarcacao || null,
        valor_pago: valor_total || 0,
        codigo_voucher: voucher,
        status_pagamento: 'pago',
        metodo_pagamento: metodo_pagamento || 'pix',
        nomes_acompanhantes: nomes_acompanhantes || [],
        checkin_realizado: false,
        status_presenca: 'pendente'
      })

    if (insError) {
      console.error('Erro ao inserir inscrição:', insError.message)
      return { ok: false, error: 'Erro ao registrar inscrição. Tente novamente.' }
    }

    // 4. Atualiza vagas na tabela de eventos
    if (evento) {
      await supabase
        .from('eventos')
        .update({ vagas_ocupadas: (evento.vagas_ocupadas || 0) + (qtd_vagas || 1) })
        .eq('id', evento_id)
    }

    // 5. Registra nos agendamentos se for mensalista para refletir no app e no perfil
    let agendamentoCriado = null
    if (mensalista_id) {
      const dataReserva = data_evento || evento?.data_evento || new Date().toISOString().split('T')[0]
      const horaReserva = horario_evento || evento?.horario || '06:00'
      const tituloFinal = titulo_evento || evento?.titulo || 'Evento Remoterapia'

      const { data: novoAg, error: agError } = await supabase
        .from('agendamentos')
        .insert({
          mensalista_id,
          data_reserva: dataReserva,
          horario_reserva: horaReserva,
          status: 'confirmado',
          is_evento: true,
          titulo_evento: tituloFinal,
          observacoes: `Evento: ${tituloFinal} · Voucher: ${voucher} · Barco: ${embarcacao || 'Alocado na base'}${nomes_acompanhantes && nomes_acompanhantes.length > 0 ? ' · Acompanhantes: ' + nomes_acompanhantes.join(', ') : ''}`
        })
        .select()
        .single()

      if (!agError && novoAg) {
        agendamentoCriado = novoAg
      }
    }

    return { 
      ok: true, 
      voucher, 
      agendamento: agendamentoCriado,
      dados: payload 
    }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}

export async function cancelarInscricao(inscricaoId: string, mensalistaId?: string) {
  try {
    const supabase = await createClient()

    // 1. Busca dados da inscrição
    const { data: inscricao } = await supabase
      .from('inscricoes_eventos')
      .select('id, evento_id, qtd_vagas, mensalista_id')
      .eq('id', inscricaoId)
      .single()

    if (!inscricao) {
      return { ok: false, error: 'Inscrição não encontrada.' }
    }

    if (mensalistaId && inscricao.mensalista_id && inscricao.mensalista_id !== mensalistaId) {
      return { ok: false, error: 'Não autorizado.' }
    }

    // 2. Atualiza status para cancelado
    await supabase
      .from('inscricoes_eventos')
      .update({ status_pagamento: 'cancelado' })
      .eq('id', inscricaoId)

    // 3. Libera as vagas no evento
    if (inscricao.evento_id) {
      const { data: ev } = await supabase
        .from('eventos')
        .select('vagas_ocupadas')
        .eq('id', inscricao.evento_id)
        .single()

      if (ev) {
        const novasVagas = Math.max(0, (ev.vagas_ocupadas || 0) - (inscricao.qtd_vagas || 1))
        await supabase
          .from('eventos')
          .update({ vagas_ocupadas: novasVagas })
          .eq('id', inscricao.evento_id)
      }
    }

    return { ok: true, message: 'Inscrição cancelada e vagas liberadas com sucesso.' }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}

export async function buscarPrecosClubes() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('configuracoes').select('valor').eq('chave', 'tabela_clubes').maybeSingle()
    if (data?.valor) {
      return {
        mensalista: data.valor.mensalista || 150,
        guardaria: data.valor.guardaria || 150,
        remadas_semanais: data.valor.remadas_semanais || 2,
        horario_corte: data.valor.horario_corte || '19:00',
        dia_manutencao: data.valor.dia_manutencao || 'Segunda-feira'
      }
    }
  } catch (e) {
    console.warn('Erro ao buscar precos', e)
  }
  return { mensalista: 150, guardaria: 150, remadas_semanais: 2, horario_corte: '19:00', dia_manutencao: 'Segunda-feira' }
}

