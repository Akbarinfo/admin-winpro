import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { usePreferences } from '@/shared/store/preferences'
import { IconButton } from './IconButton'

export function ThemeToggle({ bordered }: { bordered?: boolean }) {
  const { t } = useTranslation()
  const theme = usePreferences((s) => s.theme)
  const toggleTheme = usePreferences((s) => s.toggleTheme)
  const dark = theme === 'dark'

  return (
    <IconButton
      label={t(dark ? 'layout.theme_light' : 'layout.theme_dark')}
      onClick={toggleTheme}
      bordered={bordered}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </IconButton>
  )
}
