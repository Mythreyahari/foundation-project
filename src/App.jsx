import { useEffect, useState } from 'react'
import heroImage from './assets/ngo-volunteers-hero.png'
import './App.css'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://foundation-backend-l0fe.onrender.com/api').replace(
  /\/$/,
  '',
)

const blankVolunteer = {
  fullName: '',
  email: '',
  phone: '',
  skills: '',
  availability: '',
  password: '',
}

async function apiRequest(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Unable to complete the request.')
  }

  return data
}

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [volunteers, setVolunteers] = useState([])
  const [totalVolunteers, setTotalVolunteers] = useState(0)
  const [registrationForm, setRegistrationForm] = useState(blankVolunteer)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem('np_token') || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(false)

  const isLoggedIn = Boolean(token)

  useEffect(() => {
    if (!isLoggedIn || currentPage !== 'admin') {
      return undefined
    }

    const controller = new AbortController()

    async function loadVolunteers() {
      setIsLoadingVolunteers(true)
      setErrorMessage('')

      try {
        const query = searchTerm.trim()
          ? `?search=${encodeURIComponent(searchTerm.trim())}`
          : ''
        const data = await apiRequest(`/volunteers${query}`, {
          token,
          signal: controller.signal,
        })

        setVolunteers(data.volunteers || [])
        setTotalVolunteers(data.totalVolunteers || 0)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorMessage(error.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingVolunteers(false)
        }
      }
    }

    loadVolunteers()

    return () => controller.abort()
  }, [currentPage, isLoggedIn, searchTerm, token])

  const navigateTo = (page) => {
    if (page === 'admin' && !isLoggedIn) {
      setCurrentPage('login')
      setNotice('Please login to view the dashboard.')
      return
    }

    setCurrentPage(page)
    setNotice('')
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateRegistrationForm = (event) => {
    const { name, value } = event.target

    setRegistrationForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const updateLoginForm = (event) => {
    const { name, value } = event.target

    setLoginForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setNotice('')

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: registrationForm.fullName.trim(),
          email: registrationForm.email.trim(),
          phone: registrationForm.phone.trim(),
          skills: registrationForm.skills.trim(),
          availability: registrationForm.availability,
          password: registrationForm.password,
        }),
      })

      setRegistrationForm(blankVolunteer)
      setLoginForm({
        email: registrationForm.email.trim(),
        password: '',
      })
      setNotice('Registration successful. Please login to continue.')
      setCurrentPage('login')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setNotice('')

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      })

      localStorage.setItem('np_token', data.token)
      setToken(data.token)
      setLoginForm({ email: '', password: '' })
      setCurrentPage('admin')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('np_token')
    setToken('')
    setVolunteers([])
    setTotalVolunteers(0)
    setSearchTerm('')
    setCurrentPage('home')
  }

  const handleDeleteVolunteer = async (volunteerId) => {
    setErrorMessage('')

    try {
      await apiRequest(`/volunteers/${volunteerId}`, {
        method: 'DELETE',
        token,
      })

      setVolunteers((currentVolunteers) =>
        currentVolunteers.filter((volunteer) => volunteer.id !== volunteerId),
      )
      setTotalVolunteers((currentTotal) => Math.max(currentTotal - 1, 0))
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const renderPage = () => {
    if (currentPage === 'register') {
      return (
        <RegistrationPage
          formValues={registrationForm}
          errorMessage={errorMessage}
          isSubmitting={isSubmitting}
          onChange={updateRegistrationForm}
          onSubmit={handleRegister}
          onNavigate={navigateTo}
        />
      )
    }

    if (currentPage === 'login') {
      return (
        <LoginPage
          formValues={loginForm}
          notice={notice}
          errorMessage={errorMessage}
          isSubmitting={isSubmitting}
          onChange={updateLoginForm}
          onSubmit={handleLogin}
          onNavigate={navigateTo}
        />
      )
    }

    if (currentPage === 'admin') {
      return (
        <AdminDashboard
          volunteers={volunteers}
          searchTerm={searchTerm}
          totalVolunteers={totalVolunteers}
          errorMessage={errorMessage}
          isLoading={isLoadingVolunteers}
          onSearchChange={setSearchTerm}
          onDelete={handleDeleteVolunteer}
        />
      )
    }

    return <HomePage onNavigate={navigateTo} />
  }

  return (
    <div className="app-shell">
      <Navbar
        currentPage={currentPage}
        isLoggedIn={isLoggedIn}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />
      <main>{renderPage()}</main>
    </div>
  )
}

function Navbar({ currentPage, isLoggedIn, onNavigate, onLogout }) {
  return (
    <header className="navbar">
      <button
        className="brand"
        type="button"
        onClick={() => onNavigate('home')}
        aria-label="Go to home page"
      >
        <span className="brand-mark">NP</span>
        <span>NayePankh Foundation</span>
      </button>

      <nav className="nav-links" aria-label="Main navigation">
        <button
          className={currentPage === 'register' ? 'active' : ''}
          type="button"
          onClick={() => onNavigate('register')}
        >
          Register
        </button>
        <button
          className={currentPage === 'login' ? 'active' : ''}
          type="button"
          onClick={() => onNavigate('login')}
        >
          Login
        </button>
        {isLoggedIn && (
          <>
            <button
              className={currentPage === 'admin' ? 'active' : ''}
              type="button"
              onClick={() => onNavigate('admin')}
            >
              Dashboard
            </button>
            <button type="button" onClick={onLogout}>
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  )
}

function HomePage({ onNavigate }) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Volunteer Management System</p>
        <h1>Empowering Youth, Creating Change</h1>
        <p className="hero-description">
          NayePankh Foundation connects young volunteers with meaningful social
          initiatives in education, outreach, and community care.
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={() => onNavigate('register')}
        >
          Become a Volunteer
        </button>
      </div>

      <div className="hero-card" aria-label="NayePankh volunteers">
        <img src={heroImage} alt="Young volunteers working together" />
      </div>

      <div className="impact-grid" aria-label="Foundation focus areas">
        <article className="info-card">
          <span>01</span>
          <h2>Youth Leadership</h2>
          <p>Build confidence through guided community initiatives.</p>
        </article>
        <article className="info-card">
          <span>02</span>
          <h2>Education Support</h2>
          <p>Help students with learning, mentoring, and awareness drives.</p>
        </article>
        <article className="info-card">
          <span>03</span>
          <h2>Community Outreach</h2>
          <p>Support local programs with skills, time, and care.</p>
        </article>
      </div>
    </section>
  )
}

function RegistrationPage({
  formValues,
  errorMessage,
  isSubmitting,
  onChange,
  onSubmit,
  onNavigate,
}) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">Volunteer Registration</p>
        <h1>Join NayePankh Foundation</h1>
        <p>
          Share your details and availability so the team can match you with
          suitable volunteer opportunities.
        </p>
      </div>

      <form className="form-card" onSubmit={onSubmit}>
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={formValues.fullName}
          onChange={onChange}
          placeholder="Enter your full name"
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formValues.email}
          onChange={onChange}
          placeholder="name@example.com"
          required
        />

        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formValues.phone}
          onChange={onChange}
          placeholder="+91 98765 43210"
          required
        />

        <label htmlFor="skills">Skills</label>
        <input
          id="skills"
          name="skills"
          type="text"
          value={formValues.skills}
          onChange={onChange}
          placeholder="Teaching, fundraising, design"
          required
        />

        <label htmlFor="availability">Availability</label>
        <select
          id="availability"
          name="availability"
          value={formValues.availability}
          onChange={onChange}
          required
        >
          <option value="">Select availability</option>
          <option value="Weekdays">Weekdays</option>
          <option value="Weekends">Weekends</option>
          <option value="Weekday Evenings">Weekday Evenings</option>
          <option value="Flexible">Flexible</option>
        </select>

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formValues.password}
          onChange={onChange}
          placeholder="Create a password"
          required
        />

        <button className="primary-button full-width" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p className="switch-link">
        Already registered?{' '}
        <button type="button" onClick={() => onNavigate('login')}>
          Login here
        </button>
      </p>
    </section>
  )
}

function LoginPage({
  formValues,
  notice,
  errorMessage,
  isSubmitting,
  onChange,
  onSubmit,
  onNavigate,
}) {
  return (
    <section className="page-section compact-section">
      <div className="section-heading">
        <p className="eyebrow">Admin Login</p>
        <h1>Welcome Back</h1>
        <p>Login to view and manage registered volunteers.</p>
      </div>

      <form className="form-card" onSubmit={onSubmit}>
        {notice && <p className="success-message">{notice}</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <label htmlFor="loginEmail">Email</label>
        <input
          id="loginEmail"
          name="email"
          type="email"
          value={formValues.email}
          onChange={onChange}
          placeholder="admin@example.com"
          required
        />

        <label htmlFor="loginPassword">Password</label>
        <input
          id="loginPassword"
          name="password"
          type="password"
          value={formValues.password}
          onChange={onChange}
          placeholder="Enter your password"
          required
        />

        <button className="primary-button full-width" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="switch-link">
        New volunteer?{' '}
        <button type="button" onClick={() => onNavigate('register')}>
          Register here
        </button>
      </p>
    </section>
  )
}

function AdminDashboard({
  volunteers,
  searchTerm,
  totalVolunteers,
  errorMessage,
  isLoading,
  onSearchChange,
  onDelete,
}) {
  return (
    <section className="page-section dashboard-section">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Registered Volunteers</h1>
          <p>Search, review, and manage volunteer registrations.</p>
        </div>
        <div className="metric-card">
          <strong>{totalVolunteers}</strong>
          <span>Total Volunteers</span>
        </div>
      </div>

      <div className="search-card">
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <label htmlFor="search">Search volunteers</label>
        <input
          id="search"
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, email, phone, or skills"
        />
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Skills</th>
              <th>Availability</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="empty-state" colSpan="6">
                  Loading volunteers...
                </td>
              </tr>
            ) : volunteers.length > 0 ? (
              volunteers.map((volunteer) => (
                <tr key={volunteer.id}>
                  <td data-label="Name">{volunteer.fullName}</td>
                  <td data-label="Email">{volunteer.email}</td>
                  <td data-label="Phone">{volunteer.phone}</td>
                  <td data-label="Skills">{volunteer.skills}</td>
                  <td data-label="Availability">{volunteer.availability}</td>
                  <td data-label="Action">
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => onDelete(volunteer.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty-state" colSpan="6">
                  No volunteers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default App
