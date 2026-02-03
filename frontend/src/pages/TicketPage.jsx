import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    ShoppingCart, ArrowLeft, ShieldCheck, CheckCircle2, 
    Clock, AlertTriangle, Loader2, MapPin, Users, 
    Sparkles, Music, Trophy, Laptop, Palette, ExternalLink,
    Search, ExternalLink as DirectIcon
} from 'lucide-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

/**
 * Weaponized with a Simulated Payment Bridge and Atomic Transaction Logging.
 */
const TicketPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    
    const [event, setEvent] = useState(null);
    const [selectedTier, setSelectedTier] = useState(null); 
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false); 
    const [liveStock, setLiveStock] = useState({});
    const [showMapLightbox, setShowMapLightbox] = useState(false);
    const stompClientRef = useRef(null);

    const fetchEventDetails = useCallback(async () => {
        try {
            const token = localStorage.getItem("jwt_token");
            const res = await axios.get(`http://localhost:8080/api/events/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const eventData = res.data;
            setEvent(eventData);

            const initialStock = {};
            eventData.ticketTiers?.forEach(tier => {
                initialStock[tier.id] = tier.availableStock;
            });
            setLiveStock(initialStock);
            setLoading(false);
        } catch (err) {
            console.error("Critical: Global Inventory Fetch Failed", err);
            navigate("/home");
        }
    }, [eventId, navigate]);

    const connectWebSocket = useCallback(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {
            stompClient.subscribe(`/topic/stock/${eventId}`, (message) => {
                const update = JSON.parse(message.body); 
                setLiveStock(prev => ({ ...prev, [update.tierId]: update.remaining }));
            });
            stompClientRef.current = stompClient;
        }, (error) => {
            setTimeout(() => connectWebSocket(), 5000);
        });
    }, [eventId]);

    useEffect(() => {
        fetchEventDetails();
        connectWebSocket();
        return () => {
            if (stompClientRef.current?.connected) stompClientRef.current.disconnect();
        };
    }, [fetchEventDetails, connectWebSocket]);

    /**
     * ATOMIC PURCHASE HANDSHAKE:
     * Triggers a 2-second Payment Bridge to simulate bank-grade transaction processing.
     */
    const handlePurchase = async () => {
        if (!selectedTier) return;
        const currentStock = liveStock[selectedTier.id] ?? selectedTier.availableStock;
        if (currentStock <= 0) {
            alert("This tier just sold out!");
            fetchEventDetails();
            return;
        }

        setIsPurchasing(true); // TRIGGER PAYMENT OVERLAY
        
        // ⚡ THE 2-SECOND BANK HANDSHAKE
        await new Promise(resolve => setTimeout(resolve, 2000));

        const token = localStorage.getItem("jwt_token");
        const userEmail = localStorage.getItem("user_email");

        try {
            const payload = {
                eventId: event.id,
                tierId: selectedTier.id, 
                userId: userEmail,
                quantity: quantity,
                transactionId: `TXN_BLITZ_${Math.floor(100000 + Math.random() * 900000)}`
            };

            await axios.post(`http://localhost:8080/api/stock/purchase`, payload, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            navigate("/my-tickets", { state: { confetti: true } }); 
        } catch (err) {
            alert("Infrastructure Handshake Failed. Verify Connectivity.");
            fetchEventDetails(); 
        } finally {
            setIsPurchasing(false);
        }
    };

    const getCategoryIcon = (category) => {
        switch(category) {
            case 'Music': return <Music size={16} />;
            case 'Sports': return <Trophy size={16} />;
            case 'Tech': return <Laptop size={16} />;
            case 'Arts': return <Palette size={16} />;
            default: return <Sparkles size={16} />;
        }
    };

    if (loading) return (
        <div style={loaderStyle}>
            <Loader2 size={40} className="animate-spin" />
            <p>Syncing Global Inventory...</p>
        </div>
    );

    return (
        <div style={containerStyle}>
            <div style={heroHeader}>
                <button onClick={() => navigate("/home")} style={backBtn}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div style={badgeContainer}>
                    <span style={categoryBadge}>
                        {getCategoryIcon(event.category)} {event.category.toUpperCase()}
                    </span>
                    <span style={liveIndicator}>● LIVE INVENTORY</span>
                </div>
                <h1 style={mainTitle}>{event.title}</h1>
            </div>

            <div style={contentGrid}>
                <div style={leftColumn}>
                    <div style={imageContainer}>
                        <img 
                            src={event.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"} 
                            alt={event.title} 
                            style={mainImg} 
                        />
                    </div>
                    
                    <div style={detailsBox}>
                        <h2 style={sectionHeader}><Clock size={18} /> Experience Narrative</h2>
                        <p style={descriptionText}>{event.description}</p>
                    </div>

                    <div 
                        style={{...venueInfoCard, cursor: 'zoom-in'}} 
                        onClick={() => setShowMapLightbox(true)}
                    >
                        <div style={venueHeader}>
                            <h2 style={sectionHeader}><MapPin size={18} /> Venue & Seating Map</h2>
                            <span style={zoomBadge}><Search size={10} /> View Map</span>
                        </div>
                        <p style={venueNameText}><strong>{event.venue?.name}</strong></p>
                        <p style={venueAddressText}>{event.venue?.address || "Location being finalized."}</p>
                        
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px'}}>
                            <span style={venueCityText}>{event.venue?.city} • {event.venue?.totalCapacity?.toLocaleString()} Capacity</span>
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue?.name + " " + event.venue?.city)}`}
                                target="_blank" rel="noreferrer" style={mapLink} onClick={(e) => e.stopPropagation()}
                            >
                                <DirectIcon size={12} /> Directions
                            </a>
                        </div>
                    </div>
                </div>

                <div style={bookingWidget}>
                    <label style={labelStyle}>SELECT TICKET TIER</label>
                    <div style={tierList}>
                        {event.ticketTiers?.map((tier) => {
                            const currentStock = liveStock[tier.id] ?? tier.availableStock;
                            const isSelected = selectedTier?.id === tier.id;
                            const isSoldOut = currentStock <= 0;

                            return (
                                <div 
                                    key={tier.id} 
                                    onClick={() => !isSoldOut && setSelectedTier(tier)}
                                    style={{
                                        ...tierCard,
                                        borderColor: isSelected ? '#6f42c1' : '#eee',
                                        backgroundColor: isSoldOut ? '#f9f9f9' : (isSelected ? '#f3ebff' : '#fff'),
                                        opacity: isSoldOut ? 0.7 : 1,
                                        cursor: isSoldOut ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <div style={tierHeader}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            <span style={{...tierName, textDecoration: isSoldOut ? 'line-through' : 'none'}}>{tier.tierName}</span>
                                            {isSelected && !isSoldOut && <CheckCircle2 size={14} color="#6f42c1" />}
                                        </div>
                                        <span style={tierPrice}>₹{tier.price}</span>
                                    </div>

                                    {isSelected && !isSoldOut && (
                                        <div style={benefitDrawer}>
                                            <p style={benefitTitle}>WHAT'S INCLUDED:</p>
                                            <ul style={benefitList}>
                                                {tier.benefits?.split(',').map((perk, i) => (
                                                    <li key={i} style={benefitItem}>
                                                        <Sparkles size={10} color="#6f42c1" /> {perk.trim()}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div style={stockIndicator}>
                                        {isSoldOut ? <span style={soldOutBadge}>SOLD OUT</span> : 
                                         <span style={currentStock <= 5 ? urgencyLabel : availableText}>
                                            {currentStock <= 5 ? `🔥 ONLY ${currentStock} LEFT` : `${currentStock} tickets remaining`}
                                         </span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={quantitySection}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <label style={labelStyle}>QUANTITY</label>
                        </div>
                        <div style={qtyRow}>
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={qtyBtn}>-</button>
                            <span style={qtyValue}>{quantity}</span>
                            <button onClick={() => setQuantity(Math.min(10, quantity + 1))} style={qtyBtn}>+</button>
                        </div>
                    </div>

                    <div style={totalRow}>
                        <span style={totalLabel}>Total Payment</span>
                        <span style={totalValue}>{selectedTier ? `₹${(selectedTier.price * quantity).toLocaleString()}` : "₹0"}</span>
                    </div>

                    <button 
                        onClick={handlePurchase} 
                        disabled={isPurchasing || !selectedTier || (liveStock[selectedTier.id] ?? selectedTier.availableStock) <= 0}
                        style={isPurchasing || !selectedTier || (liveStock[selectedTier.id] ?? selectedTier.availableStock) <= 0 ? disabledBuyBtn : buyBtn}
                    >
                        {isPurchasing ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                        {isPurchasing ? "⚡ SECURING FUNDS..." : !selectedTier ? "SELECT A TIER" : `SECURE ${quantity} TICKETS`}
                    </button>
                    
                    <p style={secureFootnote}><ShieldCheck size={12} /> Bank-grade encryption active.</p>
                </div>
            </div>

            {/* 🛡️ THE ATOMIC PAYMENT BRIDGE: Mimics a real-world Payment Gateway */}
            {isPurchasing && (
                <div style={paymentOverlay}>
                    <div style={paymentModal}>
                        <Loader2 size={48} className="animate-spin" color="#6f42c1" />
                        <h2 style={paymentStatus}>Securing Transaction...</h2>
                        <div style={paymentDetails}>
                            <p style={payRow}><span>Merchant:</span> <span>TicketBlitz Infrastructure</span></p>
                            <p style={payRow}><span>Amount:</span> <span>{selectedTier ? `₹${(selectedTier.price * quantity).toLocaleString()}` : "₹0"}</span></p>
                            <p style={payRow}><span>Identity:</span> <span>{localStorage.getItem("user_email")}</span></p>
                        </div>
                        <div style={secureShield}>
                            <ShieldCheck size={16} color="#28a745" />
                            <span>Bank-Grade 256-bit SSL Handshake Active</span>
                        </div>
                    </div>
                </div>
            )}

            {showMapLightbox && (
                <div style={lightboxOverlay} onClick={() => setShowMapLightbox(false)}>
                    <div style={lightboxContent} onClick={e => e.stopPropagation()}>
                        <button style={closeBtn} onClick={() => setShowMapLightbox(false)}>×</button>
                        <h3 style={mapHeader}>{event.venue?.name} — Official Seating Chart</h3>
                        <img 
                            src={event.venue?.seatingMapUrl || "https://images.unsplash.com/photo-1504450758481-7338eba7524a"} 
                            alt="Seating Map" 
                            style={mapImageLarge} 
                        />
                        <p style={mapFooter}>Examine your tier placement before confirming.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- STYLES: High-Fidelity Refinement ---
const containerStyle = { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Inter, sans-serif' };
const heroHeader = { marginBottom: '30px' };
const backBtn = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#888', fontWeight: '600', marginBottom: '15px' };
const badgeContainer = { display: 'flex', gap: '12px', marginBottom: '10px' };
const categoryBadge = { padding: '5px 12px', background: '#f3ebff', color: '#6f42c1', borderRadius: '20px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' };
const liveIndicator = { fontSize: '10px', fontWeight: '800', color: '#28a745', letterSpacing: '0.5px' };
const mainTitle = { fontSize: '42px', fontWeight: '900', color: '#111', margin: 0, letterSpacing: '-1px' };
const contentGrid = { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '50px', alignItems: 'start' };
const leftColumn = { display: 'flex', flexDirection: 'column', gap: '30px' };
const imageContainer = { width: '100%', height: '480px', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' };
const mainImg = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' };
const detailsBox = { padding: '30px', background: '#f9f9f9', borderRadius: '24px' };
const sectionHeader = { fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0' };
const descriptionText = { lineHeight: '1.7', color: '#555', fontSize: '15px' };
const venueInfoCard = { padding: '30px', border: '1px solid #eee', borderRadius: '24px', transition: 'all 0.2s ease', backgroundColor: '#fff' };
const zoomBadge = { background: '#f1f5f9', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' };
const venueHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const venueNameText = { fontSize: '18px', margin: '0 0 5px 0' };
const venueAddressText = { color: '#666', fontSize: '14px', margin: 0 };
const venueCityText = { color: '#999', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' };
const mapLink = { fontSize: '11px', color: '#6f42c1', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' };
const bookingWidget = { background: '#fff', padding: '40px', borderRadius: '30px', border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'sticky', top: '40px' };
const labelStyle = { fontSize: '11px', fontWeight: '900', color: '#999', letterSpacing: '1px', marginBottom: '15px', display: 'block' };
const tierList = { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' };
const tierCard = { padding: '20px', borderRadius: '18px', border: '2px solid transparent', transition: 'all 0.2s ease' };
const tierHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' };
const tierName = { fontWeight: '800', fontSize: '15px' };
const tierPrice = { fontWeight: '900', fontSize: '18px', color: '#6f42c1' };
const benefitDrawer = { marginTop: '15px', padding: '15px', background: 'rgba(111, 66, 193, 0.05)', borderRadius: '12px', border: '1px dashed #dcd0ff' };
const benefitTitle = { fontSize: '10px', fontWeight: '900', color: '#6f42c1', marginBottom: '10px' };
const benefitList = { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' };
const benefitItem = { fontSize: '12px', fontWeight: '600', color: '#444', display: 'flex', alignItems: 'center', gap: '8px' };
const stockIndicator = { marginTop: '10px' };
const urgencyLabel = { color: '#dc3545', fontWeight: '900', fontSize: '11px' };
const availableText = { color: '#888', fontSize: '11px', fontWeight: '600' };
const soldOutBadge = { background: '#fee2e2', color: '#dc3545', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' };
const quantitySection = { marginBottom: '30px' };
const qtyRow = { display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' };
const qtyBtn = { width: '45px', height: '45px', borderRadius: '15px', border: '1px solid #eee', background: '#fff', fontSize: '20px', cursor: 'pointer' };
const qtyValue = { fontSize: '20px', fontWeight: '900', width: '30px', textAlign: 'center' };
const totalRow = { display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #f1f1f1', paddingTop: '20px', marginBottom: '10px' };
const totalLabel = { fontWeight: '700', color: '#666' };
const totalValue = { fontSize: '26px', fontWeight: '900', color: '#111' };
const secureFootnote = { fontSize: '10px', color: '#999', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '15px' };
const buyBtn = { width: '100%', padding: '20px', background: '#000', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', fontSize: '16px', transition: '0.2s' };
const disabledBuyBtn = { ...buyBtn, background: '#f1f1f1', color: '#ccc', cursor: 'not-allowed' };

// 🏦 PAYMENT BRIDGE STYLES
const paymentOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000 };
const paymentModal = { backgroundColor: '#fff', padding: '50px', borderRadius: '32px', textAlign: 'center', width: '100%', maxWidth: '450px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' };
const paymentStatus = { fontSize: '24px', fontWeight: '900', marginTop: '20px', color: '#111' };
const paymentDetails = { margin: '30px 0', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '16px', textAlign: 'left' };
const payRow = { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '600' };
const secureShield = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#28a745', textTransform: 'uppercase' };

const lightboxOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(10px)', padding: '40px' };
const lightboxContent = { backgroundColor: '#fff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '900px', position: 'relative', textAlign: 'center' };
const closeBtn = { position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', fontSize: '32px', color: '#ccc', cursor: 'pointer' };
const mapHeader = { fontSize: '20px', fontWeight: '900', color: '#111', marginBottom: '25px' };
const mapImageLarge = { width: '100%', maxHeight: '60vh', borderRadius: '20px', objectFit: 'contain', background: '#f9f9f9', padding: '10px' };
const mapFooter = { marginTop: '20px', fontSize: '13px', color: '#888', fontWeight: '500' };
const loaderStyle = { display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', height: '80vh', fontWeight: '800', color: '#6f42c1' };

export default TicketPage;