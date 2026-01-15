import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Dashboard() {
    const [rfps, setRfps] = useState([]);

    useEffect(() => {
        fetchRFPs();
    }, []);

    const fetchRFPs = async () => {
        try {
            const res = await api.get('/rfps');
            setRfps(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft': return 'bg-slate-100 text-slate-700';
            case 'Sent': return 'bg-blue-100 text-blue-700';
            case 'Closed': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Overview of your procurement activities</p>
                </div>
                <Link
                    to="/create-rfp"
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    New RFP
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rfps.length === 0 && (
                    <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 text-lg">No RFPs found yet.</p>
                        <Link to="/create-rfp" className="mt-4 inline-block text-blue-600 font-medium hover:underline">Create your first one &rarr;</Link>
                    </div>
                )}

                {rfps.map(rfp => (
                    <div key={rfp._id} className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rfp.status)}`}>
                                    {rfp.status}
                                </span>
                                <div className="flex items-center space-x-2">
                                    {rfp.unreadProposalsCount > 0 && (
                                        <span className="flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                                            {rfp.unreadProposalsCount} New
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400">
                                        {new Date(rfp.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                {rfp.title}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-3">
                                {rfp.description}
                            </p>

                            <div className="flex items-center text-sm text-slate-600">
                                <span className="font-medium mr-2">Budget:</span>
                                {rfp.currency} {rfp.budget.toLocaleString()}
                            </div>
                            <div className="flex items-center text-sm text-slate-600 mt-1">
                                <span className="font-medium mr-2">Vendors:</span>
                                {rfp.selectedVendors ? rfp.selectedVendors.length : 0} invited
                            </div>
                        </div>

                        <Link
                            to={`/rfp/${rfp._id}`}
                            className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm font-medium text-blue-600 hover:bg-slate-100 transition-colors rounded-b-xl flex items-center justify-between"
                        >
                            View Details
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
