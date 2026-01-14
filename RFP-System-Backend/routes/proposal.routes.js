import express from 'express';
import Proposal from '../models/Proposal.js';
import RFP from '../models/RFP.js';
import Vendor from '../models/Vendor.js';
import { fetchEmails } from '../services/email.service.js';
import { parseVendorResponse, compareProposals } from '../services/ai.service.js';

const router = express.Router();

// Get Proposals for an RFP
router.get('/rfp/:rfpId', async (req, res) => {
    try {
        const proposals = await Proposal.find({ rfp: req.params.rfpId }).populate('vendor');
        res.json(proposals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Trigger Check for New Emails
router.post('/check-emails', async (req, res) => {
    try {
        const emails = await fetchEmails();
        const newProposals = [];

        for (const email of emails) {
            // 1. Identify Vendor by email
            const vendor = await Vendor.findOne({ email: email.from });
            if (!vendor) {
                console.log(`Skipping email from unknown vendor: ${email.from}`);
                continue;
            }

            // 2. Identify RFP? 
            // This is tricky without a tracking ID in the subject. 
            // For this MVP, we will assume the LAST sent RFP for this vendor or look for keywords.
            // Or we just attach it to the most recent 'Sent' RFP unique to testing.
            // Let's Find the most recently active Sent RFP.
            const rfp = await RFP.findOne({ status: 'Sent' }).sort({ createdAt: -1 });

            if (!rfp) {
                console.log("No active RFP found to attach proposal to.");
                continue;
            }

            // Check if proposal already exists for this email/messageId to avoid duplicates
            const exists = await Proposal.findOne({ 'vendor': vendor._id, 'rfp': rfp._id, 'receivedAt': email.date });
            if (exists) continue;

            // 3. Parse Email with AI
            const extractedData = await parseVendorResponse(email.text || email.subject);

            // 4. Create Proposal
            const proposal = new Proposal({
                rfp: rfp._id,
                vendor: vendor._id,
                emailContent: email.text,
                extractedData: extractedData,
                receivedAt: email.date
            });

            await proposal.save();
            newProposals.push(proposal);
        }

        res.json({ message: 'Check complete', newProposals: newProposals.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// Compare Proposals
router.get('/rfp/:rfpId/compare', async (req, res) => {
    try {
        const rfp = await RFP.findById(req.params.rfpId);
        const proposals = await Proposal.find({ rfp: req.params.rfpId }).populate('vendor');

        if (proposals.length === 0) {
            return res.json({ recommendation: "No proposals to compare yet." });
        }

        const recommendation = await compareProposals(rfp, proposals);
        res.json({ recommendation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
