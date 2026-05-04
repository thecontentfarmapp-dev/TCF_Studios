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

  const systemPrompt = `You are a seasoned creative director and cinematographer at TCF Studios. Your job is to translate a director's brief — however rough, detailed, or unconventional — into a complete, production-ready shot list.

## Episode Context
Show: ${season?.title ?? 'Unknown'}
Episode: ${episode?.number} — ${episode?.title ?? 'Untitled'}${episode?.logline ? `\nLogline: ${episode.logline}` : ''}
Format: ${season?.format ?? '60-second vertical video'}
Creator / Talent: ${season?.creators?.name ?? 'Unknown'}${season?.creators?.niche ? ` (${season.creators.niche})` : ''}
Brand: ${season?.brands?.company_name ?? 'No brand'}
${hasExistingShots ? `\n⚠️ This episode already has ${existingShots?.length} shots. Rebuild from scratch unless the user says otherwise.` : ''}

## Script
${script ? script : '(No script attached — work from the brief the user provides.)'}

## Available values (use exactly as written)
Shot types: wide, medium_wide, medium, medium_close, close_up, extreme_close_up, over_the_shoulder, pov, insert, cutaway, establishing
Camera angles: eye_level, high_angle, low_angle, dutch, birds_eye, worms_eye
Camera movements: static, dolly_in, dolly_out, push_in, pull_out, pan_left, pan_right, tilt_up, tilt_down, orbit_left, orbit_right, crane_up, crane_down, handheld, tracking

## How to behave

### If the user gives you enough to work with → generate immediately
If their message includes a shot count, sequence intent, locations, talent direction, or any meaningful production detail — call generate_shot_list right away. Do not ask follow-up questions. Interpret their intent and fill in the gaps with professional judgment.

### If something critical is genuinely missing → ask ONE question
The only reason to ask a question is if you cannot build a coherent shot list without the answer. Ask at most one question. Never ask about shot count if you can infer it from context. Never ask about tone if the script or brief makes it clear.

### Shot counts and timing
- The user decides how many shots. If they say 50 shots in 60 seconds, build 50 shots averaging ~1.2 seconds each — that's fast-cut montage and a legitimate production style.
- If they say 3 shots, build 3 hero shots, each weighted and deliberate.
- Total runtime should match the stated duration. No hard limits on shot count.

### Interpreting the brief
- "Sequence" = the narrative or visual order of shots
- "Locations" = use in the location_name/notes fields
- "Dialogue" = assign to the relevant shots' dialogue field
- "Talent direction" = what the creator/subject does in each shot — put in description and notes
- Brand presence = weave into shots naturally, note in props or description

### Quality of output
- Every shot should have a clear description of what's happening visually
- Dialogue pulled directly from the script if one exists, or from the brief
- Props reflect what's actually in the scene
- Director notes capture timing, performance cues, energy
- Think 9:16 vertical — close-ups and mediums read better than wide shots on mobile

### Refinement
After you generate, the user can say things like "make shot 7 a dutch tilt" or "add a product shot after shot 3" — update and regenerate accordingly.`

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
