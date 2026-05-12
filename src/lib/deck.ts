export type HeroSlide     = { id: 'hero';      title: string }
export type TruthSlide    = { id: 'truth';     line1: string; line2: string }
export type WhoSlide      = { id: 'who';       points: string[] }
export type WorkSlide     = { id: 'work';      headline: string; stats: { label: string; value: string }[]; handle: string }
export type ProcessSlide  = { id: 'process';   steps: string[] }
export type NextSlide     = { id: 'nextsteps'; intro: string; steps: string[] }
export type DeckSlide     = HeroSlide | TruthSlide | WhoSlide | WorkSlide | ProcessSlide | NextSlide
export type DeckContent   = { slides: DeckSlide[] }

export const DEFAULT_DECK: DeckContent = {
  slides: [
    {
      id: 'hero',
      title: 'We turn brands into shows.',
    },
    {
      id: 'truth',
      line1: 'One video builds awareness. A series builds trust. Trust is what converts.',
      line2: 'One video is a moment. A series is a movement.',
    },
    {
      id: 'who',
      points: [
        'Strategy and production under one roof.',
        'We handle everything — locations, talent, production, post. One team, start to finish.',
        'We bring a TV mindset to short-form.',
      ],
    },
    {
      id: 'work',
      headline: 'We built our own show first.',
      stats: [
        { label: 'Episodes', value: '8' },
        { label: 'Views',    value: '1M+' },
        { label: 'Followers', value: '7K+' },
        { label: 'Timeline', value: '7 weeks' },
      ],
      handle: '@thecontentfarm',
    },
    {
      id: 'process',
      steps: ['Pre-production', 'Shoot Day', 'Post-production', 'Reviews', 'Delivery'],
    },
    {
      id: 'nextsteps',
      intro: "If this feels like the right fit, here's what happens next.",
      steps: [
        'We send you a proposal — personalised to your brand and goals',
        'You review and confirm — we answer any questions',
        'Contract and deposit — we get to work',
      ],
    },
  ],
}
