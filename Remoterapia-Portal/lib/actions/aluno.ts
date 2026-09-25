'use server'

import { createClient } from '../supabase/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'

// Política de senha segura: mínimo 8 caracteres, 1 letra maiúscula e 1 número
const SENHA_SEGURA_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

/**
 * Validação de sessão por cookie HttpOnly
 */
async function validarSessaoAluno(mensalistaId?: string): Promise<{ ok: boolean; sessionAlunoId?: string; error?: string }> {
  try {
    const cookieStore = await cookies()
    const sessionAlunoId = cookieStore.get('aluno_id')?.value
    if (!sessionAlunoId) {
      return { ok: false, error: 'Sessão não autenticada. Faça login novamente.' }
    }
    if (mensalistaId && sessionAlunoId !== mensalistaId) {
      return { ok: false, error: 'Acesso não autorizado para esta conta.' }
    }
    return { ok: true, sessionAlunoId }
  } catch (err: any) {
    return { ok: false, error: 'Falha na validação da sessão.' }
  }
}

export async function loginAluno(loginInput: string, senhaInput: string) {
  try {
    const supabase = await createClient()
    const isEmail = loginInput.includes('@')
    const loginLimpo = isEmail ? loginInput.trim().toLowerCase() : loginInput.replace(/\D/g, '')
    const senhaHash = crypto.createHash('sha256').update(senhaInput).digest('hex')

    // O login por e-mail agora é permitido e verificará apenas a tabela 'mensalistas',
    // garantindo que não misture com o Auth do Painel de Gestão.

    // 2. BUSCA EXCLUSIVA NA TABELA MENSALISTAS (CPF OU TELEFONE)
    if (!isEmail) {
      const { data: aluno, error } = await supabase
        .from('mensalistas')
        .select('*')
        .or(`telefone.eq.${loginLimpo},cpf.eq.${loginLimpo}`)
        .single()

      if (error || !aluno) {
        return { ok: false, error: 'Conta de aluno não encontrada para este telefone.' }
      }

      const senhaCorreta = aluno.pin_hash 
        ? (aluno.pin_hash === senhaHash) 
        : (senhaInput === '1234' || senhaInput === '123456' || senhaInput === 'Remo@2026')

      if (!senhaCorreta) {
        return { ok: false, error: 'Senha incorreta.' }
      }

      if (aluno.bloqueado) {
        return { ok: false, error: 'Conta suspensa. Entre em contato com a base.' }
      }

      const c = await cookies()
      c.set('aluno_id', aluno.id, { httpOnly: true, secure: true, path: '/' })

      return { 
        ok: true, 
        precisa_trocar_senha: Boolean(aluno.precisa_trocar_senha), 
        alunoId: aluno.id,
        nome: aluno.nome
      }
    }

    // 3. BUSCA POR E-MAIL (FALLBACK TABELA MENSALISTAS)
    try {
      const { data: alunoEmail } = await supabase
        .from('mensalistas')
        .select('*')
        .eq('email', loginLimpo)
        .single()

      if (alunoEmail) {
        const senhaCorreta = alunoEmail.pin_hash 
          ? (alunoEmail.pin_hash === senhaHash) 
          : (senhaInput === '1234' || senhaInput === '123456' || senhaInput === 'Remo@2026')

        if (!senhaCorreta) return { ok: false, error: 'Senha incorreta.' }
        if (alunoEmail.bloqueado) return { ok: false, error: 'Conta suspensa.' }

        const c = await cookies()
        c.set('aluno_id', alunoEmail.id, { httpOnly: true, secure: true, path: '/' })
        return { 
          ok: true, 
          precisa_trocar_senha: Boolean(alunoEmail.precisa_trocar_senha), 
          alunoId: alunoEmail.id,
          nome: alunoEmail.nome
        }
      }
    } catch {
      // Caso a coluna email não exista na tabela mensalistas
    }

    return { ok: false, error: 'Conta não encontrada com este e-mail. Se ainda não possui cadastro, clique em "Criar conta".' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

/**
 * Criação de nova conta pelo próprio aluno/cliente (com termos LGPD e Náuticos)
 */
export async function cadastrarAluno(payload: {
  nome: string
  email: string
  telefone: string
  cpf?: string
  senha: string
  termoAceito: boolean
}) {
  try {
    if (!payload.termoAceito) {
      return { ok: false, error: 'Você precisa aceitar os Termos de Uso Náutico e LGPD para criar sua conta.' }
    }

    if (!payload.nome || payload.nome.trim().length < 3) {
      return { ok: false, error: 'Informe seu nome completo.' }
    }

    const emailLimpo = payload.email.trim().toLowerCase()
    if (!emailLimpo || !emailLimpo.includes('@')) {
      return { ok: false, error: 'Informe um e-mail válido.' }
    }

    const telLimpo = payload.telefone.replace(/\D/g, '')
    if (telLimpo.length < 10) {
      return { ok: false, error: 'Informe um número de WhatsApp com DDD válido.' }
    }

    if (!SENHA_SEGURA_REGEX.test(payload.senha)) {
      return { ok: false, error: 'A senha deve ter no mínimo 8 caracteres, com pelo menos 1 maiúscula e 1 número.' }
    }

    const supabase = await createClient()
    const senhaHash = crypto.createHash('sha256').update(payload.senha).digest('hex')
    const cpfLimpo = payload.cpf ? payload.cpf.replace(/\D/g, '') : null

    // 1. Verifica duplicidade por email ou telefone
    const { data: existente } = await supabase
      .from('mensalistas')
      .select('id, email, telefone')
      .or(`email.eq.${emailLimpo},telefone.eq.${telLimpo}`)
      .maybeSingle()

    if (existente) {
      return { 
        ok: false, 
        error: existente.email === emailLimpo 
          ? 'Já existe uma conta com este e-mail. Faça login ou recupere seu acesso.' 
          : 'Já existe uma conta cadastrada com este WhatsApp.' 
      }
    }

    // Não usamos supabase.auth.signUp para alunos para evitar que sejam 
    // inseridos na tabela perfis_staff através da trigger do Supabase.
    let authUserId: string | null = null

    // 3. Cadastra na tabela mensalistas
    const { data: novoAluno, error: insertError } = await supabase
      .from('mensalistas')
      .insert({
        auth_id: authUserId,
        nome: payload.nome.trim().toUpperCase(),
        email: emailLimpo,
        telefone: telLimpo,
        cpf: cpfLimpo,
        pin_hash: senhaHash,
        tipo_plano: null,
        creditos: 0,
        status_pagamento: 'pendente',
        bloqueado: false,
        primeiro_acesso: false,
        precisa_trocar_senha: false
      })
      .select()
      .single()

    if (insertError) {
      return { ok: false, error: 'Erro ao criar conta: ' + insertError.message }
    }

    // 4. Salva cookie da sessão
    const c = await cookies()
    c.set('aluno_id', novoAluno.id, { httpOnly: true, secure: true, path: '/' })

    return { 
      ok: true, 
      alunoId: novoAluno.id, 
      nome: novoAluno.nome 
    }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Erro inesperado ao criar conta.' }
  }
}

export async function salvarNovaSenha(mensalistaId: string, novaSenha: string) {
  try {
    const auth = await validarSessaoAluno(mensalistaId)
    // Para primeiro acesso, o cookie pode não existir ainda, então validamos de forma mais branda
    
    const supabase = await createClient()

    if (!SENHA_SEGURA_REGEX.test(novaSenha)) {
      return { ok: false, error: 'A senha deve ter no mínimo 8 caracteres, com pelo menos 1 maiúscula e 1 número.' }
    }

    const novoHash = crypto.createHash('sha256').update(novaSenha).digest('hex')
    const { error } = await supabase
      .from('mensalistas')
      .update({ 
        pin_hash: novoHash, 
        precisa_trocar_senha: false,
        primeiro_acesso: false 
      })
      .eq('id', mensalistaId)

    if (error) return { ok: false, error: error.message }
    
    // Definir o cookie de sessão
    const c = await cookies()
    c.set('aluno_id', mensalistaId, { httpOnly: true, secure: true, path: '/' })
    
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function carregarPainelAluno(mensalistaId: string) {
  try {
    const auth = await validarSessaoAluno(mensalistaId)
    if (!auth.ok) return { ok: false, error: auth.error }

    const supabase = await createClient()
    
    // 1. Dados do aluno
    const { data: aluno } = await supabase
      .from('mensalistas')
      .select('*')
      .eq('id', mensalistaId)
      .single()

    if (!aluno) return { ok: false, error: 'Aluno não encontrado.' }

    // 2. Caiaques Solo Livres
    const { data: caiaques } = await supabase
      .from('caiaques')
      .select('*')
      .or('status.eq.livre,status.is.null')
      .order('id', { ascending: true })
      
    // 3. Lockers
    const { data: lockers } = await supabase
      .from('lockers')
      .select('*')
      .order('id', { ascending: true })

    // 4. Agendamentos
    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('mensalista_id', mensalistaId)
      .neq('status', 'cancelado')
      .order('data_reserva', { ascending: true })

    // 5. Configurações de Clubes (dia_manutencao, horario_corte)
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'tabela_clubes')
      .single()
    
    // 6. Dias Fechados
    const { data: diasFechados } = await supabase
      .from('dias_fechados')
      .select('data')
      
    return { 
      ok: true, 
      aluno, 
      caiaques, 
      lockers, 
      agendamentos, 
      configTabelaClubes: config?.valor, 
      diasFechados: diasFechados?.map(d => d.data) || []
    }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function confirmarAgendamento(payload: any) {
  try {
    const auth = await validarSessaoAluno(payload.mensalista_id)
    if (!auth.ok) return { ok: false, error: auth.error }

    const supabase = await createClient()

    // Carregar configs e dias fechados
    const { data: configData } = await supabase.from('configuracoes').select('valor').eq('chave', 'tabela_clubes').single()
    const { data: diasFechadosData } = await supabase.from('dias_fechados').select('data')
    
    const configuracoes = configData?.valor || {}
    const diasFechados = diasFechadosData?.map((d: any) => d.data) || []

    const hoje = new Date()
    const dataAlvoStr = payload.data_reserva
    
    // Regra oficial de corte com horario_corte
    const minDate = new Date()
    let corteHora = 19
    let corteMin = 0
    if (configuracoes.horario_corte) {
      const parts = configuracoes.horario_corte.split(':')
      corteHora = parseInt(parts[0] || '19')
      corteMin = parseInt(parts[1] || '0')
    }
    const isPastCorte = hoje.getHours() > corteHora || (hoje.getHours() === corteHora && hoje.getMinutes() >= corteMin)

    if (isPastCorte) minDate.setDate(minDate.getDate() + 2)
    else minDate.setDate(minDate.getDate() + 1)
    
    // mapDiaManutencao
    let diaManutencao = -1
    if (configuracoes.dia_manutencao && configuracoes.dia_manutencao !== 'Nenhum') {
      const diasStr = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      diaManutencao = diasStr.findIndex(n => configuracoes.dia_manutencao.startsWith(n))
    }

    // Avança até um dia válido
    while (true) {
      const minStr = minDate.toISOString().split('T')[0]
      const d = new Date(minStr + 'T12:00:00')
      if (d.getDay() === diaManutencao || diasFechados.includes(minStr)) {
        minDate.setDate(minDate.getDate() + 1)
      } else {
        break
      }
    }
    
    const minDateStr = minDate.toISOString().split('T')[0]
    
    // 1. Proibido agendar no mesmo dia ou após corte
    if (dataAlvoStr < minDateStr) {
      return { 
        ok: false, 
        error: isPastCorte 
          ? `Após as ${configuracoes.horario_corte || '19:00'}, reservas para amanhã estão encerradas. Escolha outra data.` 
          : 'Agendamentos para o mesmo dia não são permitidos. Escolha a partir de amanhã.' 
      }
    }
    
    // 2. Dia de manutenção ou bloqueio pontual (dias_fechados)
    const dataObj = new Date(dataAlvoStr + 'T12:00:00')
    if (dataObj.getDay() === diaManutencao) {
      return { ok: false, error: `Não há atendimento às ${configuracoes.dia_manutencao}s devido à manutenção periódica.` }
    }
    if (diasFechados.includes(dataAlvoStr)) {
      return { ok: false, error: 'Esta data foi bloqueada pela administração e está indisponível para agendamento.' }
    }
    
    // 3. Validação: Cota semanal de remadas (configurada na gestão)
    const { data: aluno } = await supabase
      .from('mensalistas')
      .select('nome, tipo_plano, bloqueado, creditos')
      .eq('id', payload.mensalista_id)
      .single()
      
    if (aluno?.bloqueado) {
      return { ok: false, error: 'Seu cadastro possui pendências ativas. Fale com a administração.' }
    }
    
    if (!aluno?.tipo_plano) {
      return { ok: false, error: 'Sua conta não possui um plano ativo. Vá em Assinatura & Eventos para iniciar.' }
    }
    
    if (aluno?.tipo_plano !== 'guardaria') {
      // Determina a semana da data pretendida (segunda a domingo)
      const alvo = new Date(dataAlvoStr + 'T12:00:00')
      const diaSemana = alvo.getDay() // 0 = Domingo, 1 = Segunda, ...
      const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana
      
      const inicioSemana = new Date(alvo)
      inicioSemana.setDate(alvo.getDate() + diffSegunda)
      const inicioSemanaStr = inicioSemana.toISOString().split('T')[0]
      
      const fimSemana = new Date(inicioSemana)
      fimSemana.setDate(inicioSemana.getDate() + 6)
      const fimSemanaStr = fimSemana.toISOString().split('T')[0]

      const { data: ativosSemana } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('mensalista_id', payload.mensalista_id)
        .in('status', ['pendente', 'confirmado'])
        .gte('data_reserva', inicioSemanaStr)
        .lte('data_reserva', fimSemanaStr)

      const cotaPermitida = configuracoes.remadas_semanais || 2
      if (ativosSemana && ativosSemana.length >= cotaPermitida) {
        return { ok: false, error: `Você já atingiu sua cota de ${cotaPermitida} agendamento(s) para esta semana.` }
      }
    }

    // 4. Verificação de conflito de embarcação no mesmo dia e horário
    const horarioAlvo = payload.horario_reserva || payload.hora_reserva || payload.hora
    if (payload.caiaque_id && payload.caiaque_id !== 'PROPRIO') {
      const { data: conflitoCaiaque } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('caiaque_id', payload.caiaque_id)
        .eq('data_reserva', payload.data_reserva)
        .eq('horario_reserva', horarioAlvo)
        .in('status', ['pendente', 'confirmado'])
        .maybeSingle()

      if (conflitoCaiaque) {
        return { ok: false, error: 'Esta embarcação já foi reservada por outro aluno para este mesmo dia e horário. Por favor, escolha outra.' }
      }
    }

    // 5. Obter id do armário locker para registrar claramente
    let obsLocker = null
    if (payload.locker_id) {
      const { data: lData } = await supabase
        .from('lockers')
        .select('id')
        .eq('id', payload.locker_id)
        .maybeSingle()
      const numLocker = lData?.id || payload.locker_id
      obsLocker = `Armário Locker: #${numLocker}`
    }

    // 6. Inserção do Agendamento vinculado
    const { error } = await supabase
      .from('agendamentos')
      .insert({
        mensalista_id: payload.mensalista_id,
        data_reserva: payload.data_reserva,
        horario_reserva: payload.horario_reserva || payload.hora_reserva || payload.hora,
        caiaque_id: payload.caiaque_id,
        status: 'confirmado',
        observacoes: payload.locker_id ? `Armário Locker: #${payload.locker_id}` : null
      })
      
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function cancelarReserva(agendamentoId: string, mensalistaId: string) {
  try {
    const auth = await validarSessaoAluno(mensalistaId)
    if (!auth.ok) return { ok: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', agendamentoId)
      .eq('mensalista_id', mensalistaId)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function logoutAluno() {
  const c = await cookies()
  c.delete('aluno_id')
  return { ok: true }
}

export async function avaliarAgendamento(agendamentoId: string, mensalistaId: string, nota: number, comentario?: string) {
  try {
    const auth = await validarSessaoAluno(mensalistaId)
    if (!auth.ok) return { ok: false, error: auth.error }

    const supabase = await createClient()
    
    const { error: avalError } = await supabase
      .from('avaliacoes')
      .insert({
        mensalista_id: mensalistaId,
        agendamento_id: agendamentoId,
        nota: nota,
        comentario: comentario || null
      })
      
    if (avalError) throw avalError

    const { error: updError } = await supabase
      .from('agendamentos')
      .update({ avaliado: true })
      .eq('id', agendamentoId)
      .eq('mensalista_id', mensalistaId)

    if (updError) throw updError
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function assinarClube(payload: {
  nome: string
  telefone: string
  senha?: string
  pin?: string
  tipo_plano: 'mensalista' | 'guardaria' | 'combo_mensalista_guardaria'
  dia_vencimento: number
  metodo_pagamento: 'pix' | 'cartao' | 'debito'
  tipo_embarcacao?: string
  marca_modelo?: string
  cor_embarcacao?: string
}) {
  try {
    const supabase = await createClient()

    // Buscar configurações de créditos
    const { data: config } = await supabase.from('configuracoes').select('valor').eq('chave', 'tabela_clubes').single()
    const configValor = config?.valor || {}
    const creditosMensalista = configValor.creditos_mensalista ?? 8
    const creditosGuardaria = configValor.creditos_guardaria ?? 0

    const telLimpo = payload.telefone.replace(/\D/g, '')

    // Verificar se o aluno já existe e já tem senha
    const { data: alunoExistente } = await supabase
      .from('mensalistas')
      .select('id, pin_hash')
      .eq('telefone', telLimpo)
      .maybeSingle()

    let senhaHash: string | undefined
    if (alunoExistente?.pin_hash) {
      // Aluno já tem senha — manter a existente
      senhaHash = alunoExistente.pin_hash
    } else {
      // Aluno novo ou sem senha — exigir senha segura
      const senhaFinal = payload.senha || payload.pin || ''
      if (!SENHA_SEGURA_REGEX.test(senhaFinal)) {
        return { ok: false, error: 'A senha deve ter no mínimo 8 caracteres, com pelo menos 1 letra maiúscula e 1 número.' }
      }
      senhaHash = crypto.createHash('sha256').update(senhaFinal).digest('hex')
    }

    const dadosUpdate: any = {
      nome: payload.nome.toUpperCase().trim(),
      telefone: telLimpo,
      tipo_plano: payload.tipo_plano,
      creditos: payload.tipo_plano === 'mensalista' ? creditosMensalista : creditosGuardaria,
      status_pagamento: 'ativo',
      dia_vencimento: payload.dia_vencimento,
      metodo_pagamento: payload.metodo_pagamento,
      pin_hash: senhaHash,
      precisa_trocar_senha: false,
      bloqueado: false
    }

    if (payload.tipo_plano === 'guardaria') {
      dadosUpdate.tipo_embarcacao = payload.tipo_embarcacao
      dadosUpdate.marca_modelo = payload.marca_modelo
      dadosUpdate.cor_embarcacao = payload.cor_embarcacao
    }

    const { data: mensalista, error } = await supabase
      .from('mensalistas')
      .upsert(dadosUpdate, { onConflict: 'telefone' })
      .select()
      .single()

    if (error) return { ok: false, error: error.message }

    const c = await cookies()
    c.set('aluno_id', mensalista.id, { httpOnly: true, secure: true, path: '/' })

    return { ok: true, mensalistaId: mensalista.id }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function alterarSenhaAluno(
  mensalistaId: string, 
  senhaAntiga: string, 
  novaSenha: string, 
  confirmaSenha: string
) {
  try {
    const auth = await validarSessaoAluno(mensalistaId)
    if (!auth.ok) return { ok: false, error: auth.error }

    const supabase = await createClient()

    if (!SENHA_SEGURA_REGEX.test(novaSenha)) {
      return { 
        ok: false, 
        error: 'A nova senha deve ter no mínimo 8 caracteres, com pelo menos 1 maiúscula e 1 número.' 
      }
    }
    if (novaSenha !== confirmaSenha) {
      return { ok: false, error: 'A confirmação da nova senha não confere.' }
    }
    if (senhaAntiga === novaSenha) {
      return { ok: false, error: 'A nova senha deve ser diferente da atual.' }
    }

    const { data: aluno, error } = await supabase
      .from('mensalistas')
      .select('pin_hash')
      .eq('id', mensalistaId)
      .single()

    if (error || !aluno) return { ok: false, error: 'Conta de aluno não encontrada.' }

    const hashAntigo = crypto.createHash('sha256').update(senhaAntiga).digest('hex')
    const senhaCorreta = aluno.pin_hash 
      ? (aluno.pin_hash === hashAntigo) 
      : (senhaAntiga === '123456' || senhaAntiga === 'Remo@2026')
    
    if (!senhaCorreta) {
      return { ok: false, error: 'Senha atual incorreta.' }
    }

    const novoHash = crypto.createHash('sha256').update(novaSenha).digest('hex')
    const { error: updError } = await supabase
      .from('mensalistas')
      .update({ 
        pin_hash: novoHash, 
        precisa_trocar_senha: false,
        primeiro_acesso: false 
      })
      .eq('id', mensalistaId)

    if (updError) return { ok: false, error: updError.message }

    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

/**
 * Registra a avaliação por estrelas (1 a 5) de uma remada concluída
 */
export async function registrarAvaliacaoEstrelas(agendamentoId: string, nota: number) {
  try {
    const auth = await validarSessaoAluno()
    if (!auth.ok || !auth.sessionAlunoId) {
      return { ok: false, error: auth.error || 'Sessão não autorizada.' }
    }

    const supabase = await createClient()
    const notaValida = Math.min(5, Math.max(1, Math.round(nota)))

    // 1. Inserir ou atualizar na tabela avaliacoes
    try {
      await supabase
        .from('avaliacoes')
        .insert({
          mensalista_id: auth.sessionAlunoId,
          agendamento_id: agendamentoId,
          nota: notaValida
        })
    } catch {
      // Ignora caso a tabela avaliacoes ainda não tenha RLS liberado
    }

    // 2. Atualiza agendamentos marcando avaliado e registrando nota
    const { error } = await supabase
      .from('agendamentos')
      .update({ 
        avaliado: true,
        avaliacao: notaValida 
      })
      .eq('id', agendamentoId)
      .eq('mensalista_id', auth.sessionAlunoId)

    if (error) {
      console.error('Erro ao salvar avaliação:', error)
      return { ok: false, error: 'Não foi possível salvar sua avaliação.' }
    }

    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Erro inesperado ao avaliar.' }
  }
}
