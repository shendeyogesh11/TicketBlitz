import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Calendar, MapPin, ArrowRight, SearchX, 
    Loader2, ShieldCheck, Globe, HelpCircle, 
    Instagram, X as XIcon, ArrowUpRight // ADDED: 45° Directional Icon
} from 'lucide-react';

/**
 * Features a Narrative Hero Slider, Discovery Grid, and weaponized Infrastructure Footer.
 */
const HomePage = ({ searchQuery = "", onSearch, activeCategory = "All" }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            const token = localStorage.getItem("jwt_token");
            try {
                const res = await axios.get('http://localhost:8080/api/events', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && Array.isArray(res.data)) {
                    setEvents(res.data);
                }
            } catch (err) {
                console.error("Discovery Hub fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const heroEvents = events.slice(0, 3); 
    useEffect(() => {
        if (heroEvents.length > 0) {
            const timer = setInterval(() => {
                setHeroIndex((prev) => (prev + 1) % heroEvents.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [heroEvents.length]);

    const filteredEvents = events.filter(event => {
        const matchesSearch = (
            event.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            event.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const matchesCategory = 
            activeCategory === "All" || 
            event.category?.trim().toLowerCase() === activeCategory.toLowerCase();

        return matchesSearch && matchesCategory;
    });

    if (loading) return (
        <div style={emptyStateStyle}>
            <Loader2 size={40} className="animate-spin" color="#6f42c1" />
            <p style={{marginTop: '20px', color: '#666', fontWeight: '700'}}>Syncing Global Infrastructure...</p>
        </div>
    );

    return (
        <div style={pageWrapper}>
            {/* NARRATIVE HERO ZONE */}
            {heroEvents.length > 0 && searchQuery === "" && activeCategory === "All" && (
                <div style={heroContainer}>
                    <div style={{...heroSlide, backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(${heroEvents[heroIndex].imageUrl})`}}>
                        <div style={heroContent}>
                            <span style={heroBadge}>MUST-SEE EXPERIENCE</span>
                            <h1 style={heroTitle}>{heroEvents[heroIndex].title}</h1>
                            <p style={heroSub}>{heroEvents[heroIndex].venue?.name} • {heroEvents[heroIndex].venue?.city}</p>
                            <button 
                                onClick={() => navigate(`/tickets/${heroEvents[heroIndex].id}`)}
                                style={heroBtn}
                            >
                                Secure Tickets Now <ArrowRight size={18} />
                            </button>
                        </div>
                        <div style={sliderDots}>
                            {heroEvents.map((_, i) => (
                                <div key={i} style={{...dot, opacity: i === heroIndex ? 1 : 0.4}} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div style={contentContainer}>
                <div style={sectionHeader}>
                    <h2 style={sectionTitle}>
                        {searchQuery || activeCategory !== "All" ? `${activeCategory} Events` : 'Trending Worldwide'}
                    </h2>
                    <p style={sectionSub}>Real-time inventory for the most anticipated events.</p>
                </div>

                {/* EVENT GRID */}
                {filteredEvents.length > 0 ? (
                    <div style={gridStyle}>
                        {filteredEvents.map(event => {
                            const prices = event.ticketTiers?.map(t => t.price) || [0];
                            const minPrice = Math.min(...prices);

                            return (
                                <div key={event.id} style={eventCard} onClick={() => navigate(`/tickets/${event.id}`)}>
                                    <div style={imageWrapper}>
                                        <img src={event.imageUrl} alt={event.title} style={eventImg} />
                                        <div style={categoryTag}>{event.category}</div>
                                    </div>
                                    <div style={cardContent}>
                                        <h3 style={eventTitle}>{event.title}</h3>
                                        <div style={infoRow}><Calendar size={14} color="#6f42c1" /> {new Date(event.eventDate).toLocaleDateString()}</div>
                                        <div style={infoRow}><MapPin size={14} color="#6f42c1" /> {event.venue?.name}</div>
                                        <div style={footerRow}>
                                            <div><span style={priceLabel}>From</span> <span style={priceValue}>${minPrice}</span></div>
                                            <div style={buyIndicator}><ArrowRight size={20} color="#fff" /></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={emptyStateStyle}>
                        <SearchX size={48} color="#ccc" />
                        <h3 style={{ marginTop: '20px' }}>No {activeCategory !== "All" ? activeCategory : ""} events found</h3>
                        <p style={{ color: '#999', margin: '10px 0 25px' }}>Try resetting your filters or changing your search terms.</p>
                        <button onClick={() => { if(onSearch) onSearch(""); }} style={resetBtn}>Reset Discovery</button>
                    </div>
                )}
            </div>

            {/* INFRASTRUCTURE FOOTER */}
            <footer style={footerWrapper}>
                <div style={footerGrid}>
                    <div style={footerBrand}>
                        <h3 style={footerLogo}>TicketBlitz</h3>
                        <p style={footerDesc}>Atomic stock locking engine ensuring zero double-selling for high-demand events.</p>
                        <div style={socialRow}>
                            <Instagram size={18} cursor="pointer" /> <XIcon size={18} cursor="pointer" /> <Globe size={18} cursor="pointer" />
                        </div>
                    </div>
                    <div style={footerColumn}>
                        <h4 style={footerSub}>Safety Handshake</h4>
                        <p style={footerLink}>Refund Policy</p>
                        <p style={footerLink}>Terms of Service</p>
                        <p style={footerLink}>Purchase Protection</p>
                    </div>
                    <div style={footerColumn}>
                        <h4 style={footerSub}>Global Presence</h4>
                        <p style={footerText}>Ahmedabad HQ</p>
                        <p style={footerText}>Mumbai Operations</p>
                        <p style={footerText}>Delhi Logistics</p>
                    </div>
                    <div style={footerColumn}>
                        <h4 style={footerSub}>Support</h4>
                        <Link to="/help" style={{...footerLink, color: '#6f42c1', fontWeight: '800'}}>
                            Help Center <ArrowUpRight size={14} />
                        </Link>
                        
                        {/* 🚀 WEAPONIZED PARTNER LINK */}
                        <Link to="/partner" style={{...footerLink, color: '#6f42c1', fontWeight: '800'}}>
                            Partner with Us <ArrowUpRight size={14} />
                        </Link>
                    </div>
                </div>
                <div style={footerBottom}>
                    <p>© 2026 TicketBlitz Infrastructure. Secure Atomic Locking Active.</p>
                    <div style={verifiedStamp}>
                        <ShieldCheck size={16} color="#28a745" /> 
                        <span>VERIFIED BY TICKETBLITZ SECURE-SYNC</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// --- STYLES: FIXED & COMPLETE ---
const pageWrapper = { backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' };
const contentContainer = { maxWidth: '1240px', margin: '0 auto', padding: '60px 20px' };
const heroContainer = { padding: '20px', maxWidth: '1300px', margin: '0 auto' };
const heroSlide = { height: '500px', borderRadius: '32px', backgroundSize: 'cover', backgroundPosition: 'top center', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '60px', overflow: 'hidden', transition: 'all 0.5s ease' };
const heroContent = { color: '#fff', maxWidth: '600px', zIndex: 10 };
const heroBadge = { background: '#6f42c1', padding: '6px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' };
const heroTitle = { fontSize: '56px', fontWeight: '900', margin: '15px 0', lineHeight: '1.1' };
const heroSub = { fontSize: '18px', opacity: 0.9, marginBottom: '30px' };
const heroBtn = { padding: '15px 30px', background: '#fff', color: '#000', border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' };
const sliderDots = { position: 'absolute', bottom: '40px', right: '60px', display: 'flex', gap: '8px' };
const dot = { width: '8px', height: '8px', borderRadius: '50%', background: '#fff' };
const sectionHeader = { marginBottom: '40px' };
const sectionTitle = { fontSize: '32px', fontWeight: '900', color: '#111', margin: '0 0 10px 0' };
const sectionSub = { color: '#666', fontSize: '16px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '40px' };
const eventCard = { borderRadius: '24px', overflow: 'hidden', border: '1px solid #f0f0f0', cursor: 'pointer', transition: 'all 0.3s ease', backgroundColor: '#fff' };
const imageWrapper = { position: 'relative', height: '240px' };
const eventImg = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' };
const categoryTag = { position: 'absolute', top: '20px', left: '20px', background: '#fff', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', color: '#6f42c1' };
const cardContent = { padding: '25px' };
const eventTitle = { margin: '0 0 12px 0', fontSize: '20px', fontWeight: '800' };
const infoRow = { display: 'flex', alignItems: 'center', gap: '10px', color: '#666', fontSize: '14px', marginBottom: '8px' };
const footerRow = { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const priceLabel = { fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '800' };
const priceValue = { fontSize: '22px', fontWeight: '900' };
const buyIndicator = { background: '#000', padding: '10px', borderRadius: '12px' };
const footerWrapper = { background: '#f8f9fa', padding: '80px 20px 40px', marginTop: '100px', borderTop: '1px solid #eee' };
const footerGrid = { maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '60px' };
const footerBrand = { display: 'flex', flexDirection: 'column', gap: '15px' };
const footerLogo = { fontSize: '24px', fontWeight: '900', color: '#6f42c1', margin: 0 };
const footerDesc = { color: '#666', fontSize: '14px', lineHeight: '1.6', margin: 0 };
const socialRow = { display: 'flex', gap: '15px', color: '#999' };
const footerColumn = { display: 'flex', flexDirection: 'column', gap: '15px' };
const footerSub = { fontWeight: '900', color: '#111', fontSize: '16px', margin: 0 };
const footerLink = { color: '#666', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: 0, textDecoration: 'none' };
const footerText = { color: '#666', fontSize: '14px', margin: 0 };
const footerBottom = { maxWidth: '1240px', margin: '40px auto 0', paddingTop: '30px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#999', fontSize: '12px' };
const verifiedStamp = { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', color: '#28a745' };
const emptyStateStyle = { textAlign: 'center', padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const resetBtn = { marginTop: '20px', padding: '12px 25px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' };

export default HomePage;