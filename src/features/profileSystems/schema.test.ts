import { describe, expect, it } from 'vitest'
import { emptyProfileSystem, profileSystemSchema } from './schema'

const parse = (patch: object) =>
  profileSystemSchema.safeParse({ ...emptyProfileSystem(), name: 'Termo', ...patch })
const issues = (patch: object) => {
  const r = parse(patch)
  return r.success ? [] : r.error.issues.map((i) => [i.path[0], i.message])
}

describe('profileSystemSchema', () => {
  it('requires only the name', () => {
    expect(parse({}).success).toBe(true)
    expect(issues({ name: '  ' })).toEqual([['name', 'validation.required']])
  })

  it('checks the track limit of a simple sliding system only', () => {
    for (const n of [0, 11, 2.5])
      expect(issues({ slidingType: 'FRAME_PER_TRACK', maxTrackCount: n })).toEqual([
        ['maxTrackCount', 'profileSystems.track_range'],
      ])
    expect(parse({ slidingType: 'FRAME_PER_TRACK', maxTrackCount: 10 }).success).toBe(true)
    expect(parse({ slidingType: 'FRAME_PER_TRACK', maxTrackCount: null }).success).toBe(true)
    // hidden or locked there — not checked (and not sent)
    expect(parse({ slidingType: 'MULTI_TRACK_FRAME', maxTrackCount: 50 }).success).toBe(true)
    expect(parse({ slidingType: 'NONE', maxTrackCount: 0 }).success).toBe(true)
  })

  it('allows a zero sash clearance but not a negative one', () => {
    expect(parse({ sashClearance: 0 }).success).toBe(true)
    expect(issues({ sashClearance: -1 })).toEqual([['sashClearance', 'validation.non_negative']])
  })

  it('needs the first key of every characteristic row, and trims both', () => {
    const r = profileSystemSchema.safeParse({
      ...emptyProfileSystem(),
      name: 'Termo',
      characteristics: [
        { key: ' width ', value: ' w70 ' },
        { key: 'depth', value: '' },
      ],
    })
    expect(r.success && r.data.characteristics).toEqual([
      { key: 'width', value: 'w70' },
      { key: 'depth', value: '' },
    ])
    const bad = profileSystemSchema.safeParse({
      ...emptyProfileSystem(),
      name: 'Termo',
      characteristics: [{ key: ' ', value: 'w70' }],
    })
    expect(bad.success ? [] : bad.error.issues.map((i) => [i.path.join('.'), i.message])).toEqual([
      ['characteristics.0.key', 'validation.required'],
    ])
  })
})
