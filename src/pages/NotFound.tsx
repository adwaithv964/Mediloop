import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <AlertCircle className="w-20 h-20 text-gray-400 mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                The page you are looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link to="/dashboard" className="btn btn-primary">
                <Home size={20} className="mr-2" />
                Back to Dashboard
            </Link>
        </div>
    );
}
