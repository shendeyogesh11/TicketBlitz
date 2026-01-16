import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Login from "./Login";
import Register from "./Register";
import TicketPage from "./pages/TicketPage"; 
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import MyTickets from "./pages/MyTickets";
import { isTokenExpired } from './utils/auth'; 
import PartnerWithUs from "./pages/PartnerWithUs";
import HelpCenter from "./pages/HelpCenter";

/**
 * TOP 1% G APPLICATION CORE:
 * The 'Glue' that synchronizes Global Discovery State and Secure Route Guards.
 */
function App() {
  // 1. LIFTED STATE: Synchronizes filters between Navbar and Discovery Grid
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  /**
   * TOP 1% G AUTH GUARD:
   * Verifies JWT presence and expiration to protect transactional routes.
   */
  const isAuthenticated = () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return false;

    if (isTokenExpired(token)) {
      console.warn("Session expired. Purging local data.");
      localStorage.clear(); 
      return false;
    }
    return true;
  };

  return (
    <BrowserRouter>
      {/* 2. THE COMMAND BRIDGE: Navbar handles search and category triggers */}
      <Navbar 
        onSearch={setSearchQuery} 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
      />
      
      <Routes>
        {/* 3. DISCOVERY ROUTES: Passes synced state to the HomePage logic */}
        <Route 
          path="/" 
          element={isAuthenticated() ? 
            <HomePage 
              searchQuery={searchQuery} 
              onSearch={setSearchQuery} 
              activeCategory={activeCategory} 
            /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/home" 
          element={isAuthenticated() ? 
            <HomePage 
              searchQuery={searchQuery} 
              onSearch={setSearchQuery} 
              activeCategory={activeCategory} 
            /> : <Navigate to="/login" replace />} 
        />
        
        {/* PUBLIC ACCESS BRICKS */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* TRANSACTIONAL BRICKS: Protecting Purchase and Wallet routes */}
        <Route 
          path="/tickets/:eventId" 
          element={isAuthenticated() ? <TicketPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/my-tickets" 
          element={isAuthenticated() ? <MyTickets /> : <Navigate to="/login" replace />} 
        />

        <Route path="/partner" element={<PartnerWithUs />} />
        <Route path="/help" element={<HelpCenter />} />
        
        {/* INFRASTRUCTURE COMMAND CENTER: Admin-only access */}
        <Route path="/admin" element={ 
          <AdminRoute> 
            <AdminDashboard /> 
          </AdminRoute>
        } />

        {/* SECURITY CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;