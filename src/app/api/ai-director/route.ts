import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { tool, zodSchema } from '@ai-sdk/provider-utils'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const maxDuration = 60

const ShotSchema = z.object({
  number: z.number().describe('Shot number in sequence'),
  scene_beat: z.string().describe('The script beat or moment this shot covers'),
  shot_type: z.enum(['wide', 'medium_wide', 'medium', 'medium_close', 'close_up', 'extreme_close_up', 'over_the_shoulder', 'pov', 'insert', 'cutaway', 'establishing']),
  camera_angle: z.enum(['eye_level', 'high_angle', 'low_angle', 'dutch', 'birds_eye', 'worms_eye']),
  camera_movement: z.enum(['static', 'pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'dolly_in', 'dolly_out', 'orbit_left', 'orbit_right', 'crane_up', 'crane_down', 'handheld', 'push_in', 'pull_out', 'tracking']),
  duration_seconds: z.number().min(1).max(30).describe('Estimated duration in seconds'),
  description: z.string().describe('What is happening visually in this shot'),
  dialogue: z.string().optional().describe('Spoken dialogue or voiceover'),
  props: z.string().optional().describe('Comma-separated props needed'),
  notes: z.string().optional().describe('Director notes, timing cues, performance notes'),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, episodeId } = await request.json()

  // Fetch episode context
  const [{ data: episode }, { data: scripts }, { data: existingShots }] = await Promise.all([
    supabase
      .from('episodes')
      .select('*, seasons(title, format, show_bible, brands(company_name), creators(name, niche))')
      .eq('id', episodeId)
      .single(),
    supabase
      .from('scripts')
      .select('content, status, version')
      .eq('episode_id', episodeId)
      .order('version', { ascending: false })
      .limit(1),
    supabase
      .from('shots')
      .select('id')
      .eq('episode_id', episodeId),
  ])

  const season = episode?.seasons as any
  const script = scripts?.[0]?.content ?? null
  const hasExistingShots = (existingShots?.length ?? 0) > 0

  const systemPrompt = `You are an experienced TV director and cinematographer at TCF Studios — a professional studio specialising in 60-second vertical docucomedy for brand clients on TikTok and Instagram Reels.

Your job is to build production shot lists. You are direct and efficient. Ask only what you need — no fluff.

## Episode Context
Show: ${season?.title ?? 'Unknown'}
Episode: ${episode?.number} — ${episode?.title ?? 'Untitled'}${episode?.logline ? `\nLogline: ${episode.logline}` : ''}
Format: ${season?.format ?? '60-second vertical video'}
Creator: ${season?.creators?.name ?? 'Unknown'}${season?.creators?.niche ? ` (${season.creators.niche})` : ''}
Brand: ${season?.brands?.company_name ?? 'No brand'}
${hasExistingShots ? `\n⚠️ This episode already has ${existingShots?.length} shots. You can refine or rebuild.` : ''}

## Script
${script ? script : 'No script yet. Ask the user to describe the episode beats.'}

## Available values
Shot types: wide, medium_wide, medium, medium_close, close_up, extreme_close_up, over_the_shoulder, pov, insert, cutaway, establishing
Camera angles: eye_level, high_angle, low_angle, dutch, birds_eye, worms_eye
Camera movements: static, dolly_in, dolly_out, push_in, pull_out, pan_left, pan_right, tilt_up, tilt_down, orbit_left, orbit_right, crane_up, crane_down, handheld, tracking

## Rules
- Ask 2–3 questions max: shot count, tone, must-haves
- For 60-second videos: 8–14 shots, 4–7 seconds each, total 55–65 seconds
- Pull dialogue directly from the script
- Think 9:16 — close-ups and mediums read better than wides
- When ready, call generate_shot_list — don't ask again for confirmation`

  // Convert messages to the format streamText expects
  const modelMessages = messages.map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: typeof m.content === 'string'
      ? m.content
      : m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') ?? '',
  }))

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: modelMessages,
    tools: {
      generate_shot_list: tool({
        description: 'Generate and commit the complete shot list for this episode to the database.',
        inputSchema: zodSchema(z.object({
          shots: z.array(ShotSchema).min(1).max(20),
          summary: z.string().describe('One-sentence summary of the shot list approach'),
        })),
        execute: async ({ shots, summary }) => {
          if (hasExistingShots) {
            await supabase.from('shots').delete().eq('episode_id', episodeId)
          }

          const { error } = await supabase.from('shots').insert(
            shots.map(shot => ({
              episode_id: episodeId,
              number: shot.number,
              scene_beat: shot.scene_beat,
              shot_type: shot.shot_type,
              camera_angle: shot.camera_angle,
              camera_movement: shot.camera_movement,
              duration_seconds: shot.duration_seconds,
              description: shot.description,
              dialogue: shot.dialogue ?? null,
              props: shot.props ?? null,
              notes: shot.notes ?? null,
              status: 'not_shot',
            }))
          )

          if (error) return { success: false, error: error.message }

          const totalRuntime = shots.reduce((acc, s) => acc + s.duration_seconds, 0)
          return { success: true, shotCount: shots.length, totalRuntime, summary }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
