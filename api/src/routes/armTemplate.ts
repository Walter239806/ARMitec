import { Router } from 'express';
import { ArmTemplateScraperService } from '../services/armTemplateScraper';

const router = Router();
const scraperService = new ArmTemplateScraperService();

/**
 * GET /api/arm-templates/resource/:resourceType
 * Extract ARM template for a specific resource type
 */
router.get('/resource/:resourceType', async (req, res) => {
	try {
		const { resourceType } = req.params;

		// Decode URL parameter (e.g., Microsoft.Compute%2FvirtualMachines)
		const decodedResourceType = decodeURIComponent(resourceType);

		console.log(
			`Fetching ARM template for resource type: ${decodedResourceType}`
		);

		const template =
			await scraperService.getResourceTemplate(decodedResourceType);

		res.json({
			success: true,
			resourceType: decodedResourceType,
			template,
			extractedAt: new Date().toISOString(),
		});
	} catch (error: any) {
		console.error('Error fetching ARM template:', error);
		res.status(500).json({
			success: false,
			error: error.message,
			resourceType: req.params.resourceType,
		});
	}
});

/**
 * GET /api/arm-templates/available-types
 * Get list of available resource types
 */
router.get('/available-types', async (req, res) => {
	try {
		const resourceTypes = await scraperService.getAvailableResourceTypes();

		res.json({
			success: true,
			resourceTypes,
			count: resourceTypes.length,
		});
	} catch (error: any) {
		console.error('Error fetching resource types:', error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
});

/**
 * POST /api/arm-templates/extract
 * Extract ARM template from custom documentation URL
 */
router.post('/extract', async (req, res) => {
	try {
		const { url } = req.body;

		if (!url) {
			res.status(400).json({
				success: false,
				error: 'URL is required',
			});
			return;
		}

		// Validate URL is from Microsoft docs
		if (!url.includes('learn.microsoft.com')) {
			res.status(400).json({
				success: false,
				error: 'Only Microsoft Learn documentation URLs are supported',
			});
			return;
		}

		const template = await scraperService.extractArmTemplate(url);

		res.json({
			success: true,
			sourceUrl: url,
			template,
			extractedAt: new Date().toISOString(),
		});
	} catch (error: any) {
		console.error('Error extracting ARM template:', error);
		res.status(500).json({
			success: false,
			error: error.message,
			sourceUrl: req.body.url,
		});
	}
});

export default router;
