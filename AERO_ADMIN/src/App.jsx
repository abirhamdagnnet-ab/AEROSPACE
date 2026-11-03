import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminLogin from './components/admin/AdminLogin.jsx'
import AdminChangePassword from './components/admin/AdminChangePassword.jsx'
import AdminArticleEditor from './pages/admin/AdminArticleEditor.jsx'
import AdminArticles from './pages/admin/AdminArticles.jsx'
import AdminCategories from './pages/admin/AdminCategories.jsx'
import AdminContacts from './pages/admin/AdminContacts.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
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
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
