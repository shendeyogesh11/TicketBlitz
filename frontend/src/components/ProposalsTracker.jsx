import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, FileText, MapPin, RefreshCcw, Loader2 } from 'lucide-react';

/**
 * TOP 1% G PROPOSAL TRACKER:
 * Weaponized for real-time status synchronization and secure identity fetching.
 */
export default function ProposalsTracker() {
    const [myProposals, setMyProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Retrieve Identity from the Secure Bridge
    const userEmail = localStorage.getItem("user_email");
    const token = localStorage.getItem("jwt_token");

    /**
     * SECURE REGISTRY FETCH:
     * Synchronizes the UI with the backend source of truth using current session credentials.
     */
    const fetchMyProposals = useCallback(async () => {
        // Prevent unauthorized calls if the session is not locked in
        if (!token || !userEmail) {
            console.warn("Tracker: Missing Auth Handshake (Token/Email)");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            /**
             * IDENTITY FILTERING LOGIC:
             * Queries the backend for proposals associated with the logged-in email.
             */
            const res = await axios.get(
                `http://localhost:8080/api/partners/my-proposals?email=${userEmail}`, 
                config
            );
            
            setMyProposals(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Proposal sync failed:", err.response?.status === 403 ? "Handshake Blocked" : err.message);
            setError("Unable to sync registry. Please check your secure connection.");
        } finally {
            setIsLoading(false);
        }
    }, [userEmail, token]);

    // ATOMIC SYNC: Auto-fetch on mount
    useEffect(() => {
        fetchMyProposals();
    }, [fetchMyProposals]);

    return (
        <div style={trackerContainer}>
            <div style={headerRow}>
                <h3 style={sectionTitle}><FileText size={18} /> My Event Proposals</h3>
                <button onClick={fetchMyProposals} style={refreshBtn} disabled={isLoading}>
                    {isLoading ? <Loader2 size={14} style={{animation: 'spin 1s linear infinite'}} /> : <RefreshCcw size={14} />}
                </button>
            </div>
            
            {isLoading && (
                <div style={statusMessage}>⚡ Synchronizing with Global Registry...</div>
            )}

            {!isLoading && error && (
                <div style={{...statusMessage, color: '#e53e3e'}}>{error}</div>
            )}

            {!isLoading && !error && myProposals.length === 0 && (
                <div style={emptyState}>
                    <p style={{margin: 0, fontWeight: '700'}}>No Proposals Found</p>
                    <p style={{margin: '5px 0 0 0', fontSize: '12px', opacity: 0.7}}>Submissions for {userEmail} will appear here.</p>
                </div>
            )}

            {!isLoading && myProposals.length > 0 && (
                <div style={listWrapper}>
                    {myProposals.map(p => (
                        <div key={p.id} style={proposalCard}>
                            <div style={cardMain}>
                                <p style={eventTitle}>{p.organizerName} — {p.eventCategory}</p>
                                <p style={locationText}><MapPin size={12} /> {p.city || "Global Location"}</p>
                            </div>
                            <div style={statusWrapper(p.status)}>
                                {p.status === 'APPROVED' && <CheckCircle size={14} />}
                                {p.status === 'REJECTED' && <XCircle size={14} />}
                                {p.status === 'PENDING' && <Clock size={14} />}
                                <span style={{marginLeft: '6px'}}>{p.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- STYLES: Production Standard ---
const trackerContainer = { marginTop: '40px', textAlign: 'left', animation: 'fadeIn 0.5s ease' };
const headerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const sectionTitle = { fontSize: '18px', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 };
const refreshBtn = { background: 'none', border: '1px solid #eee', padding: '8px', borderRadius: '10px', cursor: 'pointer', color: '#999', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const statusMessage = { padding: '20px', textAlign: 'center', color: '#6f42c1', fontSize: '13px', fontWeight: '600' };
const emptyState = { padding: '40px 20px', border: '2px dashed #eee', borderRadius: '24px', textAlign: 'center', color: '#999' };
const listWrapper = { display: 'flex', flexDirection: 'column', gap: '12px' };
const proposalCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' };
const cardMain = { flex: 1 };
const eventTitle = { margin: 0, fontWeight: '800', fontSize: '14px', color: '#111' };
const locationText = { margin: '4px 0 0 0', fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' };

const statusWrapper = (status) => ({
    display: 'flex', alignItems: 'center', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase',
    backgroundColor: status === 'APPROVED' ? '#f0fff4' : status === 'REJECTED' ? '#fff5f5' : '#fefcbf',
    color: status === 'APPROVED' ? '#2f855a' : status === 'REJECTED' ? '#c53030' : '#b7791f'
});