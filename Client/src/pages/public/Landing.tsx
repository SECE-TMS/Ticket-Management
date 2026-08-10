import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Search } from 'lucide-react'

export function Landing() {
  return (
    <section className="hero-atmosphere relative min-h-[calc(100vh-3.5rem)] overflow-hidden text-white">
      <div className="hero-pattern absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <p className="font-display text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          TMS
        </p>
        <p className="mt-2 text-sm font-medium tracking-[0.2em] text-teal-200/90 uppercase sm:text-base">
          Ticket Management System
        </p>
        <h1 className="mt-8 max-w-2xl font-display text-3xl leading-tight font-medium text-white/95 sm:text-4xl">
          Campus maintenance requests, tracked from report to resolution.
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
          Raise facility issues in minutes and follow every status update without waiting on phone
          calls.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/raise-ticket"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-white transition hover:bg-teal-600"
          >
            Raise Ticket
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/track-ticket"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            <Search size={18} />
            Track Ticket
          </Link>
          <Link
            to="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-teal-100 transition hover:text-white"
          >
            <ClipboardList size={18} />
            Staff Login
          </Link>
        </div>
      </div>
    </section>
  )
}
