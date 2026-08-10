import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/common/Navbar'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar
        publicMode
        items={[
          { to: '/', label: 'Home' },
          { to: '/raise-ticket', label: 'Raise Ticket' },
          { to: '/track-ticket', label: 'Track Ticket' },
        ]}
      />
      <Outlet />
    </div>
  )
}
