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
    const [editingVendorId, setEditingVendorId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState(null);

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

    const resetForm = () => {
        setNewVendor({
            vendorCode: '',
            companyName: '',
            email: '',
            phone: '',
            location: '',
            categories: ''
        });
        setEditingVendorId(null);
    };

    const handleEdit = (vendor) => {
        setEditingVendorId(vendor._id);
        setNewVendor({
            vendorCode: vendor.vendorCode || '',
            companyName: vendor.companyName || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            location: vendor.location || '',
            categories: vendor.categories ? vendor.categories.join(', ') : ''
        });
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...newVendor,
                categories: newVendor.categories.split(',').map(c => c.trim()).filter(c => c)
            };

            if (editingVendorId) {
                await api.put(`/vendors/${editingVendorId}`, payload);
                toast.success('Vendor updated successfully');
            } else {
                await api.post('/vendors', payload);
                toast.success('Vendor added successfully');
            }

            resetForm();
            fetchVendors();
        } catch (error) {
            toast.error(editingVendorId ? "Error updating vendor" : "Error adding vendor");
            console.error(error);
        }
        setLoading(false);
    };

    const handleDeleteClick = (vendor) => {
        setVendorToDelete(vendor);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!vendorToDelete) return;

        try {
            await api.delete(`/vendors/${vendorToDelete._id}`);
            toast.success('Vendor deleted successfully');
            fetchVendors();
        } catch (error) {
            toast.error('Error deleting vendor');
            console.error(error);
        } finally {
            setDeleteModalOpen(false);
            setVendorToDelete(null);
        }
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setVendorToDelete(null);
    };

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Vendor?</h3>
                            <p className="text-slate-500 mb-6">
                                Are you sure you want to delete <span className="font-medium text-slate-700">{vendorToDelete?.companyName}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-800">{editingVendorId ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                            {editingVendorId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-sm text-slate-500 hover:text-slate-700 underline"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
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
                                className={`w-full text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${editingVendorId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {loading ? (editingVendorId ? 'Updating...' : 'Adding...') : (editingVendorId ? 'Update Vendor' : 'Add Vendor')}
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
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleEdit(vendor)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <span className="sr-only">Edit</span>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(vendor)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <span className="sr-only">Delete</span>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
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
