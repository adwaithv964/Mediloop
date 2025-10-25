import { Outlet } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-12 h-12 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Mediloop
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Medicine Management & Donation Platform
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
