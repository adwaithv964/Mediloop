import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ShieldAlert } from 'lucide-react';
import { db } from '../../db';
import toast from 'react-hot-toast';
import { generateId } from '../../utils/helpers';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function AdminRegister() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        secretKey: '', // Simple protection
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        // Optional: Secret key check for extra safety in dev
        // if (formData.secretKey !== 'mediloop_admin') {
        //   toast.error('Invalid Secret Key');
        //   return;
        // }

        try {
            const existingUser = await db.users.where('email').equals(formData.email).first();
            if (existingUser) {
                toast.error('Email already registered');
                return;
            }

            // Create in Firebase
            await createUserWithEmailAndPassword(auth, formData.email, formData.password);

            // Create in Local DB explicitly as ADMIN
            const newUser = {
                id: generateId('user-'),
                email: formData.email,
                name: formData.name,
                role: 'admin' as const, // Forced Admin Role
                createdAt: new Date(),
                updatedAt: new Date(),
                preferences: {
                    theme: 'light' as const,
                    elderlyMode: false,
                    notificationsEnabled: true,
                    voiceEnabled: false,
                    language: 'en',
                },
            };

            await db.users.add(newUser);

            // Sign out immediately to force login via Admin Login page
            await signOut(auth);

            toast.success('Admin Account Created! Please Login.');
            navigate('/admin/login');
        } catch (error: any) {
            console.error('Admin Registration error:', error);
            toast.error(error.message || 'Registration failed');
        }
    };

    return (
        <div className="card max-w-md mx-auto mt-10 border-red-100 dark:border-red-900 border-2">
            <div className="text-center mb-8">
                <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">Admin Registration</h2>
                <p className="text-gray-600 dark:text-gray-400">Internal Use Only</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                        type="text"
                        required
                        className="input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="System Admin"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                        type="email"
                        required
                        className="input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password</label>
                    <input
                        type="password"
                        required
                        className="input"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                    />
                </div>

                <button type="submit" className="btn bg-red-600 hover:bg-red-700 text-white w-full">
                    <UserPlus size={18} />
                    <span>Create Admin Account</span>
                </button>
            </form>

            <p className="text-center mt-4 text-sm text-gray-600">
                <Link to="/admin/login" className="text-red-600 hover:text-red-700">
                    Back to Admin Login
                </Link>
            </p>
        </div>
    );
}
