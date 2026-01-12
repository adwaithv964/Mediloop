import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { MapPin, Save, User, Phone, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../../config/api';

export default function NGOProfile() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        location: { lat: 0, lng: 0 }
    });

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/api/ngos/${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    name: data.name,
                    email: data.email,
                    phone: data.phone || '',
                    address: data.address || '',
                    location: data.location || { lat: 0, lng: 0 }
                });
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/ngos`, {
                method: 'POST', // Using POST as upsert
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user?.id,
                    ...formData,
                    verified: true // Maintain verification
                })
            });

            if (response.ok) {
                toast.success('Profile updated successfully');
            } else {
                toast.error('Failed to update profile');
            }
        } catch (error) {
            toast.error('Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        toast.loading('Getting your location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                toast.dismiss();
                setFormData({
                    ...formData,
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                });
                toast.success('Location updated! Click Saved to persist.');
            },
            (error) => {
                toast.dismiss();
                toast.error('Unable to retrieve your location');
                console.error(error);
            }
        );
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Organization Profile
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your NGO details and location
                </p>
            </div>

            <div className="card space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{formData.name || 'NGO Name'}</h2>
                        <p className="text-gray-500">{formData.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Organization Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input pl-10 w-full"
                                placeholder="NGO Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="input pl-10 w-full"
                                placeholder="+91 99999 99999"
                            />
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Address
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="input pl-10 w-full"
                                placeholder="Full Address"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Location Settings</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                        <div className="flex items-start">
                            <Navigation className="text-blue-600 dark:text-blue-400 mt-1 mr-3" size={20} />
                            <div>
                                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                    Current Coordinates
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                    Lat: {formData.location.lat.toFixed(6)}, Lng: {formData.location.lng.toFixed(6)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="btn btn-secondary w-full sm:w-auto"
                    >
                        <Navigation size={18} />
                        <span>Update Location from Device</span>
                    </button>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        <Save size={18} />
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
