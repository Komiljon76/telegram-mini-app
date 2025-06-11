const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://telegram-mini-app-olive.vercel.app', 'https://web.telegram.org', 'https://t.me'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://telegram-mini-app-olive.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add headers for Telegram Web App
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '.'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// In-memory storage for jobs (in production, use a database)
let jobs = [];
let users = {};

// API routes for jobs
app.get('/api/jobs', (req, res) => {
    res.json({
        success: true,
        data: jobs,
        count: jobs.length
    });
});

app.post('/api/jobs', (req, res) => {
    try {
        const {
            title, company, location, type, salary, workers,
            telegram, phone, requirements, description, postedBy
        } = req.body;

        if (!title || !company || !location || !type || !salary || !workers || !description || !postedBy) {
            return res.status(400).json({
                success: false,
                message: 'Barcha majburiy maydonlarni to\'ldiring'
            });
        }

        const newJob = {
            id: Date.now(),
            title: title.trim(),
            company: company.trim(),
            location: location.trim(),
            type: type,
            salary: salary.trim(),
            workers: parseInt(workers),
            telegram: telegram ? telegram.trim() : '',
            phone: phone ? phone.trim() : '',
            requirements: requirements ? requirements.trim() : '',
            description: description.trim(),
            postedBy: postedBy,
            postedAt: new Date().toLocaleString('uz-UZ')
        };

        jobs.unshift(newJob);

        res.json({
            success: true,
            message: 'Ish muvaffaqiyatli joylashtirildi',
            data: newJob
        });
    } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi'
        });
    }
});

app.put('/api/jobs/:id', (req, res) => {
    try {
        const jobId = parseInt(req.params.id);
        const jobIndex = jobs.findIndex(job => job.id === jobId);
        
        if (jobIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Ish topilmadi'
            });
        }

        const {
            title, company, location, type, salary, workers,
            telegram, phone, requirements, description
        } = req.body;

        if (!title || !company || !location || !type || !salary || !workers || !description) {
            return res.status(400).json({
                success: false,
                message: 'Barcha majburiy maydonlarni to\'ldiring'
            });
        }

        jobs[jobIndex] = {
            ...jobs[jobIndex],
            title: title.trim(),
            company: company.trim(),
            location: location.trim(),
            type: type,
            salary: salary.trim(),
            workers: parseInt(workers),
            telegram: telegram ? telegram.trim() : '',
            phone: phone ? phone.trim() : '',
            requirements: requirements ? requirements.trim() : '',
            description: description.trim()
        };

        res.json({
            success: true,
            message: 'Ish muvaffaqiyatli tahrirlandi',
            data: jobs[jobIndex]
        });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi'
        });
    }
});

app.delete('/api/jobs/:id', (req, res) => {
    try {
        const jobId = parseInt(req.params.id);
        const jobIndex = jobs.findIndex(job => job.id === jobId);
        
        if (jobIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Ish topilmadi'
            });
        }

        jobs.splice(jobIndex, 1);

        res.json({
            success: true,
            message: 'Ish muvaffaqiyatli o\'chirildi'
        });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi'
        });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes (for future backend integration)
app.get('/api/status', (req, res) => {
    res.json({
        message: 'Job Mini App API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://${getLocalIP()}:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Get local IP address
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results = {};

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }

    // Return first available IP
    for (const name of Object.keys(results)) {
        if (results[name].length > 0) {
            return results[name][0];
        }
    }
    
    return '127.0.0.1';
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app; 