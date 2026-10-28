import { Suspense, useEffect } from 'react'
import Skeleton from '../ui/Skeleton'
import { useLocation, useOutlet } from 'react-router'
import { AnimatePresence } from 'motion/react'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileTabBar from './MobileTabBar'
import PageTransition from './PageTransition'
import ErrorBoundary from './ErrorBoundary'
import { MaintenanceBanner } from '../feature/Announcements'

export default function Layout() {
  const location = useLocation()
  const outlet = useOutlet()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[90] focus:bg-marigold focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <Navbar />
      <MaintenanceBanner />
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname.split('/').slice(0, 3).join('/')}>
            <ErrorBoundary key={location.pathname}>
              <Suspense
                fallback={
                  <div className="mx-auto max-w-6xl space-y-4 px-4 py-14">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-3/4" />
                    <Skeleton className="h-48" />
                  </div>
                }
              >
                {outlet}
              </Suspense>
            </ErrorBoundary>
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  )
}
