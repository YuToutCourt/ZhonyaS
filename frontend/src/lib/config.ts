// Configuration de l'API Backend
// Pour développement local, utilise localhost
// Pour accès externe, utilise ton IP publique avec le port redirigé

// Développement local : http://localhost:5000
// Accès externe : http://88.162.107.181:49154 (port 49154 → redirige vers 5000)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Pour activer l'accès externe, crée un fichier .env.local avec :
// NEXT_PUBLIC_API_URL=http://88.162.107.181:49154

export default API_URL

