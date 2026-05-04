import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { shotId, description, shotType, cameraAngle, cameraMovement, dialogue, episodeTitle } = await request.json()

  if (!description) return NextResponse.json({ error: 'Description required' }, { status: 400 })

  const prompt = `Storyboard frame sketch for a short-form vertical social media video.

Scene: ${description}
${dialogue ? `Dialogue: "${dialogue}"` : ''}
Shot type: ${shotType?.replace(/_/g, ' ') || 'medium'}
Camera angle: ${cameraAngle?.replace(/_/g, ' ') || 'eye level'}
Camera movement: ${cameraMovement?.replace(/_/g, ' ') || 'static'}
${episodeTitle ? `Episode: ${episodeTitle}` : ''}

Draw this as a professional storyboard panel: black and white pencil sketch style, bold clear lines, 9:16 vertical aspect ratio framing, cinematic composition. Show the framing clearly with arrows indicating camera movement if applicable. Include a simple horizon line and basic background. Characters should be gestural stick-figure style with clear positioning. Professional film storyboard aesthetic.`

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1792',
      quality: 'standard',
      style: 'natural',
      n: 1,
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) throw new Error('No image returned')

    // Save the prompt and URL back to the shot
    if (shotId) {
      await supabase
        .from('shots')
        .update({ storyboard_url: imageUrl, storyboard_prompt: prompt })
        .eq('id', shotId)
    }

    return NextResponse.json({ url: imageUrl })
  } catch (error: any) {
    console.error('OpenAI error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}
