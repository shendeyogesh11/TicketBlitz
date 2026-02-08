import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Image as ImageIcon, X, MessageCircle, User, Send, Loader2, Link as LinkIcon, Camera, Maximize2, Plus, Trash2, Pencil } from 'lucide-react';

// --- HELPER: Generate unique pastel color from name ---
const stringToColor = (str) => {
    if (!str) return "#6f42c1"; 
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 40%)`; 
};

// --- HELPER: Decode Token to get Email ---
const getCurrentUserEmail = () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub; // 'sub' is standard for email/username in JWT
    } catch (e) {
        return null;
    }
};

export default function PastEventsSection() {
    const [pastEvents, setPastEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const fetchPast = async () => {
            const token = localStorage.getItem("jwt_token");
            try {
                const res = await axios.get('http://localhost:8080/api/events', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const now = new Date();
                const past = res.data
                    .filter(e => new Date(e.eventDate) < now)
                    .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
                
                setPastEvents(past);
            } catch (err) {
                console.error("Failed to load memories", err);
            }
        };
        fetchPast();
    }, []);

    if (pastEvents.length === 0) return null;

    return (
        <div style={{ marginTop: '80px', marginBottom: '60px', animation: 'fadeIn 0.8s ease' }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px'}}>
                <div style={{fontSize: '28px', background:'#f0f0f0', padding:'10px', borderRadius:'15px'}}>🕰️</div>
                <div>
                    <h2 style={{fontSize: '24px', fontWeight: '900', margin: 0, color: '#111'}}>Memory Lane</h2>
                    <p style={{margin: '5px 0 0 0', color: '#666', fontSize: '14px'}}>Relive the magic of completed events.</p>
                </div>
            </div>
            
            <div style={scrollGrid}>
                {pastEvents.map(event => (
                    <div key={event.id} style={cardStyle} onClick={() => setSelectedEvent(event)}>
                        <div style={imgWrapper}>
                            <img src={event.imageUrl} style={grayscaleImg} alt={event.title} />
                            <div style={overlay}>
                                <span style={viewBtn}><ImageIcon size={14}/> Open Experience</span>
                            </div>
                        </div>
                        <div style={{ padding: '18px' }}>
                            <h3 style={eventTitle}>{event.title}</h3>
                            <div style={ratingRow}>
                                <div style={{display: 'flex', gap: '2px'}}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star 
                                            key={star} 
                                            size={12} 
                                            fill={star <= (event.averageRating || 0) ? "#ffd700" : "#e0e0e0"} 
                                            color={star <= (event.averageRating || 0) ? "#ffd700" : "#ccc"} 
                                        />
                                    ))}
                                </div>
                                <span style={{fontSize:'11px', fontWeight: 'bold', color:'#444', marginLeft:'8px'}}>
                                    {event.averageRating ? event.averageRating.toFixed(1) : "New"} 
                                    <span style={{color:'#999', fontWeight:'normal'}}> ({event.reviews ? event.reviews.length : 0})</span>
                                </span>
                            </div>
                            <p style={{fontSize: '11px', fontWeight:'600', color: '#888', marginTop: '10px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
                                {new Date(event.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedEvent && (
                <ExperienceModal 
                    event={selectedEvent} 
                    onClose={() => setSelectedEvent(null)} 
                />
            )}
        </div>
    );
}

// --- SUB-COMPONENT: Experience Modal with Edit/Delete ---
function ExperienceModal({ event, onClose }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    
    // UI State
    const [activeImage, setActiveImage] = useState(event.imageUrl); 
    const [showLightbox, setShowLightbox] = useState(false); 

    // Form State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [currentLink, setCurrentLink] = useState(""); 
    const [attachedImages, setAttachedImages] = useState([]); 
    
    const [isPosting, setIsPosting] = useState(false);
    const [editingId, setEditingId] = useState(null); // Tracks if we are editing a specific review

    const allImages = [event.imageUrl, ...(event.galleryImages || [])];

    useEffect(() => {
        // 1. Identify User
        const email = getCurrentUserEmail();
        setCurrentUser(email);

        // 2. Fetch Reviews
        const fetchReviews = async () => {
            const token = localStorage.getItem("jwt_token");
            try {
                const res = await axios.get(`http://localhost:8080/api/reviews/${event.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReviews(res.data);
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [event.id]);

    const addImage = () => {
        if (currentLink.trim()) {
            setAttachedImages([...attachedImages, currentLink.trim()]);
            setCurrentLink(""); 
        }
    };

    const removeImage = (index) => {
        setAttachedImages(attachedImages.filter((_, i) => i !== index));
    };

    // --- ACTIONS ---

    const handleDelete = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this memory?")) return;
        const token = localStorage.getItem("jwt_token");
        try {
            await axios.delete(`http://localhost:8080/api/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviews(reviews.filter(r => r.id !== reviewId));
            
            // If we were editing this, cancel edit mode
            if (editingId === reviewId) cancelEdit();
        } catch (err) {
            alert("Failed to delete review.");
        }
    };

    const startEdit = (review) => {
        setEditingId(review.id);
        setRating(review.rating);
        setComment(review.comment);
        setAttachedImages(review.reviewImages || []);
        // Scroll to form (optional UX)
        document.getElementById("review-form-container").scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setRating(5);
        setComment("");
        setAttachedImages([]);
        setCurrentLink("");
    };

    const handlePostReview = async () => {
        if (!comment.trim()) return;
        setIsPosting(true);
        const token = localStorage.getItem("jwt_token");

        const finalImages = currentLink.trim() 
            ? [...attachedImages, currentLink.trim()] 
            : attachedImages;

        try {
            const payload = { rating, comment, reviewImages: finalImages };
            
            let res;
            if (editingId) {
                // UPDATE (PUT)
                res = await axios.put(`http://localhost:8080/api/reviews/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Update list locally
                setReviews(reviews.map(r => r.id === editingId ? res.data : r));
                setEditingId(null); // Exit edit mode
            } else {
                // CREATE (POST)
                res = await axios.post(`http://localhost:8080/api/reviews/${event.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReviews([res.data, ...reviews]);
            }

            // Reset Form
            setComment("");
            setCurrentLink("");
            setAttachedImages([]);
            setRating(5);
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || "Unknown Error";
            alert(`Failed to ${editingId ? 'update' : 'post'} review: ${errMsg}`);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalContent} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={closeBtn} title="Close">
                    <X size={20} color="#555" />
                </button>
                
                <div style={leftPanel}>
                    <div style={mainDisplay} onClick={() => setShowLightbox(true)}>
                        <img src={activeImage} style={mainImg} alt="Active View" />
                        <div style={gradientOverlay} /> 
                        <div style={modalHeader}>
                            <h2 style={{margin: 0, fontSize: '32px', fontWeight: '800', color: '#fff', lineHeight: '1.1', textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                                {event.title}
                            </h2>
                            <div style={badge}>COMPLETED</div>
                        </div>
                        <div style={expandHint}><Maximize2 size={16} /> Full Screen</div>
                    </div>

                    <div style={filmstrip}>
                        {allImages.length > 0 ? (
                            allImages.map((img, i) => (
                                <div 
                                    key={i} 
                                    style={{
                                        ...thumbContainer,
                                        border: activeImage === img ? '2px solid #fff' : '2px solid transparent',
                                        opacity: activeImage === img ? 1 : 0.6
                                    }}
                                    onClick={() => setActiveImage(img)}
                                >
                                    <img src={img} style={thumbImg} alt={`thumb-${i}`} />
                                </div>
                            ))
                        ) : (
                            <div style={{color:'#666', fontSize:'12px', padding:'10px'}}>No images available</div>
                        )}
                    </div>
                </div>

                <div style={rightPanel}>
                    <div style={reviewHeader}>
                        <h3 style={{margin: 0, fontSize: '18px', fontWeight: '800', display:'flex', gap:'8px', alignItems:'center'}}>
                            <MessageCircle size={18} fill="#000" /> Fan Voices
                        </h3>
                        <span style={{fontSize:'12px', color:'#666', fontWeight:'600'}}>{reviews.length} Stories</span>
                    </div>
                    
                    {/* INPUT FORM */}
                    <div style={inputContainer} id="review-form-container">
                        {editingId && (
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'12px', color:'#6f42c1', fontWeight:'bold'}}>
                                <span>✏️ Editing your review</span>
                                <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={cancelEdit}>Cancel</span>
                            </div>
                        )}

                        <div style={starRow}>
                            <span style={{fontSize:'12px', fontWeight:'700', color:'#444', marginRight:'10px'}}>
                                {editingId ? "UPDATE RATING:" : "RATE IT:"}
                            </span>
                            {[1,2,3,4,5].map(s => (
                                <Star 
                                    key={s} size={22} 
                                    fill={s <= rating ? "#FFD700" : "#f0f0f0"} 
                                    color={s <= rating ? "#FFD700" : "#ccc"}
                                    onClick={() => setRating(s)}
                                    style={{cursor: 'pointer', transition: '0.2s', transform: s <= rating ? 'scale(1.1)' : 'scale(1)'}}
                                />
                            ))}
                        </div>
                        <textarea 
                            placeholder="How was the vibe? The sound? The crowd?" 
                            value={comment} onChange={e => setComment(e.target.value)} style={textArea}
                        />
                        
                        <div style={urlInputWrapper}>
                            <LinkIcon size={14} color="#999" />
                            <input 
                                type="text" placeholder="Paste image URL..." 
                                value={currentLink} 
                                onChange={e => setCurrentLink(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && addImage()}
                                style={urlInput}
                            />
                            <button onClick={addImage} style={plusBtn} title="Add Image">
                                <Plus size={16} />
                            </button>
                        </div>

                        {attachedImages.length > 0 && (
                            <div style={attachmentPreview}>
                                {attachedImages.map((url, i) => (
                                    <div key={i} style={previewChip}>
                                        <div style={chipImgBox}>
                                            <img src={url} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                        </div>
                                        <Trash2 size={12} style={{cursor:'pointer', color:'#ff4d4f'}} onClick={() => removeImage(i)}/>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button 
                            onClick={handlePostReview} 
                            disabled={isPosting || !comment.trim()}
                            style={isPosting || !comment.trim() ? {...postBtn, opacity: 0.6, cursor: 'not-allowed'} : postBtn}
                        >
                            {isPosting ? <Loader2 className="animate-spin" size={16}/> : (editingId ? <Pencil size={14}/> : <Send size={14}/>)}
                            {isPosting ? "Processing..." : (editingId ? "Update Review" : "Share Experience")}
                        </button>
                    </div>

                    {/* REVIEW LIST */}
                    <div style={scrollableList}>
                        {loading ? (
                            <div style={{textAlign:'center', padding:'40px', color:'#999'}}>
                                <Loader2 size={24} className="animate-spin" style={{margin:'0 auto 10px'}}/>
                                Loading community thoughts...
                            </div>
                        ) : reviews.length === 0 ? (
                            <div style={emptyState}>
                                <MessageCircle size={32} color="#eee" />
                                <p>No stories yet. Be the first to share!</p>
                            </div>
                        ) : (
                            reviews.map((r, i) => (
                                <div key={r.id || i} style={{...reviewItem, borderLeft: r.id === editingId ? '3px solid #6f42c1' : 'none'}}>
                                    <div style={reviewTop}>
                                        <div style={userInfo}>
                                            <div style={{...avatarInit, background: stringToColor(r.userName || "U")}}>
                                                {r.userName?.charAt(0).toUpperCase() || "U"}
                                            </div>
                                            <div>
                                                <div style={userName}>
                                                    {r.userName || "Anonymous"}
                                                    {r.userId === currentUser && <span style={youTag}>(You)</span>}
                                                </div>
                                                <div style={dateText}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Just now"}</div>
                                            </div>
                                        </div>
                                        
                                        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                            <div style={starDisplay}>
                                                <Star size={10} fill="#FFD700" color="#FFD700" />
                                                <span>{r.rating}.0</span>
                                            </div>
                                            
                                            {/* ✏️ EDIT / DELETE ICONS (Only for Owner) */}
                                            {r.userId === currentUser && (
                                                <div style={{display:'flex', gap:'8px'}}>
                                                    <Pencil size={14} color="#666" style={{cursor:'pointer'}} onClick={() => startEdit(r)} />
                                                    <Trash2 size={14} color="#ff4d4f" style={{cursor:'pointer'}} onClick={() => handleDelete(r.id)} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <p style={commentText}>{r.comment}</p>
                                    
                                    {r.reviewImages && r.reviewImages.length > 0 && (
                                        <div style={userReviewGrid}>
                                            {r.reviewImages.map((img, idx) => (
                                                <img 
                                                    key={idx} 
                                                    src={img} 
                                                    alt="User attachment" 
                                                    style={userReviewImg} 
                                                    onClick={() => { setActiveImage(img); }} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {showLightbox && (
                <div style={lightboxOverlay} onClick={() => setShowLightbox(false)}>
                    <img src={activeImage} style={lightboxImg} alt="Full Screen" />
                    <button style={lightboxClose}><X size={30} color="#fff"/></button>
                </div>
            )}
        </div>
    );
}

// --- STYLES ---
const scrollGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' };
const cardStyle = { borderRadius: '20px', border: '1px solid #f0f0f0', overflow: 'hidden', cursor: 'pointer', background: '#fff', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const imgWrapper = { position: 'relative', height: '180px', overflow: 'hidden' };
const grayscaleImg = { width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', transition: 'filter 0.4s ease' };
const overlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s' };
const viewBtn = { background: '#fff', padding: '10px 20px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' };
const eventTitle = { fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: '#222' };
const ratingRow = { display: 'flex', alignItems: 'center' };

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)', padding: '20px' };
const modalContent = { background: '#fff', width: '100%', maxWidth: '950px', height: '85vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' };
const closeBtn = { position: 'absolute', top: '20px', right: '20px', background: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 50 };

const leftPanel = { width: '55%', background: '#000', position: 'relative', display: 'flex', flexDirection: 'column' };
const mainDisplay = { flex: 1, overflow: 'hidden', position: 'relative', cursor: 'zoom-in', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const mainImg = { width: '100%', height: '100%', objectFit: 'contain' };
const gradientOverlay = { position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', zIndex: 5, pointerEvents: 'none' };
const modalHeader = { position: 'absolute', bottom: '25px', left: '25px', zIndex: 10, width: '90%' };
const badge = { fontSize: '10px', fontWeight: '900', background: '#28a745', color: '#fff', padding: '4px 10px', borderRadius: '6px', marginTop: '8px', display: 'inline-block', letterSpacing: '0.5px' };
const expandHint = { position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(4px)', zIndex: 12 };
const filmstrip = { height: '100px', background: '#111', display: 'flex', gap: '10px', padding: '15px', overflowX: 'auto', borderTop: '1px solid #333', alignItems: 'center' };
const thumbContainer = { width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, transition: '0.2s' };
const thumbImg = { width: '100%', height: '100%', objectFit: 'cover' };

const rightPanel = { width: '45%', background: '#fff', display: 'flex', flexDirection: 'column' };
const reviewHeader = { padding: '25px 25px 15px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const inputContainer = { padding: '20px 25px', background: '#fafafa', borderBottom: '1px solid #eee' };
const starRow = { display: 'flex', alignItems: 'center', marginBottom: '15px' };
const textArea = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e0e0e0', minHeight: '70px', fontSize: '13px', outline: 'none', resize: 'none', marginBottom: '12px', fontFamily: 'inherit', background: '#fff' };
const urlInputWrapper = { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '8px 12px', marginBottom: '10px' };
const urlInput = { flex: 1, border: 'none', outline: 'none', fontSize: '12px', color: '#444' };
const plusBtn = { background: '#f0f0f0', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: '#666', transition: '0.2s' };
const postBtn = { width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', transition: '0.2s' };

const attachmentPreview = { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' };
const previewChip = { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '4px 8px', borderRadius: '20px', border: '1px solid #ddd', maxWidth: '120px' };
const chipImgBox = { width: '24px', height: '24px', borderRadius: '4px', overflow: 'hidden' };

const scrollableList = { flex: 1, overflowY: 'auto', padding: '20px 25px' };
const emptyState = { textAlign: 'center', padding: '40px', color: '#ccc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', fontSize: '14px' };
const reviewItem = { marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f5f5f5' };
const reviewTop = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' };
const userInfo = { display: 'flex', gap: '10px', alignItems: 'center' };
const avatarInit = { width: '32px', height: '32px', borderRadius: '50%', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' };
const userName = { fontSize: '13px', fontWeight: '800', color: '#222' };
const youTag = { fontSize: '10px', color: '#6f42c1', fontWeight: '900', marginLeft: '5px' };
const dateText = { fontSize: '10px', color: '#999' };
const starDisplay = { display: 'flex', alignItems: 'center', gap: '4px', background: '#fffdf5', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', color: '#b7791f' };
const commentText = { margin: 0, fontSize: '13px', color: '#444', lineHeight: '1.6' };
const userReviewGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px', marginTop: '10px' };
const userReviewImg = { width: '100%', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee', cursor: 'pointer' };

const lightboxOverlay = { position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' };
const lightboxImg = { maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', boxShadow: '0 0 50px rgba(0,0,0,0.5)' };
const lightboxClose = { position: 'absolute', top: '30px', right: '30px', background: 'none', border: 'none', cursor: 'pointer' };

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  div[style*="grayscale(100%)"]:hover { filter: grayscale(0%) !important; }
  div[style*="opacity: 0"]:hover { opacity: 1 !important; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #bbb; }
`;
document.head.appendChild(styleSheet);