export type UserRole = 'admin' | 'brand' | 'creator'
export type BrandStatus = 'lead' | 'in_conversation' | 'proposal_sent' | 'negotiating' | 'signed' | 'active' | 'alumni'
export type BrandSource = 'website_form' | 'referral' | 'outbound' | 'other'
export type CreatorStatus = 'prospect' | 'in_conversation' | 'soft_commitment' | 'signed' | 'active' | 'alumni'
export type SeasonStatus = 'development' | 'pre_production' | 'production' | 'post' | 'distribution' | 'complete'
export type EpisodePhase = 'commissioning' | 'development' | 'pre_production' | 'production' | 'post' | 'distribution' | 'publishing' | 'evaluation'
export type ScriptStatus = 'draft' | 'in_review' | 'creator_approved' | 'brand_approved' | 'locked'
export type ShootStatus = 'scheduled' | 'complete' | 'cancelled'
export type InvoiceType = 'deposit' | 'final' | 'custom'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'
export type BriefStatus = 'draft' | 'sent' | 'approved' | 'rejected'
export type PublishPlatform = 'tiktok' | 'instagram_reels' | 'instagram_stories' | 'youtube_shorts'

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  email: string
  full_name: string | null
  role: UserRole
  brand_id: string | null
  creator_id: string | null
}

export interface Brand {
  id: string
  created_at: string
  updated_at: string
  company_name: string
  industry: string | null
  website: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  status: BrandStatus
  notes: string | null
  source: BrandSource
}

export interface Creator {
  id: string
  created_at: string
  updated_at: string
  name: string
  email: string
  phone: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  youtube_handle: string | null
  niche: string | null
  audience_size: number | null
  status: CreatorStatus
  slot: string | null
  deal_memo_signed: boolean
  notes: string | null
}

export interface BrandBrief {
  id: string
  brand_id: string
  created_at: string
  updated_at: string
  product_name: string
  campaign_goal: string | null
  story_angle: string | null
  deliverables: string | null
  usage_rights: string | null
  budget: number | null
  timeline_start: string | null
  timeline_end: string | null
  status: BriefStatus
}

export interface Season {
  id: string
  created_at: string
  updated_at: string
  title: string
  show_bible: string | null
  creator_id: string | null
  brand_id: string | null
  brief_id: string | null
  episode_count: number
  format: string | null
  status: SeasonStatus
  greenlit_at: string | null
  wrapped_at: string | null
}

export interface Episode {
  id: string
  season_id: string
  created_at: string
  updated_at: string
  number: number
  title: string | null
  logline: string | null
  phase: EpisodePhase
  due_date: string | null
  publish_date: string | null
  published_at: string | null
}

export interface Script {
  id: string
  episode_id: string
  created_at: string
  updated_at: string
  version: number
  content: string | null
  status: ScriptStatus
  creator_approved_at: string | null
  brand_approved_at: string | null
  notes: string | null
}

export interface ShootDay {
  id: string
  season_id: string
  created_at: string
  date: string
  call_time: string | null
  location_name: string | null
  location_notes: string | null
  shot_list: string | null
  call_sheet_url: string | null
  episodes_covered: string[]
  status: ShootStatus
}

export interface Invoice {
  id: string
  brand_id: string
  season_id: string | null
  created_at: string
  updated_at: string
  invoice_number: string
  amount: number
  type: InvoiceType
  status: InvoiceStatus
  due_date: string | null
  paid_at: string | null
  stripe_invoice_id: string | null
  notes: string | null
}

export interface PublishRecord {
  id: string
  episode_id: string
  created_at: string
  updated_at: string
  platform: PublishPlatform
  url: string | null
  caption: string | null
  hashtags: string | null
  thumbnail_url: string | null
  scheduled_at: string | null
  published_at: string | null
  views: number
  likes: number
  comments: number
  shares: number
  retention_rate: number | null
  last_synced_at: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Profile> }
      brands: { Row: Brand; Insert: Omit<Brand, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Brand> }
      creators: { Row: Creator; Insert: Omit<Creator, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Creator> }
      brand_briefs: { Row: BrandBrief; Insert: Omit<BrandBrief, 'id' | 'created_at' | 'updated_at'>; Update: Partial<BrandBrief> }
      seasons: { Row: Season; Insert: Omit<Season, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Season> }
      episodes: { Row: Episode; Insert: Omit<Episode, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Episode> }
      scripts: { Row: Script; Insert: Omit<Script, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Script> }
      shoot_days: { Row: ShootDay; Insert: Omit<ShootDay, 'id' | 'created_at'>; Update: Partial<ShootDay> }
      invoices: { Row: Invoice; Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'invoice_number'>; Update: Partial<Invoice> }
      publish_records: { Row: PublishRecord; Insert: Omit<PublishRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<PublishRecord> }
    }
  }
}
