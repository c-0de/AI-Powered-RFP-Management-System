import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

function RFPCreate() {
    const [description, setDescription] = useState('');
    const [generatedRFP, setGeneratedRFP] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleGenerate = async () => {
        if (!description.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/rfps/generate', { description });
            setGeneratedRFP(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Error extracting requirements');
        }
        setLoading(false);
    };

    const handleConfirm = async () => {
        if (!generatedRFP) return;

        try {
            await api.post('/rfps', generatedRFP);
            navigate('/');
        } catch (error) {
            console.error("Failed to save RFP:", error);
            toast.error("Failed to save RFP. Please try again.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900">New RFP Request</h1>
                <p className="mt-2 text-slate-600">Describe your procurement needs, and our AI will structure it for you.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
                {/* Chat Area */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/50">
                    {/* Initial System Message */}
                    <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                            AI
                        </div>
                        <div className="ml-4 bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm max-w-lg">
                            <p className="text-slate-700">Hello! I can help you create a formal RFP. Just tell me what you need, including quantity, specs, budget, and timeline.</p>
                        </div>
                    </div>

                    {/* User Input (Ghost when submitted) */}
                    {(generatedRFP || loading) && (
                        <div className="flex items-start justify-end">
                            <div className="mr-4 bg-blue-600 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-lg text-white">
                                <p>{description}</p>
                            </div>
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                Me
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                AI
                            </div>
                            <div className="ml-4 bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generated Result */}
                    {generatedRFP && (
                        <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                AI
                            </div>
                            <div className="ml-4 bg-white rounded-2xl rounded-tl-none border border-slate-200 shadow-sm w-full max-w-2xl overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-green-50/50">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-green-800">Draft Created Successfully</h3>
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Ready for Review</span>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</label>
                                        <p className="text-lg font-medium text-slate-900">{generatedRFP.title}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget</label>
                                            <p className="text-slate-900">{generatedRFP.currency} {generatedRFP.budget?.toLocaleString() || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</label>
                                            <p className="text-slate-900">{generatedRFP.deadline ? new Date(generatedRFP.deadline).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Line Items</label>
                                        <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Item</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Qty</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Specs</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-200">
                                                    {generatedRFP.items?.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-2 text-sm text-slate-900">{item.itemName}</td>
                                                            <td className="px-4 py-2 text-sm text-slate-500">{item.quantity}</td>
                                                            <td className="px-4 py-2 text-sm text-slate-500">{item.specs}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end space-x-3">
                                        <button
                                            onClick={() => setGeneratedRFP(null)} // Reset
                                            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                        >
                                            Discard
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Confirm & Save
                                        </button>
                                    </div>

                                    {/* Dynamic Fields Section */}
                                    {(() => {
                                        const standardFields = ['title', 'description', 'items', 'budget', 'currency', 'deadline', 'time', 'date', '_id', 'status', 'createdAt', 'updatedAt', 'selectedVendors', '__v'];
                                        const dynamicKeys = Object.keys(generatedRFP).filter(key => !standardFields.includes(key) && generatedRFP[key] != null);

                                        if (dynamicKeys.length === 0) return null;

                                        return (
                                            <div className="pt-4 border-t border-slate-100">
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Additional Details</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {dynamicKeys.map(key => (
                                                        <div key={key}>
                                                            <label className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                            <p className="text-sm font-medium text-slate-900">{typeof generatedRFP[key] === 'object' ? JSON.stringify(generatedRFP[key]) : generatedRFP[key].toString()}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                {!generatedRFP && (
                    <div className="p-4 bg-white border-t border-slate-200">
                        <div className="relative">
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ex: I need 10 Macbook Pros (M3, 16GB) for the dev team. Budget is $25k. Need them by end of month."
                                className="w-full pl-4 pr-32 py-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all shadow-sm"
                                rows="3"
                            />
                            <div className="absolute bottom-3 right-3">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !description.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? 'Thinking...' : 'Analyze'}
                                    {!loading && (
                                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

export default RFPCreate;
