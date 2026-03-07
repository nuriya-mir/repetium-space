import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { group_id, letter_targets, format, difficulty_step } = await req.json()

  // Generate cache key
  const cache_key = createHash('sha256')
    .update(JSON.stringify({ group_id, letter_targets, format, difficulty_step }))
    .digest('hex')

  const supabase = await createClient()

  // Check cache first
  const { data: cached } = await supabase
    .from('generated_texts')
    .select('*')
    .eq('cache_key', cache_key)
    .single()

  if (cached) return NextResponse.json(cached)

  // Generate new text
  const prompt = buildPrompt(group_id, letter_targets, format, difficulty_step)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''

  // Save to cache
  const { data: saved } = await supabase
    .from('generated_texts')
    .insert({
      cache_key,
      group_id,
      letter_targets,
      format,
      content,
      word_count: content.split(' ').length
    })
    .select()
    .single()

  return NextResponse.json(saved)
}

function buildPrompt(
  group_id: string,
  letter_targets: string[],
  format: string,
  difficulty_step: number
): string {
  return `Generate a French language learning text for adult learners.

Group: ${group_id}
Target letters/patterns: ${letter_targets.join(', ')}
Format: ${format}
Difficulty: ${difficulty_step}/5

Requirements:
- 100–150 words
- Natural French sentences (not artificial)
- Target patterns appear naturally, not forced
- Appropriate for adult learners
- No meta-commentary, just the text itself

Return only the French text, nothing else.`
}
