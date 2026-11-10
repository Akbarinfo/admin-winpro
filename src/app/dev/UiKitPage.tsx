import { useMemo, useState, type ReactNode } from 'react'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import type { TableSort } from '@/shared/api/table'
import { formatDate, formatNumber } from '@/shared/lib/format'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Chip,
  Combobox,
  ConfirmDialog,
  DataTable,
  Field,
  Highlight,
  IconButton,
  Input,
  LanguageSwitch,
  Modal,
  NumberInput,
  PageHeader,
  Pagination,
  PasswordInput,
  SearchInput,
  Select,
  Spinner,
  Switch,
  TableCard,
  TableToolbar,
  Textarea,
  ThemeToggle,
  TreeSelect,
  type Column,
} from '@/shared/ui'

// Dev-only showcase of shared/ui (not in the production build, so texts are not translated).
// Each card lists the old-panel components it replaces.

type Rate = { id: number; from: string; to: string; date: string; rate: number }

const RATES: Rate[] = [
  { id: 318, from: 'USD', to: 'UZS', date: '2026-10-19', rate: 12648.5 },
  { id: 317, from: 'EUR', to: 'UZS', date: '2026-10-19', rate: 13712.3 },
  { id: 316, from: 'RUB', to: 'UZS', date: '2026-10-19', rate: 152.84 },
  { id: 315, from: 'CNY', to: 'UZS', date: '2026-10-18', rate: 1771.2 },
  { id: 314, from: 'USD', to: 'KZT', date: '2026-10-18', rate: 487.2 },
  { id: 313, from: 'KZT', to: 'UZS', date: '2026-10-17', rate: 25.96 },
  { id: 312, from: 'USD', to: 'UZS', date: '2026-10-17', rate: 12655 },
  { id: 311, from: 'EUR', to: 'UZS', date: '2026-10-16', rate: 13690.1 },
  { id: 310, from: 'RUB', to: 'UZS', date: '2026-10-16', rate: 153.4 },
  { id: 309, from: 'USD', to: 'KZT', date: '2026-10-15', rate: 486.75 },
]

type Option = { id: number; name: string }
type TreeNode = Option & { children?: TreeNode[] }
const PROFILE_TREE: TreeNode[] = [
  {
    id: 1,
    name: 'Akfa',
    children: [
      { id: 11, name: 'Akfa 60', children: [{ id: 111, name: 'Akfa 60 Termo' }] },
      { id: 12, name: 'Akfa 70' },
    ],
  },
  { id: 2, name: 'Engelberg', children: [{ id: 21, name: 'Engelberg 58' }] },
  { id: 3, name: 'Rehau' },
]
const SYSTEMS: Option[] = [
  { id: 1, name: 'Akfa 60 — ПВХ' },
  { id: 2, name: 'Akfa 70 — ПВХ' },
  { id: 3, name: 'Rehau Blitz New' },
  { id: 4, name: 'Rehau Grazio' },
  { id: 5, name: 'Engelberg Slide' },
  { id: 6, name: 'Engelberg 58' },
]

const SECTIONS = ['Кнопки', 'Поля ввода', 'Выбор', 'Таблица', 'Окна', 'Статусы'] as const

function KitCard({
  title,
  replaces,
  wide,
  children,
}: {
  title: string
  replaces?: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <Card
      className={
        wide ? 'col-span-full grid gap-3.5 p-[18px]' : 'grid content-start gap-3.5 p-[18px]'
      }
    >
      <div>
        <h3 className="text-[14.5px] font-semibold">{title}</h3>
        {replaces && <p className="mt-0.5 text-[11.5px] text-faint">заменяет: {replaces}</p>}
      </div>
      {children}
    </Card>
  )
}

function Section({ title, children }: { title: (typeof SECTIONS)[number]; children: ReactNode }) {
  return (
    <section id={title} className="mb-8 grid scroll-mt-20 gap-3">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] items-start gap-3.5">
        {children}
      </div>
    </section>
  )
}

const row = 'flex flex-wrap items-center gap-2.5'

export function UiKitPage() {
  const [loadingBtn, setLoadingBtn] = useState(false)
  const [num, setNum] = useState<number | null>(1250.5)
  const [system, setSystem] = useState<Option | null>(SYSTEMS[0])
  const [treeValue, setTreeValue] = useState<number[]>([111])
  const [sort, setSort] = useState<TableSort>({ column: 'date', dir: 'desc' })
  const [page, setPage] = useState({ page: 3, size: 20 })
  const [tableState, setTableState] = useState<'data' | 'loading' | 'empty'>('data')
  const [selected, setSelected] = useState<number | null>(317)
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [query, setQuery] = useState('')

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...RATES].sort((a, b) =>
      a[sort.column as keyof Rate] > b[sort.column as keyof Rate] ? dir : -dir,
    )
  }, [sort])

  const columns: Column<Rate>[] = [
    {
      key: 'from',
      title: 'Из валюты',
      render: (r) => (
        <Chip>
          <Highlight text={r.from} query={query} />
        </Chip>
      ),
    },
    {
      key: 'to',
      title: 'В валюту',
      render: (r) => (
        <Chip>
          <Highlight text={r.to} query={query} />
        </Chip>
      ),
    },
    { key: 'date', title: 'Дата', sortable: true, render: (r) => formatDate(r.date) },
    {
      key: 'rate',
      title: 'Курс',
      sortable: true,
      align: 'right',
      render: (r) => <b className="tabular-nums">{formatNumber(r.rate, 2)}</b>,
    },
  ]

  return (
    <>
      <PageHeader
        title="UI компоненты"
        description="shared/ui — всё, из чего собираются страницы. Страница есть только в dev-режиме."
        actions={
          <>
            <LanguageSwitch />
            <ThemeToggle bordered />
          </>
        }
      />

      <nav className="mb-6 flex flex-wrap gap-1.5">
        {SECTIONS.map((s) => (
          <a
            key={s}
            href={`#${s}`}
            className="rounded-md border border-line bg-surface px-3 py-1 hover:border-primary hover:text-primary-strong"
          >
            {s}
          </a>
        ))}
      </nav>

      <Section title="Кнопки">
        <KitCard title="Button" replaces="AddButton.js, Button.js, PriceButton.js, nextButton.js">
          <div className={row}>
            <Button icon={<Plus size={16} />}>Добавить</Button>
            <Button variant="outline" icon={<Download size={16} />}>
              Экспорт
            </Button>
            <Button variant="ghost">Назад</Button>
            <Button variant="danger">Удалить</Button>
          </div>
          <div className={row}>
            <Button size="sm">Small</Button>
            <Button>Medium</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className={row}>
            <Button
              loading={loadingBtn}
              onClick={() => {
                setLoadingBtn(true)
                setTimeout(() => setLoadingBtn(false), 1500)
              }}
            >
              {loadingBtn ? 'Сохраняем…' : 'Нажмите — loading'}
            </Button>
          </div>
        </KitCard>
        <KitCard
          title="IconButton"
          replaces="EditButton.js, DeleteButton.js, CopyButton.js, SettingButton.js"
        >
          <div className={row}>
            <IconButton label="Изменить">
              <Pencil size={16} />
            </IconButton>
            <IconButton label="Удалить" tone="danger">
              <Trash2 size={16} />
            </IconButton>
            <IconButton label="Скачать" bordered>
              <Download size={16} />
            </IconButton>
          </div>
          <p className="text-xs text-faint">
            label обязателен: он же подсказка и имя для экранного диктора.
          </p>
        </KitCard>
      </Section>

      <Section title="Поля ввода">
        <KitCard title="Input, Field" replaces="InputComponent.js, SearchInputComponent.jsx">
          <Field label="Название" htmlFor="kit-name" required hint="Как в каталоге поставщика">
            <Input id="kit-name" defaultValue="Рама 60 мм" />
          </Field>
          <Field label="Артикул" htmlFor="kit-art" error="validation.required" required>
            <Input id="kit-art" invalid />
          </Field>
          <Field label="Отключено" htmlFor="kit-dis">
            <Input id="kit-dis" disabled defaultValue="AK-60-101" />
          </Field>
        </KitCard>
        <KitCard title="NumberInput, PasswordInput, дата" replaces="InputDate.js, react-input-mask">
          <Field label="Длина" htmlFor="kit-num" hint={`Значение: ${num ?? 'null'}`}>
            <NumberInput id="kit-num" value={num} onChange={setNum} unit="мм" nonNegative />
          </Field>
          <Field label="Пароль" htmlFor="kit-pw">
            <PasswordInput id="kit-pw" defaultValue="winpro2026" />
          </Field>
          <Field label="Дата" htmlFor="kit-date">
            <Input id="kit-date" type="date" defaultValue="2026-10-19" />
          </Field>
        </KitCard>
        <KitCard title="Textarea">
          <Field label="Описание" htmlFor="kit-desc">
            <Textarea id="kit-desc" defaultValue="Профиль рамы для поворотно-откидных окон." />
          </Field>
        </KitCard>
      </Section>

      <Section title="Выбор">
        <KitCard
          title="Combobox"
          replaces="Combobox.js, comboComponent.js, SelectComponent.js, AsyncSearchCombobox.js"
        >
          <Field
            label="Система профилей"
            htmlFor="kit-cb"
            hint="Введите «reh» — список отфильтруется. ↑ ↓ Enter Esc"
          >
            <Combobox
              id="kit-cb"
              options={SYSTEMS}
              value={system}
              onChange={setSystem}
              getKey={(o) => o.id}
              getLabel={(o) => o.name}
              clearable
            />
          </Field>
          <Field label="Загрузка" htmlFor="kit-cb2">
            <Combobox
              id="kit-cb2"
              options={[]}
              value={null}
              onChange={() => {}}
              getKey={(o: Option) => o.id}
              getLabel={(o) => o.name}
              loading
            />
          </Field>
        </KitCard>
        <KitCard title="TreeSelect" replaces="TreeSelectComponent.js (antd TreeSelect)">
          <Field
            label="Системы профилей"
            htmlFor="kit-tree"
            hint="Родитель отмечает всю ветку; в значении только конечные узлы. → ← открыть/закрыть ветку"
          >
            <TreeSelect
              id="kit-tree"
              options={PROFILE_TREE}
              value={treeValue}
              onChange={setTreeValue}
              getKey={(n) => n.id}
              getLabel={(n) => n.name}
              getChildren={(n) => n.children}
            />
          </Field>
        </KitCard>
        <KitCard title="Select (нативный)" replaces="Select.js (размер страницы)">
          <Field label="Страна" htmlFor="kit-sel">
            <Select id="kit-sel" defaultValue="UZ">
              <option value="UZ">Узбекистан</option>
              <option value="KZ">Казахстан</option>
            </Select>
          </Field>
          <p className="text-xs text-faint">
            Для коротких фиксированных списков. Для поиска и длинных списков — Combobox.
          </p>
        </KitCard>
        <KitCard
          title="Checkbox, Switch"
          replaces="CheckboxComponent.js, Toggle.js, ToggleWithLabel.js, TailwindToggle.js"
        >
          <Checkbox label="Армирование" defaultChecked />
          <Checkbox label="Арочный профиль" />
          <Switch label="Показывать в каталоге" defaultChecked />
          <Switch label="Отключено" disabled />
        </KitCard>
      </Section>

      <Section title="Таблица">
        <KitCard
          wide
          title="DataTable + Pagination"
          replaces="TemDataTable.jsx, TemDataTableInline.js, DataTable.js, FillingDataTable.js, Pagination.js, Select.js, search/*SearchInput.js + 6 Context"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-faint uppercase">
              Состояние
            </span>
            {(['data', 'loading', 'empty'] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={tableState === s ? 'primary' : 'outline'}
                onClick={() => setTableState(s)}
              >
                {s}
              </Button>
            ))}
            <span className="text-xs text-faint">
              Клик по строке выделяет её; «Дата» и «Курс» сортируются.
            </span>
          </div>
          <TableCard className="max-h-[360px]">
            <TableToolbar>
              <SearchInput value={query} onChange={setQuery} />
              {query && (
                <span className="text-xs text-faint">
                  Ищем: «{query}» (применяется через 300 мс, от 2 символов)
                </span>
              )}
            </TableToolbar>
            <DataTable
              columns={columns}
              rows={
                tableState === 'empty'
                  ? []
                  : sorted.filter((r) =>
                      `${r.from} ${r.to}`.toLowerCase().includes(query.toLowerCase()),
                    )
              }
              getRowKey={(r) => r.id}
              loading={tableState === 'loading'}
              sort={sort}
              onSortChange={setSort}
              highlight={query}
              selectedKey={selected}
              onRowClick={(r) => setSelected(r.id)}
              actions={() => (
                <>
                  <IconButton label="Изменить">
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton label="Удалить" tone="danger" onClick={() => setConfirm(true)}>
                    <Trash2 size={16} />
                  </IconButton>
                </>
              )}
            />
            <Pagination page={page.page} size={page.size} total={318} onChange={setPage} />
          </TableCard>
        </KitCard>
      </Section>

      <Section title="Окна">
        <KitCard title="Modal" replaces="components/modal/*, ModalAdd*.js">
          <div className={row}>
            <Button variant="outline" onClick={() => setModal(true)}>
              Открыть форму
            </Button>
          </div>
          <p className="text-xs text-faint">
            Закрывается по Esc, крестику и клику по фону. Фокус остаётся внутри.
          </p>
        </KitCard>
        <KitCard title="ConfirmDialog" replaces="swal() — 73 вызова">
          <div className={row}>
            <Button variant="danger" onClick={() => setConfirm(true)}>
              Удалить запись
            </Button>
          </div>
          <p className="text-xs text-faint">
            В приложении открывается через useConfirmDelete — вместе с запросом и toast.
          </p>
        </KitCard>
      </Section>

      <Section title="Статусы">
        <KitCard title="Alert">
          <Alert>Неверный логин или пароль.</Alert>
          <Alert tone="warn">Запись используется в 3 шаблонах.</Alert>
          <Alert tone="ok">Цены обновлены.</Alert>
        </KitCard>
        <KitCard title="Chip, Spinner">
          <div className={row}>
            <Chip>Akfa 60</Chip>
            <Chip tone="primary">Рама</Chip>
            <Chip tone="ok">Активен</Chip>
            <Chip tone="warn">Нет цены</Chip>
            <Chip tone="danger">Ошибка</Chip>
          </div>
          <div className={`${row} text-primary`}>
            <Spinner />
            <Spinner className="size-6" />
          </div>
        </KitCard>
      </Section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Новый курс"
        onSubmit={(e) => {
          e.preventDefault()
          setModal(false)
        }}
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(false)}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </>
        }
      >
        <Field label="Система профилей" htmlFor="kit-m-cb" required>
          <Combobox
            id="kit-m-cb"
            options={SYSTEMS}
            value={system}
            onChange={setSystem}
            getKey={(o) => o.id}
            getLabel={(o) => o.name}
          />
        </Field>
        <Field label="Курс" htmlFor="kit-m-num" required>
          <NumberInput id="kit-m-num" value={num} onChange={setNum} />
        </Field>
      </Modal>

      <ConfirmDialog
        open={confirm}
        title="Удалить запись?"
        description="«USD → UZS, 19.10.2026» будет удалено без возможности восстановления."
        confirmLabel="Удалить"
        onConfirm={() => setConfirm(false)}
        onCancel={() => setConfirm(false)}
      />
    </>
  )
}
