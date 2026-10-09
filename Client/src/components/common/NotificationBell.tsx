import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  Info,
  MessageSquare,
  RefreshCw,
  Star,
  Ticket,
  X,
} from 'lucide-react'
import { notificationService } from '../../services/notificationService'
import { useAppSelector } from '../../store/hooks'
import { cn } from '../../lib/utils'
import type { NotificationItem } from '../../types'

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 30) return 'Just now'
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

interface NotificationBellProps {
  variant?: 'header' | 'dark' | 'default'
  placement?: 'default' | 'sidebar-flyout'
}

export function NotificationBell({
  variant = 'header',
  placement = 'default',
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role || 'employee'

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await notificationService.list({ limit: 30 })
      setNotifications(res.items || [])
      setUnreadCount(res.items.filter((n) => !n.isRead).length)
    } catch {
      // ignore fetch errors silently on background poll
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Initial fetch and auto-polling every 30 seconds
  useEffect(() => {
    void fetchNotifications()
    const interval = setInterval(() => {
      void fetchNotifications(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return
    setMarkingAll(true)
    try {
      await notificationService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // ignore error
    } finally {
      setMarkingAll(false)
    }
  }

  const handleNotificationClick = async (notif: NotificationItem) => {
    // 1. Mark read if unread
    if (!notif.isRead) {
      try {
        await notificationService.markRead(notif._id)
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // ignore
      }
    }

    setOpen(false)

    // 2. Route based on attached entity
    const targetRole = role === 'superadmin' ? 'admin' : role

    if (notif.task) {
      const taskId = typeof notif.task === 'object' ? notif.task._id : notif.task
      if (taskId) {
        navigate(`/${targetRole}/tasks/${taskId}`)
        return
      }
    }

    if (notif.ticket) {
      const ticketId = typeof notif.ticket === 'object' ? notif.ticket._id : notif.ticket
      if (ticketId) {
        navigate(`/${targetRole}/tickets/${ticketId}`)
        return
      }
    }

    // Default fallback routing for tasks vs tickets by message pattern
    if (notif.type.startsWith('task_') || notif.message.toLowerCase().includes('task')) {
      navigate(`/${targetRole}/tasks`)
    } else {
      navigate(`/${targetRole}/tickets`)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead
    return true
  })

  const getNotificationIcon = (notif: NotificationItem) => {
    const type = notif.type.toLowerCase()
    if (type.includes('feedback')) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200 shadow-xs">
          <Star size={15} className="fill-amber-500 text-amber-500" />
        </div>
      )
    }
    if (type.startsWith('task_')) {
      if (type.includes('completed')) {
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-xs">
            <CheckSquare size={15} />
          </div>
        )
      }
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-xs">
          <CheckSquare size={15} />
        </div>
      )
    }
    if (type.includes('resolved') || type.includes('closed')) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-xs">
          <CheckCircle2 size={15} />
        </div>
      )
    }
    if (type.includes('comment')) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 border border-purple-200 shadow-xs">
          <MessageSquare size={15} />
        </div>
      )
    }
    if (type.includes('status') || type.includes('reopened')) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 border border-sky-200 shadow-xs">
          <RefreshCw size={15} />
        </div>
      )
    }
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 border border-blue-200 shadow-xs">
        <Ticket size={15} />
      </div>
    )
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs',
          variant === 'dark'
            ? 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-blue-600 hover:border-slate-300',
          open && (variant === 'dark' ? 'bg-white/25 ring-2 ring-white/30' : 'bg-slate-100 ring-2 ring-blue-100 border-blue-400 text-blue-600')
        )}
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {open && (
        <div
          className={cn(
            'z-50 w-[360px] sm:w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-800 animate-in fade-in duration-200',
            placement === 'sidebar-flyout'
              ? 'fixed lg:left-[270px] lg:bottom-4 lg:right-auto lg:top-auto bottom-16 right-4 max-h-[85vh]'
              : 'absolute right-0 mt-2.5 max-h-[85vh]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                Notifications
              </h3>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                  {unreadCount} new
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <CheckCheck size={13} />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 bg-white px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'flex-1 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer',
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={cn(
                'flex-1 pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer',
                activeTab === 'unread'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <RefreshCw size={20} className="animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-medium">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => void handleNotificationClick(notif)}
                  className={cn(
                    'group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-slate-50',
                    !notif.isRead && 'bg-blue-50/40 hover:bg-blue-50/70'
                  )}
                >
                  {/* Status indicator icon */}
                  {getNotificationIcon(notif)}

                  {/* Message body */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p
                      className={cn(
                        'text-xs leading-relaxed text-slate-800',
                        !notif.isRead ? 'font-bold' : 'font-normal'
                      )}
                    >
                      {notif.message}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                      {notif.ticket && typeof notif.ticket === 'object' && (
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                          {notif.ticket.ticketCode}
                        </span>
                      )}
                      {notif.task && typeof notif.task === 'object' && (
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          {notif.task.taskCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Unread Dot */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                    {!notif.isRead && (
                      <span
                        className="h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-200"
                        title="Unread"
                      />
                    )}
                    <ExternalLink
                      size={12}
                      className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                  <Bell size={22} className="text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px]">
                  Updates about ticket assignments, tasks, and feedback will show up here.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-[10px]">
              <Info size={11} className="text-slate-400" />
              Auto-syncs live updates
            </span>
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              className="flex items-center gap-1 font-bold text-blue-600 hover:underline cursor-pointer"
            >
              <RefreshCw size={10} />
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
