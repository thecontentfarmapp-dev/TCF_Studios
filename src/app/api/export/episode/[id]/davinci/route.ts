import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

// Shot type → DaVinci/FCP colour label
const SHOT_TYPE_COLOUR: Record<string, string> = {
  establishing:       'Blue',
  wide:               'Blue',
  medium_wide:        'Green',
  medium:             'Green',
  medium_close:       'Yellow',
  close_up:           'Red',
  extreme_close_up:   'Red',
  over_the_shoulder:  'Orange',
  pov:                'Violet',
  insert:             'Yellow',
  cutaway:            'Orange',
}

function frames(seconds: number, fps: number) {
  return Math.round(seconds * fps)
}

function toTimecode(totalFrames: number, fps: number) {
  const s = Math.floor(totalFrames / fps)
  const f = totalFrames % fps
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return [
    String(h).padStart(2, '0'),
    String(m % 60).padStart(2, '0'),
    String(s % 60).padStart(2, '0'),
    String(f).padStart(2, '0'),
  ].join(':')
}

function escapeXml(str: string | null | undefined) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  const fps = parseInt(url.searchParams.get('fps') ?? '25')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const [{ data: episode }, { data: shots }] = await Promise.all([
    supabase
      .from('episodes')
      .select('*, seasons(title, format, brands(company_name), creators(name))')
      .eq('id', id)
      .single(),
    supabase
      .from('shots')
      .select('*')
      .eq('episode_id', id)
      .order('number', { ascending: true }),
  ])

  if (!episode) return notFound()
  if (!shots || shots.length === 0) {
    return new Response('No shots found for this episode', { status: 400 })
  }

  const season = episode.seasons as any
  const sequenceName = `${season?.title ?? 'Season'} — Ep ${episode.number}${episode.title ? ` — ${episode.title}` : ''}`
  const totalSeconds = shots.reduce((acc: number, s: any) => acc + (s.duration_seconds ?? 0), 0)
  const totalFrames = frames(totalSeconds, fps)

  // Build clip items
  let cursor = 0
  const clipItems = shots.map((shot: any, index: number) => {
    const durationSec = shot.duration_seconds ?? 4
    const durationF = frames(durationSec, fps)
    const startF = cursor
    const endF = cursor + durationF
    cursor = endF

    const clipId = `clipitem-${index + 1}`
    const fileId = `file-${index + 1}`
    const shotLabel = [
      shot.shot_type?.replace(/_/g, ' '),
      shot.camera_angle?.replace(/_/g, ' '),
      shot.camera_movement?.replace(/_/g, ' '),
    ].filter(Boolean).join(' | ')
    const clipName = `${String(shot.number).padStart(3, '0')} — ${escapeXml(shot.description ?? shot.scene_beat ?? 'Shot')}`
    const colour = SHOT_TYPE_COLOUR[shot.shot_type ?? ''] ?? 'None'

    return `        <clipitem id="${clipId}">
          <name>${clipName}</name>
          <duration>${durationF}</duration>
          <rate>
            <timebase>${fps}</timebase>
            <ntsc>FALSE</ntsc>
          </rate>
          <start>${startF}</start>
          <end>${endF}</end>
          <in>0</in>
          <out>${durationF}</out>
          <file id="${fileId}">
            <name>${clipName}</name>
            <duration>${durationF}</duration>
            <rate>
              <timebase>${fps}</timebase>
              <ntsc>FALSE</ntsc>
            </rate>
            <timecode>
              <rate>
                <timebase>${fps}</timebase>
                <ntsc>FALSE</ntsc>
              </rate>
              <string>${toTimecode(startF, fps)}</string>
              <frame>${startF}</frame>
              <displayformat>NDF</displayformat>
            </timecode>
            <media>
              <video>
                <samplecharacteristics>
                  <width>1080</width>
                  <height>1920</height>
                </samplecharacteristics>
              </video>
            </media>
          </file>
          <labels>
            <label2>${colour}</label2>
          </labels>
          <logginginfo>
            <description>${escapeXml(shot.dialogue)}</description>
            <scene>${escapeXml(shot.scene_beat)}</scene>
            <shottake>${String(shot.number).padStart(3, '0')}</shottake>
            <lognote>${escapeXml([shotLabel, shot.props ? `Props: ${shot.props}` : '', shot.notes].filter(Boolean).join(' | '))}</lognote>
          </logginginfo>
          <comments>
            <mastercomment1>${escapeXml(shotLabel)}</mastercomment1>
            <mastercomment2>${escapeXml(shot.description)}</mastercomment2>
          </comments>
        </clipitem>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml PUBLIC "-//Apple//DTD XMEML 1.0//EN" "http://developer.apple.com/DTDs/XMEML.dtd">
<xmeml version="5">
  <sequence>
    <name>${escapeXml(sequenceName)}</name>
    <duration>${totalFrames}</duration>
    <rate>
      <timebase>${fps}</timebase>
      <ntsc>FALSE</ntsc>
    </rate>
    <timecode>
      <rate>
        <timebase>${fps}</timebase>
        <ntsc>FALSE</ntsc>
      </rate>
      <string>00:00:00:00</string>
      <frame>0</frame>
      <displayformat>NDF</displayformat>
    </timecode>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>1080</width>
            <height>1920</height>
            <pixelaspectratio>square</pixelaspectratio>
            <fielddominance>none</fielddominance>
            <rate>
              <timebase>${fps}</timebase>
              <ntsc>FALSE</ntsc>
            </rate>
          </samplecharacteristics>
        </format>
        <track>
${clipItems}
        </track>
      </video>
    </media>
    <labels>
      <label2>None</label2>
    </labels>
    <logginginfo>
      <description>${escapeXml(sequenceName)}</description>
      <scene>${escapeXml(season?.title ?? '')}</scene>
      <lognote>${shots.length} shots · ${totalSeconds}s · ${fps}fps · Generated by TCF Studios</lognote>
    </logginginfo>
  </sequence>
</xmeml>`

  const filename = `TCF_${(season?.title ?? 'Season').replace(/[^a-zA-Z0-9]/g, '_')}_Ep${episode.number}_${fps}fps.xml`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
