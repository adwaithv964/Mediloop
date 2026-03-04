import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { db } from '../../db';
import toast from 'react-hot-toast';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuthStore, setAdminLoginFlag } from '../../store/useAuthStore';
import { API_URL } from '../../config/api';
import type { User } from '../../types';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Signal to useAuthStore.initialize() that admin login is underway.
            // This stops onAuthStateChanged from racing ahead and overwriting the role.
            setAdminLoginFlag(true);

            // 1. Login with Firebase (triggers onAuthStateChanged, which will be blocked by flag above)
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const firebaseToken = await userCredential.user.getIdToken();

            // 2. Check role — try local Dexie first, then backend as fallback
            let isAdmin = false;
            const localUser = await db.users.where('email').equals(userCredential.user.email!).first();

            if (localUser) {
                isAdmin = localUser.role === 'admin';
            } else {
                // Fallback: verify against backend (handles cases where local DB was cleared)
                try {
                    const isLocal =
                        window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1';
                    const base = isLocal
                        ? 'http://localhost:5000'
                        : 'https://mediloop-backend.onrender.com';

                    const res = await fetch(`${base}/api/admin/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${firebaseToken}`,
                        },
                    });
                    if (res.ok) {
                        isAdmin = true;
                    }
                } catch {
                    // Backend unreachable — fall through to denial
                }
            }

            if (!isAdmin) {
                await signOut(auth);
                toast.error('Access Denied: Admin privileges required.');
                return;
            }

            // Build admin user object with role: 'admin' (source of truth for this session)
            // Try MongoDB first, fall back to local + Firebase data
            let adminUser: User;
            try {
                const res = await fetch(`${API_URL}/api/sync/user-by-email?email=${encodeURIComponent(formData.email)}`);
                if (res.ok) {
                    const mongoUser = await res.json();
                    // Always enforce admin role — MongoDB record may be stale
                    adminUser = { ...mongoUser, role: 'admin' as const };
                    // Patch MongoDB if the role was wrong
                    if (mongoUser.role !== 'admin') {
                        fetch(`${API_URL}/api/sync`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ users: [adminUser] }),
                        }).catch(() => {/* non-critical */ });
                    }
                } else {
                    throw new Error('not in mongo');
                }
            } catch {
                // Fallback: build from Dexie local data + Firebase
                adminUser = {
                    id: userCredential.user.uid,
                    email: userCredential.user.email!,
                    name: localUser?.name || userCredential.user.displayName || formData.email.split('@')[0],
                    role: 'admin' as const,
                    createdAt: new Date(userCredential.user.metadata.creationTime || Date.now()),
                    updatedAt: new Date(),
                    preferences: localUser?.preferences || {
                        theme: 'light' as const,
                        elderlyMode: false,
                        notificationsEnabled: true,
                        voiceEnabled: false,
                        language: 'en',
                    },
                };
            }

            // Set user in store immediately with role: 'admin', then clear the flag
            login(adminUser);
            setAdminLoginFlag(false);

            toast.success('Welcome back, Admin!');
            navigate('/admin');
        } catch (error: any) {
            // Always clear the flag on error so normal logins aren't blocked
            setAdminLoginFlag(false);
            console.error('Admin Login error:', error);
            toast.error('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="card max-w-md mx-auto mt-10">
            <div className="text-center mb-8">
                <ShieldCheck className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Admin Portal</h2>
                <p className="text-gray-600 dark:text-gray-400">Restricted Access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Admin Email</label>
                    <input
                        type="email"
                        required
                        className="input"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="admin@mediloop.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                        type="password"
                        required
                        className="input"
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                    />
                </div>

                <button type="submit" className="btn btn-primary w-full">
                    <ShieldCheck size={18} />
                    <span>Login to Console</span>
                </button>
            </form>

            <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                <Link
                    to="/login"
                    className="text-gray-500 hover:text-gray-700"
                >
                    ← Back to Main App
                </Link>
            </p>
        </div>
    );
}
