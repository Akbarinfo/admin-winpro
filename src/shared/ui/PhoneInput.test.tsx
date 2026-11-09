import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { PhoneInput, type PhoneCountryOption } from './PhoneInput'

const COUNTRIES: PhoneCountryOption[] = [
  {
    code: 'uz',
    name: 'Uzbekistan',
    phoneCode: '+998',
    phoneFormat: '+998 (##) ### ## ##',
    flagUrl: '/uz.png',
  },
  {
    code: 'kz',
    name: 'Kazakhstan',
    phoneCode: '+7',
    phoneFormat: '+7 (###) ### ## ##',
    flagUrl: '/kz.png',
  },
]

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <PhoneInput aria-label="phone" value={value} onChange={setValue} countries={COUNTRIES} />
      <button onClick={() => setValue('+7 (701) 123 45 67')}>load</button>
    </>
  )
}

const phone = () => screen.getByLabelText('phone')
const picker = () => screen.getByRole('button', { name: /^Страна:/ })

describe('PhoneInput', () => {
  it('formats with the default country; the flag picker shows no code text', async () => {
    render(<Harness />)
    expect(phone()).toHaveAttribute('placeholder', '+998 (__) ___ __ __')
    await userEvent.type(phone(), '901234567')
    expect(phone()).toHaveValue('+998 (90) 123 45 67')
    expect(picker()).toHaveAccessibleName('Страна: Uzbekistan')
  })

  it('picks a country from the list with flag, name and code, keeping the digits', async () => {
    render(<Harness />)
    await userEvent.type(phone(), '701')
    await userEvent.click(picker())
    const option = screen.getByRole('option', { name: /Kazakhstan/ })
    expect(option).toHaveTextContent('+7')
    await userEvent.click(screen.getByRole('button', { name: /Kazakhstan/ }))
    expect(phone()).toHaveValue('+7 (701')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows a saved number in its own country', async () => {
    render(<Harness initial="+998(90) 123 - 45 - 67" />)
    expect(phone()).toHaveValue('+998(90) 123 - 45 - 67')
    await userEvent.click(screen.getByRole('button', { name: 'load' }))
    expect(picker()).toHaveAccessibleName('Страна: Kazakhstan')
  })
})
