import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Inbox, Mail, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminRequest } from '../../utils/adminApi.js'

const PAGE_SIZE = 20

function AdminContacts() {
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messageToDelete, setMessageToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    adminRequest(`/admin/contact-messages?page=${page}&limit=${PAGE_SIZE}`)
      .then(({ data, meta }) => { if (active) setResult({ messages: data, meta }) })
      .catch((requestError) => { if (active) toast.error(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, refreshKey])

  async function removeMessage() {
    if (!messageToDelete) return
    setDeleting(true)
    try {
      await adminRequest(`/admin/contact-messages/${messageToDelete.id}`, { method: 'DELETE', csrf: true })
      setMessageToDelete(null)
      toast.success('Contact message deleted.')
      if (result.messages.length === 1 && page > 1) setPage((current) => current - 1)
      else setRefreshKey((current) => current + 1)
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to delete contact message.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><span className="admin-eyebrow">INBOX</span><h1>Contact messages</h1><p>Read visitor messages submitted through the AeroCampus contact form.</p></div>
      </div>
      <section className="admin-panel admin-contacts-panel">
        <div className="admin-panel-heading">
          <div><h2>Visitor messages</h2><p>Newest messages appear first.</p></div>
          <span className="admin-count-pill">{result?.meta.totalItems ?? 0} total</span>
        </div>
        {loading ? <div className="admin-state"><span className="admin-spinner" /> Loading contact messages…</div> : result?.messages.length ? (
          <>
            <div className="admin-contact-list">
              {result.messages.map((message) => (
                <article className="admin-contact-card" key={message.id}>
                  <div className="admin-contact-heading">
                    <div className="admin-contact-identity">
                      <span className="admin-contact-icon"><Mail size={17} /></span>
                      <div><h3>{message.name}</h3><a href={`mailto:${message.email}`}>{message.email}</a></div>
                    </div>
                    <div className="admin-contact-tools">
                      <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time>
                      <button className="admin-row-action is-danger" type="button" onClick={() => setMessageToDelete(message)} aria-label={`Delete message from ${message.name}`}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="admin-contact-topic">{message.subject || 'No topic selected'}</div>
                  <p className="admin-contact-message">{message.message}</p>
                </article>
              ))}
            </div>
            <div className="admin-pagination">
              <span>{result.meta.totalItems} messages · Page {result.meta.page} of {Math.max(1, result.meta.totalPages)}</span>
              <div>
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft size={16} /></button>
                <button type="button" aria-label="Next page" disabled={page >= result.meta.totalPages} onClick={() => setPage((current) => current + 1)}><ArrowRight size={16} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="admin-empty-state"><span><Inbox size={22} /></span><h3>No contact messages yet.</h3><p>Messages sent through the public contact form will appear here.</p></div>
        )}
      </section>
      {messageToDelete && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (!deleting && event.target === event.currentTarget) setMessageToDelete(null)
          }}
        >
          <section className="admin-modal admin-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="contact-delete-title" aria-describedby="contact-delete-description">
            <div className="admin-modal-heading">
              <div><span className="admin-eyebrow">CONFIRM DELETION</span><h2 id="contact-delete-title">Delete this message?</h2></div>
              <button className="admin-icon-button" type="button" aria-label="Close confirmation" disabled={deleting} onClick={() => setMessageToDelete(null)}><X size={18} /></button>
            </div>
            <p className="admin-confirm-copy" id="contact-delete-description">The message from <strong>{messageToDelete.name}</strong> will be permanently deleted.</p>
            <div className="admin-modal-actions">
              <button className="admin-secondary-button" type="button" disabled={deleting} onClick={() => setMessageToDelete(null)}>Cancel</button>
              <button className="admin-danger-button" type="button" disabled={deleting} onClick={removeMessage}>{deleting ? 'Deleting…' : 'Delete message'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminContacts
