import { create } from 'zustand';
import { API_URL } from '../config/api';

export interface PlatformConfig {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    donationEnabled: boolean;
    maxUsersPerDay: number;
    maxDonationsPerUser: number;
}

interface PlatformState {
    config: PlatformConfig;
    setConfig: (config: Partial<PlatformConfig>) => void;
    loadFromServer: () => Promise<void>;
}

const STORAGE_KEY = 'mediloop_platform_config';

const DEFAULTS: PlatformConfig = {
    maintenanceMode: false,
    registrationEnabled: true,
    donationEnabled: true,
    maxUsersPerDay: 100,
    maxDonationsPerUser: 10,
};

/** Read persisted config from localStorage (falls back to DEFAULTS). */
function readStored(): PlatformConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch { /* ignore parse errors */ }
    return { ...DEFAULTS };
}

/** Write config to localStorage so other tabs can pick it up. */
function writeStored(cfg: PlatformConfig) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch { /* ignore quota errors */ }
}

export const usePlatformStore = create<PlatformState>()((set, get) => ({
    // Initialise from localStorage so the patient tab already has the latest
    // config even before the server responds.
    config: readStored(),

    setConfig: (updates) => {
        const next = { ...get().config, ...updates };
        writeStored(next);
        set({ config: next });
    },

    loadFromServer: async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/settings`);
            if (!res.ok) return;
            const data = await res.json();
            // Only trust server values when the admin has explicitly saved them
            // this server session (_persisted: true). Otherwise keep localStorage.
            if (data?.platform && data._persisted === true) {
                const next = { ...DEFAULTS, ...data.platform };
                writeStored(next);
                set({ config: next });
            }
            // If _persisted is false (fresh server start / server doesn't persist),
            // localStorage remains the source of truth — no override.
        } catch {
            // Server unreachable — stay on localStorage / safe defaults
        }
    },
}));

/**
 * Cross-tab sync: when the admin tab writes to localStorage, every other
 * open tab (patient, NGO, etc.) receives a 'storage' event and immediately
 * applies the new platform config — no page refresh required.
 */
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
            try {
                const incoming = JSON.parse(e.newValue) as Partial<PlatformConfig>;
                usePlatformStore.setState({ config: { ...DEFAULTS, ...incoming } });
            } catch { /* ignore */ }
        }
    });
}
