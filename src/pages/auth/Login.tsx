import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import toast from 'react-hot-toast';
import { generateId } from '../../utils/helpers';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'patient' as 'patient' | 'admin' | 'ngo' | 'hospital',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // For demo purposes, create/login user directly
      // In production, use Firebase Authentication
      const existingUser = await db.users
        .where('email')
        .equals(formData.email)
        .first();

      if (existingUser) {
        login(existingUser);
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        // Create new user for demo
        const newUser = {
          id: generateId('user-'),
          email: formData.email,
          name: formData.email.split('@')[0],
          role: formData.role,
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
        login(newUser);
        toast.success('Account created and logged in!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
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
                role: e.target.value as any,
              })
            }
          >
            <option value="patient">Patient</option>
            <option value="ngo">NGO</option>
            <option value="hospital">Hospital</option>
            <option value="admin">Admin</option>
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
