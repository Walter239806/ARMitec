import { AzureOpenAI } from 'openai';
import type { ArmTemplate } from '../types/template';
import dotenv from 'dotenv';

dotenv.config();
export class OpenAIService {
	private client: AzureOpenAI;
	private modelName: string;
	private deployment: string;
	private maxTokens: number;

	constructor() {
		if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_ENDPOINT) {
			throw new Error(
				'OPENAI_API_KEY and OPENAI_ENDPOINT environment variables are required'
			);
		}

		const endpoint = process.env.OPENAI_ENDPOINT?.replace(/\/$/, ''); // Remove trailing slash
		const apiKey = process.env.OPENAI_API_KEY;
		const deployment = process.env.OPENAI_DEPLOYMENT || 'gpt-4o';
		const apiVersion = process.env.OPENAI_API_VERSION || '2024-04-01-preview';

		// Azure OpenAI configuration
		const options = { endpoint, apiKey, deployment, apiVersion };
		this.client = new AzureOpenAI(options);

		this.modelName = 'gpt-4o';
		this.deployment = deployment;
		this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '4000');

		console.log('Azure OpenAI Service initialized:', {
			endpoint,
			deployment,
			modelName: this.modelName,
			maxTokens: this.maxTokens,
			apiVersion,
			constructedURL: `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
		});
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

			const completion = await this.client.chat.completions.create({
				model: this.modelName,
				messages,
				max_tokens: this.maxTokens,
				temperature: 0.7,
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

CRITICAL: You MUST return your response as a valid JSON object with exactly this structure:
{
  "template": { /* Complete ARM template JSON object */ },
  "explanation": "Detailed explanation of the template"
}

IMPORTANT RULES:
1. Do NOT use markdown code blocks or backticks
2. Return only the raw JSON object
3. The "template" field must contain a complete, valid ARM template
4. Include proper Azure resource types and API versions
5. Use appropriate parameters and follow ARM template best practices
6. The response must be valid JSON that can be parsed directly`;

			const userPrompt = `Generate an ARM template for: ${requirements}
      
${templateType ? `Template type focus: ${templateType}` : ''}

Requirements:
- Valid ARM template structure
- Appropriate parameters for customization
- Include metadata and descriptions
- Follow Azure naming conventions
- Include outputs where relevant`;

			const completion = await this.client.chat.completions.create({
				model: this.modelName,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
				max_tokens: 4000,
				temperature: 0.3,
			});

			const response = completion.choices[0]?.message?.content;
			if (!response) {
				throw new Error('No response from OpenAI');
			}

			// Try to parse the JSON response
			try {
				// Clean the response in case it has markdown wrapping
				let cleanedResponse = response.trim();
				if (cleanedResponse.startsWith('```json')) {
					cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
				} else if (cleanedResponse.startsWith('```')) {
					cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
				}
				
				const parsed = JSON.parse(cleanedResponse);
				console.log('Successfully parsed template generation response');
				return {
					template: parsed.template,
					explanation: parsed.explanation || 'Template generated successfully',
				};
			} catch (parseError) {
				console.error('JSON parsing failed:', parseError);
				console.log('Raw response:', response.substring(0, 500) + '...');
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
			console.error('Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				model: this.modelName,
				endpoint: process.env.OPENAI_ENDPOINT,
			});
			throw new Error(
				`Failed to generate ARM template: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
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

			const stream = await this.client.chat.completions.create({
				model: this.modelName,
				messages,
				max_tokens: this.maxTokens,
				temperature: 0.7,
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
