import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import chatRoutes from './routes/chatRoutes'; // Add this import

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:5173',
		credentials: true,
	})
);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
	res.json({
		status: 'OK',
		message: 'ARM Template API is running',
		timestamp: new Date().toISOString(),
		openaiConfigured: !!process.env.OPENAI_API_KEY,
	});
});

app.use('/api/chat', chatRoutes); // Add chat routes

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error('Error occurred:', err);
	res.status(500).json({
		success: false,
		error: err.message || 'Internal server error'
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ 
		success: false,
		error: 'Route not found' 
	});
});

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
	console.log(
		`🤖 OpenAI integration: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`
	);
});
