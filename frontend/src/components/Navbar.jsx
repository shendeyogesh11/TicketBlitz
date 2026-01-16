import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Ticket, LayoutDashboard, Wallet, LogOut, 
    Search, Music, Trophy, Laptop, Palette, 
    LayoutGrid, CircleUser, ClipboardList, LogIn,
    Handshake, 
    HelpCircle
} from 'lucide-react';

/**
 * Features automated identity synchronization, dynamic auth toggling,
 * and business partnership entry points.
 */
const Navbar = ({ onSearch, activeCategory, setActiveCategory }) => {
    const [showProfile, setShowProfile] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // AUTH SOURCE OF TRUTH
    const token = localStorage.getItem("jwt_token");
    const role = localStorage.getItem("user_role"); 
    const userEmail = localStorage.getItem("user_email") || "";
    
    /**
     * CLEAN IDENTITY SYNC:
     * Pulls the REAL name from your updated Backend Identity Handshake.
     */
    const userName = localStorage.getItem("user_name") || "Member";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const resetSearch = () => {
        if (onSearch) onSearch(""); 
        if (searchInputRef.current) searchInputRef.current.value = ""; 
    };

    const handleLogout = () => {
        localStorage.clear();
        setShowProfile(false);
        resetSearch(); 
        navigate("/login"); 
    };

    return (
        <nav style={navStyle}>
            <div style={navContainer}>
                {/* BRAND HANDSHAKE */}
                <Link to="/home" style={logoStyle} onClick={resetSearch}>
                    <Ticket size={28} color="#6f42c1" strokeWidth={3} />
                    <span style={{ marginLeft: '10px' }}>TicketBlitz</span>
                </Link>

                {/* SEARCH INFRASTRUCTURE */}
                <div style={searchWrapper}>
                    <Search size={18} color="#999" style={searchIcon} />
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Search stadiums, artists, or summits..." 
                        style={searchInput}
                        onChange={(e) => onSearch && onSearch(e.target.value)} 
                    />
                </div>

                {/* DYNAMIC ACTION AREA */}
                <div style={linksStyle}>
                    <button onClick={() => navigate("/home")} style={linkBtn}>Explore</button>
                    
                    {token ? (
                        <>
                            {/* USER WALLET */}
                            <Link to="/my-tickets" style={linkItem}>
                                <Wallet size={18} style={{marginRight: '5px'}} /> Wallet
                            </Link>

                            {/* 🤝 NEW PARTNER PORTAL: 'Host' Entry Point */}
                            <Link to="/partner" style={linkItem}>
                                <Handshake size={18} style={{marginRight: '5px'}} color="#6f42c1" /> Host
                            </Link>

                            <Link to="/help" style={linkItem}>
                                <HelpCircle size={18} style={{marginRight: '5px'}} /> Support
                            </Link>
                            
                            {/* ADMIN COMMAND CENTER */}
                            {role === 'ADMIN' && (
                                <Link to="/admin" style={adminLink}>
                                    <LayoutDashboard size={18} style={{marginRight: '5px'}} /> Admin
                                </Link>
                            )}

                            {/* IDENTITY DROPDOWN */}
                            <div style={{ position: 'relative' }} ref={dropdownRef}>
                                <div style={avatarCircle} onClick={() => setShowProfile(!showProfile)}>
                                    <CircleUser size={26} color="#6f42c1" />
                                </div>

                                {showProfile && (
                                    <div style={profileDropdown}>
                                        <div style={dropHeader}>
                                            <p style={dropFullName}>{userName}</p>
                                            <p style={dropEmail}>{userEmail}</p>
                                        </div>
                                        <hr style={divider} />
                                        <button style={dropItem} onClick={() => { setShowProfile(false); navigate("/my-tickets"); }}>
                                            <ClipboardList size={16} /> My Purchase History
                                        </button>
                                        <hr style={divider} />
                                        <button style={{...dropItem, color: '#ff4d4d'}} onClick={handleLogout}>
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button onClick={() => navigate("/login")} style={signInBtn}>
                            <LogIn size={18} /> Sign In
                        </button>
                    )}
                </div>
            </div>

            {/* DISCOVERY STRIP */}
            <div style={categoryStrip}>
                {['All', 'Music', 'Sports', 'Tech', 'Arts'].map((cat) => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCategory && setActiveCategory(cat)}
                        style={{
                            ...catBtn,
                            background: activeCategory === cat ? '#000' : 'none',
                            color: activeCategory === cat ? '#fff' : '#666',
                            borderColor: activeCategory === cat ? '#000' : '#eee'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </nav>
    );
};

// --- STYLES: High-Fidelity UI Standards ---
const navStyle = { position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', borderBottom: '1px solid #f0f0f0', padding: '10px 0' };
const navContainer = { maxWidth: '1240px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const logoStyle = { display: 'flex', alignItems: 'center', fontSize: '22px', fontWeight: '900', color: '#1a1a1a', textDecoration: 'none' };
const searchWrapper = { position: 'relative', flex: 1, maxWidth: '400px', margin: '0 30px' };
const searchIcon = { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' };
const searchInput = { width: '100%', padding: '10px 12px 10px 45px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none', fontSize: '14px' };
const linksStyle = { display: 'flex', alignItems: 'center', gap: '24px' };
const linkItem = { textDecoration: 'none', color: '#444', fontWeight: '700', display: 'flex', alignItems: 'center', fontSize: '14px' };
const linkBtn = { ...linkItem, background: 'none', border: 'none', cursor: 'pointer', padding: 0 };
const adminLink = { ...linkItem, color: '#6f42c1', padding: '6px 14px', background: '#f3ebff', borderRadius: '10px' };

const avatarCircle = { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f3ebff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' };
const signInBtn = { background: '#000', color: '#fff', padding: '10px 20px', borderRadius: '12px', gap: '8px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', fontWeight: '700', fontSize: '14px' };

const profileDropdown = { position: 'absolute', top: '50px', right: 0, width: '250px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0', padding: '8px', zIndex: 1001 };
const dropHeader = { padding: '12px 16px' };
const dropFullName = { margin: 0, fontWeight: '800', fontSize: '15px', color: '#111' };
const dropEmail = { margin: 0, fontSize: '11px', color: '#999' };
const dropItem = { width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', color: '#444', cursor: 'pointer', textAlign: 'left', transition: '0.2s' };
const divider = { border: 'none', borderTop: '1px solid #f0f0f0', margin: '4px 0' };

const categoryStrip = { maxWidth: '1240px', margin: '0 auto', padding: '15px 20px 5px', display: 'flex', gap: '10px', overflowX: 'auto' };
const catBtn = { padding: '8px 16px', borderRadius: '20px', border: '1px solid #eee', fontSize: '12px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' };

export default Navbar;