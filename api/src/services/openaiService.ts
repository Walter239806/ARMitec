import OpenAI from 'openai';
import type { ArmTemplate } from '../types/template';

export class OpenAIService {
	private openai: OpenAI;
	private model: string;
	private maxTokens: number;
	private temperature: number;

	constructor() {
		if (!process.env.OPENAI_API_KEY) {
			throw new Error('OPENAI_API_KEY environment variable is required');
		}

		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		this.model = process.env.OPENAI_MODEL || 'gpt-4';
		this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000');
		this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');
	}

	async chatWithTemplate(
		userMessage: string,
		currentTemplate?: ArmTemplate,
		chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
	): Promise<string> {
		try {
			const systemPrompt = this.buildSystemPrompt(currentTemplate);
			const messages = this.buildMessages(
				systemPrompt,
				userMessage,
				chatHistory
			);

			const completion = await this.openai.chat.completions.create({
				model: this.model,
				messages,
				max_tokens: this.maxTokens,
				temperature: this.temperature,
			});

			return (
				completion.choices[0]?.message?.content ||
				"I apologize, but I couldn't generate a response."
			);
		} catch (error) {
			console.error('OpenAI API Error:', error);
			throw new Error('Failed to get AI response. Please try again.');
		}
	}

	async generateTemplate(
		requirements: string,
		templateType?: string
	): Promise<{ template: ArmTemplate; explanation: string }> {
		try {
			const systemPrompt = `You are an expert Azure ARM template developer. Your task is to generate valid ARM templates based on user requirements.

IMPORTANT RULES:
1. Always return a valid JSON ARM template
2. Include proper Azure resource types and API versions
3. Use appropriate parameter patterns
4. Include helpful descriptions
5. Follow ARM template best practices
6. Return both the template AND an explanation

Format your response as JSON with this structure:
{
  "template": { /* ARM template JSON */ },
  "explanation": "Detailed explanation of the template components and design decisions"
}`;

			const userPrompt = `Generate an ARM template for: ${requirements}
      
${templateType ? `Template type focus: ${templateType}` : ''}

Requirements:
- Valid ARM template structure
- Appropriate parameters for customization
- Include metadata and descriptions
- Follow Azure naming conventions
- Include outputs where relevant`;

			const completion = await this.openai.chat.completions.create({
				model: this.model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
				max_tokens: 4000,
				temperature: 0.3, // Lower temperature for more consistent template generation
			});

			const response = completion.choices[0]?.message?.content;
			if (!response) {
				throw new Error('No response from OpenAI');
			}

			// Try to parse the JSON response
			try {
				const parsed = JSON.parse(response);
				return {
					template: parsed.template,
					explanation: parsed.explanation || 'Template generated successfully',
				};
			} catch {
				// If JSON parsing fails, treat the whole response as explanation
				return {
					template: {
						$schema:
							'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
						contentVersion: '1.0.0.0',
						parameters: {},
						variables: {},
						resources: [],
						outputs: {},
					},
					explanation: response,
				};
			}
		} catch (error) {
			console.error('Template generation error:', error);
			throw new Error('Failed to generate ARM template. Please try again.');
		}
	}

	private buildSystemPrompt(currentTemplate?: ArmTemplate): string {
		let prompt = `You are an expert Azure ARM template consultant and developer. You help users understand, modify, and create Azure ARM templates.

CAPABILITIES:
- Analyze and explain ARM templates
- Suggest improvements and best practices
- Help with resource dependencies and configurations
- Generate new templates based on requirements
- Debug template issues
- Provide Azure resource guidance

RESPONSE STYLE:
- Be clear and concise
- Provide practical examples
- Explain Azure concepts when helpful
- Focus on ARM template best practices
- If generating code, ensure it's valid JSON`;

		if (currentTemplate) {
			prompt += `

CURRENT TEMPLATE CONTEXT:
The user is working with an ARM template that has:
- ${currentTemplate.resources ? (Array.isArray(currentTemplate.resources) ? currentTemplate.resources.length : Object.keys(currentTemplate.resources).length) : 0} resources
- ${currentTemplate.parameters ? Object.keys(currentTemplate.parameters).length : 0} parameters
- ${currentTemplate.variables ? Object.keys(currentTemplate.variables).length : 0} variables
- Schema: ${currentTemplate.$schema}
- Content Version: ${currentTemplate.contentVersion}

Resource types in template: ${this.extractResourceTypes(currentTemplate).join(', ')}`;
		}

		return prompt;
	}

	private buildMessages(
		systemPrompt: string,
		userMessage: string,
		chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
	): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
		const messages: Array<{
			role: 'system' | 'user' | 'assistant';
			content: string;
		}> = [{ role: 'system', content: systemPrompt }];

		// Add chat history (keep last 10 messages to avoid token limits)
		if (chatHistory && chatHistory.length > 0) {
			const recentHistory = chatHistory.slice(-10);
			messages.push(...recentHistory);
		}

		// Add current user message
		messages.push({ role: 'user', content: userMessage });

		return messages;
	}

	private extractResourceTypes(template: ArmTemplate): string[] {
		if (!template.resources) return [];

		if (Array.isArray(template.resources)) {
			return template.resources
				.map((resource: any) => resource.type || 'Unknown')
				.filter(Boolean);
		}

		return Object.values(template.resources)
			.map((resource: any) => resource.type || 'Unknown')
			.filter(Boolean);
	}

	// Streaming response for better UX (optional)
	async *streamChatResponse(
		userMessage: string,
		currentTemplate?: ArmTemplate,
		chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
	): AsyncGenerator<string, void, unknown> {
		try {
			const systemPrompt = this.buildSystemPrompt(currentTemplate);
			const messages = this.buildMessages(
				systemPrompt,
				userMessage,
				chatHistory
			);

			const stream = await this.openai.chat.completions.create({
				model: this.model,
				messages,
				max_tokens: this.maxTokens,
				temperature: this.temperature,
				stream: true,
			});

			for await (const chunk of stream) {
				const content = chunk.choices[0]?.delta?.content;
				if (content) {
					yield content;
				}
			}
		} catch (error) {
			console.error('Streaming error:', error);
			yield 'Error: Failed to get AI response. Please try again.';
		}
	}
}
