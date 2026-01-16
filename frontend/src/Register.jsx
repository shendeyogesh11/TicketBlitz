import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Sparkles, Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react';

/**
 * TOP 1% G REGISTRATION ENGINE:
 * Weaponized with in-line validation, identity security, and design parity.
 */
export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(""); // REACTIVE ERROR STATE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // CLEAR ERROR ON INPUT: Maintains a clean UX as the user corrects their data
  useEffect(() => {
    if (error) setError("");
  }, [formData]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // REGISTRATION HANDSHAKE
      await axios.post("http://localhost:8080/api/auth/register", formData);
      
      // SUCCESS REDIRECTION: Standard practice to force login for security verification
      navigate("/login", { state: { message: "Account created! Secure your session below." } });
    } catch (err) {
      // OPTIMAL ERROR CAPTURE: Replaces invasive alert() popups
      const msg = err.response?.data || "Registration failed. This email may already be in use.";
      setError(msg);
      console.error("Infrastructure Handshake Failure:", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={authWrapper}>
      <div style={{...authCard, border: error ? '1px solid #ffeded' : '1px solid transparent'}}>
        <div style={iconHeader}>📝</div>
        <h1 style={titleStyle}>Create Account</h1>
        <p style={subtitleStyle}>Join TicketBlitz to access global event infrastructure.</p>
        
        {/* 🛡️ OPTIMAL ERROR BANNER */}
        {error && (
            <div style={errorBanner}>
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* FULL NAME INPUT */}
          <div style={inputGroup}>
            <User size={18} style={{...fieldIcon, color: error ? '#ff4d4d' : '#999'}} />
            <input 
              name="name" type="text" placeholder="Full Name" required 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{...inputStyle, borderColor: error ? '#ff4d4d' : '#eee'}} 
            />
          </div>
          
          {/* EMAIL ADDRESS INPUT */}
          <div style={inputGroup}>
            <Mail size={18} style={{...fieldIcon, color: error ? '#ff4d4d' : '#999'}} />
            <input 
              name="email" type="email" placeholder="Email Address" required 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{...inputStyle, borderColor: error ? '#ff4d4d' : '#eee'}} 
            />
          </div>
          
          {/* PASSWORD INPUT WITH EYE-TOGGLE TECHNOLOGY */}
          <div style={inputGroup}>
            <Lock size={18} style={{...fieldIcon, color: error ? '#ff4d4d' : '#999'}} />
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="Choose Password" required 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{...inputStyle, borderColor: error ? '#ff4d4d' : '#eee'}} 
            />
            <div onClick={() => setShowPassword(!showPassword)} style={toggleIcon}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={isSubmitting ? { ...submitBtn, opacity: 0.7, cursor: 'not-allowed' } : submitBtn}
          >
            {isSubmitting ? "⚡ SECURING DATA..." : "SIGN UP"}
            {!isSubmitting && <Sparkles size={18} style={{marginLeft: '8px'}} />}
          </button>
        </form>

        <p style={footerLinkText}>
          Already have an account? <span onClick={() => navigate("/login")} style={linkBtn}>Login Here</span>
        </p>
      </div>
    </div>
  );
}

// --- STYLES: DESIGN PARITY INFRASTRUCTURE ---
const authWrapper = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'Inter, sans-serif' };
const authCard = { padding: '50px 40px', borderRadius: '32px', backgroundColor: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', textAlign: 'center', transition: '0.3s' };
const iconHeader = { fontSize: '40px', marginBottom: '15px' };
const titleStyle = { fontSize: '32px', fontWeight: '900', color: '#111', margin: '0 0 10px 0', letterSpacing: '-1px' };
const subtitleStyle = { fontSize: '15px', color: '#888', marginBottom: '30px' };

const errorBanner = { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff5f5', color: '#ff4d4d', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', marginBottom: '25px', border: '1px solid #ffeded', textAlign: 'left' };

const inputGroup = { position: 'relative', display: 'flex', alignItems: 'center' };
const fieldIcon = { position: 'absolute', left: '15px', transition: '0.2s' };
const inputStyle = { width: '100%', padding: '16px 45px', borderRadius: '16px', border: '2px solid #eee', backgroundColor: '#f9f9f9', fontSize: '15px', outline: 'none', transition: '0.2s' };
const toggleIcon = { position: 'absolute', right: '15px', cursor: 'pointer', color: '#999' };
const submitBtn = { padding: '18px', background: '#000', color: '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' };
const footerLinkText = { marginTop: '30px', fontSize: '14px', color: '#666' };
const linkBtn = { color: "#6f42c1", fontWeight: "800", cursor: "pointer", marginLeft: '5px' };