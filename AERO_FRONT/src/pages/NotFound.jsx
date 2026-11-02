import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="not-found-section">
      <div className="container not-found-content">
        <span className="not-found-icon"><Compass size={29} /></span>
        <span className="eyebrow">Off the flight path</span>
        <p className="not-found-code">404</p>
        <h1>This page has drifted out of orbit.</h1>
        <p>The page you’re looking for may have moved, or the link may be out of date.</p>
        <Link className="button button-primary" to="/"><ArrowLeft size={17} /> Back to home</Link>
      </div>
    </section>
  )
}

export default NotFound
