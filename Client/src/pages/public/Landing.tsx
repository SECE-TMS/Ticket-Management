import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Headset, Search, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Raise in minutes',
    desc: 'Submit facility issues instantly with photos or voice notes attached.',
  },
  {
    icon: Search,
    title: 'Track live status',
    desc: 'Follow every stage from assignment to resolution without any calls.',
  },
  {
    icon: Shield,
    title: 'SLA guaranteed',
    desc: 'Every department has defined response times so issues never go unresolved.',
  },
]

export function Landing() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]" style={{ background: 'var(--surface)' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="hero-atmosphere relative overflow-hidden"
        style={{ minHeight: '85vh' }}
        aria-label="Hero"
      >
        <div className="hero-pattern absolute inset-0 opacity-50" aria-hidden />

        {/* Gold shimmer blobs */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--gold)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-10 left-10 h-48 w-48 rounded-full opacity-10 blur-2xl"
          style={{ background: 'var(--gold)' }}
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[85vh] max-w-5xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="animate-fade-in mb-6 inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
               style={{ background: 'rgb(249 195 1 / 0.15)', border: '1px solid rgb(249 195 1 / 0.3)', color: 'var(--gold)' }}>
            <Headset size={13} />
            Campus Maintenance &amp; Facilities
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
              style={{ animationDelay: '0.05s' }}>
            Resolve campus issues{' '}
            <span style={{ color: 'var(--gold)' }}>faster than ever</span>
          </h1>

          <p className="animate-fade-in mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
             style={{ color: 'rgb(255 255 255 / 0.72)', animationDelay: '0.1s' }}>
            Raise facility issues in minutes and follow every status update — from assignment to
            completion — without waiting on phone calls.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-in mt-10 flex flex-wrap items-center gap-3"
               style={{ animationDelay: '0.15s' }}>
            <Link
              to="/raise-ticket"
              id="hero-raise-ticket"
              className="inline-flex h-12 items-center gap-2.5 rounded-xl px-7 text-sm font-bold transition hover:scale-105 active:scale-95"
              style={{ background: 'var(--gold)', color: 'var(--primary-blue-deeper)', boxShadow: '0 4px 16px rgb(249 195 1 / 0.4)' }}
            >
              Raise a Ticket
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/track-ticket"
              id="hero-track-ticket"
              className="inline-flex h-12 items-center gap-2.5 rounded-xl px-7 text-sm font-semibold backdrop-blur transition hover:bg-white/15"
              style={{ border: '1.5px solid rgb(255 255 255 / 0.3)', color: 'var(--white)' }}
            >
              <Search size={16} />
              Track Ticket
            </Link>
            <Link
              to="/login"
              id="hero-staff-login"
              className="inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium transition hover:text-white"
              style={{ color: 'rgb(255 255 255 / 0.6)' }}
            >
              <ClipboardList size={16} />
              Staff Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-label="Features">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="panel panel-hover p-6 animate-fade-in"
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}
              >
                <Icon size={22} />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <div
          className="mt-10 rounded-2xl p-8 text-center"
          style={{ background: 'var(--primary-blue)', color: 'var(--white)' }}
        >
          <p className="text-lg font-bold">Ready to report an issue?</p>
          <p className="mt-1 text-sm" style={{ color: 'rgb(255 255 255 / 0.7)' }}>
            It takes less than 2 minutes.
          </p>
          <Link
            to="/raise-ticket"
            id="cta-raise-ticket"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-8 text-sm font-bold transition hover:scale-105"
            style={{ background: 'var(--gold)', color: 'var(--primary-blue-deeper)' }}
          >
            Get Started <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  )
}
