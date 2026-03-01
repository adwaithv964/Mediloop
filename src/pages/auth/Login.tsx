import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { db } from '../../db';

export default function Login() {
  const navigate = useNavigate();
  // const { login } = useAuthStore(); // Unused
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'patient' as 'patient' | 'admin' | 'ngo' | 'hospital',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Check local DB first to avoid unnecessary Firebase 400 errors and validate role
      const existingUser = await db.users
        .where('email')
        .equals(formData.email)
        .first();

      if (!existingUser) {
        toast.error('User not found. Please register.');
        return;
      }

      if (existingUser.role !== formData.role) {
        toast.error('Invalid role selected for this account.');
        return;
      }

      // 2. Validate password with Firebase
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. If this is your first time, please Sign Up.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Please register.';
      }
      toast.error(errorMessage);
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
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
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
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <select
            className="input"
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as UserRole,
              })
            }
          >
            <option value="patient">Patient</option>
            <option value="ngo">NGO/Hospital</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-full">
          <LogIn size={18} />
          <span>Sign In</span>
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Sign Up
        </Link>
      </p>

    </div>
  );
}
