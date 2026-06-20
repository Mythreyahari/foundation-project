import { useMemo, useState } from 'react'
import heroImage from './assets/ngo-volunteers-hero.png'
import './App.css'

const blankVolunteer = {
  fullName: '',
  email: '',
  phone: '',
  skills: '',
  availability: '',
  password: '',
}

const sampleVolunteers = [
  {
    id: 1,
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    skills: 'Teaching, Event Support',
    availability: 'Weekends',
  },
  {
    id: 2,
    fullName: 'Priya Mehta',
    email: 'priya.mehta@example.com',
    phone: '+91 91234 56780',
    skills: 'Fundraising, Social Media',
    availability: 'Weekday Evenings',
  },
  {
    id: 3,
    fullName: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    phone: '+91 99887 76655',
    skills: 'Community Outreach',
    availability: 'Flexible',
  },
]

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [volunteers, setVolunteers] = useState(sampleVolunteers)
  const [registrationForm, setRegistrationForm] = useState(blankVolunteer)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const filteredVolunteers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) {
      return volunteers
    }

    return volunteers.filter((volunteer) =>
      [
        volunteer.fullName,
        volunteer.email,
        volunteer.phone,
        volunteer.skills,
        volunteer.availability,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [searchTerm, volunteers])

  const navigateTo = (page) => {
    setCurrentPage(page)
    setNotice('')
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

  const handleRegister = (event) => {
    event.preventDefault()

    const newVolunteer = {
      id: Date.now(),
      fullName: registrationForm.fullName.trim(),
      email: registrationForm.email.trim(),
      phone: registrationForm.phone.trim(),
      skills: registrationForm.skills.trim(),
      availability: registrationForm.availability,
    }

    setVolunteers((currentVolunteers) => [newVolunteer, ...currentVolunteers])
    setRegistrationForm(blankVolunteer)
    setNotice('Registration successful. Please login to continue.')
    setCurrentPage('login')
  }

  const handleLogin = (event) => {
    event.preventDefault()
    setIsLoggedIn(true)
    setNotice('')
    setCurrentPage('admin')
  }

  const handleDeleteVolunteer = (volunteerId) => {
    setVolunteers((currentVolunteers) =>
      currentVolunteers.filter((volunteer) => volunteer.id !== volunteerId),
    )
  }

  const renderPage = () => {
    if (currentPage === 'register') {
      return (
        <RegistrationPage
          formValues={registrationForm}
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
          onChange={updateLoginForm}
          onSubmit={handleLogin}
          onNavigate={navigateTo}
        />
      )
    }

    if (currentPage === 'admin') {
      return (
        <AdminDashboard
          volunteers={filteredVolunteers}
          searchTerm={searchTerm}
          totalVolunteers={volunteers.length}
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
      />
      <main>{renderPage()}</main>
    </div>
  )
}

function Navbar({ currentPage, isLoggedIn, onNavigate }) {
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
          <button
            className={currentPage === 'admin' ? 'active' : ''}
            type="button"
            onClick={() => onNavigate('admin')}
          >
            Dashboard
          </button>
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

function RegistrationPage({ formValues, onChange, onSubmit, onNavigate }) {
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

        <button className="primary-button full-width" type="submit">
          Register
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

function LoginPage({ formValues, notice, onChange, onSubmit, onNavigate }) {
  return (
    <section className="page-section compact-section">
      <div className="section-heading">
        <p className="eyebrow">Admin Login</p>
        <h1>Welcome Back</h1>
        <p>Login to view and manage registered volunteers.</p>
      </div>

      <form className="form-card" onSubmit={onSubmit}>
        {notice && <p className="success-message">{notice}</p>}

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

        <button className="primary-button full-width" type="submit">
          Login
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
            {volunteers.length > 0 ? (
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
