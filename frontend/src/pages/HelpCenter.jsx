import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Mail, FileText, Check } from 'lucide-react';

/**
 * Weaponized with a real-time search engine and identity-aware support bridge.
 */
export default function HelpCenter() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [copied, setCopied] = useState(false);

    // IDENTITY SOURCE OF TRUTH
    const userEmail = localStorage.getItem("user_email") || 'Guest_User';

    // BRICK: Article Registry
    const articles = [
        { id: 1, title: "How to download my E-Tickets?", content: "Access your 'Wallet' in the Navbar. Your tickets are stored as secure digital tokens." },
        { id: 2, title: "Hosting your first stadium event", content: "Navigate to the 'Host' portal. Submit your venue details for infrastructure review." },
        { id: 3, title: "What is Atomic Stock Locking?", content: "Our proprietary engine locks ticket availability at the database level during checkout." },
        { id: 4, title: "Requesting a refund handshake", content: "Refunds are processed within 48 hours. Contact support with your Order ID." }
    ];

    // BRICK: Real-Time Filter Engine
    const filteredArticles = articles.filter(art => 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        art.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // BRICK: Identity Injection logic
    const mailtoLink = useMemo(() => {
        const email = "support@ticketblitz.com";
        const ticketID = Math.floor(1000 + Math.random() * 9000);
        const subject = encodeURIComponent(`Priority Support - ID: ${ticketID}`);
        const body = encodeURIComponent(`Account: ${userEmail}\nReference: #${ticketID}\nIssue: `);
        return `mailto:${email}?subject=${subject}&body=${body}`;
    }, [userEmail]);

    /**
     * DUAL-PROTOCOL HANDSHAKE:
     * Triggers the mail client while simultaneously providing a clipboard fallback.
     */
    const handleSupportClick = () => {
        setCopied(true);
        navigator.clipboard.writeText("support@ticketblitz.com");
        setTimeout(() => setCopied(false), 3000);
        
        // FORCED TRIGGER: Bypassing browser-only limitations
        window.location.href = mailtoLink; 
    };

    return (
        <div style={helpWrapper}>
            <div style={heroSection}>
                <button onClick={() => navigate(-1)} style={backBtn}>
                    <ArrowLeft size={16}/> Back
                </button>
                <h1 style={heroTitle}>Infrastructure Support</h1>
                <div style={searchBox}>
                    <Search size={20} color="#999" />
                    <input 
                        type="text" 
                        placeholder="Search for articles (e.g. 'lock', 'host', 'wallet')..." 
                        style={searchInput}
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                </div>
            </div>

            <div style={contentContainer}>
                <h2 style={sectionTitle}>{searchQuery ? "Search Results" : "Featured Articles"}</h2>
                <div style={articleGrid}>
                    {filteredArticles.length > 0 ? (
                        filteredArticles.map(art => (
                            <div key={art.id} style={articleCard}>
                                <div style={{display: 'flex', gap: '15px'}}>
                                    <FileText size={20} color="#6f42c1" />
                                    <div>
                                        <h3 style={artTitle}>{art.title}</h3>
                                        <p style={artContent}>{art.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={emptyState}>No documentation found matching "{searchQuery}".</div>
                    )}
                </div>

                {/* 🛡️ WEAPONIZED SUPPORT CTA */}
                <div style={contactCTA}>
                    <Mail size={24} color="#fff" />
                    <div style={{flex: 1}}>
                        <h3 style={{margin: 0, fontWeight: '800'}}>Direct Priority Access</h3>
                        <p style={{margin: 0, fontSize: '14px', opacity: 0.8}}>Our 24/7 technical team is live.</p>
                    </div>
                    
                    <button onClick={handleSupportClick} style={mailBtn}>
                        {copied ? <><Check size={16} /> Email Copied</> : "Contact Support"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- STYLES: GLOBAL INFRASTRUCTURE STANDARDS ---
const helpWrapper = { minHeight: '100vh', backgroundColor: '#fff', fontFamily: 'Inter, sans-serif' };
const heroSection = { backgroundColor: '#f8f9fa', padding: '100px 20px', textAlign: 'center', position: 'relative' };
const heroTitle = { fontSize: '42px', fontWeight: '900', color: '#111', letterSpacing: '-1.5px' };
const searchBox = { maxWidth: '600px', margin: '30px auto 0', display: 'flex', alignItems: 'center', gap: '15px', padding: '18px 25px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' };
const searchInput = { border: 'none', outline: 'none', fontSize: '15px', width: '100%' };
const contentContainer = { maxWidth: '900px', margin: '0 auto', padding: '60px 20px' };
const sectionTitle = { fontSize: '22px', fontWeight: '800', marginBottom: '25px', color: '#111' };
const articleGrid = { display: 'flex', flexDirection: 'column', gap: '20px' };
const articleCard = { padding: '25px', borderRadius: '24px', border: '1px solid #eee', backgroundColor: '#fff' };
const artTitle = { margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: '#111' };
const artContent = { margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.6' };
const emptyState = { padding: '40px', textAlign: 'center', color: '#999', border: '2px dashed #eee', borderRadius: '24px' };
const contactCTA = { marginTop: '60px', padding: '30px 40px', backgroundColor: '#111', borderRadius: '28px', color: '#fff', display: 'flex', alignItems: 'center', gap: '25px' };
const mailBtn = { border: 'none', cursor: 'pointer', padding: '14px 28px', borderRadius: '14px', backgroundColor: '#fff', color: '#000', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' };
const backBtn = { position: 'absolute', top: '30px', left: '30px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' };