import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, Home, LogOut, PanelLeft, Search, Radio, Check } from 'lucide-react'
import { useStore } from '../lib/store'
import logoFull from '../assets/quantanite-logo.png'
import logoMark from '../assets/quantanite-mark.png'
import { agents, COACH } from '../data/qlensData'
import { Avatar, Btn, Drawer, Modal, Popover, timeAgo } from './ui'

function Logo({ collapsed }) {
  return (
    <div className={`flex items-center h-[52px] ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
      {collapsed ? <img src={logoMark} alt="Quantanite" className="h-7 w-auto" /> : <img src={logoFull} alt="Quantanite" className="h-7 w-auto" />}
    </div>
  )
}

export function Sidebar() {
  const { state } = useStore()
  const collapsed = state.sidebarCollapsed
  return (
    <aside className={`${collapsed ? 'w-[64px]' : 'w-[256px]'} shrink-0 bg-white border-r border-(--color-line) hidden md:flex flex-col transition-all`}>
      <Logo collapsed={collapsed} />
      {!collapsed && (
        <div className="px-4 mt-6 mb-2 text-[10.5px] font-semibold tracking-wider text-(--color-ink-mute)">
          {state.persona === 'agent' ? 'EMPLOYEE' : 'COACH'}
        </div>
      )}
      <nav className={`${collapsed ? 'px-2 mt-6' : 'px-2'}`}>
        <button onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })} className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-3'} py-2 rounded-xl border-2 border-(--color-teal) bg-(--color-mint-2) text-(--color-ink) text-[14px]`}>
          <Home size={17} />
          {!collapsed && 'Home'}
        </button>
      </nav>
      <div className="mt-auto p-4 text-[10.5px] text-(--color-ink-mute) leading-relaxed">

      </div>
    </aside>
  )
}

function RoleSwitcher() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-(--color-line) bg-(--color-paper) hover:bg-white">
        <span className="text-[12px] px-2 py-0.5 rounded-full border border-(--color-teal) text-(--color-teal-dark) bg-white">
          {state.persona === 'agent' ? 'Employee' : 'Coach'}
        </span>
        <ChevronDown size={15} className="text-(--color-ink-soft)" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="right-0 top-11 w-60 p-1.5">
        {[
          ['agent', 'Employee', 'Agent view: Q-tips, progress, numbers'],
          ['coach', 'Coach', 'Team view: 1:1s, to-dos, evidence'],
        ].map(([k, label, sub]) => (
          <button
            key={k}
            onClick={() => {
              dispatch({ type: 'persona', persona: k })
              setOpen(false)
            }}
            className="w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-(--color-paper)"
          >
            <span className="w-4 mt-0.5">{state.persona === k && <Check size={14} className="text-(--color-teal)" />}</span>
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-(--color-ink-soft)">{sub}</span>
            </span>
          </button>
        ))}
      </Popover>
    </div>
  )
}

function Notifications() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const recipient = state.persona === 'agent' ? state.agentId : 'coach'
  const list = state.notifications[recipient] || []
  const unread = list.filter((n) => !n.read).length
  return (
    <div className="relative">
      <button aria-label="Notifications" onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-lg hover:bg-(--color-paper)">
        <Bell size={20} className="text-(--color-ink)" />
        {unread > 0 && (
          <span className="absolute -top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#e5484d] text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>
        )}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="right-0 top-11 w-80">
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-line)">
          <span className="text-sm font-semibold">Notifications</span>
          <button onClick={() => dispatch({ type: 'markRead', recipient })} className="text-xs text-(--color-teal-dark) font-medium hover:underline disabled:opacity-40" disabled={!unread}>
            Mark all read
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {list.length === 0 && <div className="px-4 py-6 text-sm text-(--color-ink-soft) text-center">You're all caught up.</div>}
          {list.map((n) => (
            <div key={n.id} className={`px-4 py-3 border-b border-(--color-line) last:border-0 ${n.read ? '' : 'bg-(--color-mint-2)'}`}>
              <div className="flex gap-2">
                {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-(--color-teal) shrink-0" />}
                <div>
                  <div className="text-[13px] text-(--color-ink)">{n.text}</div>
                  <div className="text-[11px] text-(--color-ink-mute) mt-0.5">{timeAgo(n.at)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Popover>
    </div>
  )
}

function UserMenu() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const me = state.persona === 'agent' ? agents[state.agentId] : COACH
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-(--color-paper) text-left">
        <Avatar initials={me.initials} size={32} />
        <span className="hidden lg:block leading-tight">
          <span className="block text-[13px] font-semibold">{me.name}</span>
          <span className="block text-[11px] text-(--color-ink-soft)">{me.email}</span>
        </span>
        <ChevronDown size={14} className="text-(--color-ink-soft)" />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} className="right-0 top-12 w-72 p-1.5">
        {state.persona === 'agent' ? (
          <>
            <div className="px-3 pt-2 pb-1 text-[10.5px] font-semibold tracking-wider text-(--color-ink-mute)">DEMO · SIGN IN AS</div>
            <div className="max-h-80 overflow-y-auto">
              {Object.values(agents).map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    dispatch({ type: 'agent', agentId: a.id })
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-(--color-paper) text-left"
                >
                  <Avatar initials={a.initials} size={26} tone={a.id === state.agentId ? 'teal' : 'soft'} />
                  <span className="flex-1 text-sm">{a.name}</span>
                  {a.real ? <span className="text-[10px] font-semibold text-(--color-teal-dark)">REAL DATA</span> : <span className="text-[10px] text-(--color-ink-mute)">illustrative</span>}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="px-3 py-2 text-sm text-(--color-ink-soft)">Signed in as {COACH.name}, Coach for a 10-agent team.</div>
        )}
      </Popover>
    </div>
  )
}

function SearchBox({ query, setQuery, onPickAgent }) {
  const { state } = useStore()
  const ref = useRef(null)
  const [focus, setFocus] = useState(false)
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const isCoach = state.persona === 'coach'
  const matches = isCoach && query ? Object.values(agents).filter((a) => a.name.toLowerCase().includes(query.toLowerCase())) : []
  return (
    <div className="relative w-full max-w-[320px] min-w-0">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-ink-mute)" />
      <input
        ref={ref}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder={isCoach ? 'Search employee...' : 'Search your Q-tips...'}
        className="w-full pl-9 pr-12 py-2 text-sm rounded-lg border border-dashed border-(--color-line) bg-(--color-paper) focus:bg-white focus:border-solid focus:border-(--color-teal) outline-none"
      />
      <kbd className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-(--color-ink-mute) border border-(--color-line) rounded px-1.5 py-0.5 bg-white">⌘ K</kbd>
      {isCoach && focus && query && (
        <div className="absolute top-11 left-0 w-full bg-white border border-(--color-line) rounded-xl shadow-lg z-40 p-1.5">
          {matches.length === 0 && <div className="px-3 py-2 text-sm text-(--color-ink-soft)">No employee matches "{query}".</div>}
          {matches.map((a) => (
            <button
              key={a.id}
              onMouseDown={() => {
                onPickAgent(a.id)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-(--color-paper) text-left text-sm"
            >
              <Avatar initials={a.initials} size={24} tone="soft" /> {a.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SourcesToggle() {
  const { state, dispatch } = useStore()
  const on = state.showSources
  return (
    <button onClick={() => dispatch({ type: 'toggleSources' })} title="Show which data is real and which is seeded, plus the events QLens reports to QIQ" className="hidden md:flex items-center gap-2 text-[12px] text-(--color-ink-soft) px-2 py-1.5 rounded-lg hover:bg-(--color-paper)">
      <span className={`w-8 h-[18px] rounded-full relative transition ${on ? 'bg-(--color-teal)' : 'bg-(--color-line)'}`}>
        <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${on ? 'left-[16px]' : 'left-[2px]'}`} />
      </span>
      Data sources
    </button>
  )
}

export function TopBar({ query, setQuery, onPickAgent }) {
  const { dispatch } = useStore()
  const [confirm, setConfirm] = useState(false)
  return (
    <header className="h-[52px] shrink-0 bg-white border-b border-(--color-line) flex items-center gap-2 sm:gap-3 px-3 sm:px-4">
      <button aria-label="Toggle sidebar" onClick={() => dispatch({ type: 'sidebar' })} className="p-1.5 rounded-lg hover:bg-(--color-paper)">
        <PanelLeft size={18} className="text-(--color-ink-soft)" />
      </button>
      <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
        <RoleSwitcher />
        <Notifications />
        <UserMenu />
        <button aria-label="Log out" onClick={() => setConfirm(true)} className="p-2 rounded-lg hover:bg-(--color-coral-soft)">
          <LogOut size={18} className="text-(--color-coral)" />
        </button>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Log out and reset the demo?"
        subtitle="Everything goes back to the start of the day: cards unread, XP and streaks as seeded, the queue as it was."
        footer={
          <>
            <Btn variant="outline" onClick={() => setConfirm(false)}>Cancel</Btn>
            <Btn
              onClick={() => {
                dispatch({ type: 'reset' })
                setConfirm(false)
              }}
            >
              Log out and reset
            </Btn>
          </>
        }
      >
        <div className="text-sm text-(--color-ink-soft)">Use this before running the demo for someone new.</div>
      </Modal>
    </header>
  )
}

export function EventLog() {
  const { state } = useStore()
  const [open, setOpen] = useState(false)
  if (!state.showSources) return null
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} className="fixed right-5 z-30 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-(--color-ink) text-white text-[13px] font-medium shadow-lg hover:brightness-110">
        <Radio size={15} className="text-(--color-teal)" />
        <span className="hidden sm:inline">Reported to QIQ</span>
        <span className="ml-1 text-[11px] bg-white/15 rounded-full px-2 py-0.5">{state.events.length}</span>
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Reported to QIQ" subtitle="Every event QLens sends back. QIQ decides, QLens shows, tracks and reports.">
        {state.events.length === 0 && (
          <div className="text-sm text-(--color-ink-soft) py-8 text-center">
            No events yet. Read a Q-tip, nudge an agent, or book a session and it appears here.
          </div>
        )}
        <div className="space-y-2">
          {state.events.map((e) => (
            <div key={e.id} className="border border-(--color-line) rounded-lg px-3 py-2.5 anim-rise">
              <div className="flex items-center justify-between">
                <code className="text-[11.5px] font-semibold text-(--color-teal-dark) bg-(--color-teal-soft) px-1.5 py-0.5 rounded">{e.type}</code>
                <span className="text-[11px] text-(--color-ink-mute)">{timeAgo(e.at)}</span>
              </div>
              <div className="text-[13px] mt-1.5">{e.text}</div>
            </div>
          ))}
        </div>
      </Drawer>
    </>
  )
}
