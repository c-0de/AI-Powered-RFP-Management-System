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
    emailContent: String, // Raw email body
    extractedData: {
        totalPrice: Number,
        deliveryTime: String,
        warranty: String,
        lineItems: [{
            itemName: String,
            price: Number,
            comments: String
        }]
    },
    aiSummary: String,
    score: Number,
    receivedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Proposal', proposalSchema);
