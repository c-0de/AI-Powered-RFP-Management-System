import express from 'express';
import Proposal from '../models/Proposal.js';
import RFP from '../models/RFP.js';
import Vendor from '../models/Vendor.js';
import Analysis from '../models/Analysis.js';
import { parseVendorResponse, compareProposals } from '../services/ai.service.js';

const router = express.Router();

// Get Proposals for an RFP
router.get('/rfp/:rfpId', async (req, res) => {
    try {
        const proposals = await Proposal.find({ rfp: req.params.rfpId }).populate('vendor');
        res.json(proposals);
    } catch (error) {
        res.status(500).json({ message: `Failed to fetch proposals: ${error.message}` });
    }
});

// Compare Proposals
router.get('/rfp/:rfpId/compare', async (req, res) => {
    try {
        // Check for existing analysis first (unless forced)
        // If force=true, we skip this block and generate new
        if (req.query.force !== 'true') {
            const existingAnalysis = await Analysis.findOne({ rfp: req.params.rfpId }).sort({ createdAt: -1 });
            if (existingAnalysis) {
                return res.json({
                    recommendation: existingAnalysis.content,
                    analysisId: existingAnalysis._id,
                    analysisDate: existingAnalysis.createdAt,
                    cached: true
                });
            }
        }

        // If checkOnly flag is set, do not generate new analysis
        if (req.query.checkOnly === 'true') {
            return res.json({ recommendation: null, cached: false });
        }

        const rfp = await RFP.findById(req.params.rfpId);
        const proposals = await Proposal.find({ rfp: req.params.rfpId }).populate('vendor');

        // AI Comparison
        const recommendation = await compareProposals(rfp, proposals);

        // Save Analysis to DB
        // Save or Update Analysis in DB
        const analysis = await Analysis.findOneAndUpdate(
            { rfp: rfp._id },
            {
                rfp: rfp._id,
                proposals: proposals.map(p => p._id),
                content: recommendation
            },
            { new: true, upsert: true }
        );

        // Return result
        res.json({ recommendation, analysisId: analysis._id, analysisDate: analysis.createdAt, cached: false });
    } catch (error) {
        console.error("Comparison Error:", error);
        res.status(500).json({ message: `AI comparison failed: ${error.message}` });
    }
});

export default router;
