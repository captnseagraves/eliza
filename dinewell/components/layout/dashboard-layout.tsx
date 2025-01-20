import { UserButton } from "@clerk/nextjs"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-yellow-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-rose-600">The Spirit of Dinner</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[200px] flex-col md:flex">
          <nav className="grid items-start px-4 py-4">
            <Link
              href="/dashboard"
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-rose-100"
            >
              My Events
            </Link>
            <Separator className="my-2" />
            <Link
              href="/dashboard/events/new"
              className="flex items-center rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              Create Event
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
