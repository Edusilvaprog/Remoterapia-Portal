import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { createClient } from '@/lib/supabase/server'

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export async function POST(request: Request) {
  try {
    const { alunoId, base64 } = await request.json()
    if (!alunoId || !base64) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    let fotoUrl = base64
    const supabase = await createClient()

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const uploadRes = await cloudinary.uploader.upload(base64, {
        folder: 'remoterapia/perfil',
        resource_type: 'image',
      })
      fotoUrl = uploadRes.secure_url
    } else {
      // Se não houver Cloudinary configurado, avisa que o ideal é ter. 
      // Por ora, segue salvando a imagem Base64.
    }

    const { error } = await supabase
      .from('mensalistas')
      .update({ avatar: fotoUrl })
      .eq('id', alunoId)

    if (error) throw error

    return NextResponse.json({ ok: true, url: fotoUrl })
  } catch (error: any) {
    console.error('Erro no upload de foto do aluno:', error)
    return NextResponse.json({ error: error.message || 'Erro ao processar foto' }, { status: 500 })
  }
}
