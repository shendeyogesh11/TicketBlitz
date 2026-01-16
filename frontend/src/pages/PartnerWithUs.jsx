import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Building2, Mail, Users, Send, CheckCircle, 
    ArrowLeft, Phone, MapPin, Calendar, Info 
} from 'lucide-react';
import ProposalsTracker from '../components/ProposalsTracker';

/**
 * Weaponized for high-value event acquisition with automated Identity Injection.
 */
export default function PartnerWithUs() {
    // 1. FORM STATE: Captures business-specific metadata
    const [form, setForm] = useState({ 
        organizerName: "", businessEmail: "", contactNumber: "",
        city: "", eventCategory: "Music", estimatedAttendance: "", 
        eventDate: "", eventProposal: "" 
    });
    
    // 2. IDENTITY SOURCE: Retrieves the logged-in user's account email
    const userEmail = localStorage.getItem("user_email");
    const token = localStorage.getItem("jwt_token");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    
    const navigate = useNavigate();

    // Reset error visuals when the user begins correcting data
    useEffect(() => { if (error) setError(""); }, [form]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            /**
             * ATOMIC IDENTITY INJECTION:
             * We merge the user's current session email into the payload.
             * This ensures the ProposalsTracker (filtering by kunal@gmail.com) 
             * finds these records even if 'businessEmail' is a different contact.
             */
            const payload = {
                ...form,
                submittedByEmail: userEmail // The Hidden Handshake Key
            };

            // SECURE TRANSMISSION to PostgreSQL Registry
            await axios.post("http://localhost:8080/api/partners/apply", payload);
            
            setSuccess(true);
            setRefreshTrigger(prev => prev + 1); // ATOMIC SYNC: Refreshes registry below immediately
            
            // RESET FORM: Clear state after successful transmission
            setForm({ 
                organizerName: "", businessEmail: "", contactNumber: "",
                city: "", eventCategory: "Music", estimatedAttendance: "", 
                eventDate: "", eventProposal: "" 
            });
            
            setTimeout(() => setSuccess(false), 6000);
        } catch (err) {
            const msg = err.response?.status === 403 
                ? "Security Block: Check Backend SecurityConfig permissions." 
                : "Infrastructure Sync Failed. Verify your connection.";
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={hubWrapper}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                
                <div style={formCard}>
                    <button onClick={() => navigate(-1)} style={backBtn}><ArrowLeft size={16}/> Back</button>
                    <div style={{fontSize: '40px', marginBottom: '10px'}}>🤝</div>
                    <h1 style={titleStyle}>Partner with TicketBlitz</h1>
                    <p style={subtitleStyle}>Scale your event with our secure atomic locking infrastructure.</p>

                    {/* DYNAMIC FEEDBACK LAYER */}
                    {success && (
                        <div style={successBanner}>
                            <CheckCircle size={20} /> 
                            <span>Proposal Locked In. Track your status in the registry below.</span>
                        </div>
                    )}

                    {error && (
                        <div style={errorBanner}>
                            <Info size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={formGrid}>
                        <div style={inputGroup}>
                            <Building2 size={18} style={fieldIcon} />
                            <input type="text" placeholder="Organization Name" required value={form.organizerName} style={inputStyle}
                                   onChange={e => setForm({...form, organizerName: e.target.value})} />
                        </div>
                        <div style={inputGroup}>
                            <Mail size={18} style={fieldIcon} />
                            <input type="email" placeholder="Business Contact Email" required value={form.businessEmail} style={inputStyle}
                                   onChange={e => setForm({...form, businessEmail: e.target.value})} />
                        </div>
                        <div style={inputGroup}>
                            <Phone size={18} style={fieldIcon} />
                            <input type="tel" placeholder="Contact Number" required value={form.contactNumber} style={inputStyle}
                                   onChange={e => setForm({...form, contactNumber: e.target.value})} />
                        </div>
                        <div style={inputGroup}>
                            <MapPin size={18} style={fieldIcon} />
                            <input type="text" placeholder="Launch City" required value={form.city} style={inputStyle}
                                   onChange={e => setForm({...form, city: e.target.value})} />
                        </div>
                        <div style={inputGroup}>
                            <Calendar size={18} style={fieldIcon} />
                            <input type="date" required value={form.eventDate} style={inputStyle}
                                   onChange={e => setForm({...form, eventDate: e.target.value})} />
                        </div>
                        <div style={inputGroup}>
                            <Users size={18} style={fieldIcon} />
                            <input type="text" placeholder="Expected Attendance" value={form.estimatedAttendance} style={inputStyle}
                                   onChange={e => setForm({...form, estimatedAttendance: e.target.value})} />
                        </div>
                        <div style={{gridColumn: 'span 2'}}>
                            <select style={selectStyle} value={form.eventCategory} onChange={e => setForm({...form, eventCategory: e.target.value})}>
                                <option value="Music">Music Event</option>
                                <option value="Sports">Sports Tournament</option>
                                <option value="Tech">Tech Summit</option>
                                <option value="Arts">Arts & Theatre</option>
                            </select>
                        </div>
                        <div style={{gridColumn: 'span 2'}}>
                            <textarea placeholder="Tell us about your event proposal..." required value={form.eventProposal} style={textAreaStyle}
                                      onChange={e => setForm({...form, eventProposal: e.target.value})} />
                        </div>
                        <div style={{gridColumn: 'span 2'}}>
                            <button type="submit" disabled={isSubmitting} style={isSubmitting ? { ...submitBtn, opacity: 0.7 } : submitBtn}>
                                {isSubmitting ? "⚡ SECURING LEAD..." : "SUBMIT PROPOSAL"} 
                                {!isSubmitting && <Send size={18} style={{marginLeft: '10px'}} />}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 🚀 THE REGISTRY: Linked to the user's hidden email identity */}
                <div style={trackerContainer}>
                    <ProposalsTracker key={refreshTrigger} />
                </div>
            </div>
        </div>
    );
}

// --- STYLES: High-Fidelity Infrastructure Standards ---
const hubWrapper = { minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '60px 20px', fontFamily: 'Inter, sans-serif' };
const formCard = { padding: '50px', borderRadius: '32px', backgroundColor: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', textAlign: 'center', position: 'relative' };
const trackerContainer = { marginTop: '50px' };
const titleStyle = { fontSize: '32px', fontWeight: '900', color: '#111', marginBottom: '10px', letterSpacing: '-1px' };
const subtitleStyle = { fontSize: '15px', color: '#888', marginBottom: '40px' };
const formGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' };
const inputGroup = { position: 'relative', display: 'flex', alignItems: 'center' };
const fieldIcon = { position: 'absolute', left: '15px', color: '#999' };
const inputStyle = { width: '100%', padding: '16px 15px 16px 45px', borderRadius: '16px', border: '1px solid #eee', backgroundColor: '#f9f9f9', fontSize: '14px', outline: 'none', transition: '0.2s' };
const selectStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #eee', backgroundColor: '#f9f9f9', fontSize: '14px', cursor: 'pointer' };
const textAreaStyle = { width: '100%', height: '120px', padding: '15px', borderRadius: '16px', border: '1px solid #eee', backgroundColor: '#f9f9f9', fontSize: '14px', outline: 'none', resize: 'none', lineHeight: '1.6' };
const submitBtn = { width: '100%', padding: '18px', background: '#000', color: '#fff', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.3s' };
const backBtn = { position: 'absolute', top: '30px', left: '30px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' };
const successBanner = { marginBottom: '20px', padding: '15px', backgroundColor: '#f0fff4', color: '#2f855a', borderRadius: '12px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: '1px solid #c6f6d5' };
const errorBanner = { marginBottom: '20px', padding: '15px', backgroundColor: '#fff5f5', color: '#ff4d4d', borderRadius: '12px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: '1px solid #fed7d7' };