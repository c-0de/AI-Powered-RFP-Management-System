import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

function ComparisonView() {
    const { id } = useParams();
    const [rfp, setRfp] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [recommendation, setRecommendation] = useState('');
    const [loadingComparison, setLoadingComparison] = useState(false);
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [analysisDate, setAnalysisDate] = useState(null);

    const isOutdated = analysisDate && proposals.some(p => new Date(p.receivedAt) > new Date(analysisDate));

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

            // Check for existing analysis (safe check, no generation)
            try {
                const analysisRes = await api.get(`/proposals/rfp/${id}/compare?checkOnly=true`);
                if (analysisRes.data.recommendation) {
                    setRecommendation(analysisRes.data.recommendation);
                }
            } catch (err) {
                console.error("Error checking existing analysis:", err);
            }

            // Mark as read if there are unread items
            if (rfpRes.data.unreadProposalsCount > 0) {
                await api.put(`/rfps/${id}/mark-read`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchVendors = async () => {
        const res = await api.get('/vendors');
        setVendors(res.data);
    };

    const handleSendRFP = async () => {
        setIsSending(true);
        try {
            await api.post(`/rfps/${id}/send`, { vendorIds: selectedVendors });
            toast.success('RFP Sent!');
            fetchData();
        } catch (error) {
            toast.error('Error sending RFP');
        } finally {
            setIsSending(false);
        }
    };

    const handleCheckEmails = async () => {
        setIsSyncing(true);
        try {
            const res = await api.post('/proposals/check-emails');
            toast.success(`Check complete. New proposals: ${res.data.newProposals}`);
            fetchData();
        } catch (error) {
            toast.error('Error checking emails');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCompare = async (force = false) => {
        setLoadingComparison(true);
        try {
            const endpoint = force
                ? `/proposals/rfp/${id}/compare?force=true`
                : `/proposals/rfp/${id}/compare`;

            const res = await api.get(endpoint);
            setRecommendation(res.data.recommendation);
            if (force) toast.success('Analysis refreshed');
        } catch (error) {
            console.error(error);
            toast.error('Error generating analysis');
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
                            <span>Deadline: {rfp.deadline ? new Date(rfp.deadline).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {rfp.title}
                        </h1>
                        <p className="mt-2 text-lg text-slate-600">
                            Budget: {rfp.currency} {rfp.budget?.toLocaleString() || '0'}
                        </p>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0">
                        <button
                            onClick={handleCheckEmails}
                            disabled={isSyncing}
                            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSyncing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <svg className="mr-2 -ml-1 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Sync Emails
                                </>
                            )}
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
                            disabled={selectedVendors.length === 0 || isSending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                        >
                            {isSending ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                `Send Invitations (${selectedVendors.length})`
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Project Requirements */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <details className="group">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <h2 className="text-lg font-bold text-slate-900">Project Requirements</h2>
                        <span className="ml-6 flex-shrink-0">
                            <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </summary>
                    <div className="px-6 py-4 border-t border-slate-200">
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</h3>
                            <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <p className="whitespace-pre-wrap">{rfp.description}</p>
                            </div>
                        </div>

                        {rfp.items && rfp.items.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Required Items</h3>
                                <div className="overflow-x-auto ring-1 ring-slate-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item Name</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Specifications</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {rfp.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.itemName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{item.quantity}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">{item.specs}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </details>
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Received Proposals ({proposals.length})</h2>
                {proposals.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                        No proposals received yet. Check for new emails or wait for vendors to reply.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {proposals.map(p => (
                            <div
                                key={p._id}
                                onClick={() => setSelectedProposal(p)}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow ring-1 ring-transparent hover:ring-blue-200"
                            >
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-semibold text-lg text-slate-900">{p.vendor.companyName}</h3>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-slate-500">Received: {new Date(p.receivedAt).toLocaleDateString()}</p>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">View Details</span>
                                    </div>
                                </div>
                                <div className="p-5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Total Price</span>
                                        <span className="text-lg font-semibold text-slate-900">${p.totalPrice?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Delivery</span>
                                        <span className="text-sm font-medium text-slate-900 text-right truncate block max-w-[70%]" title={p.deliveryTime}>{p.deliveryTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Warranty</span>
                                        <span className="text-sm font-medium text-slate-900 text-right truncate block max-w-[70%]" title={p.warranty}>{p.warranty}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">Validity</span>
                                        <span className="text-sm font-medium text-slate-900 text-right truncate block max-w-[70%]" title={p.validity_period || 'N/A'}>{p.validity_period || 'N/A'}</span>
                                    </div>

                                    {/* Key Highlights Preview */}
                                    {p.key_highlights && p.key_highlights.length > 0 && (
                                        <div className="pt-3 border-t border-slate-100">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Highlights</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {p.key_highlights.slice(0, 3).map((point, idx) => (
                                                    <li key={idx} className="text-xs text-slate-700 line-clamp-1">{point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Proposal Detail Modal */}
            {selectedProposal && (
                <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedProposal(null)}
                    ></div>

                    {/* Modal Panel - Centered */}
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-3xl border border-slate-200">

                            {/* Header */}
                            <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                                <h3 className="text-xl font-bold text-slate-900" id="modal-title">
                                    {selectedProposal.vendor.companyName}
                                </h3>
                                <button
                                    onClick={() => setSelectedProposal(null)}
                                    className="rounded-full p-1 hover:bg-slate-100 transition-colors"
                                >
                                    <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Price</p>
                                        <p className="text-lg font-semibold text-slate-900">${selectedProposal.totalPrice?.toLocaleString() || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Delivery</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedProposal.deliveryTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Warranty</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedProposal.warranty}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Validity</p>
                                        <p className="text-sm font-medium text-slate-900">{selectedProposal.validity_period || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Key Highlights */}
                                    {selectedProposal.key_highlights && selectedProposal.key_highlights.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                Key Highlights
                                            </h4>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {selectedProposal.key_highlights.map((point, idx) => (
                                                    <li key={idx} className="flex items-start text-sm text-slate-700 bg-yellow-50/50 p-2 rounded border border-yellow-100">
                                                        <span className="mr-2 text-yellow-500">•</span>
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Full Proposal Body */}
                                    {selectedProposal.proposal && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Original Proposal</h4>
                                            <div className="bg-white p-4 rounded-lg border border-slate-200 leading-relaxed max-h-96 overflow-y-auto shadow-inner prose prose-sm prose-slate max-w-none">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 mt-4 text-slate-900 border-b pb-2" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-4 text-slate-900" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-3 text-slate-900" {...props} />,
                                                        p: ({ node, ...props }) => <p className="mb-3 text-slate-700 leading-relaxed last:mb-0" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-700" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-700" {...props} />,
                                                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-3 bg-slate-50 italic text-slate-600 rounded-r" {...props} />,
                                                        pre: ({ node, ...props }) => <pre className="bg-slate-900 text-slate-50 p-3 rounded-lg mb-3 overflow-x-auto text-sm" {...props} />,
                                                        code: ({ node, ...props }) => <code className="font-mono text-sm" {...props} />,
                                                        a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                                                        table: ({ node, ...props }) => <div className="overflow-x-auto mb-4 border border-slate-200 rounded-lg"><table className="min-w-full divide-y divide-slate-200" {...props} /></div>,
                                                        thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
                                                        th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" {...props} />,
                                                        tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-slate-200" {...props} />,
                                                        tr: ({ node, ...props }) => <tr className="hover:bg-slate-50" {...props} />,
                                                        td: ({ node, ...props }) => <td className="px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap" {...props} />,
                                                    }}
                                                >
                                                    {selectedProposal.proposal}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* Requirements Analysis */}
                                    {selectedProposal.requirements_analysis && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Technical Analysis</h4>
                                            <div className="text-sm text-slate-700 whitespace-pre-wrap bg-blue-50 p-4 rounded-lg border border-blue-100 leading-relaxed">
                                                {selectedProposal.requirements_analysis}
                                            </div>
                                        </div>
                                    )}

                                    {/* Line Items Table */}
                                    {selectedProposal.lineItems && selectedProposal.lineItems.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Line Items</h4>
                                            <div className="overflow-x-auto ring-1 ring-slate-200 rounded-lg">
                                                <table className="min-w-full divide-y divide-slate-200">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                                                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Note</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-slate-200">
                                                        {selectedProposal.lineItems.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-4 py-3 text-sm text-slate-900">{item.itemName}</td>
                                                                <td className="px-4 py-3 text-sm text-slate-600 text-right">${item.price?.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-sm text-slate-500">{item.comments}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-slate-50 px-6 py-4 flex flex-row-reverse border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProposal(null)}
                                    className="w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-indigo-900">AI Application Analysis</h2>
                                    <p className="mt-1 text-indigo-700">The system analyzes all proposals against your original requirements and budget.</p>
                                </div>
                                {recommendation && (
                                    <button
                                        onClick={() => handleCompare(true)}
                                        disabled={loadingComparison}
                                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 shadow-sm text-xs font-medium rounded-full text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                                        title="Force re-generation of analysis"
                                    >
                                        <svg className={`w-3 h-3 mr-1.5 ${loadingComparison ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        {loadingComparison ? 'Analyzing...' : 'Re-analyze'}
                                    </button>
                                )}
                            </div>

                            {isOutdated && (
                                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700">
                                                <span className="font-bold">Heads up:</span> New proposals have arrived since this analysis was generated.
                                                <button
                                                    onClick={() => handleCompare(true)}
                                                    className="ml-1 underline font-medium hover:text-yellow-600"
                                                >
                                                    Re-analyze now
                                                </button> to include them.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!recommendation ? (
                                <div className="mt-6">
                                    <button
                                        onClick={() => handleCompare(false)}
                                        disabled={loadingComparison}
                                        className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                                    >
                                        {loadingComparison ? 'Generating Recommendation...' : 'Run Analysis & Recommendation'}
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-6 bg-white rounded-xl p-6 border border-indigo-100 shadow-sm relative group">
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
