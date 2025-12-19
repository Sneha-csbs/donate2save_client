import React from 'react'
import Footer from './Components/Footer'
import Header from './Components/Header'
import Home from './Pages/Home'
import About from './Pages/About'
import Login from './Pages/Login'
import DonorDashBoard from './Dashboard/DonorDashBoard'
import RequesterDashBoard from './Dashboard/RequesterDashBoard'
import AdminDashBoard from './Dashboard/AdminDashBoard'
import { BrowserRouter as Router,Routes,Route,useLocation } from 'react-router-dom'
import { RequestProvider } from './context/RequestContext.jsx'
import { AppointmentProvider } from './context/AppointmentContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'


const Layout = () =>{
  const location = useLocation();
  const hide=['/DonorDashBoard','/RequesterDashBoard','/AdminDashBoard']
  const hideLayout =hide.includes(location.pathname)
  
  return (
     <>
     {!hideLayout && <Header />}
     <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/about' element={<About/>} />
       <Route path='/login' element={<Login/>} />
       <Route path='/DonorDashBoard' element={<DonorDashBoard/>} />
       <Route path='/RequesterDashBoard' element={<RequesterDashBoard/>} />
       <Route path='/AdminDashBoard' element={<AdminDashBoard/>} />
        
     </Routes>
     {!hideLayout && <Footer />}
     </>
  )
}

const App = () => {
  return (
    <div>
      <AuthProvider>
        <RequestProvider>
          <AppointmentProvider>
            <Router>
              <Layout />
            </Router>
          </AppointmentProvider>
        </RequestProvider>
      </AuthProvider>
    </div>
  )
}
export default App