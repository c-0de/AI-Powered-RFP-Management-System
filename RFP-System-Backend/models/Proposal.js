import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
    rfp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RFP',
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    proposal: String, // Cleaned email body (renamed from emailContent)

    // Flattened AI Extracted Fields
    totalPrice: Number,
    deliveryTime: String,
    warranty: String,
    validity_period: String,
    key_highlights: [String], // Array of important bullet points
    requirements_analysis: String, // Analysis of how requirements are met
    lineItems: [{
        itemName: String,
        price: Number,
        comments: String
    }],

    aiSummary: String,
    score: Number,
    receivedAt: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model('Proposal', proposalSchema);
