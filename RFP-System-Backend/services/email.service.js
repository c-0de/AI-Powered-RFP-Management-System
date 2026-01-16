import formData from 'form-data';
import Mailgun from 'mailgun.js';
import imaps from 'imap-simple';
import dotenv from 'dotenv';
import { simpleParser } from 'mailparser';

dotenv.config();

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_SENDING_API_KEY || process.env.MAILGUN_API_KEY,
});

const DOMAIN = process.env.MAILGUN_DOMAIN;

export const sendEmail = async (to, subject, text, html) => {
    try {
        if (!DOMAIN) {
            throw new Error("MAILGUN_DOMAIN is missing in .env");
        }

        const messageData = {
            from: `RFP System <postmaster@${DOMAIN}>`,
            to: [to.trim()],
            "h:Reply-To": `replies@${DOMAIN}`,
            subject,
            text,
            html,
        };


        const msg = await mg.messages.create(DOMAIN, messageData);
        console.log("Message sent:", msg);
        return msg;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

