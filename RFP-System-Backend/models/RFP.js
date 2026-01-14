import mongoose from 'mongoose';

const rfpSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String, // Original natural language description
        required: true
    },
    items: [{
        itemName: String,
        quantity: Number,
        specs: String
    }],
    budget: Number,
    currency: {
        type: String,
        default: 'USD'
    },
    deadline: Date,
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Closed'],
        default: 'Draft'
    },
    selectedVendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { strict: false });

export default mongoose.model('RFP', rfpSchema);
