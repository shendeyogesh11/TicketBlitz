import { useState } from 'react';
import axios from 'axios';
import { 
    MapPin, Plus, Trash2, Home, Users, 
    Navigation, Image as ImageIcon, Edit2, X 
} from 'lucide-react';

/**
 * Orchestrates the registration and patching of physical venues.
 */
const VenueManager = ({ venues, onRefresh }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingVenue, setEditingVenue] = useState(null); // Track the active patch target
    const [formData, setFormData] = useState({ 
        name: '', 
        city: '', 
        address: '', 
        totalCapacity: '', 
        seatingMapUrl: '' 
    });

    const resetForm = () => {
        setFormData({ name: '', city: '', address: '', totalCapacity: '', seatingMapUrl: '' });
        setEditingVenue(null);
        setShowForm(false);
    };

    /**
     * EDIT INITIATION:
     * Pre-populates the form with existing "Brick" data for patching.
     */
    const handleEditInitiate = (venue) => {
        setEditingVenue(venue);
        setFormData({
            name: venue.name,
            city: venue.city,
            address: venue.address,
            totalCapacity: venue.totalCapacity,
            seatingMapUrl: venue.seatingMapUrl || ''
        });
        setShowForm(true);
    };

    /**
     * UNIFIED PERSISTENCE HANDSHAKE:
     * Dynamically switches between POST and PUT based on editing state.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("jwt_token");
        
        // --- NORMALIZATION BRICK ---
        const payload = {
            ...formData,
            totalCapacity: parseInt(formData.totalCapacity) || 0,
            seatingMapUrl: formData.seatingMapUrl || "https://images.unsplash.com/photo-1504450758481-7338eba7524a"
        };

        try {
            if (editingVenue) {
                // PATCH: Update existing infrastructure
                await axios.put(`http://localhost:8080/api/venues/${editingVenue.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("🔄 Infrastructure Patched Successfully!");
            } else {
                // POST: Register new global infrastructure
                await axios.post("http://localhost:8080/api/venues", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("🏟️ Infrastructure Successfully Registered!");
            }
            onRefresh(); // Global dashboard sync
            resetForm();
        } catch (err) { 
            console.error("Infrastructure sync failed", err); 
            alert("Error: Ensure your Admin JWT is valid and schema matches.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("🚨 Remove this infrastructure? This may affect active events.")) return;
        const token = localStorage.getItem("jwt_token");
        try {
            await axios.delete(`http://localhost:8080/api/venues/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRefresh();
        } catch (err) {
            console.error("Deletion blocked: Infrastructure in use", err);
        }
    };

    return (
        <div style={container}>
            <div style={header}>
                <h2 style={title}><Home size={20} color="#6f42c1" /> Venue Infrastructure</h2>
                <button onClick={() => { if(showForm) resetForm(); else setShowForm(true); }} style={addBtn}>
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? "Cancel" : "Register Venue"}
                </button>
            </div>

            {/* UNIFIED INFRASTRUCTURE FORM */}
            {showForm && (
                <form onSubmit={handleSubmit} style={formStyle}>
                    <h3 style={formTitle}>
                        {editingVenue ? `✏️ Patching: ${editingVenue.name}` : "🚀 Register New Venue"}
                    </h3>
                    <div style={inputGroup}>
                        <input placeholder="Venue Name" required value={formData.name} 
                               onChange={e => setFormData({...formData, name: e.target.value})} style={input} />
                        <input placeholder="City" required value={formData.city} 
                               onChange={e => setFormData({...formData, city: e.target.value})} style={input} />
                    </div>
                    <div style={inputGroup}>
                        <input placeholder="Full Physical Address" required value={formData.address} 
                               onChange={e => setFormData({...formData, address: e.target.value})} style={input} />
                        <input type="number" placeholder="Total Capacity" required value={formData.totalCapacity} 
                               onChange={e => setFormData({...formData, totalCapacity: e.target.value})} style={input} />
                    </div>
                    
                    <div style={{...inputGroup, gridTemplateColumns: '1fr'}}>
                        <input 
                            placeholder="Seating Map URL (Paste high-fidelity image link here)" 
                            value={formData.seatingMapUrl} 
                            onChange={e => setFormData({...formData, seatingMapUrl: e.target.value})} 
                            style={{...input, borderColor: '#6f42c1', borderStyle: 'dashed'}} 
                        />
                    </div>
                    
                    <button type="submit" style={submitBtn}>
                        {editingVenue ? "UPDATE INFRASTRUCTURE" : "CONFIRM REGISTRATION"}
                    </button>
                </form>
            )}

            {/* INFRASTRUCTURE GRID */}
            <div style={grid}>
                {venues.map(v => (
                    <div key={v.id} style={card}>
                        <div style={cardContent}>
                            <div style={cardMain}>
                                <MapPin size={14} color="#6f42c1" />
                                <strong style={venueName}>{v.name}</strong>
                                <div style={actionGroup}>
                                    <button onClick={() => handleEditInitiate(v)} style={iconBtn} title="Edit"><Edit2 size={12} /></button>
                                    <button onClick={() => handleDelete(v.id)} style={{...iconBtn, color: '#ff4d4f'}} title="Delete"><Trash2 size={12} /></button>
                                </div>
                            </div>
                            
                            <div style={detailLine}>
                                <Navigation size={10} color="#999" />
                                <span style={detailText}>{v.address || "Pending Address..."}</span>
                            </div>

                            <div style={detailLine}>
                                <Users size={10} color="#999" />
                                <span style={detailText}>{v.city} • <span style={{fontWeight: '900'}}>Cap: {v.totalCapacity?.toLocaleString()}</span></span>
                            </div>

                            <div style={{...detailLine, marginTop: '5px'}}>
                                <ImageIcon size={10} color={v.seatingMapUrl ? "#28a745" : "#ccc"} />
                                <span style={{...detailText, color: v.seatingMapUrl ? "#28a745" : "#ccc", fontSize: '10px', fontWeight: '800'}}>
                                    {v.seatingMapUrl ? "MAP SYNCED" : "NO MAP FOUND"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {venues.length === 0 && <p style={emptyText}>No venues registered. Deploy your first stadium now.</p>}
            </div>
        </div>
    );
};

// --- STYLES ---
const container = { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' };
const title = { margin: 0, fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', color: '#111' };
const addBtn = { padding: '10px 20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px', padding: '25px', background: '#f8f9fa', borderRadius: '16px', border: '1px solid #6f42c1' };
const formTitle = { margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#6f42c1' };
const inputGroup = { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' };
const input = { padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#fff' };
const submitBtn = { padding: '14px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' };
const card = { padding: '20px', borderRadius: '16px', border: '1px solid #eee', background: '#fff' };
const cardContent = { display: 'flex', flexDirection: 'column', gap: '8px' };
const cardMain = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' };
const venueName = { fontSize: '14px', fontWeight: '800', color: '#111', flex: 1 };
const actionGroup = { display: 'flex', gap: '8px' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#999' };
const detailLine = { display: 'flex', alignItems: 'center', gap: '8px' };
const detailText = { fontSize: '11px', color: '#666', fontWeight: '500' };
const emptyText = { gridColumn: 'span 3', textAlign: 'center', color: '#ccc', padding: '40px' };

export default VenueManager;