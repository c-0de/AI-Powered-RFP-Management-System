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

// Email Receiver (IMAP)
export const fetchEmails = async () => {
    const config = {
        imap: {
            user: process.env.IMAP_USER,
            password: process.env.IMAP_PASS,
            host: process.env.IMAP_HOST || 'imap.gmail.com',
            port: parseInt(process.env.IMAP_PORT) || 993,
            tls: true,
            authTimeout: 3000,
            tlsOptions: { rejectUnauthorized: false } // Helpful for some dev environments
        },
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: true,
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        const emails = [];

        for (const item of messages) {
            const all = item.parts.find(part => part.which === '');
            const id = item.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\\r\\n";
            const source = idHeader + all.body;

            const parsed = await simpleParser(source);

            emails.push({
                from: parsed.from.text,
                subject: parsed.subject,
                text: parsed.text,
                date: parsed.date,
                messageId: parsed.messageId
            });
        }

        connection.end();
        return emails;
    } catch (error) {
        console.warn("IMAP Connection Error (Check credentials):", error.message);
        // Return empty array instead of crashing so the app can start without valid email creds
        return [];
    }
};

