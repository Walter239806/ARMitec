// api/src/controllers/chatController.ts
import { Request, Response, NextFunction } from 'express';
import { OpenAIService } from '../services/openaiService';
import type { ApiResponse } from '../types/ApiResponse';
import { ArmTemplate } from '@/types/template';

interface ChatRequest {
	message: string;
	currentTemplate?: ArmTemplate;
	chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface GenerateTemplateRequest {
	requirements: string;
	templateType?: string;
}

export class ChatController {
	private openaiService = new OpenAIService();

	chat = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const { message, currentTemplate, chatHistory }: ChatRequest = req.body;

			if (!message?.trim()) {
				res.status(400).json({
					success: false,
					error: 'Message is required',
				});
				return;
			}

			const response = await this.openaiService.chatWithTemplate(
				message,
				currentTemplate,
				chatHistory
			);

			const apiResponse: ApiResponse = {
				success: true,
				data: {
					message: response,
					timestamp: new Date().toISOString(),
				},
			};

			res.json(apiResponse);
		} catch (error) {
			next(error);
		}
	};

	generateTemplate = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const { requirements, templateType }: GenerateTemplateRequest = req.body;

			if (!requirements?.trim()) {
				res.status(400).json({
					success: false,
					error: 'Requirements are required',
				});
				return;
			}

			const result = await this.openaiService.generateTemplate(
				requirements,
				templateType
			);

			const apiResponse: ApiResponse = {
				success: true,
				data: result,
			};

			res.json(apiResponse);
		} catch (error) {
			next(error);
		}
	};

	// Streaming endpoint for real-time responses
	streamChat = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const { message, currentTemplate, chatHistory }: ChatRequest = req.body;

			if (!message?.trim()) {
				res.status(400).json({
					success: false,
					error: 'Message is required',
				});
				return;
			}

			// Set up SSE headers
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Cache-Control',
			});

			// Send streaming response
			for await (const chunk of this.openaiService.streamChatResponse(
				message,
				currentTemplate,
				chatHistory
			)) {
				res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
			}

			res.write('data: [DONE]\n\n');
			res.end();
		} catch (error) {
			res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
			res.end();
		}
	};
}
