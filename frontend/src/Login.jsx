import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

/**
 * Fixed to handle structured JSON error objects from Spring Boot without crashing.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(""); 
  const navigate = useNavigate();

  // Reset error when user starts typing to clear the red state
  useEffect(() => {
    if (error) setError("");
  }, [email, password]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(""); 

    try {
      const response = await axios.post("http://localhost:8080/api/auth/authenticate", { 
          email, 
          password 
      });

      const { token, role, name } = response.data;

      localStorage.setItem("jwt_token", token);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", name); 
      localStorage.setItem("user_role", role || "USER");

      window.location.href = "/home";
      
    } catch (err) {
      // THE FIX: Extraction Logic
      // We check if it's an object with a 'message' key, otherwise fallback to a string.
      const backendError = err.response?.data;
      const extractedMessage = (typeof backendError === 'object' && backendError !== null)
        ? backendError.message 
        : (typeof backendError === 'string' ? backendError : "Invalid credentials. Please try again.");

      setError(extractedMessage);
      console.error("Secure Bridge Handshake Failure:", extractedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={authWrapper}>
      <div style={{...authCard, border: error ? '1px solid #ffeded' : '1px solid transparent'}}>
        <div style={iconHeader}>🔑</div>
        <h1 style={titleStyle}>Welcome Back</h1>
        <p style={subtitleStyle}>Enter your credentials to access your secure wallet.</p>

        {/* ERROR BANNER: Now safely rendering a STRING */}
        {error && (
            <div style={errorBanner}>
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={inputGroup}>
            <Mail size={18} style={{...fieldIcon, color: error ? '#ff4d4d' : '#999'}} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{...inputStyle, borderColor: error ? '#ff4d4d' : '#eee'}}
            />
          </div>

          <div style={inputGroup}>
            <Lock size={18} style={{...fieldIcon, color: error ? '#ff4d4d' : '#999'}} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              required
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
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
            {isSubmitting ? "⚡ SECURING ACCESS..." : "SIGN IN"}
            {!isSubmitting && <ChevronRight size={18} />}
          </button>
        </form>

        <p style={footerLinkText}>
          New to TicketBlitz? <span onClick={() => navigate("/register")} style={linkBtn}>Create Account</span>
        </p>
      </div>
    </div>
  );
}

// --- STYLES: Precision Infrastructure ---
const authWrapper = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'Inter, sans-serif' };
const authCard = { padding: '50px 40px', borderRadius: '32px', backgroundColor: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', textAlign: 'center', transition: '0.3s' };
const iconHeader = { fontSize: '40px', marginBottom: '15px' };
const titleStyle = { fontSize: '32px', fontWeight: '900', color: '#111', margin: '0 0 10px 0', letterSpacing: '-1px' };
const subtitleStyle = { fontSize: '15px', color: '#888', marginBottom: '40px' };

const errorBanner = { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff5f5', color: '#ff4d4d', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', marginBottom: '25px', border: '1px solid #ffeded', textAlign: 'left' };

const inputGroup = { position: 'relative', display: 'flex', alignItems: 'center' };
const fieldIcon = { position: 'absolute', left: '15px', transition: '0.2s' };
const inputStyle = { width: '100%', padding: '16px 15px 16px 45px', borderRadius: '16px', border: '1px solid #eee', backgroundColor: '#f9f9f9', fontSize: '15px', outline: 'none', transition: '0.2s' };
const toggleIcon = { position: 'absolute', right: '15px', cursor: 'pointer', color: '#999' };
const submitBtn = { padding: '18px', background: '#000', color: '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' };
const footerLinkText = { marginTop: '30px', fontSize: '14px', color: '#666' };
const linkBtn = { color: "#6f42c1", fontWeight: "800", cursor: "pointer", marginLeft: '5px' };