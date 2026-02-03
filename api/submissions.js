import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // Get all submissions
        const submissions = await redis.lrange('submissions', 0, 99) || [];
        return res.status(200).json(submissions);
    }

    if (req.method === 'POST') {
        // Add new submission
        const { ca } = req.body;

        if (!ca || !ca.trim()) {
            return res.status(400).json({ error: 'CA is required' });
        }

        const submission = {
            id: Date.now(),
            ca: ca.trim(),
            time: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            timestamp: Date.now()
        };

        // Add to the front of the list
        await redis.lpush('submissions', submission);
        
        // Keep only last 100
        await redis.ltrim('submissions', 0, 99);

        return res.status(200).json({ success: true, submission });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
