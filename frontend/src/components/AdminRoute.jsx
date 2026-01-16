import { Navigate } from 'react-router-dom';
import { getUserRoleFromToken } from '../utils/authUtils'; 

const AdminRoute = ({ children }) => {
    const role = getUserRoleFromToken();

    // Strict Check: Matches what your Backend sends
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
        return children; // Access Granted
    } else {
        return <Navigate to="/" replace />; // Access Denied -> Back to Home
    }
};

export default AdminRoute;