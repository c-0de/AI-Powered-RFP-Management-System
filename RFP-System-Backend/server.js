import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rfpRoutes from './routes/rfp.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import proposalRoutes from './routes/proposal.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
/*
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rfp-system')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));
*/

// Routes
app.use('/api/rfps', rfpRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/proposals', proposalRoutes);

app.get('/', (req, res) => {
    res.send('AI-Powered RFP System API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
