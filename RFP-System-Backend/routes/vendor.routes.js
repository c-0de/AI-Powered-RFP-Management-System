import express from 'express';
import Vendor from '../models/Vendor.js';

const router = express.Router();

// Get all Vendors
router.get('/', async (req, res) => {
    try {
        const vendors = await Vendor.find();
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: `Failed to retrieve vendor list: ${error.message}` });
    }
});

// Create Vendor
router.post('/', async (req, res) => {
    try {
        const newVendor = new Vendor(req.body);
        const savedVendor = await newVendor.save();
        res.status(201).json({ ...savedVendor.toObject(), message: "Vendor registered successfully" });
    } catch (error) {
        res.status(400).json({ message: `Failed to register vendor: ${error.message}` });
    }
});

export default router;
