import type { ArmTemplate } from './template';

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// Specific response types for different endpoints
export interface ChatResponse {
	message: string;
	timestamp: string;
}

export interface TemplateGenerationResponse {
	template: ArmTemplate;
	explanation: string;
}

export interface TemplateValidationResponse {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface HealthResponse {
	status: string;
	message: string;
	timestamp: string;
	port?: number;
	openaiConfigured?: boolean;
}
