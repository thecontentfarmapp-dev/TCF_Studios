export type StatusKey =
  | 'lead' | 'in_conversation' | 'proposal_sent' | 'negotiating' | 'signed' | 'active' | 'alumni'
  | 'prospect' | 'soft_commitment'
  | 'development' | 'pre_production' | 'production' | 'post' | 'distribution' | 'complete'
  | 'commissioning' | 'publishing' | 'evaluation'
  | 'draft' | 'in_review' | 'creator_approved' | 'brand_approved' | 'locked'
  | 'scheduled' | 'cancelled'
  | 'paid' | 'sent' | 'overdue'
  | 'not_shot' | 'shot' | 'approved'
  | 'tiktok' | 'instagram_reels' | 'instagram_stories' | 'youtube_shorts'

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    // Brand pipeline
    lead:            'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    in_conversation: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    proposal_sent:   'bg-violet-500/15 text-violet-400 border-violet-500/30',
    negotiating:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
    signed:          'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    active:          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    alumni:          'bg-zinc-600/15 text-zinc-500 border-zinc-600/30',
    // Creator pipeline
    prospect:        'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    soft_commitment: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    // Season/episode phase
    development:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
    pre_production:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
    production:      'bg-violet-500/15 text-violet-400 border-violet-500/30',
    post:            'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    distribution:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    complete:        'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    commissioning:   'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    publishing:      'bg-green-500/15 text-green-400 border-green-500/30',
    evaluation:      'bg-pink-500/15 text-pink-400 border-pink-500/30',
    // Script
    draft:           'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    in_review:       'bg-amber-500/15 text-amber-400 border-amber-500/30',
    creator_approved:'bg-blue-500/15 text-blue-400 border-blue-500/30',
    brand_approved:  'bg-violet-500/15 text-violet-400 border-violet-500/30',
    locked:          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    // Shoot
    scheduled:       'bg-blue-500/15 text-blue-400 border-blue-500/30',
    cancelled:       'bg-red-500/15 text-red-400 border-red-500/30',
    // Invoice
    paid:            'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    sent:            'bg-blue-500/15 text-blue-400 border-blue-500/30',
    overdue:         'bg-red-500/15 text-red-400 border-red-500/30',
    // Shot
    not_shot:        'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    shot:            'bg-blue-500/15 text-blue-400 border-blue-500/30',
    approved:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  }
  return map[status] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
}

// Brand portal (light mode) status colours
export function statusColorLight(status: string): string {
  const map: Record<string, string> = {
    development:     'bg-amber-50 text-amber-700 border-amber-200',
    pre_production:  'bg-blue-50 text-blue-700 border-blue-200',
    production:      'bg-violet-50 text-violet-700 border-violet-200',
    post:            'bg-cyan-50 text-cyan-700 border-cyan-200',
    distribution:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    complete:        'bg-gray-50 text-gray-600 border-gray-200',
    paid:            'bg-emerald-50 text-emerald-700 border-emerald-200',
    sent:            'bg-blue-50 text-blue-700 border-blue-200',
    overdue:         'bg-red-50 text-red-700 border-red-200',
    draft:           'bg-gray-100 text-gray-600 border-gray-200',
    in_review:       'bg-amber-50 text-amber-700 border-amber-200',
    brand_approved:  'bg-blue-50 text-blue-700 border-blue-200',
    locked:          'bg-emerald-50 text-emerald-700 border-emerald-200',
    approved:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

export function formatDate(
  date: string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-NZ', opts)
}

export function formatDateShort(date: string | null | undefined): string {
  return formatDate(date, { month: 'short', day: 'numeric' })
}
