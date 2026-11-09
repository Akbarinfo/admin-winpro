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

export type NavItem = { to: string; label: string; icon: LucideIcon }
export type NavGroup = { title: string; items: NavItem[] }

// Sidebar menu as data. Paths and labels come from the old panel (components/Sidebar.js),
// so links users have bookmarked keep working. Labels are i18n keys.
export const NAV: NavGroup[] = [
  {
    title: 'nav.group_overview',
    items: [{ to: '/', label: 'sidebar_menu_dashboard', icon: House }],
  },
  {
    title: 'nav.group_references',
    items: [
      { to: '/currency', label: 'sidebar_menu_currency', icon: Coins },
      { to: '/exchange', label: 'exchange.title', icon: ArrowLeftRight },
      { to: '/country', label: 'country', icon: Globe },
      { to: '/units', label: 'sidebar_menu_units', icon: Ruler },
      { to: '/series', label: 'sidebar_menu_series', icon: Layers },
      { to: '/material-type', label: 'sidebar_material_type', icon: Boxes },
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
      { to: '/languages', label: 'sidebar_menu_languages', icon: Type },
      { to: '/tariff-feature', label: 'sidebar_menu_tariff_feature', icon: BadgeDollarSign },
    ],
  },
  // Dev only: component showcase for reviewing the design.
  ...(import.meta.env.DEV
    ? [{ title: 'nav.group_dev', items: [{ to: '/ui-kit', label: 'nav.ui_kit', icon: LayoutGrid }] }]
    : []),
]

export const NAV_ITEMS = NAV.flatMap((group) => group.items)

/** The menu item a URL belongs to, including its sub-pages (/currency/add → /currency). */
export const findNavItem = (pathname: string) =>
  NAV_ITEMS.find((item) => matchPath({ path: item.to, end: item.to === '/' }, pathname))
