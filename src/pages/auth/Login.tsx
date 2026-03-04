import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import toast from 'react-hot-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config/api';
import type { User } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'patient' as 'patient' | 'ngo' | 'hospital',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Sign in with Firebase
      const credential = await signInWithEmailAndPassword(auth, formData.email, formData.password);

      // 2. Fetch user profile from MongoDB (source of truth for role)
      let mongoUser: User | null = null;
      try {
        const res = await fetch(`${API_URL}/api/sync/user-by-email?email=${encodeURIComponent(formData.email)}`);
        if (res.ok) {
          mongoUser = await res.json();
        }
      } catch {
        // Backend unreachable, will fall back to Firebase UID below
      }

      if (mongoUser) {
        // Validate selected role matches stored role
        // Allow 'ngo' selection to match 'hospital' too (both use the NGO/Hospital option)
        const selectedRole = formData.role;
        const actualRole = mongoUser.role;
        const roleMatch =
          actualRole === selectedRole ||
          (selectedRole === 'ngo' && (actualRole === 'ngo' || actualRole === 'hospital'));

        if (!roleMatch) {
          toast.error(`This account is registered as "${actualRole}". Please select the correct role.`);
          setIsLoading(false);
          return;
        }

        // Normalise dates (API returns strings)
        const userWithDates: User = {
          ...mongoUser,
          role: actualRole,
          createdAt: new Date(mongoUser.createdAt as any),
          updatedAt: new Date((mongoUser as any).updatedAt || mongoUser.createdAt),
        };

        // Set user immediately — no waiting for onAuthStateChanged
        login(userWithDates);
        toast.success('Login successful!');

        // Route based on actual role from MongoDB
        if ((actualRole as string) === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        // MongoDB not reachable — build minimal user from Firebase + selected role
        const fallbackUser: User = {
          id: credential.user.uid,
          email: credential.user.email!,
          name: credential.user.displayName || formData.email.split('@')[0],
          role: formData.role,
          createdAt: new Date(credential.user.metadata.creationTime || Date.now()),
          updatedAt: new Date(),
          preferences: {
            theme: 'light',
            elderlyMode: false,
            notificationsEnabled: true,
            voiceEnabled: false,
            language: 'en',
          },
        };
        login(fallbackUser);
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found. Please Sign Up first.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            required
            className="input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
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
          <label className="block text-sm font-medium mb-2">Role</label>
          <select
            className="input"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
          >
            <option value="patient">Patient</option>
            <option value="ngo">NGO / Hospital</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
          <LogIn size={18} />
          <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
