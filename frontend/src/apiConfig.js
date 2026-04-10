const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// If local, use the default port 8001
// If production, you can set this to your Render backend URL
const productionUrl = ""; 

const API_BASE_URL = isLocal ? "http://localhost:8001/api" : (productionUrl || "/api");

export default API_BASE_URL;
