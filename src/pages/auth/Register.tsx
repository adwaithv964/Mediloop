import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { usePlatformStore } from '../../store/usePlatformStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config/api';

export default function Register() {
  const navigate = useNavigate();
  const { config } = usePlatformStore();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'patient' | 'admin' | 'ngo' | 'hospital',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      // 1. Create in Firebase
      const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // 2. Build user object
      const newUser = {
        id: credential.user.uid,        // Use Firebase UID as the canonical ID
        email: formData.email,
        name: formData.name,
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

      // 3. Save to MongoDB (primary source of truth)
      await fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: [newUser] }),
      });

      // 4. Set user in auth store immediately so role-based routing works
      login(newUser);

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }
      toast.error(errorMessage);
    }
  };

  // Block registration if admin has disabled it
  if (!config.registrationEnabled) {
    return (
      <div className="card text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Registration Closed</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          New user registration is currently disabled by the administrator.
        </p>
        <Link to="/login" className="btn btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            required
            className="input"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="John Doe"
          />
        </div>

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
          <label className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            required
            className="input"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
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
            <option value="ngo">NGO/Hospital</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-full">
          <UserPlus size={18} />
          <span>Create Account</span>
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
