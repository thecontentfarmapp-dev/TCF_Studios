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

function buildSystemPrompt(contact: { name: string; email: string; phone: string; brand: string }) {
  return `You are the intake assistant for TCF Studios — The Content Farm Studios. We produce short-form vertical video for brands on TikTok, Instagram Reels, and YouTube Shorts.

## Contact details already collected (do NOT ask for these again)
Name: ${contact.name}
Email: ${contact.email}
Phone: ${contact.phone || 'Not provided'}
Brand / Company: ${contact.brand}

## Your job
Have a warm, professional conversation to understand their campaign needs. Ask ONE question at a time. Keep it natural — not a form, a conversation.

## Questions to ask (in this order)
1. Ask what their brand does and what product or service they're promoting.
2. Ask what kind of content they're looking to create — which platforms (TikTok, Reels, YouTube Shorts) and what format they have in mind.
3. Ask who their target audience is.
4. Ask if they've worked with creators or done this style of content before — what worked, what didn't.
5. Ask about their rough budget. Offer these brackets to make it easy: Under $10K / $10K–$25K / $25K–$50K / $50K+
6. Ask when they're looking to get started and if there's a specific launch date.
7. Ask what success looks like — what's the main thing they want this campaign to achieve?
8. Ask: "Last one — do you have any questions for us before we connect?"

## Rules
- One question at a time. Wait for the answer before moving on.
- Be warm and direct. This is a premium studio, not a freelancer.
- If an answer is vague, gently ask for a bit more detail once — then move on.
- Do not ask more than 8 questions.
- For question 8, give a brief warm acknowledgement (one sentence), then say: "That's everything — our team will be in touch within 24 hours to lock in a discovery call." Then immediately call submit_lead.
- Do not try to answer any questions they raise — our team will cover everything on the call.
- Never mention anyone's name. Always say "our team" or "we".
- Do not ask for confirmation before calling submit_lead.`
}

export async function POST(request: Request) {
  const { messages, contact } = await request.json()

  const safeContact = {
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    brand: contact?.brand ?? '',
  }

  const modelMessages = messages.map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: typeof m.content === 'string'
      ? m.content
      : (m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') ?? ''),
  }))

  const result = streamText({
    model: openai('gpt-4o'),
    system: buildSystemPrompt(safeContact),
    messages: modelMessages,
    stopWhen: stepCountIs(12),
    tools: {
      submit_lead: tool({
        description: 'Save the completed lead to the database and notify TJ. Call this after all questions have been answered.',
        inputSchema: zodSchema(z.object({
          product_description: z.string().describe('What the brand does and what they sell'),
          platforms: z.string().describe('Which platforms and content formats they want'),
          target_audience: z.string(),
          prior_experience: z.string().describe('Their experience with creator content'),
          budget_range: z.string(),
          timeline: z.string(),
          campaign_goal: z.string(),
          conversation_summary: z.string().describe('2-3 sentence summary of the opportunity for TJ'),
        })),
        execute: async (intake) => {
          try {
            // Save brand (lead) — contact details from the pre-form
            const { data: brand, error: brandError } = await adminSupabase
              .from('brands')
              .insert({
                company_name: safeContact.brand,
                contact_name: safeContact.name,
                contact_email: safeContact.email,
                contact_phone: safeContact.phone || null,
                status: 'lead',
                source: 'website_form',
                notes: intake.conversation_summary,
              })
              .select()
              .single()

            if (brandError) throw new Error(brandError.message)

            // Save full brief
            await adminSupabase
              .from('brand_briefs')
              .insert({
                brand_id: brand.id,
                product_name: safeContact.brand,
                campaign_goal: intake.campaign_goal,
                story_angle: [
                  `Product: ${intake.product_description}`,
                  `Platforms: ${intake.platforms}`,
                  `Audience: ${intake.target_audience}`,
                  `Prior experience: ${intake.prior_experience}`,
                  `Budget: ${intake.budget_range}`,
                  `Timeline: ${intake.timeline}`,
                ].join('\n'),
                status: 'draft',
              })

            // Email TJ
            if (process.env.RESEND_API_KEY) {
              const { Resend } = await import('resend')
              const resend = new Resend(process.env.RESEND_API_KEY)
              await resend.emails.send({
                from: 'TCF Studios <hello@thecontentfarm.co>',
                to: ['thecontentfarm1@gmail.com'],
                subject: `New lead: ${safeContact.brand} — ${intake.budget_range}`,
                html: `
                  <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
                    <h2 style="margin-bottom:4px;">New lead via website</h2>
                    <p style="color:#666;margin-top:0;">${new Date().toLocaleDateString('en-NZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <table style="width:100%;border-collapse:collapse;margin:24px 0;">
                      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:38%;">Company</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">${safeContact.brand}</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">Name</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${safeContact.name}</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:8px 0;border-bottom:1px solid #eee;"><a href="mailto:${safeContact.email}" style="color:#7c3aed;">${safeContact.email}</a></td></tr>
                      ${safeContact.phone ? `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${safeContact.phone}</td></tr>` : ''}
                      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">Product</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${intake.product_description}</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">Platforms</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${intake.platforms}</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">Audience</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${intake.target_audience}</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">Experience</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${intake.prior_experience}</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">Budget</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">${intake.budget_range}</td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">Timeline</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${intake.timeline}</td></tr>
                      <tr><td style="padding:8px 0;color:#666;">Goal</td><td style="padding:8px 0;">${intake.campaign_goal}</td></tr>
                    </table>

                    <div style="background:#f9f9f9;border-left:3px solid #7c3aed;padding:16px;border-radius:4px;margin:24px 0;">
                      <p style="margin:0;font-style:italic;color:#444;">${intake.conversation_summary}</p>
                    </div>

                    <a href="https://studio.thecontentfarm.co/admin/brands" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">View lead in studio →</a>
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
