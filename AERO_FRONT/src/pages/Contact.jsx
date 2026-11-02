import { useState } from 'react'
import { ArrowRight, Mail, MapPin, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { submitContactMessage } from '../utils/api.js'

function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    const form = event.currentTarget

    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      subject: String(formData.get('topic') || '').trim(),
      message: String(formData.get('message') || '').trim(),
    }

    try {
      await submitContactMessage(payload)
      setSubmitted(true)
      form.reset()
      toast.success('Your message was sent successfully.')
    } catch (requestError) {
      const validationMessages = Array.isArray(requestError.details)
        ? requestError.details.map((detail) => detail.message).filter(Boolean)
        : []
      const nextFieldErrors = Object.fromEntries(
        (Array.isArray(requestError.details) ? requestError.details : [])
          .filter((detail) => detail.field)
          .map((detail) => [detail.field, detail.message])
      )
      setFieldErrors(nextFieldErrors)
      const message = requestError.status === 503
        ? 'Your message was saved, but we couldn’t notify our team by email. Please contact hello@aerocampus.org if your request is urgent.'
        : validationMessages.length
          ? `Please review your contact details: ${validationMessages.join(' ')}`
          : requestError.message || 'We couldn’t send your message. Please try again shortly.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="page-intro contact-intro">
        <div className="container">
          <div className="breadcrumb"><span>Explore</span><span>/</span><strong>Contact</strong></div>
          <span className="eyebrow">We’d love to hear from you</span>
          <h1>Have a question? <span>Let’s talk.</span></h1>
          <p>Share an idea, ask about our learning resources, or tell us what you’d like to explore next.</p>
        </div>
      </section>
      <section className="section contact-section">
        <div className="container contact-grid">
          <div className="contact-info">
            <span className="eyebrow">Get in touch</span>
            <h2>Good conversations start with a hello.</h2>
            <p>We’re growing AeroCampus one curious conversation at a time.</p>
            <a className="contact-info-item" href="mailto:hello@aerocampus.org">
              <span><Mail size={19} /></span><span><small>Email us</small><strong>hello@aerocampus.org</strong></span>
            </a>
            <div className="contact-info-item">
              <span><MapPin size={19} /></span><span><small>Our focus</small><strong>Learning without borders</strong></span>
            </div>
            <div className="contact-note"><MessageCircle size={18} /><p>Have an idea for a story or resource? We’d especially love to hear it.</p></div>
          </div>
          <div className="contact-form-card">
            {submitted ? (
              <div className="form-success" role="status">
                <span className="form-success-icon"><MessageCircle size={22} /></span>
                <h2>Thanks for reaching out.</h2>
                <p>Your message has been received and saved in the backend. To contact the team directly, email <a href="mailto:hello@aerocampus.org">hello@aerocampus.org</a>.</p>
                <button className="text-link" type="button" onClick={() => setSubmitted(false)}>Send another message <ArrowRight size={16} /></button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2>Send us a message</h2>
                <p className="form-intro">All fields are required.</p>
                <div className="form-row">
                  <label>Full name<input name="name" type="text" autoComplete="name" placeholder="Your name" minLength={2} maxLength={100} required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined} onChange={() => setFieldErrors((current) => ({ ...current, name: '' }))} />{fieldErrors.name && <small className="field-error" id="contact-name-error">{fieldErrors.name}</small>}</label>
                  <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined} onChange={() => setFieldErrors((current) => ({ ...current, email: '' }))} />{fieldErrors.email && <small className="field-error" id="contact-email-error">{fieldErrors.email}</small>}</label>
                </div>
                <label>What’s this about?
                  <select name="topic" defaultValue="" required aria-invalid={Boolean(fieldErrors.subject)} aria-describedby={fieldErrors.subject ? 'contact-subject-error' : undefined} onChange={() => setFieldErrors((current) => ({ ...current, subject: '' }))}>
                    <option value="" disabled>Select a topic</option>
                    <option>Learning resources</option>
                    <option>Aerospace careers</option>
                    <option>Story suggestion</option>
                    <option>Something else</option>
                  </select>
                  {fieldErrors.subject && <small className="field-error" id="contact-subject-error">{fieldErrors.subject}</small>}
                </label>
                <label>Your message<textarea name="message" rows="5" minLength={10} maxLength={5000} placeholder="Tell us what’s on your mind..." required aria-invalid={Boolean(fieldErrors.message)} aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined} onChange={() => setFieldErrors((current) => ({ ...current, message: '' }))} />{fieldErrors.message && <small className="field-error" id="contact-message-error">{fieldErrors.message}</small>}</label>
                <button className="button button-primary form-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send your message'} <ArrowRight size={17} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default Contact
