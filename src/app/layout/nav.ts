import {
  ArrowLeftRight,
  BadgeDollarSign,
  BellRing,
  Boxes,
  Coins,
  FileStack,
  Frame,
  Globe,
  Grip,
  Hammer,
  House,
  Languages,
  LayoutGrid,
  Layers,
  Layers3,
  LayoutTemplate,
  Link2,
  ListPlus,
  MessageSquare,
  MonitorSmartphone,
  Palette,
  PanelsTopLeft,
  Plug,
  Ruler,
  Scale,
  Settings2,
  Smartphone,
  Square,
  Tags,
  Truck,
  Type,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { matchPath } from 'react-router'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /**
   * Migration progress, shown in the sidebar:
   * undefined — not migrated yet (greyed out, not clickable); 'ready' — migrated; 'new' — migrated in the latest batch.
   * When a section is migrated, mark it 'new' and turn the previous batch's 'new' into 'ready'.
   */
  status?: 'ready' | 'new'
}
export type NavGroup = { title: string; items: NavItem[] }

// Sidebar menu as data. Paths and labels come from the old panel (components/Sidebar.js),
// so links users have bookmarked keep working. Labels are i18n keys.
export const NAV: NavGroup[] = [
  {
    title: 'nav.group_overview',
    items: [{ to: '/', label: 'sidebar_menu_dashboard', icon: House, status: 'ready' }],
  },
  {
    title: 'nav.group_references',
    items: [
      { to: '/currency', label: 'currency.title', icon: Coins, status: 'ready' },
      { to: '/exchange', label: 'exchange.title', icon: ArrowLeftRight, status: 'ready' },
      { to: '/country', label: 'country', icon: Globe },
      { to: '/units', label: 'units.title', icon: Ruler, status: 'new' },
      { to: '/series', label: 'series.title', icon: Layers, status: 'new' },
      { to: '/material-type', label: 'materialType.title', icon: Boxes, status: 'new' },
      { to: '/suppliers', label: 'sidebar_menu_suppliers', icon: Truck },
      { to: '/sales_category', label: 'sidebar_sales_category', icon: Tags },
    ],
  },
  {
    title: 'nav.group_products',
    items: [
      { to: '/product/profile', label: 'sidebar_menu_profiles', icon: Frame },
      { to: '/product/accessories', label: 'sidebar_menu_accessories', icon: Wrench },
      { to: '/product/seal', label: 'sidebar_menu_seal', icon: Grip },
      { to: '/product/filling', label: 'sidebar_menu_filling', icon: Square },
    ],
  },
  {
    title: 'nav.group_catalog',
    items: [
      { to: '/textures', label: 'sidebar_menu_textures', icon: Palette },
      { to: '/connection', label: 'sidebar_menu_connection', icon: Link2 },
      { to: '/inserts', label: 'sidebar_menu_insert', icon: ListPlus },
      { to: '/filling', label: 'sidebar_menu_filling', icon: PanelsTopLeft },
      { to: '/furniture', label: 'sidebar_menu_accessories', icon: Settings2 },
      { to: '/profile_system', label: 'sidebar_menu_profile_system', icon: Layers3 },
    ],
  },
  {
    title: 'nav.group_templates',
    items: [
      { to: '/templates', label: 'sidebar_templates', icon: LayoutTemplate },
      { to: '/templetes', label: 'sidebar_menu_templetes', icon: FileStack },
    ],
  },
  {
    title: 'nav.group_integrations',
    items: [
      { to: '/price-requests', label: 'sidebar_price_requests', icon: BellRing },
      { to: '/integrations/akfa', label: 'sidebar_menu_integrations_akfa', icon: Plug },
      { to: '/integrations/unit', label: 'nav.akfa_units', icon: Scale },
    ],
  },
  {
    title: 'nav.group_users',
    items: [
      { to: '/user', label: 'sidebar_menu_user', icon: Users },
      { to: '/mobile_user', label: 'mobile_users', icon: Smartphone },
      { to: '/feedback', label: 'nav.feedback', icon: MessageSquare },
    ],
  },
  {
    title: 'nav.group_system',
    items: [
      { to: '/workshop-service', label: 'sidebar_workshop_service', icon: Hammer },
      { to: '/app-versions', label: 'sidebar_app_versions', icon: MonitorSmartphone },
      { to: '/translations', label: 'sidebar_menu_translations', icon: Languages },
      { to: '/languages', label: 'languages.title', icon: Type, status: 'new' },
      { to: '/tariff-feature', label: 'sidebar_menu_tariff_feature', icon: BadgeDollarSign },
    ],
  },
  // Dev only: component showcase for reviewing the design.
  ...(import.meta.env.DEV
    ? [
        {
          title: 'nav.group_dev',
          items: [{ to: '/ui-kit', label: 'nav.ui_kit', icon: LayoutGrid, status: 'ready' as const }],
        },
      ]
    : []),
]

export const NAV_ITEMS = NAV.flatMap((group) => group.items)

/** The menu item a URL belongs to, including its sub-pages (/currency/add → /currency). */
export const findNavItem = (pathname: string) =>
  NAV_ITEMS.find((item) => matchPath({ path: item.to, end: item.to === '/' }, pathname))
