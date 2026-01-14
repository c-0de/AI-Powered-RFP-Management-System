import nodemailer from 'nodemailer';
import imaps from 'imap-simple';
import dotenv from 'dotenv';
import { simpleParser } from 'mailparser';

dotenv.config();

// Email Sender (SMTP)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"RFP System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return info;
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
            host: process.env.IMAP_HOST,
            port: process.env.IMAP_PORT,
            tls: true,
            authTimeout: 3000,
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
