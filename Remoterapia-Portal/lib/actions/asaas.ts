'use server'

import { createClient } from '../supabase/server'

interface AsaasConfig {
  apiKey: string
  baseUrl: string
  isConfigured: boolean
}

function getAsaasConfig(): AsaasConfig {
  const apiKey = process.env.ASAAS_API_KEY || ''
  const isSandbox = process.env.ASAAS_SANDBOX !== 'false'
  const baseUrl = isSandbox
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3'

  return {
    apiKey,
    baseUrl,
    isConfigured: Boolean(apiKey && apiKey.length > 5)
  }
}

/**
 * Cria ou recupera o cliente no gateway Asaas
 */
export async function criarClienteAsaas(aluno: {
  nome: string
  email?: string
  telefone: string
  cpfCnpj?: string
}) {
  try {
    const config = getAsaasConfig()
    if (!config.isConfigured) {
      console.warn('Asaas API Key não configurada. Operação em modo simulado.')
      return { 
        ok: true, 
        simulado: true, 
        customerId: `cus_sim_${Date.now()}` 
      }
    }

    const telLimpo = aluno.telefone.replace(/\D/g, '')

    const response = await fetch(`${config.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': config.apiKey
      },
      body: JSON.stringify({
        name: aluno.nome.trim(),
        email: aluno.email || undefined,
        mobilePhone: telLimpo,
        cpfCnpj: aluno.cpfCnpj ? aluno.cpfCnpj.replace(/\D/g, '') : undefined,
        notificationDisabled: false
      })
    })

    const data = await response.json()
    if (!response.ok) {
      return { 
        ok: false, 
        error: data.errors?.[0]?.description || 'Erro ao registrar cliente no Asaas.' 
      }
    }

    return { ok: true, customerId: data.id, customer: data }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Falha de comunicação com o gateway de pagamentos.' }
  }
}

/**
 * Gera uma cobrança pontual (Avulso, Evento ou taxa de adesão)
 */
export async function gerarCobrancaAsaas(payload: {
  customerId: string
  mensalistaId?: string
  tipo: 'mensalidade' | 'evento' | 'guardaria' | 'avulso'
  valor: number
  metodo: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  descricao: string
  dueDate?: string
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    phone: string
  }
}) {
  try {
    const config = getAsaasConfig()
    const supabase = await createClient()

    // Data de vencimento padrão: amanhã ou informada
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    const dueDate = payload.dueDate || amanha.toISOString().split('T')[0]

    if (!config.isConfigured) {
      console.warn('Asaas API Key não configurada. Criando cobrança simulada.')
      const cobrancaId = `pay_sim_${Date.now()}`

      try {
        await supabase.from('transacoes').insert({
          mensalista_id: payload.mensalistaId || null,
          tipo: payload.tipo,
          gateway: 'asaas_simulado',
          gateway_cobranca_id: cobrancaId,
          valor: payload.valor,
          status: 'PENDING',
          metodo: payload.metodo,
          data_vencimento: dueDate,
          metadados: { descricao: payload.descricao }
        })
      } catch (e: any) {
        console.warn('Erro ao registrar transação no Supabase:', e.message)
      }

      return {
        ok: true,
        simulado: true,
        cobrancaId,
        pix: {
          copiaECola: '00020126580014br.gov.bcb.pix0136remoterapia-simulado-pix-copia-e-cola520400005303986540585.005802BR5920Remoterapia Santos6006Santos62070503***6304ABCD',
          qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=remoterapia-simulado'
        }
      }
    }

    const bodyEnvio: any = {
      customer: payload.customerId,
      billingType: payload.metodo,
      value: payload.valor,
      dueDate,
      description: payload.descricao,
      postalService: false
    }

    if (payload.metodo === 'CREDIT_CARD' && payload.creditCard) {
      bodyEnvio.creditCard = payload.creditCard
      bodyEnvio.creditCardHolderInfo = payload.creditCardHolderInfo
    }

    const response = await fetch(`${config.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': config.apiKey
      },
      body: JSON.stringify(bodyEnvio)
    })

    const data = await response.json()
    if (!response.ok) {
      return { 
        ok: false, 
        error: data.errors?.[0]?.description || 'Erro ao gerar cobrança no gateway.' 
      }
    }

    let pixInfo: any = null
    // Se for PIX, busca QR Code
    if (payload.metodo === 'PIX' && data.id) {
      try {
        const pixRes = await fetch(`${config.baseUrl}/payments/${data.id}/pixQrCode`, {
          headers: { 'access_token': config.apiKey }
        })
        if (pixRes.ok) {
          const pixData = await pixRes.json()
          pixInfo = {
            copiaECola: pixData.payload,
            qrCodeImage: `data:image/png;base64,${pixData.encodedImage}`
          }
        }
      } catch (e: any) {
        console.warn('Erro ao obter QR Code Pix do Asaas:', e.message)
      }
    }

    // Registra no banco
    try {
      await supabase.from('transacoes').insert({
        mensalista_id: payload.mensalistaId || null,
        tipo: payload.tipo,
        gateway: 'asaas',
        gateway_cobranca_id: data.id,
        valor: payload.valor,
        status: data.status || 'PENDING',
        metodo: payload.metodo,
        pix_qrcode: pixInfo?.qrCodeImage || null,
        pix_copia_cola: pixInfo?.copiaECola || null,
        link_pagamento: data.invoiceUrl || data.bankSlipUrl || null,
        data_vencimento: dueDate,
        metadados: data
      })
    } catch (e: any) {
      console.warn('Erro ao salvar transação no Supabase:', e.message)
    }

    return {
      ok: true,
      cobrancaId: data.id,
      status: data.status,
      invoiceUrl: data.invoiceUrl,
      pix: pixInfo
    }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Falha ao processar pagamento.' }
  }
}

/**
 * Cria uma assinatura recorrente no Asaas (Mensalista / Guardaria)
 */
export async function criarAssinaturaAsaas(payload: {
  customerId: string
  mensalistaId?: string
  valor: number
  cycle: 'MONTHLY'
  nextDueDate: string
  descricao: string
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  creditCard?: any
  creditCardHolderInfo?: any
}) {
  try {
    const config = getAsaasConfig()
    const supabase = await createClient()

    if (!config.isConfigured) {
      console.warn('Asaas API Key não configurada. Assinatura em modo simulado.')
      const subId = `sub_sim_${Date.now()}`

      if (payload.mensalistaId) {
        try {
          await supabase
            .from('mensalistas')
            .update({ 
              gateway_cliente_id: payload.customerId,
              status_pagamento: 'ativo'
            })
            .eq('id', payload.mensalistaId)
        } catch {
          // Ignora se coluna ainda não existir
        }
      }

      return { ok: true, simulado: true, subscriptionId: subId }
    }

    const bodyEnvio: any = {
      customer: payload.customerId,
      billingType: payload.billingType,
      value: payload.valor,
      nextDueDate: payload.nextDueDate,
      cycle: payload.cycle,
      description: payload.descricao
    }

    if (payload.billingType === 'CREDIT_CARD' && payload.creditCard) {
      bodyEnvio.creditCard = payload.creditCard
      bodyEnvio.creditCardHolderInfo = payload.creditCardHolderInfo
    }

    const response = await fetch(`${config.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': config.apiKey
      },
      body: JSON.stringify(bodyEnvio)
    })

    const data = await response.json()
    if (!response.ok) {
      return { 
        ok: false, 
        error: data.errors?.[0]?.description || 'Erro ao criar assinatura no gateway.' 
      }
    }

    if (payload.mensalistaId) {
      try {
        await supabase
          .from('mensalistas')
          .update({ 
            gateway_cliente_id: payload.customerId,
            status_pagamento: 'ativo'
          })
          .eq('id', payload.mensalistaId)
      } catch {
        // Ignora se coluna ainda não existir
      }
    }

    return { ok: true, subscriptionId: data.id, subscription: data }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Falha ao registrar assinatura no gateway.' }
  }
}

/**
 * Consulta o status de uma cobrança no gateway
 */
export async function consultarStatusCobrancaAsaas(cobrancaId: string) {
  try {
    const config = getAsaasConfig()
    if (!config.isConfigured || cobrancaId.startsWith('pay_sim_')) {
      return { ok: true, status: 'RECEIVED', simulado: true }
    }

    const response = await fetch(`${config.baseUrl}/payments/${cobrancaId}`, {
      headers: { 'access_token': config.apiKey }
    })

    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.errors?.[0]?.description || 'Cobrança não encontrada.' }
    }

    const supabase = await createClient()
    try {
      await supabase
        .from('transacoes')
        .update({ 
          status: data.status,
          data_pagamento: data.paymentDate ? new Date(data.paymentDate).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('gateway_cobranca_id', cobrancaId)
    } catch {
      // Ignora erro
    }

    return { ok: true, status: data.status, cobranca: data }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Erro ao consultar cobrança.' }
  }
}
