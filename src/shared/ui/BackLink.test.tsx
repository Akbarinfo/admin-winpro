import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLastView } from '@/shared/store/tablePrefs'
import { renderWithProviders } from '@/test/render'
import { BackLink } from './BackLink'

describe('BackLink', () => {
  it('goes back to the list as it was left', () => {
    useLastView.getState().remember('/inserts', '?inserts.page=3&inserts.search=rama')
    renderWithProviders(<BackLink to="/inserts">К списку вставок</BackLink>, {
      url: '/inserts/layout/page/3',
    })
    expect(screen.getByRole('link', { name: 'К списку вставок' })).toHaveAttribute(
      'href',
      '/inserts?inserts.page=3&inserts.search=rama',
    )
  })

  it('goes to the plain list when it was never opened in this session', () => {
    renderWithProviders(<BackLink to="/inserts">К списку вставок</BackLink>)
    expect(screen.getByRole('link', { name: 'К списку вставок' })).toHaveAttribute(
      'href',
      '/inserts',
    )
  })
})
