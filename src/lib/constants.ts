/**
 * HarborNex - Centralized Configuration
 * 
 * ALL URLs, settings, and branding are defined here.
 * NOTHING is hardcoded in components or API routes.
 * 
 * To change domains: just update this one file!
 */

// Determine environment
const isDev = process.env.NODE_ENV === 'development';

/**
 * Brand Configuration
 */
export const BRAND = {
    name: 'HarborNex',
    tagline: 'Turn any computer into your cloud',
    description: 'Decentralized cloud platform powered by the Dirac resource system',

    // Product names
    cloud: 'NexCloud',      // Dashboard
    flow: 'NexFlow',        // Desktop GUI
    cli: 'nexflow',         // CLI command name

    // Config file names
    configFile: 'nexflow.json',

    // Emojis/Icons
    logo: '⚓',
    chunk: '🖥️',
    pod: '🌐',
} as const;

/**
 * URL Configuration
 * 
 * In development: localhost
 * In production: harbornex.dev
 */
export const URLS = {
    // Main domain
    domain: isDev ? 'localhost:3000' : 'harbornex.dev',

    // Full URLs
    app: isDev ? 'http://localhost:3000' : 'https://app.harbornex.dev',
    api: isDev ? 'http://localhost:3000/api' : 'https://app.harbornex.dev/api',
    landing: isDev ? 'http://localhost:3000' : 'https://harbornex.dev',
    docs: isDev ? 'http://localhost:3000/docs' : 'https://docs.harbornex.dev',

    // Download URLs
    download: {
        windows: 'https://harbornex.dev/download/nexflow-windows.zip',
        mac: 'https://harbornex.dev/download/nexflow-mac.zip',
        linux: 'https://harbornex.dev/download/nexflow-linux.tar.gz',
    },

    // OAuth Callbacks
    oauth: {
        github: isDev
            ? 'http://localhost:3000/api/auth/callback/github'
            : 'https://app.harbornex.dev/api/auth/callback/github',
        google: isDev
            ? 'http://localhost:3000/api/auth/callback/google'
            : 'https://app.harbornex.dev/api/auth/callback/google',
    },

    // Social/External
    github: 'https://github.com/harbornex',
    twitter: 'https://twitter.com/harbornex',
    discord: 'https://discord.gg/harbornex',
} as const;

/**
 * API Configuration
 */
export const API = {
    // Endpoints
    endpoints: {
        chunks: '/api/chunks',
        projects: '/api/projects',
        deploy: '/api/deploy',
        auth: '/api/auth',
    },

    // Headers
    headers: {
        apiKey: 'x-api-key',
        contentType: 'application/json',
    },

    // Timeouts (ms)
    timeout: 30000,
    heartbeatInterval: 30000,
} as const;

/**
 * Dirac System Configuration
 */
export const DIRACS = {
    // Conversion rates (machine to human-readable)
    rates: {
        dc: { per: 10, unit: 'CPU core', description: '10dc ≈ 1 CPU core' },
        dm: { per: 16, unit: 'MB RAM', description: '16dm ≈ 256MB RAM' },
        ds: { per: 50, unit: 'GB disk', description: '50ds ≈ 5GB disk' },
        db: { per: 10, unit: 'Mbps', description: '10db ≈ 5Mbps' },
    },

    // Limits
    minTotal: 1,
    maxTotal: 100,

    // Colors for UI
    colors: {
        dc: '#f97316', // orange
        dm: '#22c55e', // green
        ds: '#3b82f6', // blue
        db: '#a855f7', // purple
    },
} as const;

/**
 * Feature Flags
 * 
 * Toggle features on/off without code changes
 */
export const FEATURES = {
    githubOAuth: true,
    googleOAuth: false,       // Enable when configured
    githubWebhook: true,
    autoDeployOnPush: true,
    sandboxing: false,        // Enable when implemented
    billing: false,           // Enable for paid features
    analytics: false,         // Enable for usage tracking
} as const;

/**
 * Helper function: Get full API URL
 */
export function getApiUrl(endpoint: string): string {
    return `${URLS.api}${endpoint}`;
}

/**
 * Helper function: Get full app URL
 */
export function getAppUrl(path: string = ''): string {
    return `${URLS.app}${path}`;
}
