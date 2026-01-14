import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    contactPerson: String,
    phone: String,
    category: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Vendor', vendorSchema);
