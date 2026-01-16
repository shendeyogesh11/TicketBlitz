import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; 
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
    MapPin, Calendar, Clock, ArrowLeft, Ticket as TicketIcon, 
    Star, ShieldCheck, Sparkles, Download, Loader2 
} from 'lucide-react';

/**
 * Features Client-Side PDF Generation and a simulated Bank-to-Wallet Handshake.
 */
const MyTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // --- CELEBRATION ENGINE: Stadium Burst Effect ---
    const triggerSuccessConfetti = useCallback(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }, []);

    /**
     * ATOMIC PDF HANDSHAKE:
     * Captures the ticket UI and converts it to a professional gate pass.
     */
    const downloadTicket = async (ticketId) => {
        setIsDownloading(ticketId);
        const element = document.getElementById(`ticket-card-${ticketId}`);
        
        try {
            const canvas = await html2canvas(element, { 
                scale: 3, // High-DPI for professional printing
                useCORS: true,
                backgroundColor: "#ffffff"
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`TicketBlitz_Pass_${ticketId}.pdf`);
        } catch (err) {
            console.error("PDF Generation Failed:", err);
        } finally {
            setIsDownloading(null);
        }
    };

    useEffect(() => {
        const fetchMyTickets = async () => {
            const token = localStorage.getItem("jwt_token");
            if (!token) { navigate("/login"); return; }

            try {
                const res = await axios.get(`http://localhost:8080/api/stock/my-tickets`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTickets(res.data);

                if (location.state?.confetti) {
                    triggerSuccessConfetti();
                    window.history.replaceState({}, document.title);
                }
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403) navigate("/login");
            } finally {
                setLoading(false);
            }
        };
        fetchMyTickets();
    }, [navigate, location, triggerSuccessConfetti]);

    if (loading) return <div style={loaderStyle}>Opening Secure Wallet...</div>;

    return (
        <div style={walletPage}>
            <div style={headerSection}>
                <button onClick={() => navigate("/home")} style={backBtn}>
                    <ArrowLeft size={18} /> Back to Shop
                </button>
                <h1 style={titleStyle}>🎟️ My Ticket Wallet</h1>
                <p style={subtitleStyle}>Your digital gate passes for upcoming worldwide events.</p>
            </div>

            <div style={ticketList}>
                {tickets.length > 0 ? (
                    tickets.map((ticket) => {
                        const isVIP = ticket.ticketType?.toUpperCase().includes('VIP');
                        
                        return (
                            <div key={ticket.id} style={ticketWrapper}>
                                {/* THE CAPTURABLE TICKET CARD */}
                                <div id={`ticket-card-${ticket.id}`} style={{
                                    ...ticketCard,
                                    border: isVIP ? '2px solid #ffd700' : '1px solid #f0f0f0',
                                    background: isVIP ? 'linear-gradient(to right, #fff, #fffdf5)' : '#fff'
                                }}>
                                    <div style={leftSection}>
                                        <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                                            <div style={{
                                                ...tierBadge, 
                                                backgroundColor: isVIP ? '#6f42c1' : '#28a745',
                                                display: 'flex', alignItems: 'center', gap: '5px'
                                            }}>
                                                {isVIP ? <Star size={10} fill="#fff" /> : <ShieldCheck size={10} />}
                                                {ticket.ticketType || "STANDARD"}
                                            </div>
                                            <div style={qtyBadge}>x{ticket.quantity || 1}</div>
                                        </div>
                                        
                                        <h2 style={eventTitle}>{ticket.eventTitle || "Official Event"}</h2>
                                        <p style={holderLabel}>SECURE PASS FOR: <span style={holderValue}>{ticket.userId}</span></p>
                                        
                                        <div style={infoGrid}>
                                            <div style={infoItem}><Calendar size={14} color="#6f42c1" /> <span>{new Date(ticket.eventDate).toLocaleDateString()}</span></div>
                                            <div style={infoItem}><Clock size={14} color="#6f42c1" /> <span>{ticket.eventTime || "18:00"}</span></div>
                                            <div style={infoItem}><MapPin size={14} color="#6f42c1" /> <span>{ticket.venueName}</span></div>
                                        </div>

                                        <div style={orderId}>REF: {ticket.transactionId || `TICKET-${ticket.id}`}</div>
                                    </div>

                                    <div style={{...rightSection, backgroundColor: isVIP ? '#2b1d42' : '#111'}}>
                                        <div style={qrContainer}>
                                            <QRCodeSVG value={ticket.transactionId || ticket.id.toString()} size={100} level="H" />
                                        </div>
                                        <span style={{...scanText, color: isVIP ? '#ffd700' : '#aaa'}}>SCAN AT GATE</span>
                                        <div style={notchTop}></div>
                                        <div style={notchBottom}></div>
                                    </div>
                                </div>

                                {/* ACTION ACTION: Download Control */}
                                <button 
                                    onClick={() => downloadTicket(ticket.id)} 
                                    style={downloadBtn}
                                    disabled={isDownloading === ticket.id}
                                >
                                    {isDownloading === ticket.id ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                                    {isDownloading === ticket.id ? "GENERATING PDF..." : "DOWNLOAD GATE PASS (.PDF)"}
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div style={emptyWallet}>
                        <TicketIcon size={48} color="#eee" />
                        <p>Your Wallet is Empty</p>
                        <button onClick={() => navigate("/home")} style={shopBtn}>Explore Events</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STYLES (High-Fidelity) ---
const walletPage = { maxWidth: '900px', margin: '0 auto', padding: '60px 20px' };
const ticketWrapper = { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' };
const ticketCard = { display: 'flex', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' };
const leftSection = { flex: 1, padding: '35px', borderRight: '2px dashed #eee', position: 'relative' };
const rightSection = { width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' };
const downloadBtn = { 
    width: 'fit-content', alignSelf: 'center', padding: '12px 25px', 
    backgroundColor: '#f8f9fa', border: '1px solid #eee', borderRadius: '12px', 
    fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', gap: '10px', transition: '0.2s' 
};
const headerSection = { marginBottom: '50px' };
const titleStyle = { fontSize: '36px', fontWeight: '900', margin: '0' };
const subtitleStyle = { color: '#888', marginTop: '5px' };
const ticketList = { display: 'flex', flexDirection: 'column' };
const backBtn = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#666' };
const tierBadge = { color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '10px', fontWeight: '900' };
const qtyBadge = { backgroundColor: '#000', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900' };
const eventTitle = { fontSize: '26px', fontWeight: '900', margin: '0 0 10px 0' };
const holderLabel = { fontSize: '11px', color: '#999', fontWeight: '800' };
const holderValue = { color: '#444' };
const infoGrid = { display: 'flex', gap: '20px', marginTop: '20px' };
const infoItem = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' };
const orderId = { fontSize: '10px', color: '#ddd', marginTop: '25px', fontWeight: '700' };
const qrContainer = { backgroundColor: '#fff', padding: '10px', borderRadius: '12px', marginBottom: '10px' };
const scanText = { fontSize: '9px', fontWeight: '900', letterSpacing: '1px' };
const notchTop = { position: 'absolute', top: '-15px', left: '-15px', width: '30px', height: '30px', backgroundColor: '#fff', borderRadius: '50%' };
const notchBottom = { position: 'absolute', bottom: '-15px', left: '-15px', width: '30px', height: '30px', backgroundColor: '#fff', borderRadius: '50%' };
const emptyWallet = { textAlign: 'center', padding: '100px', backgroundColor: '#f9f9f9', borderRadius: '30px' };
const shopBtn = { marginTop: '20px', padding: '15px 45px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800' };
const loaderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontWeight: '800' };

export default MyTickets;