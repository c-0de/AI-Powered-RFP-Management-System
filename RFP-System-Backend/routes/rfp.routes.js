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
    } catch (error) {
        res.status(500).json({ message: `Failed to fetch RFPs: ${error.message}` });
    }
});

// Get single RFP
router.get('/:id', async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.id).populate('selectedVendors');
        if (!rfp) return res.status(404).json({ message: `RFP with ID ${req.params.id} not found` });
        res.json(rfp);
    } catch (error) {
        res.status(500).json({ message: `Error retrieving RFP details: ${error.message}` });
    }
});

// Create new RFP
router.post('/', async (req, res) => {
    try {
        const newRFP = new RFP(req.body);
        const savedRFP = await newRFP.save();
        res.status(201).json({ ...savedRFP.toObject(), message: "RFP created successfully" });
    } catch (error) {
        res.status(400).json({ message: `Failed to create RFP: ${error.message}` });
    }
});

// Create RFP Analysis (Preview) from Natural Language
router.post('/generate', async (req, res) => {
    const { description } = req.body;
    if (!description) return res.status(400).json({ message: 'Description is required' });

    try {
        const structuredData = await parseRFPRequirement(description);

        // Ensure specs is a string
        if (structuredData.items && Array.isArray(structuredData.items)) {
            structuredData.items = structuredData.items.map(item => {
                if (Array.isArray(item.specs)) {
                    return { ...item, specs: item.specs.join('\n') };
                } else if (typeof item.specs === 'object' && item.specs !== null) {
                    // Handle case where specs is an object (key-value pairs)
                    const specsString = Object.entries(item.specs)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                    return { ...item, specs: specsString };
                }
                return item;
            });
        }

        // Return preview data without saving
        const previewRFP = {
            ...structuredData,
            description: description,
            status: 'Draft',
            message: "RFP analysis generated successfully"
        };

        res.json(previewRFP);
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
            const text = `Dear ${vendor.companyName},\n\nPlease find attached the details for our new RFP.\n\nDescription: ${rfp.description}\n\nBudget: ${rfp.currency} ${rfp.budget}\nDeadline: ${rfp.deadline}\n\nPlease reply to this email with your proposal.\n\nBest regards,\nProcurement Team`;

            return sendEmail(vendor.email, subject, text, text); // Send HTML as text for now
        });

        await Promise.all(emailPromises);

        res.json({ message: `Successfully sent RFP invitations to ${vendors.length} vendors`, vendorCount: vendors.length });
    } catch (error) {
        res.status(500).json({ message: `Failed to send RFP emails: ${error.message}` });
    }
});

// Mark proposals as read
router.put('/:id/mark-read', async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.id);
        if (!rfp) return res.status(404).json({ message: 'RFP not found' });

        // Update RFP count
        rfp.unreadProposalsCount = 0;
        await rfp.save();

        res.json({ message: 'All proposals for this RFP marked as read' });
    } catch (error) {
        res.status(500).json({ message: `Error marking proposals as read: ${error.message}` });
    }
});

export default router;
