import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error("❌ GOOGLE_API_KEY is missing from .env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log(`Testing connectivity to: ${url.replace(API_KEY, 'HIDDEN_KEY')}`);

try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        console.error("❌ API Request Failed!");
        console.error(`Status: ${response.status} ${response.statusText}`);
        console.error("Error Details:", JSON.stringify(data, null, 2));
    } else {
        console.log("✅ API Connectivity Successful!");
        console.log("Writing models to models.json...");
        fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
    }
} catch (error) {
    console.error("❌ Network or Parsing Error:", error.message);
}
