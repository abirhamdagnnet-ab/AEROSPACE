import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/SiteLayout.jsx'
import About from './pages/About.jsx'
import ArticleDetails from './pages/ArticleDetails.jsx'
import Articles from './pages/Articles.jsx'
import AerospaceEngineering from './pages/AerospaceEngineering.jsx'
import Contact from './pages/Contact.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminLogin from './components/admin/AdminLogin.jsx'
import AdminArticleEditor from './pages/admin/AdminArticleEditor.jsx'
import AdminArticles from './pages/admin/AdminArticles.jsx'
import AdminCategories from './pages/admin/AdminCategories.jsx'
import AdminContacts from './pages/admin/AdminContacts.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminChangePassword from './components/admin/AdminChangePassword.jsx'
import './admin.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/change-password" element={<AdminChangePassword />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="articles" element={<AdminArticles />} />
          <Route path="articles/new" element={<AdminArticleEditor />} />
          <Route path="articles/:id/edit" element={<AdminArticleEditor />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="messages" element={<AdminContacts />} />
        </Route>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:slug" element={<ArticleDetails />} />
          <Route path="/aerospace-engineering" element={<AerospaceEngineering />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
