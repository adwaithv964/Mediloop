import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { db } from '../../db';
import toast from 'react-hot-toast';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // 1. Login with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);

            // 2. Check role in local DB
            const user = await db.users.where('email').equals(userCredential.user.email!).first();

            if (!user || user.role !== 'admin') {
                // Not an admin
                await signOut(auth);
                toast.error('Access Denied: Admin privileges required.');
                return;
            }

            toast.success('Welcome back, Admin!');
            navigate('/admin');
        } catch (error: any) {
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

            <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                Need to set up a new admin?{' '}
                <Link
                    to="/admin/register"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                >
                    Register Admin
                </Link>
            </p>
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
