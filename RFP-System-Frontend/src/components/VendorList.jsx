import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

function VendorList() {
    const [vendors, setVendors] = useState([]);
    const [newVendor, setNewVendor] = useState({
        vendorCode: '',
        companyName: '',
        email: '',
        phone: '',
        location: '',
        categories: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await api.get('/vendors');
            setVendors(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...newVendor,
                categories: newVendor.categories.split(',').map(c => c.trim()).filter(c => c)
            };
            await api.post('/vendors', payload);
            setNewVendor({
                vendorCode: '',
                companyName: '',
                email: '',
                phone: '',
                location: '',
                categories: ''
            });
            toast.success('Vendor added successfully');
            fetchVendors();
        } catch (error) {
            toast.error("Error adding vendor");
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Vendor Management</h1>
                    <p className="text-slate-500 mt-1">Manage your supplier database and contacts.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Vendor</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Code</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. VEN-001"
                                    value={newVendor.vendorCode}
                                    onChange={e => setNewVendor({ ...newVendor, vendorCode: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. TechNova Solutions"
                                    value={newVendor.companyName}
                                    onChange={e => setNewVendor({ ...newVendor, companyName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="contact@example.com"
                                    type="email"
                                    value={newVendor.email}
                                    onChange={e => setNewVendor({ ...newVendor, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="+1 234 567 890"
                                    value={newVendor.phone}
                                    onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="City, Country"
                                    value={newVendor.location}
                                    onChange={e => setNewVendor({ ...newVendor, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categories</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Hardware, Software (comma separated)"
                                    value={newVendor.categories}
                                    onChange={e => setNewVendor({ ...newVendor, categories: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Adding...' : 'Add Vendor'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-semibold text-slate-800">Directory</h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {vendors.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No vendors found. Add one to get started.
                                </div>
                            ) : (
                                vendors.map(vendor => (
                                    <div key={vendor._id} className="p-6 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-medium text-slate-900">{vendor.companyName}</h3>
                                                    {vendor.vendorCode && (
                                                        <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                                            {vendor.vendorCode}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-slate-500">
                                                    <span className="flex items-center">
                                                        <span className="mr-1.5 opacity-70">📧</span> {vendor.email}
                                                    </span>
                                                    {vendor.phone && (
                                                        <span className="flex items-center">
                                                            <span className="mr-1.5 opacity-70">📞</span> {vendor.phone}
                                                        </span>
                                                    )}
                                                    {vendor.location && (
                                                        <span className="flex items-center">
                                                            <span className="mr-1.5 opacity-70">📍</span> {vendor.location}
                                                        </span>
                                                    )}
                                                </div>
                                                {vendor.categories && vendor.categories.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {vendor.categories.map((cat, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Optional: Show rating or SLA if available */}
                                                {(vendor.rating || vendor.responseSLAHours) && (
                                                    <div className="mt-2 text-xs text-slate-400 flex gap-3">
                                                        {vendor.rating && <span>⭐ {vendor.rating}/5</span>}
                                                        {vendor.responseSLAHours && <span>⏱️ {vendor.responseSLAHours}h SLA</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                                <span className="sr-only">Edit</span>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VendorList;
