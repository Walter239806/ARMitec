import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
	[key: string]: {
		count: number;
		resetTime: number;
	};
}

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '10');

export const rateLimiter = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const key = req.ip || 'unknown';
	const now = Date.now();

	if (!store[key] || now > store[key].resetTime) {
		store[key] = {
			count: 1,
			resetTime: now + WINDOW_MS,
		};
		return next();
	}

	if (store[key].count >= MAX_REQUESTS) {
		return res.status(429).json({
			success: false,
			error: 'Too many requests. Please try again later.',
			retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
		});
	}

	store[key].count++;
	next();
};
