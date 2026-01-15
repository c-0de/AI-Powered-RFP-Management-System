import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
    vendorCode: {
        type: String,
        required: true,
        unique: true
    },
    companyName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: String,
    location: String,
    categories: [String],
    rating: {
        type: Number,
        default: 0
    },
    onTimeDeliveryRate: Number,
    responseSLAHours: Number,
    certifications: [String],
    paymentTermsSupported: [String],
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Vendor', vendorSchema);
