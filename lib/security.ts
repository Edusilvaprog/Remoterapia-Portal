import 'server-only'
import { createClient } from './supabase/server'

export async function getAuthenticatedAluno(expectedId?: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data: aluno } = await supabase.from('mensalistas')
    .select('id,nome,email,telefone,tipo_plano,bloqueado,precisa_trocar_senha')
    .eq('auth_id', user.id).is('arquivado_em', null).maybeSingle()
  if (!aluno || (expectedId && expectedId !== aluno.id)) return null
  return { supabase, user, aluno }
}
