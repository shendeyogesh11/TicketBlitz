// This file holds shared helper functions for the whole app

export const getUserRoleFromToken = () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return null;
  
    try {
      // 1. Decode the Base64 token
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      
      const payload = JSON.parse(jsonPayload);
      
      // 2. Check all common places for the Role
      const roleData = payload.role || payload.roles || payload.authorities;
      
      // 3. Return the string (e.g., "ADMIN")
      if (Array.isArray(roleData)) {
          return roleData[0];
      }
      return roleData; 
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  };