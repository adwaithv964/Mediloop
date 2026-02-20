import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { db } from '../../db';
import toast from 'react-hot-toast';
import { generateId } from '../../utils/helpers';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function Register() {
  const navigate = useNavigate();
  // const { login } = useAuthStore(); // Unused
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
      // 1. Check if user already exists in local DB (optional, but good for consistency)
      const existingUser = await db.users
        .where('email')
        .equals(formData.email)
        .first();

      if (existingUser) {
        toast.error('Email already registered');
        return;
      }

      // 2. Create in Firebase
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // 3. Create in Local DB
      const newUser = {
        id: generateId('user-'), // Use local ID generation for now to keep compatibility
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

      await db.users.add(newUser);

      // 4. Update Store (Login logic handles this via listener, but we can optimistically set)
      // login(newUser); // The listener in useAuthStore should handle this

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
