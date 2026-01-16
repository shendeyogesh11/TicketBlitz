import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Users, Ticket, DollarSign, Activity, TrendingUp, 
    ShieldAlert, PlusCircle, ArrowLeft, Briefcase, 
    CheckCircle, XCircle, Clock 
} from 'lucide-react';
import AdminEventForm from '../components/AdminEventForm';
import EventTable from '../components/EventTable';
import VenueManager from '../components/VenueManager';

/**
 * TOP 1% G ADMIN INTERFACE:
 * Orchestrates global system visibility, inventory synchronization,
 * physical venue management, and partner proposal vetting.
 */
function AdminDashboard() {
    const [events, setEvents] = useState([]); 
    const [venues, setVenues] = useState([]);
    const [proposals, setProposals] = useState([]); // STATE: Added for partner tracking
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const [stats, setStats] = useState({ totalUsers: 0, totalTicketsSold: 0, totalRevenue: 0 });
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

    const getToken = () => localStorage.getItem("jwt_token");

    /**
     * PARTNER INFRASTRUCTURE FETCH:
     * Retrieves all organizer applications from the PostgreSQL registry.
     */
    const fetchProposals = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:8080/api/admin/partners', config);
            setProposals(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Partner inquiry fetch failed", err);
            setProposals([]);
        }
    };

    const fetchVenues = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:8080/api/admin/venues', config);
            setVenues(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Venue infrastructure fetch failed", err);
            setVenues([]);
        }
    };

    const fetchEvents = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('http://localhost:8080/api/events', config);
            setEvents(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch events", err);
            setEvents([]); 
        }
    };

    const fetchData = async () => {
        const token = getToken();
        if (!token) { navigate("/login"); return; }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const statsRes = await axios.get('http://localhost:8080/api/admin/stats', config);
            setStats(statsRes.data);
            
            const usersRes = await axios.get('http://localhost:8080/api/admin/users', config);
            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            
            const ordersRes = await axios.get('http://localhost:8080/api/admin/orders', config);
            setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
            
            await fetchEvents();
            await fetchVenues();
            await fetchProposals(); // INCLUDED: Sync proposals during master fetch
        } catch (err) {
            console.error("Admin Load Failed", err);
            if(err.response && err.response.status === 403) navigate("/login");
        }
    };

    useEffect(() => {
        fetchData();
    }, [navigate]);

    /**
     * PROPOSAL STATUS ORCHESTRATION:
     * Updates the inquiry status and triggers frontend notification sync.
     */
    const handleUpdateProposalStatus = async (proposalId, newStatus) => {
        const token = getToken();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:8080/api/admin/partners/${proposalId}/status`, 
                { status: newStatus }, config);
            fetchProposals(); // Refresh registry
        } catch (err) {
            alert("Status sync failed. Verify Admin credentials.");
        }
    };

    const handleReset = async () => {
        if(!window.confirm("🚨 Force-sync Redis with PostgreSQL Source of Truth?")) return;
        const token = getToken();
        try {
            await axios.post('http://localhost:8080/api/admin/sync-stock', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Global Inventory Synchronized Successfully!");
            fetchData();
        } catch (err) {
            console.error("Global Sync failed", err);
            alert("Sync Failed: Ensure your Admin JWT is valid.");
        }
    }

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("Delete this user permanently?")) return;
        const token = getToken();
        try {
            await axios.delete(`http://localhost:8080/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(); 
        } catch (error) {
            console.error("Delete failed", error);
        }
    }

    const handleDeleteEvent = async (eventId) => {
        if(!window.confirm("🚨 Warning: This removes all tiers and Redis stock keys. Proceed?")) return;
        const token = getToken();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`http://localhost:8080/api/events/${eventId}`, config);
            fetchData(); 
        } catch (error) {
            console.error("Event deletion failed", error);
        }
    }

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setShowModal(true);
    };

    const getChartData = () => {
        if (!Array.isArray(orders) || orders.length === 0) return [];
        const grouped = orders.reduce((acc, order) => {
            const time = new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            acc[time] = (acc[time] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(grouped).map(time => ({ time, sales: grouped[time] }));
    };

    return (
        <div style={{ padding: '40px', backgroundColor: '#fdfdfd', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

            {/* TOP BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{fontSize: '32px', fontWeight: '900', margin: 0, color: '#111'}}>🛡️ Command Center</h1>
                    <div style={liveBadge}><Activity size={10} /> SYSTEM LIVE</div>
                </div>
                <div style={{display: 'flex', gap: '15px'}}>
                    <button onClick={() => { setEditingEvent(null); setShowModal(true); }} style={launchBtn}>
                        <PlusCircle size={18} /> LAUNCH NEW EVENT
                    </button>
                    <button onClick={() => navigate("/home")} style={backBtn}><ArrowLeft size={16}/> Live View</button>
                </div>
            </div>

            {/* ANALYTICS STRIP */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div style={cardStyle}>
                    <div style={cardHeader}><Users size={16} /> Total Users</div>
                    <p style={numberStyle}>{stats.totalUsers.toLocaleString()}</p>
                </div>
                <div style={cardStyle}>
                    <div style={cardHeader}><Ticket size={16} color="#28a745" /> Tickets Sold</div>
                    <p style={{...numberStyle, color: '#28a745'}}>{stats.totalTicketsSold.toLocaleString()}</p>
                </div>
                <div style={cardStyle}>
                    <div style={cardHeader}><DollarSign size={16} color="#ffc107" /> Total Revenue</div>
                    <p style={{...numberStyle, color: '#ffc107'}}>
                        ${stats.totalRevenue.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* PARTNER PROPOSALS MANAGEMENT */}
            <div style={{...sectionCard, marginBottom: '40px', borderLeft: '4px solid #6f42c1'}}>
                <h2 style={sectionTitle}><Briefcase size={18} /> Partner Proposals Registry</h2>
                <div style={{overflowX: 'auto'}}>
                    <table style={tableBase}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Organizer</th>
                                <th style={thStyle}>Event/City</th>
                                <th style={thStyle}>Inquiry</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proposals.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>
                                        <strong>{p.organizerName}</strong><br/>
                                        <span style={{fontSize: '11px', color: '#888'}}>{p.businessEmail}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={catBadge}>{p.eventCategory}</span><br/>
                                        <span style={{fontSize: '12px'}}>{p.city}</span>
                                    </td>
                                    <td style={{...tdStyle, maxWidth: '300px'}}>
                                        <p style={{fontSize: '12px', margin: 0, color: '#666', lineHeight: '1.4'}}>{p.eventProposal}</p>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={statusBadge(p.status)}>{p.status}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{display: 'flex', gap: '8px'}}>
                                            <button onClick={() => handleUpdateProposalStatus(p.id, 'APPROVED')} style={actionIconBtn} title="Approve"><CheckCircle size={14} color="#28a745" /></button>
                                            <button onClick={() => handleUpdateProposalStatus(p.id, 'REJECTED')} style={actionIconBtn} title="Reject"><XCircle size={14} color="#e53e3e" /></button>
                                            <button onClick={() => handleUpdateProposalStatus(p.id, 'PENDING')} style={actionIconBtn} title="Mark Pending"><Clock size={14} color="#999" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SALES & OVERRIDES */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '40px' }}>
                <div style={sectionCard}>
                    <h2 style={sectionTitle}><TrendingUp size={18} /> Sales Velocity</h2>
                    <div style={{ width: '100%', height: '300px', minHeight: '300px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getChartData()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} allowDecimals={false} />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'}} />
                                <Line type="monotone" dataKey="sales" stroke="#6f42c1" strokeWidth={4} dot={{ r: 4, fill: '#6f42c1' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div style={{...sectionCard, border: '1px solid #feb2b2', background: '#fff5f5'}}>
                    <h2 style={sectionTitle}><ShieldAlert size={18} /> Emergency Overrides</h2>
                    <p style={{fontSize: '12px', color: '#666', marginBottom: '20px'}}>Manually force-sync database stock levels to Redis cache.</p>
                    <button onClick={handleReset} style={resetBtn}>🚨 SYNC CACHE ENGINE</button>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <VenueManager venues={venues} onRefresh={fetchData} />
            </div>

            <div style={{...sectionCard, marginBottom: '40px'}}>
                <h2 style={sectionTitle}>Live Events Management</h2>
                <EventTable data={events} onDelete={handleDeleteEvent} onEdit={handleEditEvent} />
            </div>

            <div style={sectionCard}>
                <h2 style={sectionTitle}>Registered Users</h2>
                <div style={{overflowX: 'auto'}}>
                    <table style={tableBase}>
                        <thead>
                            <tr>
                                <th style={thStyle}>ID</th>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Role</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>#{user.id}</td>
                                    <td style={tdStyle}><strong>{user.name}</strong></td>
                                    <td style={tdStyle}>{user.email}</td>
                                    <td style={tdStyle}>
                                        <span style={user.role === 'ADMIN' ? adminBadge : userBadge}>{user.role}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        {user.role !== 'ADMIN' && (
                                            <button onClick={() => handleDeleteUser(user.id)} style={deleteBtn}>Remove</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h2 style={{margin: 0, fontWeight: '900'}}>
                                {editingEvent ? "✏️ Edit Global Event" : "🚀 Launch Worldwide"}
                            </h2>
                            <button onClick={() => { setShowModal(false); setEditingEvent(null); }} style={closeX}>&times;</button>
                        </div>
                        <AdminEventForm 
                            onClose={() => { setShowModal(false); setEditingEvent(null); }} 
                            refreshData={fetchData} 
                            initialData={editingEvent} 
                            venues={venues} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// STYLES
const cardStyle = { flex: 1, padding: '30px', borderRadius: '16px', backgroundColor: '#fff', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' };
const cardHeader = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' };
const numberStyle = { fontSize: '42px', fontWeight: '900', margin: '15px 0 0 0', color: '#111' };
const sectionCard = { padding: '30px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee' };
const sectionTitle = { marginTop: 0, marginBottom: '25px', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' };
const launchBtn = { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' };
const backBtn = { display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' };
const resetBtn = { width: '100%', padding: '16px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' };
const tableBase = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 15px', textAlign: 'left', color: '#999', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' };
const tdStyle = { padding: '15px', color: '#444', fontSize: '14px' };
const adminBadge = { padding: '4px 10px', borderRadius: '20px', backgroundColor: '#f3ebff', color: '#6f42c1', fontWeight: 'bold', fontSize: '11px' };
const userBadge = { padding: '4px 10px', borderRadius: '20px', backgroundColor: '#f7f7f7', color: '#777', fontWeight: 'bold', fontSize: '11px' };
const deleteBtn = { padding: '6px 12px', background: 'none', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' };
const modalContent = { background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' };
const closeX = { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#ccc' };
const liveBadge = { fontSize: '9px', fontWeight: '900', color: '#28a745', border: '1px solid #28a745', padding: '3px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', width: 'fit-content', marginTop: '10px' };

const catBadge = { backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', color: '#666' };
const actionIconBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const statusBadge = (status) => {
    const styles = {
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    };
    if (status === 'APPROVED') return { ...styles, backgroundColor: '#d4edda', color: '#155724' };
    if (status === 'REJECTED') return { ...styles, backgroundColor: '#f8d7da', color: '#721c24' };
    return { ...styles, backgroundColor: '#fff3cd', color: '#856404' }; // PENDING
};

export default AdminDashboard;