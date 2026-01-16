import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
    rfp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RFP',
        required: true
    },
    proposals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal'
    }],
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Analysis', analysisSchema);
