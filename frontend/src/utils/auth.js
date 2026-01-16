// Function to check if a JWT token is expired
export const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        // JWTs are Base64 encoded. The middle part contains the "payload"
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000; // Convert to seconds
        
        return payload.exp < currentTime;
    } catch (e) {
        return true; // If decoding fails, assume it's invalid/expired
    }
};