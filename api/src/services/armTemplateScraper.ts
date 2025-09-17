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
	 * Extract ARM template JSON from URL (supports both raw JSON and HTML documentation)
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

			console.log(`Fetching ARM template from: ${documentationUrl}`);

			// Fetch the content
			const response = await axios.get(documentationUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (compatible; ArmTemplateBot/1.0)',
					Accept: 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				},
				timeout: 10000,
			});

			let armTemplate: ArmTemplate | null = null;

			// Check if response is raw JSON (for GitHub raw files)
			if (documentationUrl.includes('raw.githubusercontent.com') ||
				response.headers['content-type']?.includes('application/json')) {
				// Axios automatically parses JSON, so response.data should already be an object
				if (typeof response.data === 'object' && response.data !== null) {
					armTemplate = response.data;
				} else if (typeof response.data === 'string') {
					try {
						armTemplate = JSON.parse(response.data);
					} catch (e: any) {
						console.log('Failed to parse JSON string:', e.message);
					}
				}
			}

			// If not raw JSON, try extracting from HTML
			if (!armTemplate) {
				const $ = cheerio.load(response.data);
				armTemplate = this.extractJsonFromCodeBlocks($);
			}

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
	 * Get only the resource schema/definition for a specific Azure resource type
	 */
	async getResourceSchema(resourceType: string): Promise<any> {
		// Get the full template first
		const template = await this.getResourceTemplate(resourceType);

		// Extract only the resources that match the requested resource type
		const matchingResources = (template.resources as any[])?.filter((resource: any) =>
			resource.type === resourceType
		) || [];

		if (matchingResources.length === 0) {
			throw new Error(`No resource definition found for type: ${resourceType}`);
		}

		// Return the resource schema with essential properties for UI creation
		return {
			type: resourceType,
			apiVersion: matchingResources[0].apiVersion,
			properties: this.extractResourceProperties(matchingResources[0]),
			requiredProperties: this.identifyRequiredProperties(matchingResources[0]),
			description: `Schema for creating ${resourceType} resources`
		};
	}

	/**
	 * Extract relevant properties from a resource definition for UI display
	 */
	private extractResourceProperties(resource: any): any {
		const properties = resource.properties || {};

		// Remove ARM template functions and expressions to show the base structure
		return this.cleanArmExpressions(properties);
	}

	/**
	 * Identify which properties are typically required for resource creation
	 */
	private identifyRequiredProperties(resource: any): string[] {
		const required: string[] = [];
		const properties = resource.properties || {};

		// Common required properties based on resource structure
		if (properties.hardwareProfile) required.push('hardwareProfile');
		if (properties.osProfile) required.push('osProfile');
		if (properties.storageProfile) required.push('storageProfile');
		if (properties.networkProfile) required.push('networkProfile');
		if (properties.securityRules) required.push('securityRules');
		if (properties.addressSpace) required.push('addressSpace');
		if (properties.subnets) required.push('subnets');

		return required;
	}

	/**
	 * Clean ARM template expressions to show base property structure
	 */
	private cleanArmExpressions(obj: any): any {
		if (typeof obj === 'string') {
			// Remove ARM template functions like [parameters('...')]
			if (obj.startsWith('[') && obj.endsWith(']')) {
				return '<expression>'; // Placeholder for ARM expressions
			}
			return obj;
		}

		if (Array.isArray(obj)) {
			return obj.map(item => this.cleanArmExpressions(item));
		}

		if (obj && typeof obj === 'object') {
			const cleaned: any = {};
			for (const [key, value] of Object.entries(obj)) {
				cleaned[key] = this.cleanArmExpressions(value);
			}
			return cleaned;
		}

		return obj;
	}

	/**
	 * Build GitHub Quickstart Templates URL for a resource type
	 */
	private buildDocumentationUrl(resourceType: string): string {
		// Map resource types to their corresponding quickstart template paths
		const resourceTemplateMap: Record<string, string> = {
			'Microsoft.Compute/virtualMachines': 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.compute/vm-simple-linux/azureDeploy.json',
			'Microsoft.Storage/storageAccounts': 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.storage/storage-account-create/azureDeploy.json',
			'Microsoft.Network/virtualNetworks': 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.network/vnet-create/azureDeploy.json',
			'Microsoft.Network/networkSecurityGroups': 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.network/nsg-create/azureDeploy.json',
			'Microsoft.Network/publicIPAddresses': 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.network/public-ip-create/azureDeploy.json',
			'Microsoft.Web/sites': 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.web/webapp-basic-linux/azureDeploy.json',
			'Microsoft.Sql/servers': 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.sql/sql-database/azureDeploy.json',
			'Microsoft.KeyVault/vaults': 'https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.keyvault/key-vault-create/azureDeploy.json',
		};

		const templateUrl = resourceTemplateMap[resourceType];
		if (!templateUrl) {
			throw new Error(`No quickstart template available for resource type: ${resourceType}`);
		}

		return templateUrl;
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
