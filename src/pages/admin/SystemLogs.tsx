import { useEffect, useState } from 'react';
import {
    Terminal,
    Search,
    Filter,
    AlertTriangle,
    Info,
    XOctagon,
    RefreshCw,
    Calendar,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

interface Log {
    _id: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    meta: any;
    userId?: {
        _id: string;
        name: string;
        email: string;
    };
    timestamp: string;
}

export default function SystemLogs() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        level: '',
        startDate: '',
        endDate: ''
    });

    const fetchLogs = async (pageNum = 1) => {
        try {
            setLoading(pageNum === 1);
            setRefreshing(pageNum > 1 || refreshing);

            // In a real app we'd use the configured base URL
            const response = await axios.get('http://localhost:5000/api/admin/logs', {
                params: {
                    page: pageNum,
                    limit: 20,
                    ...filters
                },
                withCredentials: true
            });

            setLogs(response.data.logs);
            setTotalPages(response.data.totalPages);
            setPage(response.data.currentPage);
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Failed to load system logs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [filters]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchLogs(newPage);
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case 'warn': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
            case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            case 'debug': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'info': return <Info size={16} />;
            case 'warn': return <AlertTriangle size={16} />;
            case 'error': return <XOctagon size={16} />;
            default: return <Terminal size={16} />;
        }
    };

    return (
        <div className="space-y-6 fade-in h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        System Logs
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Monitor system activities and errors
                    </p>
                </div>
                <button
                    onClick={() => fetchLogs(page)}
                    className="btn btn-secondary"
                    disabled={refreshing}
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            className="input pl-10"
                            value={filters.level}
                            onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                        >
                            <option value="">All Levels</option>
                            <option value="info">Info</option>
                            <option value="warn">Warning</option>
                            <option value="error">Error</option>
                            <option value="debug">Debug</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="date"
                            className="input pl-10"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            placeholder="Start Date"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="date"
                            className="input pl-10"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            placeholder="End Date"
                        />
                    </div>
                    <div className="flex items-center justify-end">
                        <button
                            onClick={() => setFilters({ level: '', startDate: '', endDate: '' })}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="card flex-1 overflow-hidden flex flex-col p-0">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold w-24">Level</th>
                                <th className="text-left py-3 px-4 font-semibold w-48">Timestamp</th>
                                <th className="text-left py-3 px-4 font-semibold">Message</th>
                                <th className="text-left py-3 px-4 font-semibold w-48">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">
                                        No logs found matching your filters
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 font-mono text-sm">
                                        <td className="py-3 px-4 align-top">
                                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${getLevelColor(log.level)}`}>
                                                {getLevelIcon(log.level)}
                                                <span>{log.level}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap align-top">
                                            {formatDate(new Date(log.timestamp))}
                                        </td>
                                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100 align-top">
                                            <div className="break-all">{log.message}</div>
                                            {log.meta && Object.keys(log.meta).length > 0 && (
                                                <pre className="mt-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(log.meta, null, 2)}
                                                </pre>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 align-top">
                                            {log.userId ? (
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">{log.userId.name}</span>
                                                    <span className="text-xs">{log.userId.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">System</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-white dark:bg-gray-800">
                    <div className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
