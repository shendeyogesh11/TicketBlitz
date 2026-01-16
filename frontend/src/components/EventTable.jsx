import React from 'react';

/**
 * Implements strict type guarding to prevent "data.map is not a function" errors.
 */
function EventTable({ data, onEdit, onDelete }) {
    
    // Logic to determine if an event is in the past or future
    const getEventStatus = (eventDate) => {
        if (!eventDate) return { text: "TBD", color: "#999", bg: "#f5f5f5", border: "#eee" };
        
        const now = new Date();
        const eventTime = new Date(eventDate);

        if (now > eventTime) {
            return { 
                text: "Completed", 
                color: "#e53e3e", 
                bg: "#fff5f5", 
                border: "#feb2b2" 
            }; 
        } else {
            return { 
                text: "Live", 
                color: "#059669", 
                bg: "#ecfdf5", 
                border: "#a7f3d0" 
            }; 
        }
    };

    // --- TYPE GUARD: Ensures 'data' is always an array before mapping ---
    const eventsArray = Array.isArray(data) ? data : [];

    return (
        <div style={tableContainer}>
            <table style={tableStyle}>
                <thead>
                    <tr style={headerRow}>
                        <th style={thStyle}>EVENT</th>
                        <th style={thStyle}>CATEGORY</th>
                        <th style={thStyle}>LOCATION</th>
                        <th style={thStyle}>DATE</th>
                        <th style={thStyle}>PRICE RANGE</th>
                        <th style={thStyle}>STATUS</th>
                        <th style={{...thStyle, textAlign: 'center'}}>ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {eventsArray.length > 0 ? (
                        eventsArray.map((event) => {
                            const status = getEventStatus(event.eventDate);
                            
                            // Safe calculation for price range
                            const prices = event.ticketTiers?.map(t => t.price) || [0];
                            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

                            return (
                                <tr key={event.id} style={rowStyle}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: '700', color: '#111' }}>{event.title}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={categoryBadge}>{event.category}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        {event.venue ? (
                                            <span>{event.venue.name}, <small style={{color: '#666'}}>{event.venue.city}</small></span>
                                        ) : "Worldwide Pool"}
                                    </td>
                                    <td style={tdStyle}>
                                        {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : "Date TBD"}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{fontWeight: '600'}}>${minPrice} - ${maxPrice}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            ...statusBadgeBase,
                                            color: status.color,
                                            backgroundColor: status.bg,
                                            border: `1px solid ${status.border}`
                                        }}>
                                            {status.text}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                                onClick={() => onEdit(event)} 
                                                style={editBtn}
                                                title="Edit Event Configuration"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => onDelete(event.id)} 
                                                style={deleteBtn}
                                                title="Permanently Purge Event & Orders"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="7" style={{...tdStyle, textAlign: 'center', color: '#888', padding: '60px'}}>
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
                                    <span style={{fontSize: '24px'}}>📊</span>
                                    <span>No events available to display.</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// --- High-Fidelity Styles ---
const tableContainer = { marginTop: '10px', overflowX: 'auto', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', fontSize: '14px' };
const headerRow = { backgroundColor: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #f1f1f1' };
const thStyle = { padding: '16px 20px', color: '#6b7280', fontWeight: '600', fontSize: '12px', letterSpacing: '0.05em' };
const tdStyle = { padding: '18px 20px', borderBottom: '1px solid #f3f4f6', color: '#374151', verticalAlign: 'middle' };
const rowStyle = { transition: 'background 0.2s ease' };
const categoryBadge = { padding: '4px 12px', background: '#f3f4f6', color: '#4b5563', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' };
const statusBadgeBase = { padding: '5px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '11px', display: 'inline-block', textAlign: 'center', minWidth: '80px' };
const editBtn = { padding: '6px 12px', backgroundColor: '#fff', color: '#4f46e5', border: '1px solid #e0e7ff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' };
const deleteBtn = { padding: '6px 12px', backgroundColor: '#fff', color: '#e53e3e', border: '1px solid #fee2e2', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' };

export default EventTable;