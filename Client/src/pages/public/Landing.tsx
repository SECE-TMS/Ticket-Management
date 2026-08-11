import { Link } from 'react-router-dom'
import { ArrowRight, Headset, Search} from 'lucide-react'

// const features = [
//   {
//     icon: Zap,
//     title: 'Raise in minutes',
//     desc: 'Submit facility issues instantly with photos or voice notes attached.',
//   },
//   {
//     icon: Search,
//     title: 'Track live status',
//     desc: 'Follow every stage from assignment to resolution without any calls.',
//   },
//   {
//     icon: Shield,
//     title: 'SLA guaranteed',
//     desc: 'Every department has defined response times so issues never go unresolved.',
//   },
// ]

export function Landing() {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-[var(--primary-blue-deeper)] via-[var(--primary-blue)] to-[var(--primary-blue-dark)] min-h-screen text-[var(--white)] flex flex-col"
        aria-label="Hero"
      >
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
          aria-hidden
        />

        {/* Gold Glow Accents */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-[var(--gold)] opacity-20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-10 left-10 h-48 w-48 rounded-full bg-[var(--gold)] opacity-10 blur-2xl"
          aria-hidden
        />

        {/* Top Header Logo inside Hero */}
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold bg-[var(--gold)] text-[var(--primary-blue-deeper)] shadow-xs">
              TM
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[var(--white)] leading-none">
                TMS Portal
              </span>
              <span className="text-[10px] font-medium text-white/60 tracking-wider uppercase">
                Ticket Management
              </span>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-4 text-xs font-bold bg-[var(--gold)] text-[var(--primary-blue-deeper)] hover:bg-[var(--gold-dark)] transition-colors shadow-xs"
          >
            Staff Login
          </Link>
        </div>

        {/* Main Hero Copy & CTAs */}
        <div className="relative mx-auto flex flex-1 max-w-5xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          {/* Tagline Badge */}
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-yellow-400/30 bg-[var(--gold)]/15 px-4 py-1.5 text-xs font-bold text-[var(--gold)]">
            <Headset size={13} />
            Campus Maintenance &amp; Facilities
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl font-bold leading-tight text-[var(--white)] sm:text-5xl lg:text-6xl">
            Resolve campus issues{' '}
            <span className="text-[var(--gold)]">faster than ever</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Raise facility issues in minutes and follow every status update — from assignment to
            completion — without waiting on phone calls.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/raise-ticket"
              id="hero-raise-ticket"
              className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-[var(--gold)] px-7 text-sm font-bold text-[var(--primary-blue-deeper)] shadow-lg shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Raise a Ticket
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/track-ticket"
              id="hero-track-ticket"
              className="inline-flex h-12 items-center gap-2.5 rounded-xl border border-white/30 bg-white/5 px-7 text-sm font-semibold text-[var(--white)] backdrop-blur-xs transition-all hover:bg-white/15"
            >
              <Search size={16} />
              Track Ticket
            </Link>
            {/* <Link
              to="/login"
              id="hero-staff-login"
              className="inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white/60 transition-colors hover:text-[var(--white)]"
            >
              <ClipboardList size={16} />
              Staff Login
            </Link> */}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ─────────────────────────────────────────────── */}
      {/* <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-label="Features">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-blue-light)] text-[var(--primary-blue)]">
                <Icon size={22} />
              </div>
              <h2 className="text-base font-bold text-[var(--ink)]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                {desc}
              </p>
            </div>
          ))}
        </div> */}

        {/* Bottom CTA strip */}
        {/* <div className="mt-10 rounded-2xl bg-[var(--primary-blue)] p-8 text-center text-[var(--white)] shadow-md">
          <p className="text-lg font-bold">Ready to report an issue?</p>
          <p className="mt-1 text-sm text-white/70">
            It takes less than 2 minutes.
          </p>
          <Link
            to="/raise-ticket"
            id="cta-raise-ticket"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--gold)] px-8 text-sm font-bold text-[var(--primary-blue-deeper)] transition-all hover:scale-105"
          >
            Get Started <ArrowRight size={15} />
          </Link>
        </div>
      </section> */}
    </div>
  )
}
