import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { brand, product, platforms, audience, experience, budget, timeline, goal, summary } = body

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are helping TJ Tauroa, director at TCF Studios, prepare for a 30-minute discovery call with a brand.

TCF Studios produces short-form vertical video (TikTok, Instagram Reels, YouTube Shorts). Typical packages:
- Under $10K: 3–5 videos, quick turnaround, minimal strategy
- $10K–$25K: 6–10 videos, platform strategy, creator-led content
- $25K–$50K: Full campaign, multiple formats, studio + creator hybrid
- $50K+: Premium partnership, ongoing strategy, full production

Return a JSON object with exactly these keys:
{
  "talking_points": ["string", "string", "string"],
  "package_recommendation": "string",
  "questions": ["string", "string", "string"]
}

talking_points: 3 specific angles to lead with, referencing their actual answers
package_recommendation: 1–2 sentences on what to pitch and why, based on their budget + goal
questions: 3 probing questions to ask during the call to uncover more

Be direct and specific. Reference their brand and answers. No filler.`,
        },
        {
          role: 'user',
          content: `Brand: ${brand}
Product: ${product}
Platforms: ${platforms}
Target Audience: ${audience}
Prior Experience: ${experience}
Budget: ${budget}
Timeline: ${timeline}
Campaign Goal: ${goal}
Summary: ${summary}`,
        },
      ],
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Prep generation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
