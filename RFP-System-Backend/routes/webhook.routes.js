import express from 'express';
import multer from 'multer';
import Proposal from '../models/Proposal.js';
import RFP from '../models/RFP.js';
import Vendor from '../models/Vendor.js';
import { parseVendorResponse } from '../services/ai.service.js';

const router = express.Router();
const upload = multer();

/**
 * @route GET /receive-mail
 * @description Simple check to see if the webhook path is accessible
 * @access Public
 */
router.get('/', (req, res) => {
    console.log('*** GET request to /receive-mail received - Endpoint is accessible! ***');
    res.status(200).send('Webhook endpoint is active and accessible. Please use POST for actual emails.');
});

/**
 * @route POST /receive-mail
 * @description Receive email webhooks (e.g., from ngrok/Mailgun)
 * @access Public (Webhook)
 */
router.post('/', upload.any(), (req, res) => {
    // 1. Immediate Response
    res.status(200).send('Webhook received, processing in background');

    // 2. Background Processing
    (async () => {
        try {
            console.log('\n***********************************************');
            console.log('***    EMAIL WEBHOOK RECEIVED SUCCESSFULLY    ***');
            console.log('***********************************************');
            console.log('Timestamp:', new Date().toISOString());

            // Extract fields
            const { sender, recipient, subject, 'body-plain': bodyPlain } = req.body;
            const emailBody = bodyPlain || req.body['body-html'] || 'No content';

            console.log(`Processing email from: ${sender}`);

            // 1. Identify Vendor
            // Mailgun sender format: "Name <email@domain.com>" or just "email@domain.com"
            const emailMatch = sender ? sender.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/) : null;

            if (!emailMatch) {
                console.log("Error: Could not extract email from sender string");
                return; // Stop processing, no response needed
            }

            const cleanEmail = emailMatch[0].toLowerCase(); // Case insensitive
            console.log(`Extracted Email: ${cleanEmail}`);

            // Case-insensitive find
            const vendor = await Vendor.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

            if (!vendor) {
                console.log(`Error: Vendor not found for email ${cleanEmail}`);
                return; // Stop processing
            }
            console.log(`Identified Vendor: ${vendor.companyName}`);

            // 2. Identify RFP
            // Assumption: Attach to the most recent 'Sent' RFP since we don't have ID in subject yet
            const rfp = await RFP.findOne({ status: 'Sent' }).sort({ createdAt: -1 });
            if (!rfp) {
                console.log('Error: No active (Sent) RFP found.');
                return; // Stop processing
            }
            console.log(`Identified RFP: ${rfp.title}`);

            // Helper to strip quoted replies
            const extractNewContent = (text) => {
                if (!text) return "";
                // Common delimiters for replies
                const delimiters = [
                    /On .+, .+ wrote:/i,
                    /-----Original Message-----/i,
                    /From: .+/i,
                    /^>.*$/m // Lines starting with >
                ];

                let content = text;
                for (const delimiter of delimiters) {
                    const match = content.match(delimiter);
                    if (match && match.index !== undefined) {
                        content = content.substring(0, match.index);
                    }
                }
                return content.trim();
            };

            const cleanEmailBody = extractNewContent(emailBody);
            console.log(`Cleaned Email Content: "${cleanEmailBody}"`);

            // 3. AI Parse
            console.log('Parsing email content with AI...');
            let extractedData = {};

            // Only parse if there's substantial content
            if (cleanEmailBody.length > 2) {
                try {
                    extractedData = await parseVendorResponse(cleanEmailBody);
                    console.log('AI Parsing Complete.');
                } catch (aiError) {
                    console.error("AI Parsing failed, falling back to empty data:", aiError);
                }
            } else {
                console.log("Email content too short for AI parsing, skipping.");
                // Default structure for short/empty emails
                extractedData = {
                    totalPrice: 0,
                    deliveryTime: "N/A",
                    warranty: "N/A",
                    proposal_body: cleanEmailBody,
                    requirements_analysis: "Message too short to analyze.",
                    lineItems: []
                };
            }

            // SANITIZATION: Ensure numeric fields are actually numbers to prevent Mongoose CastErrors
            if (extractedData) {
                // Helper to parse price
                const safeParsePrice = (val) => {
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') {
                        // Remove currency symbols and commas
                        const cleaned = val.replace(/[^0-9.-]+/g, "");
                        const parsed = parseFloat(cleaned);
                        return isNaN(parsed) ? 0 : parsed;
                    }
                    return 0;
                };

                extractedData.totalPrice = safeParsePrice(extractedData.totalPrice);

                if (Array.isArray(extractedData.lineItems)) {
                    extractedData.lineItems = extractedData.lineItems.map(item => ({
                        ...item,
                        price: safeParsePrice(item.price)
                    }));
                }
            }

            // 4. Save Proposal
            const proposal = new Proposal({
                rfp: rfp._id,
                vendor: vendor._id,
                proposal: cleanEmailBody, // Renamed from emailContent

                // Spread extracted data to top level
                totalPrice: extractedData.totalPrice,
                deliveryTime: extractedData.deliveryTime,
                warranty: extractedData.warranty,
                validity_period: extractedData.validity_period,
                key_highlights: extractedData.key_highlights,
                proposalBody: extractedData.proposal_body, // Store the summary
                requirements_analysis: extractedData.requirements_analysis,
                extractionDetails: extractedData, // Store full object for reference
                lineItems: extractedData.lineItems,

                receivedAt: new Date()
            });

            await proposal.save();
            console.log(`SUCCESS: Proposal saved with ID: ${proposal._id}`);

            // Update RFP notification count
            await RFP.findByIdAndUpdate(rfp._id, { $inc: { unreadProposalsCount: 1 } });
            console.log(`Updated RFP unread count.`);

        } catch (error) {
            console.error('Error processing webhook in background:', error);
        }
    })();
});

export default router;
