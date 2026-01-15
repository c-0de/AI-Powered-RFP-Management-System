import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

function ComparisonView() {
    const { id } = useParams();
    const [rfp, setRfp] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [recommendation, setRecommendation] = useState('');
    const [loadingComparison, setLoadingComparison] = useState(false);
    const [selectedVendors, setSelectedVendors] = useState([]);

    useEffect(() => {
        fetchData();
        fetchVendors();
    }, [id]);

    const fetchData = async () => {
        try {
            const rfpRes = await api.get(`/rfps/${id}`);
            setRfp(rfpRes.data);
            const propRes = await api.get(`/proposals/rfp/${id}`);
            setProposals(propRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchVendors = async () => {
        const res = await api.get('/vendors');
        setVendors(res.data);
    };

    const handleSendRFP = async () => {
        try {
            await api.post(`/rfps/${id}/send`, { vendorIds: selectedVendors });
            alert('RFP Sent!');
            fetchData();
        } catch (error) {
            alert('Error sending RFP');
        }
    };

    const handleCheckEmails = async () => {
        try {
            const res = await api.post('/proposals/check-emails');
            alert(`Check complete. New proposals: ${res.data.newProposals}`);
            fetchData();
        } catch (error) {
            alert('Error checking emails');
        }
    };

    const handleCompare = async () => {
        setLoadingComparison(true);
        try {
            const res = await api.get(`/proposals/rfp/${id}/compare`);
            setRecommendation(res.data.recommendation);
        } catch (error) {
            console.error(error);
        }
        setLoadingComparison(false);
    };

    const toggleVendor = (vId) => {
        if (selectedVendors.includes(vId)) {
            setSelectedVendors(selectedVendors.filter(id => id !== vId));
        } else {
            setSelectedVendors([...selectedVendors, vId]);
        }
    };

    if (!rfp) return (
        <div className="flex justify-center items-center h-64">
            <div className="text-slate-500">Loading RFP details...</div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3 text-sm text-slate-500 mb-2">
                            <span className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wide">
                                {rfp.status}
                            </span>
                            <span>•</span>
                            <span>Deadline: {new Date(rfp.deadline).toLocaleDateString()}</span>
                        </div>
                        <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {rfp.title}
                        </h1>
                        <p className="mt-2 text-lg text-slate-600">
                            Budget: {rfp.currency} {rfp.budget.toLocaleString()}
                        </p>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0">
                        <button
                            onClick={handleCheckEmails}
                            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <svg className="mr-2 -ml-1 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Emails
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions: Send to Vendors (Only in Draft) */}
            {rfp.status === 'Draft' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-medium text-slate-900">Invite Vendors</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {vendors.map(v => (
                                <label key={v._id} className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedVendors.includes(v._id) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}
                `}>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={selectedVendors.includes(v._id)}
                                        onChange={() => toggleVendor(v._id)}
                                    />
                                    <span className="ml-3 block text-sm font-medium text-slate-700">{v.companyName}</span>
                                </label>
                            ))}
                        </div>
                        <button
                            onClick={handleSendRFP}
                            disabled={selectedVendors.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send Invitations ({selectedVendors.length})
                        </button>
                    </div>
                </div>
            )}

            {/* Proposals Grid */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Received Proposals ({proposals.length})</h2>
                {proposals.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                        No proposals received yet. Check for new emails or wait for vendors to reply.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {proposals.map(p => (
                            <div key={p._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100">
                                    <h3 className="font-semibold text-lg text-slate-900">{p.vendor.companyName}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Received: {new Date(p.receivedAt).toLocaleString()}</p>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Total Price</span>
                                        <span className="text-lg font-semibold text-slate-900">${p.extractedData.totalPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Delivery</span>
                                        <span className="text-sm font-medium text-slate-900">{p.extractedData.deliveryTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Warranty</span>
                                        <span className="text-sm font-medium text-slate-900">{p.extractedData.warranty}</span>
                                    </div>
                                </div>
                                {/* <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                   ID: {p._id}
                </div> */}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Comparison */}
            {proposals.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-8 shadow-sm">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg">
                            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-full">
                            <h2 className="text-xl font-bold text-indigo-900">AI Application Analysis</h2>
                            <p className="mt-1 text-indigo-700">The system analyzes all proposals against your original requirements and budget.</p>

                            {!recommendation ? (
                                <div className="mt-6">
                                    <button
                                        onClick={handleCompare}
                                        disabled={loadingComparison}
                                        className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                                    >
                                        {loadingComparison ? 'Generating Recommendation...' : 'Run Analysis & Recommendation'}
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-6 bg-white rounded-xl p-6 border border-indigo-100 shadow-sm relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Recommendation</h3>
                                    <p className="text-slate-800 whitespace-pre-line leading-relaxed">{recommendation}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ComparisonView;
