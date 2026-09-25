import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  const supabase = await createClient()

  // 1. Troca o código pela sessão do Supabase (OAuth Auth)
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
  
  if (sessionError) {
    console.error('Erro no exchangeCodeForSession:', sessionError)
    return NextResponse.redirect(`${origin}/?error=oauth_error`)
  }

  // 2. Pega os dados do usuário autenticado no Google
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || !user.email) {
    return NextResponse.redirect(`${origin}/?error=no_user_data`)
  }

  const email = user.email.toLowerCase()
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Aluno Remoterapia'
  const telefone = '' // OAuth não dá o telefone garantido na maioria das vezes

  // 3. Procura o e-mail na nossa tabela customizada 'mensalistas'
  // (Precisamos buscar ignorando possíveis espaços e case-sensitive)
  const { data: mensalistaExistente, error: searchError } = await supabase
    .from('mensalistas')
    .select('id')
    .eq('email', email)
    .single()

  let alunoIdToSet = ''

  if (mensalistaExistente && mensalistaExistente.id) {
    // 3A. Já existe, apenas pega o ID
    alunoIdToSet = mensalistaExistente.id
  } else {
    // 3B. Não existe, vamos criar a conta (tipo plano 'comum' como padrão)
    const { data: novoMensalista, error: insertError } = await supabase
      .from('mensalistas')
      .insert({
        nome: fullName.toUpperCase().trim(),
        email: email,
        telefone: null,
        tipo_plano: null,
        auth_id: user.id,
        creditos: 0,
        status_pagamento: 'ativo', // Comum não tem pendência de mensalidade
        bloqueado: false
      })
      .select('id')
      .single()

    if (insertError || !novoMensalista) {
      console.error('Erro ao criar mensalista via OAuth:', insertError)
      return NextResponse.redirect(`${origin}/?error=create_user_failed`)
    }
    
    alunoIdToSet = novoMensalista.id
  }

  // 4. Se chegou aqui e tem alunoIdToSet, configura o cookie da sessão customizada!
  if (alunoIdToSet) {
    const c = await cookies()
    c.set('aluno_id', alunoIdToSet, { httpOnly: true, secure: true, path: '/' })
  }

  // 5. Redireciona de volta para a aplicação (que vai ler o localStorage/cookie e abrir)
  return NextResponse.redirect(`${origin}/?oauth_aluno_id=${alunoIdToSet}#home`)
}
