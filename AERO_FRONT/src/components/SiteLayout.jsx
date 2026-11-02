import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from './layout/Footer.jsx'
import Header from './layout/Header.jsx'

function SiteLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default SiteLayout
