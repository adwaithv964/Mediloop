import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NGO } from './src/models/NGO.js';

dotenv.config();

const sampleNGOs = [
    {
        id: 'ngo-seed-1',
        name: 'Delhi Care Foundation',
        email: 'contact@delhicare.org',
        password: 'hashedpassword123',
        phone: '+91-9876543210',
        address: 'Connaught Place, Delhi',
        location: { lat: 28.6304, lng: 77.2177 }, // Central Delhi
        verified: true,
    },
    {
        id: 'ngo-seed-2',
        name: 'South Delhi Aid',
        email: 'help@southdelhiaid.org',
        password: 'hashedpassword123',
        phone: '+91-9876543211',
        address: 'Saket, New Delhi',
        location: { lat: 28.5244, lng: 77.2188 }, // South Delhi
        verified: true,
    },
    {
        id: 'ngo-seed-3',
        name: 'West Delhi Relief',
        email: 'info@westdelhirelief.org',
        password: 'hashedpassword123',
        phone: '+91-9876543212',
        address: 'Janakpuri, Delhi',
        location: { lat: 28.6219, lng: 77.0878 }, // West Delhi
        verified: true,
    },
    {
        id: 'ngo-seed-4',
        name: 'Noida Health Hope',
        email: 'support@noidahealth.org',
        password: 'hashedpassword123',
        phone: '+91-9876543213',
        address: 'Sector 18, Noida',
        location: { lat: 28.5700, lng: 77.3200 }, // Noida
        verified: true,
    },
    {
        id: 'ngo-seed-5',
        name: 'Gurgaon Medical Mission',
        email: 'contact@gurgaonmed.org',
        password: 'hashedpassword123',
        phone: '+91-9876543214',
        address: 'Cyber City, Gurgaon',
        location: { lat: 28.4595, lng: 77.0266 }, // Gurgaon
        verified: true,
    },
];

const seedNGOs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing seed NGOs (optional, to avoid duplicates if run multiple times)
        await NGO.deleteMany({ id: { $regex: 'ngo-seed' } });
        console.log('Cleared old seed data');

        await NGO.insertMany(sampleNGOs);
        console.log('Successfully seeded NGOs');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding NGOs:', error);
        process.exit(1);
    }
};

seedNGOs();
