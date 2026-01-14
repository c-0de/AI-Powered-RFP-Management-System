import express from 'express';
import RFP from '../models/RFP.js';
import { parseRFPRequirement } from '../services/ai.service.js';
import { sendEmail } from '../services/email.service.js';
import Vendor from '../models/Vendor.js';

const router = express.Router();

// Get all RFPs
router.get('/', async (req, res) => {
    try {
        const rfps = await RFP.find().sort({ createdAt: -1 });
        res.json(rfps);
        // res.json([]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single RFP
router.get('/:id', async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.id).populate('selectedVendors');
        if (!rfp) return res.status(404).json({ message: 'RFP not found' });
        res.json(rfp);
        // res.status(404).json({ message: 'RFP DB disabled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create RFP from Natural Language
router.post('/generate', async (req, res) => {
    const { description } = req.body;
    if (!description) return res.status(400).json({ message: 'Description is required' });

    try {
        const structuredData = await parseRFPRequirement(description);
        // Create new RFP in draft mode
        const newRFP = new RFP({
            ...structuredData,
            description: description, // Save original text
            status: 'Draft'
        });

        // Don't save yet, let user review? Or save as draft? Let's save as draft.
        const savedRFP = await newRFP.save();
        res.status(201).json(savedRFP);

        // res.status(201).json({ ...structuredData, _id: "dummy_id_no_db", description, status: 'Draft' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send RFP to Vendors
router.post('/:id/send', async (req, res) => {
    const { vendorIds } = req.body; // Array of vendor IDs
    try {
        const rfp = await RFP.findById(req.params.id);
        if (!rfp) return res.status(404).json({ message: 'RFP not found' });

        const vendors = await Vendor.find({ _id: { $in: vendorIds } });

        // Update RFP with selected vendors
        rfp.selectedVendors = vendorIds;
        rfp.status = 'Sent';
        await rfp.save();

        // Send Emails
        const emailPromises = vendors.map(vendor => {
            const subject = `Request for Proposal: ${rfp.title}`;
            const text = `Dear ${vendor.contactPerson || vendor.name},\n\nPlease find attached the details for our new RFP.\n\nDescription: ${rfp.description}\n\nBudget: ${rfp.currency} ${rfp.budget}\nDeadline: ${rfp.deadline}\n\nPlease reply to this email with your proposal.\n\nBest regards,\nProcurement Team`;

            return sendEmail(vendor.email, subject, text, text); // Send HTML as text for now
        });

        await Promise.all(emailPromises);

        res.json({ message: 'RFP sent to vendors', vendorCount: vendors.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
