import { useState, useEffect } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Link as LinkIcon, Plus, Trash2, Ticket, Clock, Camera, X } from 'lucide-react';

function AdminEventForm({ onClose, refreshData, initialData, venues }) {
    
    // Default Empty State
    const defaultState = {
        title: "",
        description: "",
        imageUrl: "",
        eventDate: "",
        eventTime: "", 
        category: "Music", 
        venue: { id: "" },
        ticketTiers: [
            { tierName: "General Admission", price: 0, availableStock: 0, benefits: "Standard Entry" }
        ],
        galleryImages: [] 
    };

    const [eventData, setEventData] = useState(defaultState);

    // 🔄 CRITICAL FIX: Sync State when initialData changes (e.g. clicking Edit)
    useEffect(() => {
        if (initialData) {
            setEventData({
                ...initialData,
                // Ensure venue is an object with ID to prevent crashes
                venue: initialData.venue || { id: "" },
                // Ensure gallery is an array, never null
                galleryImages: initialData.galleryImages || [] 
            });
        } else {
            // Reset to default if creating new
            setEventData(defaultState);
            // Auto-select first venue if available
            if (venues && venues.length > 0) {
                setEventData(prev => ({ ...prev, venue: { id: venues[0].id } }));
            }
        }
    }, [initialData, venues]);

    // --- TIER LOGIC ---
    const addTier = () => {
        setEventData({
            ...eventData,
            ticketTiers: [...eventData.ticketTiers, { tierName: "", price: 0, availableStock: 0, benefits: "" }]
        });
    };

    const removeTier = (index) => {
        if (eventData.ticketTiers.length === 1) return;
        const updatedTiers = eventData.ticketTiers.filter((_, i) => i !== index);
        setEventData({ ...eventData, ticketTiers: updatedTiers });
    };

    const handleTierChange = (index, field, value) => {
        const updatedTiers = [...eventData.ticketTiers];
        updatedTiers[index][field] = value;
        setEventData({ ...eventData, ticketTiers: updatedTiers });
    };

    // --- GALLERY LOGIC ---
    const addGalleryImage = () => {
        setEventData({
            ...eventData,
            galleryImages: [...(eventData.galleryImages || []), ""]
        });
    };

    const removeGalleryImage = (index) => {
        const updatedGallery = eventData.galleryImages.filter((_, i) => i !== index);
        setEventData({ ...eventData, galleryImages: updatedGallery });
    };

    const handleGalleryChange = (index, value) => {
        const updatedGallery = [...(eventData.galleryImages || [])];
        updatedGallery[index] = value;
        setEventData({ ...eventData, galleryImages: updatedGallery });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("jwt_token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Prepare Data
        const finalData = {
            ...eventData,
            imageUrl: eventData.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
            // 🛡️ Filter out empty strings to send clean data
            galleryImages: eventData.galleryImages.filter(url => url && url.trim() !== "")
        };

        try {
            console.log("📤 Sending Data:", finalData); // Check console to see what is sent!

            if (initialData && initialData.id) {
                // UPDATE (PUT)
                await axios.put(`http://localhost:8080/api/events/${initialData.id}`, finalData, config);
                alert("✅ Experience Updated Successfully!");
            } else {
                // CREATE (POST)
                await axios.post('http://localhost:8080/api/events/create', finalData, config);
                alert("🚀 Experience Launched!");
            }
            
            if (refreshData) refreshData(); // Reload the list in dashboard
            onClose(); 
        } catch (error) {
            console.error("Action failed", error);
            const msg = error.response?.data?.message || "Check console for details.";
            alert(`Error: ${msg}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <div style={gridContainer}>
                {/* IMAGE PREVIEW */}
                <div style={previewSection}>
                    {eventData.imageUrl ? (
                        <img src={eventData.imageUrl} alt="Preview" style={previewImg} />
                    ) : (
                        <div style={placeholderPreview}><ImageIcon size={24} color="#ccc" /></div>
                    )}
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <input type="text" placeholder="Event Title" required value={eventData.title} onChange={(e) => setEventData({...eventData, title: e.target.value})} style={inputStyle} />
                    
                    <div style={{display: 'flex', gap: '10px'}}>
                        <select value={eventData.category} onChange={(e) => setEventData({...eventData, category: e.target.value})} style={{...inputStyle, flex: 1.2}}>
                            <option value="Music">🎵 Music</option>
                            <option value="Sports">🏆 Sports</option>
                            <option value="Tech">💻 Tech</option>
                            <option value="Arts">🎨 Arts</option>
                        </select>
                        <div style={{position: 'relative', flex: 1}}>
                             <Clock size={14} style={iconInput} />
                             <input type="text" placeholder="Start (e.g. 7 PM)" value={eventData.eventTime} onChange={(e) => setEventData({...eventData, eventTime: e.target.value})} style={{...inputStyle, paddingLeft: '35px', width: '100%'}} />
                        </div>
                    </div>
                </div>

                <textarea placeholder="Detailed Event Narrative..." required value={eventData.description} onChange={(e) => setEventData({...eventData, description: e.target.value})} style={{...inputStyle, gridColumn: 'span 2', height: '60px'}} />
                
                <div style={{gridColumn: 'span 2', display: 'flex', gap: '12px'}}>
                    <input type="date" required value={eventData.eventDate} onChange={(e) => setEventData({...eventData, eventDate: e.target.value})} style={{...inputStyle, flex: 1}} />
                    
                    <select 
                        value={eventData.venue?.id || ""} 
                        onChange={(e) => setEventData({...eventData, venue: { id: e.target.value }})} 
                        style={{...inputStyle, flex: 1.5}} 
                        required
                    >
                        <option value="" disabled>Select Venue</option>
                        {venues && venues.map(v => (
                            <option key={v.id} value={v.id}>{v.name} — {v.city}</option>
                        ))}
                    </select>
                </div>

                <div style={{...inputStyle, gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <LinkIcon size={14} color="#999" />
                    <input type="text" placeholder="Poster Image URL" value={eventData.imageUrl} onChange={(e) => setEventData({...eventData, imageUrl: e.target.value})} style={{border: 'none', outline: 'none', width: '100%'}} />
                </div>
            </div>

            {/* 📸 GALLERY MANAGER (ADMIN ONLY) */}
            <div style={{marginTop: '25px', padding: '15px', background: '#fff', borderRadius: '12px', border: '1px solid #eee'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                    <h3 style={sectionLabel}><Camera size={14} /> Official Gallery (Admin Only)</h3>
                    <button type="button" onClick={addGalleryImage} style={addBtn}>+ Add Image URL</button>
                </div>
                
                {(!eventData.galleryImages || eventData.galleryImages.length === 0) && (
                    <p style={{fontSize: '11px', color: '#999', fontStyle: 'italic'}}>No official snaps added yet.</p>
                )}

                {eventData.galleryImages?.map((url, index) => (
                    <div key={index} style={{display: 'flex', gap: '10px', marginBottom: '8px'}}>
                        <input 
                            type="text" 
                            placeholder="Paste Image URL..." 
                            value={url} 
                            onChange={(e) => handleGalleryChange(index, e.target.value)} 
                            style={{...tierInput, flex: 1}} 
                        />
                        <button type="button" onClick={() => removeGalleryImage(index)} style={trashBtn}><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>

            {/* DYNAMIC TIER BUILDER */}
            <div style={{marginTop: '25px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                    <h3 style={sectionLabel}><Ticket size={14} /> Tiers & Benefits</h3>
                    <button type="button" onClick={addTier} style={addBtn}>+ Add Tier</button>
                </div>

                <div style={{maxHeight: '220px', overflowY: 'auto', paddingRight: '5px'}}>
                    {eventData.ticketTiers.map((tier, index) => (
                        <div key={index} style={tierCard}>
                            <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                                <input type="text" placeholder="Tier Name" required value={tier.tierName} onChange={(e) => handleTierChange(index, 'tierName', e.target.value)} style={{...tierInput, flex: 2}} />
                                <input type="number" placeholder="Price (₹)" required value={tier.price} onChange={(e) => handleTierChange(index, 'price', e.target.value)} style={tierInput} />
                                <input type="number" placeholder="Stock" required value={tier.availableStock} onChange={(e) => handleTierChange(index, 'availableStock', e.target.value)} style={tierInput} />
                                <button type="button" onClick={() => removeTier(index)} style={trashBtn}><Trash2 size={16}/></button>
                            </div>
                            <input type="text" placeholder="Specific Perks (e.g. Free Drinks, VR Gallery Access)" value={tier.benefits} onChange={(e) => handleTierChange(index, 'benefits', e.target.value)} style={{...tierInput, width: '100%', fontSize: '12px', background: '#fff'}} />
                        </div>
                    ))}
                </div>
            </div>

            <div style={{display: 'flex', gap: '10px', marginTop: '30px'}}>
                <button type="submit" style={submitBtn}>{initialData ? "UPDATE EXPERIENCE" : "LAUNCH WORLDWIDE"}</button>
                <button type="button" onClick={onClose} style={cancelBtn}>DISCARD</button>
            </div>
        </form>
    );
}

// --- STYLING ---
const formStyle = { display: 'flex', flexDirection: 'column' };
const gridContainer = { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' };
const previewSection = { width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const previewImg = { width: '100%', height: '100%', objectFit: 'cover' };
const placeholderPreview = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #eee', fontSize: '13px', outline: 'none', background: '#fff' };
const iconInput = { position: 'absolute', left: '12px', top: '15px', color: '#999' };
const tierCard = { padding: '12px', background: '#fcfcfc', borderRadius: '12px', marginBottom: '10px', border: '1px solid #f0f0f0' };
const tierInput = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none' };
const sectionLabel = { fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' };
const addBtn = { padding: '6px 14px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' };
const trashBtn = { background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' };
const submitBtn = { padding: '16px', background: '#000', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', flex: 2 };
const cancelBtn = { padding: '16px', background: '#fff', color: '#666', border: '1px solid #eee', borderRadius: '12px', cursor: 'pointer', flex: 1 };

export default AdminEventForm;