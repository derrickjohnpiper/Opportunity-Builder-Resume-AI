const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// VITE_API_URL is injected at build time via environment variables.
// - For GitHub Pages builds: set to "https://opportunity-builder-resume-ai.onrender.com/api"
// - For Render (same-domain builds): leave unset → falls back to "/api"
// - For local dev: always uses localhost:8001
const envApiUrl = import.meta.env.VITE_API_URL;

const API_BASE_URL = isLocal ? "http://localhost:8001/api" : (envApiUrl || "/api");

export default API_BASE_URL;
