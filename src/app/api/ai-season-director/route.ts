import { openai } from '@ai-sdk/openai'
import { streamText, stepCountIs } from 'ai'
import { tool, zodSchema } from '@ai-sdk/provider-utils'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const maxDuration = 300 // 5 min — full seasons take time

const EpisodeArcSchema = z.object({
  number: z.number(),
  title: z.string(),
  logline: z.string().describe('One sentence — what happens in this episode'),
  key_beats: z.string().describe('Comma-separated key visual/story beats — used to build the shot list'),
})

const ShotSchema = z.object({
  number: z.number(),
  scene_beat: z.string(),
  shot_type: z.enum(['wide', 'medium_wide', 'medium', 'medium_close', 'close_up', 'extreme_close_up', 'over_the_shoulder', 'pov', 'insert', 'cutaway', 'establishing']),
  camera_angle: z.enum(['eye_level', 'high_angle', 'low_angle', 'dutch', 'birds_eye', 'worms_eye']),
  camera_movement: z.enum(['static', 'pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'dolly_in', 'dolly_out', 'orbit_left', 'orbit_right', 'crane_up', 'crane_down', 'handheld', 'push_in', 'pull_out', 'tracking']),
  duration_seconds: z.number().min(1).max(30).transform(Math.round),
  description: z.string(),
  dialogue: z.string().optional(),
  props: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, seasonId } = await request.json()

  // Load full season context
  const [{ data: season }, { data: episodes }] = await Promise.all([
    supabase
      .from('seasons')
      .select('*, brands(company_name, industry), creators(name, niche, instagram_handle, tiktok_handle)')
      .eq('id', seasonId)
      .single(),
    supabase
      .from('episodes')
      .select('id, number, title, logline, phase')
      .eq('season_id', seasonId)
      .order('number', { ascending: true }),
  ])

  const season_ = season as any
  const episodeCount = episodes?.length ?? 0
  const episodeMap = Object.fromEntries((episodes ?? []).map(e => [e.number, e.id]))

  const systemPrompt = `You are a seasoned showrunner and creative director at TCF Studios. Your job is to build a complete episodic series — from episode arc through to every individual shot — based on the show bible and director's brief.

## Season Context
Title: ${season_?.title ?? 'Unknown'}
Format: ${season_?.format ?? '60-second vertical video'}
Episode count: ${episodeCount} episodes
Creator / Talent: ${season_?.creators?.name ?? 'Unknown'}${season_?.creators?.niche ? ` (${season_.creators.niche})` : ''}
Brand: ${season_?.brands?.company_name ?? 'No brand'}${season_?.brands?.industry ? ` — ${season_.brands.industry}` : ''}

## Show Bible
${season_?.show_bible ?? '(No show bible — work from the director brief provided.)'}

## Available shot values (use exactly as written)
Shot types: wide, medium_wide, medium, medium_close, close_up, extreme_close_up, over_the_shoulder, pov, insert, cutaway, establishing
Camera angles: eye_level, high_angle, low_angle, dutch, birds_eye, worms_eye
Camera movements: static, dolly_in, dolly_out, push_in, pull_out, pan_left, pan_right, tilt_up, tilt_down, orbit_left, orbit_right, crane_up, crane_down, handheld, tracking

## Your job — execute in this exact order

### Step 1 — Call update_episode_arc
Build the complete series arc. Every episode gets a title, logline, and key beats.
Think about narrative momentum across the season: setup, escalation, midpoint, climax, resolution.
Each episode should be a standalone set piece that also advances the series arc.

### Step 2 — Call generate_episode_shots for EVERY episode, in order from 1 to ${episodeCount}
For each episode, generate a COMPLETE shot list based on that episode's key beats.
You MUST call generate_episode_shots for every single episode — do not skip any.
Apply the shot count and style direction from the show bible and user brief.
Every shot list must have genuine variety — rotate shot types, angles, movements.
Pull dialogue cues from the episode beats.

### Rules
- Build all ${episodeCount} episodes — do not stop early
- Match the shot count specified in the show bible or brief exactly
- Consecutive shots must not repeat the same shot type
- Think 9:16 vertical — favour close-ups, mediums, inserts over wide shots
- Brand appears naturally in shots — never forced
- Total runtime per episode = sum of duration_seconds (should match episode format)`

  const modelMessages = messages.map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: typeof m.content === 'string'
      ? m.content
      : (m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') ?? ''),
  }))

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: modelMessages,
    stopWhen: stepCountIs(episodeCount + 5),
    tools: {
      update_episode_arc: tool({
        description: 'Set titles, loglines, and key beats for all episodes in the season. Call this FIRST before any shot generation.',
        inputSchema: zodSchema(z.object({
          episodes: z.array(EpisodeArcSchema),
        })),
        execute: async ({ episodes }) => {
          const updates = await Promise.all(
            episodes.map(ep => {
              const epId = episodeMap[ep.number]
              if (!epId) return Promise.resolve({ number: ep.number, ok: false })
              return supabase
                .from('episodes')
                .update({
                  title: ep.title,
                  logline: ep.logline,
                })
                .eq('id', epId)
                .then(({ error }) => ({ number: ep.number, title: ep.title, ok: !error }))
            })
          )
          return {
            success: true,
            updated: updates.filter(u => u.ok).length,
            episodes: updates.map(u => ({ number: u.number, title: (u as any).title })),
          }
        },
      }),

      generate_episode_shots: tool({
        description: 'Generate and save the complete shot list for ONE episode. Call this once per episode, for every episode in order.',
        inputSchema: zodSchema(z.object({
          episode_number: z.number().describe('Which episode number (1, 2, 3...)'),
          shots: z.array(ShotSchema),
        })),
        execute: async ({ episode_number, shots }) => {
          const epId = episodeMap[episode_number]
          if (!epId) return { success: false, error: `Episode ${episode_number} not found` }

          // Clear existing shots for this episode
          await supabase.from('shots').delete().eq('episode_id', epId)

          const { error } = await supabase.from('shots').insert(
            shots.map(shot => ({
              episode_id: epId,
              number: shot.number,
              scene_beat: shot.scene_beat,
              shot_type: shot.shot_type,
              camera_angle: shot.camera_angle,
              camera_movement: shot.camera_movement,
              duration_seconds: Math.round(shot.duration_seconds),
              description: shot.description,
              dialogue: shot.dialogue ?? null,
              props: shot.props ?? null,
              notes: shot.notes ?? null,
              status: 'not_shot',
            }))
          )

          if (error) return { success: false, episode_number, error: error.message }

          return {
            success: true,
            episode_number,
            shot_count: shots.length,
            runtime: shots.reduce((acc, s) => acc + s.duration_seconds, 0),
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
