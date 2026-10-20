import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text, voice = 'fr-FR-Neural2-C' } = await req.json()

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'text_required' }, { status: 400 })
  }

  const text_hash = createHash('sha256').update(text + voice).digest('hex')
  const supabase = await createClient()

  // Check cache
  const { data: cached } = await supabase
    .from('audio_cache')
    .select('storage_url')
    .eq('text_hash', text_hash)
    .single()

  if (cached) return NextResponse.json({ url: cached.storage_url })

  // Call Google Cloud TTS
  let ttsResponse: Response
  try {
    ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'fr-FR', name: voice },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9 }
        })
      }
    )
  } catch {
    return NextResponse.json({ error: 'tts_unavailable' }, { status: 502 })
  }

  const payload: unknown = await ttsResponse.json().catch(() => null)
  const audioContent = payload && typeof payload === 'object' && 'audioContent' in payload
    ? (payload as { audioContent?: unknown }).audioContent
    : undefined

  if (!ttsResponse.ok || typeof audioContent !== 'string' || !audioContent) {
    return NextResponse.json({ error: 'tts_unavailable' }, { status: 502 })
  }

  const buffer = Buffer.from(audioContent, 'base64')

  // Upload to Supabase Storage
  const filename = `tts/${text_hash}.mp3`
  await supabase.storage.from('audio').upload(filename, buffer, {
    contentType: 'audio/mpeg',
    upsert: true
  })

  const { data: { publicUrl } } = supabase.storage
    .from('audio')
    .getPublicUrl(filename)

  // Save to cache table
  await supabase.from('audio_cache').insert({
    text_hash,
    text_content: text,
    voice,
    storage_url: publicUrl
  })

  return NextResponse.json({ url: publicUrl })
}
