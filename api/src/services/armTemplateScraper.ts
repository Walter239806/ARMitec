import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ArmTemplate } from '../types/template';

export class ArmTemplateScraperService {
	private readonly baseUrl = 'https://learn.microsoft.com';
	private readonly cache = new Map<
		string,
		{ data: ArmTemplate; timestamp: number }
	>();
	private readonly cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

	/**
	 * Extract ARM template JSON from Microsoft documentation page
	 */
	async extractArmTemplate(documentationUrl: string): Promise<ArmTemplate> {
		try {
			// Check cache first
			const cacheKey = documentationUrl;
			const cached = this.cache.get(cacheKey);
			if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
				console.log('Returning cached ARM template');
				return cached.data;
			}

			console.log(`Scraping ARM template from: ${documentationUrl}`);

			// Fetch the documentation page
			const response = await axios.get(documentationUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (compatible; ArmTemplateBot/1.0)',
					Accept:
						'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				},
				timeout: 10000,
			});

			const $ = cheerio.load(response.data);

			// Extract JSON from code blocks
			const armTemplate = this.extractJsonFromCodeBlocks($);

			if (!armTemplate) {
				throw new Error('No valid ARM template found in the documentation');
			}

			// Validate the template structure
			this.validateArmTemplate(armTemplate);

			// Cache the result
			this.cache.set(cacheKey, { data: armTemplate, timestamp: Date.now() });

			return armTemplate;
		} catch (error: any) {
			console.error('Error extracting ARM template:', error);
			throw new Error(`Failed to extract ARM template: ${error.message}`);
		}
	}

	/**
	 * Extract JSON from various code block formats on Microsoft docs
	 */
	private extractJsonFromCodeBlocks($: cheerio.CheerioAPI): ArmTemplate | null {
		// Look for code blocks with JSON content
		const codeSelectors = [
			'code.lang-json', // Highlighted JSON code
			'pre code.json', // Pre-formatted JSON
			'div.highlight pre code', // GitHub-style code blocks
			'.code-header + pre code', // Microsoft docs code blocks
			'pre.highlight code', // Alternative highlighting
		];

		for (const selector of codeSelectors) {
			const codeBlocks = $(selector);

			codeBlocks.each((_, element) => {
				const codeText = $(element).text().trim();

				try {
					// Try to parse as JSON
					const parsed = JSON.parse(codeText);

					// Check if it looks like an ARM template
					if (this.isValidArmTemplateStructure(parsed)) {
						console.log(`Found ARM template in ${selector}`);
						return parsed;
					}
				} catch (e) {
					// Not valid JSON, continue
				}
			});
		}

		// Also try extracting from text content that might contain JSON
		const textContent = $('body').text();
		const jsonMatches = textContent.match(/\{[\s\S]*?\}/g) || [];

		for (const match of jsonMatches) {
			try {
				const parsed = JSON.parse(match);
				if (this.isValidArmTemplateStructure(parsed)) {
					console.log('Found ARM template in text content');
					return parsed;
				}
			} catch (e) {
				// Continue searching
			}
		}

		return null;
	}

	/**
	 * Check if the parsed JSON has ARM template structure
	 */
	private isValidArmTemplateStructure(obj: any): boolean {
		return (
			obj &&
			typeof obj === 'object' &&
			obj.$schema &&
			typeof obj.$schema === 'string' &&
			(obj.$schema.includes('deploymentTemplate') ||
				obj.$schema.includes('managementGroup') ||
				obj.$schema.includes('subscription')) &&
			(obj.resources !== undefined || obj.parameters !== undefined)
		);
	}

	/**
	 * Validate ARM template structure
	 */
	private validateArmTemplate(template: ArmTemplate): void {
		if (!template.$schema) {
			throw new Error('Invalid ARM template: missing $schema');
		}

		if (!template.contentVersion && !template.languageVersion) {
			throw new Error('Invalid ARM template: missing version information');
		}

		// Additional validation can be added here
	}

	/**
	 * Get ARM template for specific Azure resource type
	 */
	async getResourceTemplate(resourceType: string): Promise<ArmTemplate> {
		// Convert resource type to documentation URL
		const docUrl = this.buildDocumentationUrl(resourceType);
		return this.extractArmTemplate(docUrl);
	}

	/**
	 * Build Microsoft documentation URL for a resource type
	 */
	private buildDocumentationUrl(resourceType: string): string {
		// Convert Microsoft.Compute/virtualMachines to microsoft.compute/virtualmachines
		const normalizedType = resourceType.toLowerCase().replace(/\./g, '.');
		const [provider, resource] = normalizedType.split('/');

		return `${this.baseUrl}/en-us/azure/templates/${provider}/${resource}?pivots=deployment-language-arm-template`;
	}

	/**
	 * Get available resource types (could be expanded to scrape from Azure docs)
	 */
	async getAvailableResourceTypes(): Promise<string[]> {
		// This could be expanded to dynamically discover resource types
		return [
			'Microsoft.Compute/virtualMachines',
			'Microsoft.Storage/storageAccounts',
			'Microsoft.Network/virtualNetworks',
			'Microsoft.Network/networkSecurityGroups',
			'Microsoft.Network/publicIPAddresses',
			'Microsoft.Network/networkInterfaces',
			'Microsoft.Web/sites',
			'Microsoft.Sql/servers',
			'Microsoft.KeyVault/vaults',
			// Add more as needed
		];
	}
}
