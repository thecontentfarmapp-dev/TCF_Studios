import { openai } from '@ai-sdk/openai'
import { streamText, stepCountIs } from 'ai'
import { tool, zodSchema } from '@ai-sdk/provider-utils'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { z } from 'zod'

export const maxDuration = 60

const adminSupabase = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `You are the intake assistant for TCF Studios — The Content Farm Studios. We are a professional content studio that produces short-form vertical video for brands on TikTok, Instagram Reels, and YouTube Shorts.

Your job is to have a warm, professional conversation with a potential brand partner and gather key information. You ask one question at a time and keep the conversation natural — not robotic or form-like.

## Your questions (ask in this order, one at a time)

1. Ask for their name and company name.
2. Ask what their brand does and what product or service they're promoting.
3. Ask what platforms they're focused on and what kind of content they're imagining. (TikTok? Reels? A specific format?)
4. Ask who their target audience is.
5. Ask if they've worked with creators or done this style of content before — and if so, what worked or didn't.
6. Ask about their rough budget range. Offer these brackets: Under $10K / $10K–$25K / $25K–$50K / $50K+
7. Ask when they're looking to get started and if there's a specific launch date in mind.
8. Ask what success looks like to them — what's the main thing they want this campaign to achieve?

## Rules
- One question at a time. Wait for their answer before asking the next.
- Be warm, direct, and professional. This is a premium studio, not a freelancer.
- If they give a short or vague answer, gently prompt for a bit more detail once.
- Do not ask more than 8 questions total.
- Once you have answers to all 8 questions, tell them: "That's everything I need. I'll pass this straight to TJ — you'll hear from us within 24 hours to lock in a discovery call." Then call submit_lead immediately.
- Do not ask for confirmation before calling submit_lead. Just call it.`

export async function POST(request: Request) {
  const { messages } = await request.json()

  const modelMessages = messages.map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: typeof m.content === 'string'
      ? m.content
      : (m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') ?? ''),
  }))

  const result = streamText({
    model: openai('gpt-4o'),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    stopWhen: stepCountIs(15),
    tools: {
      submit_lead: tool({
        description: 'Save the completed lead to the database and notify TJ. Call this after all 8 questions have been answered.',
        inputSchema: zodSchema(z.object({
          contact_name: z.string(),
          company_name: z.string(),
          contact_email: z.string().optional().describe('If they mentioned an email during the conversation'),
          product_description: z.string().describe('What the brand does and what they sell'),
          platforms: z.string().describe('Which platforms and content formats they want'),
          target_audience: z.string(),
          prior_experience: z.string().describe('Their experience with creator content'),
          budget_range: z.string().describe('Their budget bracket'),
          timeline: z.string().describe('When they want to start and any launch dates'),
          campaign_goal: z.string().describe('What success looks like to them'),
          conversation_summary: z.string().describe('2-3 sentence summary of the opportunity for TJ'),
        })),
        execute: async (lead) => {
          try {
            // Save brand (lead)
            const { data: brand, error: brandError } = await adminSupabase
              .from('brands')
              .insert({
                company_name: lead.company_name,
                contact_name: lead.contact_name,
                contact_email: lead.contact_email ?? '',
                status: 'lead',
                source: 'website_form',
                notes: lead.conversation_summary,
              })
              .select()
              .single()

            if (brandError) throw new Error(brandError.message)

            // Save brief with all intake answers
            await adminSupabase
              .from('brand_briefs')
              .insert({
                brand_id: brand.id,
                product_name: lead.company_name,
                campaign_goal: lead.campaign_goal,
                story_angle: [
                  `Product: ${lead.product_description}`,
                  `Platforms: ${lead.platforms}`,
                  `Audience: ${lead.target_audience}`,
                  `Prior experience: ${lead.prior_experience}`,
                  `Budget: ${lead.budget_range}`,
                  `Timeline: ${lead.timeline}`,
                ].join('\n'),
                status: 'draft',
              })

            // Notify TJ
            if (process.env.RESEND_API_KEY) {
              const { Resend } = await import('resend')
              const resend = new Resend(process.env.RESEND_API_KEY)
              await resend.emails.send({
                from: 'TCF Studios <hello@thecontentfarm.co>',
                to: ['thecontentfarm1@gmail.com'],
                subject: `New lead: ${lead.company_name} — ${lead.budget_range}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
                    <h2 style="margin-bottom: 4px;">New lead via website</h2>
                    <p style="color: #666; margin-top: 0;">${new Date().toLocaleDateString('en-NZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;">Company</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 600;">${lead.company_name}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Contact</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${lead.contact_name}${lead.contact_email ? ` · ${lead.contact_email}` : ''}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Product</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${lead.product_description}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Platforms</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${lead.platforms}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Audience</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${lead.target_audience}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Experience</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${lead.prior_experience}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Budget</td><td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 600;">${lead.budget_range}</td></tr>
                      <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Timeline</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${lead.timeline}</td></tr>
                      <tr><td style="padding: 8px 0; color: #666;">Goal</td><td style="padding: 8px 0;">${lead.campaign_goal}</td></tr>
                    </table>

                    <div style="background: #f9f9f9; border-left: 3px solid #7c3aed; padding: 16px; border-radius: 4px; margin: 24px 0;">
                      <p style="margin: 0; font-style: italic; color: #444;">${lead.conversation_summary}</p>
                    </div>

                    <a href="https://studio.thecontentfarm.co/admin/brands" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">View in TCF Studios →</a>
                  </div>
                `,
              })
            }

            return { success: true, brandId: brand.id }
          } catch (error: any) {
            console.error('Lead submission error:', error)
            return { success: false, error: error.message }
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
