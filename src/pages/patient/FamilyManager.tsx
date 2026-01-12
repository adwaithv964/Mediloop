import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { FamilyService } from '../../services/familyService';
import { User } from '../../types';
import { Users, UserPlus, Shield, Copy, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const FamilyManager = () => {
    const { user, updateUser } = useAuthStore();
    const [dependents, setDependents] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<'dependents' | 'caregivers'>('dependents');
    const [linkCode, setLinkCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState(user?.familyCode || 'Generating...');

    useEffect(() => {
        // If user doesn't have a family code yet, we might need to fetch/generate it 
        if (user?.id) {
            if (!user.familyCode) {
                refreshProfile();
            }
            loadDependents();
        }
    }, [user?.id, user?.familyCode]);

    const refreshProfile = async () => {
        if (!user?.id) return;
        try {
            const updatedUser = await FamilyService.getProfile(user.id);
            if (updatedUser) {
                updateUser(updatedUser);
                if (updatedUser.familyCode) {
                    setGeneratedCode(updatedUser.familyCode);
                    // toast.success('Family Code generated');
                }
            }
        } catch (error) {
            console.error('Failed to refresh profile', error);
        }
    };

    const loadDependents = async () => {
        if (!user?.id) return;
        try {
            const data = await FamilyService.getDependents(user.id);
            setDependents(data);
        } catch (error) {
            console.error('Failed to load dependents', error);
        }
    };

    const handleLinkAccount = async () => {
        if (!linkCode.trim() || !user?.id) return;
        setLoading(true);
        try {
            const result = await FamilyService.linkAccount(user.id, linkCode);
            if (result.success) {
                toast.success(result.message);
                setLinkCode('');
                // Update local user state if needed (e.g. to show new dependent count)
                loadDependents();
                // Refresh full user profile if backend returned it? 
                // For now just re-fetch dependents
            } else {
                toast.error(result.message || 'Failed to link account');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (user?.familyCode) {
            navigator.clipboard.writeText(user.familyCode);
            toast.success('Family Code copied!');
        } else {
            toast.error('No code available');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family & Caregivers</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage linked accounts and shared access</p>
                </div>
            </div>

            {/* Family Code Section */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Your Family Code</h2>
                        <p className="opacity-90 text-sm mb-4">Share this code with a family member to let them manage your schedule.</p>
                        <div className="flex items-center space-x-2 bg-white/10 p-2 rounded-lg backdrop-blur-sm w-fit">
                            <code className="text-2xl font-mono tracking-wider font-bold">{user?.familyCode || '-----'}</code>
                            <button onClick={copyCode} className="p-2 hover:bg-white/20 rounded-md transition-colors">
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <Shield className="w-24 h-24 opacity-20" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('dependents')}
                    className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'dependents'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    My Dependents
                    {activeTab === 'dependents' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('caregivers')}
                    className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'caregivers'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    My Caregivers
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Link Account Form */}
                <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-fit">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <UserPlus className="w-5 h-5 mr-2 text-green-500" />
                        Add {activeTab === 'dependents' ? 'Dependent' : 'Caregiver'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Enter Family Code
                            </label>
                            <input
                                type="text"
                                value={linkCode}
                                onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                                placeholder="e.g. A1B2C3"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase font-mono"
                            />
                        </div>
                        <button
                            onClick={handleLinkAccount}
                            disabled={loading || !linkCode}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Linking...' : 'Link Account'}
                        </button>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            By linking, you grant access to manage medicine schedules and receive alerts.
                        </p>
                    </div>
                </div>

                {/* List Section */}
                <div className="md:col-span-2 space-y-4">
                    {activeTab === 'dependents' ? (
                        // Dependents List
                        <div className="space-y-4">
                            {dependents.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No dependents linked yet.</p>
                                </div>
                            ) : (
                                dependents.map(dep => (
                                    <div key={dep.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center group hover:shadow-md transition-all">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{dep.name || 'Unnamed User'}</h4>
                                            <p className="text-sm text-gray-500">{dep.email || dep.familyCode}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                                                View Dashboard
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // Caregivers List (Mock for now, as we don't have an endpoint to list MY caregivers, only dependents)
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 flex items-start">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Caregiver Access</h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                    Caregivers listed here can view your medicines and receive notifications if you miss a dose.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyManager;
