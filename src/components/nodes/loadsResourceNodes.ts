// src/components/nodes/loadsResourceNodes.ts
import type { ArmTemplate } from '../../types/template';
import type { Node, Edge } from '@xyflow/react';

// Layout configuration - Centered and optimized for tree structure
const LAYOUT_CONFIG = {
	ROOT_POSITION: { x: 600, y: 50 }, // More centered horizontally
	CATEGORY_SPACING: 500, // Increased spacing between categories
	CATEGORY_Y_OFFSET: 200, // Space below root
	PARAMETER_SPACING: 140, // Reduced to fit more parameters on screen
	RESOURCE_SPACING: { x: 250, y: 180 }, // Increased vertical spacing for better tree visualization
	PADDING: 50,
};

// Function to extract parameter references from a string
// function extractParameterReferences(value: any): string[] {
// 	if (typeof value !== 'string') return [];

// 	const parameterRegex = /parameters\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
// 	const matches: string[] = [];
// 	let match;

// 	while ((match = parameterRegex.exec(value)) !== null) {
// 		matches.push(match[1]);
// 	}

// 	return matches;
// }

// Function to find parameter references in resource properties
// function findParameterReferencesInResource(resource: any): string[] {
// 	const references = new Set<string>();

// 	function traverse(obj: any) {
// 		if (typeof obj === 'string') {
// 			extractParameterReferences(obj).forEach((ref) => references.add(ref));
// 		} else if (Array.isArray(obj)) {
// 			obj.forEach((item) => traverse(item));
// 		} else if (obj && typeof obj === 'object') {
// 			Object.values(obj).forEach((value) => traverse(value));
// 		}
// 	}

// 	traverse(resource);
// 	return Array.from(references);
// }

// Parse ARM template resource ID expressions with better debugging
function parseResourceId(
	resourceIdExpression: string
): { resourceType: string; resourceName: string } | null {
	console.log(`Parsing resource ID: ${resourceIdExpression}`);

	const cleaned = resourceIdExpression.replace(/[\[\]'"]/g, '');
	const resourceIdMatch = cleaned.match(
		/resourceId\s*\(\s*([^,]+)\s*,\s*(.+)\s*\)/
	);

	if (!resourceIdMatch) {
		console.log(`❌ Failed to match resourceId pattern in: ${cleaned}`);
		return null;
	}

	const resourceType = resourceIdMatch[1].replace(/'/g, '').trim();
	const resourceNameExpr = resourceIdMatch[2].trim();

	let resourceName = resourceNameExpr;
	const variableMatch = resourceNameExpr.match(
		/variables\s*\(\s*'([^']+)'\s*\)/
	);
	const paramMatch = resourceNameExpr.match(/parameters\s*\(\s*'([^']+)'\s*\)/);

	if (variableMatch) {
		resourceName = variableMatch[1];
		console.log(`Found variable reference: ${resourceName}`);
	} else if (paramMatch) {
		resourceName = paramMatch[1];
		console.log(`Found parameter reference: ${resourceName}`);
	} else {
		resourceName = resourceNameExpr.replace(/'/g, '');
		console.log(`Using direct name: ${resourceName}`);
	}

	const result = { resourceType, resourceName };
	console.log(`✅ Parsed result:`, result);
	return result;
}

// Build resource dependency tree with comprehensive debugging and matching
function buildResourceDependencyTree(resources: any[]): any[] {
	if (!Array.isArray(resources)) return [];

	console.log('\n=== Building Resource Dependency Tree ===');
	console.log(
		'Resources to process:',
		resources.map((r) => ({
			name: r.name,
			type: r.type,
			dependsOn: r.dependsOn,
		}))
	);

	const resourceMap = new Map<string, any>();
	const resourcesByType = new Map<string, any[]>();

	// Create all resource nodes first and index them by multiple keys
	resources.forEach((resource, index) => {
		const resourceName =
			typeof resource.name === 'string' && resource.name.startsWith('[')
				? resource.name
				: resource.name || `Resource ${index}`;

		const node = {
			id: `resource-${index}`,
			name: resourceName,
			type: resource.type || 'Unknown',
			location: resource.location,
			properties: resource.properties,
			dependsOn: resource.dependsOn || [],
			children: [],
			originalResource: resource,
			resourceIndex: index,
		};

		// Index by multiple keys for better lookup
		resourceMap.set(resourceName, node);
		resourceMap.set(resource.name, node);
		resourceMap.set(`resource-${index}`, node);

		// Also try to index by clean names (remove brackets and expressions)
		const cleanName = resourceName.replace(/[\[\]'"()]/g, '').toLowerCase();
		resourceMap.set(cleanName, node);

		// Index by type
		if (!resourcesByType.has(resource.type)) {
			resourcesByType.set(resource.type, []);
		}
		resourcesByType.get(resource.type)!.push(node);

		console.log(`📝 Indexed resource: ${resourceName} (${resource.type})`);
		console.log(
			`   Index keys: [${resourceName}, ${resource.name}, resource-${index}, ${cleanName}]`
		);
	});

	// Build parent-child relationships
	const childrenSet = new Set<string>();

	resources.forEach((resource, index) => {
		const currentNode = resourceMap.get(`resource-${index}`);
		if (!currentNode) return;

		const dependencies = resource.dependsOn || [];
		if (dependencies.length === 0) {
			console.log(`ℹ️  ${resource.name} has no dependencies`);
			return;
		}

		console.log(`\n--- Processing dependencies for: ${resource.name} ---`);
		console.log('Dependencies:', dependencies);

		dependencies.forEach((dep: string) => {
			console.log(`\n🔍 Processing dependency: ${dep}`);

			const parsedDep = parseResourceId(dep);
			if (!parsedDep) {
				console.log(`❌ Could not parse dependency: ${dep}`);
				return;
			}

			console.log(`✅ Parsed dependency:`, parsedDep);

			let parentNode: any = null;

			// Strategy 1: Try exact match by parsed resource name
			parentNode = resourceMap.get(parsedDep.resourceName);
			if (parentNode) {
				console.log(`✅ Found parent by exact name match: ${parentNode.name}`);
			}

			// Strategy 2: Look for resources of the same type and try name matching
			if (!parentNode) {
				const resourcesOfType =
					resourcesByType.get(parsedDep.resourceType) || [];
				console.log(
					`🔍 Looking in ${parsedDep.resourceType} resources:`,
					resourcesOfType.map((r) => r.name)
				);

				parentNode = resourcesOfType.find((r: any) => {
					// Try various matching strategies
					const resourceNameLower = r.name.toLowerCase();
					const parsedNameLower = parsedDep.resourceName.toLowerCase();

					console.log(
						`   Comparing "${resourceNameLower}" with "${parsedNameLower}"`
					);

					// Direct contains match
					if (
						resourceNameLower.includes(parsedNameLower) ||
						parsedNameLower.includes(resourceNameLower)
					) {
						console.log(`   ✅ Found parent by contains match: ${r.name}`);
						return true;
					}

					// Clean name matching (remove ARM expressions)
					const cleanResourceName = r.name
						.replace(/[\[\]'"()]/g, '')
						.toLowerCase();
					const cleanParsedName = parsedDep.resourceName
						.replace(/[\[\]'"()]/g, '')
						.toLowerCase();

					console.log(
						`   Comparing clean names: "${cleanResourceName}" with "${cleanParsedName}"`
					);

					if (
						cleanResourceName.includes(cleanParsedName) ||
						cleanParsedName.includes(cleanResourceName)
					) {
						console.log(`   ✅ Found parent by clean name match: ${r.name}`);
						return true;
					}

					// Variable/parameter expression matching
					if (r.name.includes('variables(') && parsedDep.resourceName) {
						const resourceVar = r.name.match(/variables\s*\(\s*'([^']+)'\s*\)/);
						if (resourceVar && resourceVar[1] === parsedDep.resourceName) {
							console.log(`   ✅ Found parent by variable match: ${r.name}`);
							return true;
						}
					}

					if (r.name.includes('parameters(') && parsedDep.resourceName) {
						const resourceParam = r.name.match(
							/parameters\s*\(\s*'([^']+)'\s*\)/
						);
						if (resourceParam && resourceParam[1] === parsedDep.resourceName) {
							console.log(`   ✅ Found parent by parameter match: ${r.name}`);
							return true;
						}
					}

					return false;
				});
			}

			// Strategy 3: Special handling for common Azure resource patterns
			if (
				!parentNode &&
				parsedDep.resourceType === 'Microsoft.Network/publicIPAddresses'
			) {
				const allResources = Array.from(
					resourcesByType.get('Microsoft.Network/publicIPAddresses') || []
				);
				parentNode = allResources.find(
					(r: any) =>
						r.name.toLowerCase().includes('publicip') ||
						r.name.toLowerCase().includes('public') ||
						r.name.toLowerCase().includes(parsedDep.resourceName.toLowerCase())
				);
				if (parentNode) {
					console.log(
						`✅ Found PublicIP parent by pattern match: ${parentNode.name}`
					);
				}
			}

			if (
				!parentNode &&
				parsedDep.resourceType === 'Microsoft.Network/virtualNetworks'
			) {
				const allResources = Array.from(
					resourcesByType.get('Microsoft.Network/virtualNetworks') || []
				);
				parentNode = allResources.find(
					(r: any) =>
						r.name.toLowerCase().includes('vnet') ||
						r.name.toLowerCase().includes('virtualnetwork') ||
						r.name.toLowerCase().includes(parsedDep.resourceName.toLowerCase())
				);
				if (parentNode) {
					console.log(
						`✅ Found VirtualNetwork parent by pattern match: ${parentNode.name}`
					);
				}
			}

			// Add the dependency relationship
			if (parentNode && parentNode !== currentNode) {
				console.log(
					`🔗 Creating dependency: ${currentNode.name} depends on ${parentNode.name}`
				);

				// Avoid duplicate children
				if (
					!parentNode.children.find((child: any) => child.id === currentNode.id)
				) {
					parentNode.children.push(currentNode);
					childrenSet.add(currentNode.id);
					console.log(
						`   ✅ Added ${currentNode.name} as child of ${parentNode.name}`
					);
				} else {
					console.log(`   ⚠️  Child relationship already exists`);
				}
			} else {
				console.log(
					`❌ Could not resolve dependency for ${currentNode.name}: ${dep}`
				);
				console.log(
					`   Parsed as: ${parsedDep.resourceType} -> ${parsedDep.resourceName}`
				);
				console.log(
					`   Available resources of this type:`,
					(resourcesByType.get(parsedDep.resourceType) || []).map((r) => r.name)
				);
			}
		});
	});

	// Get root nodes (nodes that are not children of any other node)
	const rootNodes: any[] = [];
	const allUniqueNodes = Array.from(resourceMap.values()).filter(
		(node) => node.id && !rootNodes.find((existing) => existing.id === node.id)
	);

	allUniqueNodes.forEach((node) => {
		if (!childrenSet.has(node.id)) {
			rootNodes.push(node);
		}
	});

	console.log('\n=== Dependency Tree Results ===');
	console.log(
		'Root nodes:',
		rootNodes.map((n) => n.name)
	);
	console.log('Nodes with children:');
	allUniqueNodes.forEach((node) => {
		if (node.children.length > 0) {
			console.log(
				`  ${node.name} -> [${node.children
					.map((c: any) => c.name)
					.join(', ')}]`
			);
		}
	});

	return rootNodes;
}

// Position resources in a triangular tree layout
function positionResourceTree(
	resourceTree: any[],
	startX: number,
	startY: number
): { nodes: Node[]; edges: Edge[]; maxX: number; maxY: number } {
	const nodes: Node[] = [];
	const edges: Edge[] = [];
	let maxY = startY;
	let maxX = startX;

	console.log('\n=== Positioning Resource Tree ===');
	console.log(
		'Root nodes to position:',
		resourceTree.map((r) => r.name)
	);

	// Calculate the width needed for each subtree
	function calculateSubtreeWidth(node: any): number {
		if (node.children.length === 0) return 1;

		let totalWidth = 0;
		node.children.forEach((child: any) => {
			totalWidth += calculateSubtreeWidth(child);
		});

		return Math.max(1, totalWidth);
	}

	// Position a subtree in a triangular layout
	function positionSubtree(
		node: any,
		centerX: number,
		y: number,
		level: number
	): number {
		console.log(
			`Positioning ${node.name} at level ${level}, centerX: ${centerX}, y: ${y}`
		);

		// Position the current node
		const nodeX = centerX - 100; // Center the 200px wide node
		nodes.push({
			id: node.id,
			type: 'resource',
			data: {
				name: node.name,
				type: node.type,
				location: node.location,
				properties: node.properties,
			},
			position: { x: nodeX, y },
		});

		maxY = Math.max(maxY, y);
		maxX = Math.max(maxX, nodeX + 200); // Node width is 200px

		// If no children, return the width used
		if (node.children.length === 0) {
			return 200; // Single node width
		}

		// Calculate total width needed for all children
		let totalChildWidth = 0;
		const childWidths: number[] = [];

		node.children.forEach((child: any) => {
			const childWidth = calculateSubtreeWidth(child) * 250; // 200px node + 50px spacing
			childWidths.push(childWidth);
			totalChildWidth += childWidth;
		});

		// Position children below the parent, spread horizontally
		const childY = y + LAYOUT_CONFIG.RESOURCE_SPACING.y;
		const startChildX = centerX - totalChildWidth / 2;
		let currentChildX = startChildX;

		node.children.forEach((child: any, index: number) => {
			const childWidth = childWidths[index];
			const childCenterX = currentChildX + childWidth / 2;

			// Recursively position the child subtree
			positionSubtree(child, childCenterX, childY, level + 1);

			// Create edge from parent to child
			edges.push({
				id: `${node.id}-${child.id}`,
				source: node.id,
				target: child.id,
				type: 'smoothstep',
				animated: true,
				style: { stroke: '#6b7280', strokeWidth: 2 },
			});

			console.log(`  Child ${child.name} positioned at ${childCenterX}`);
			currentChildX += childWidth;
		});

		return Math.max(totalChildWidth, 200);
	}

	// Position all root trees side by side
	let currentX = startX;

	resourceTree.forEach((rootNode, index) => {
		console.log(`\nPositioning root tree ${index + 1}: ${rootNode.name}`);

		const treeWidth = calculateSubtreeWidth(rootNode) * 250; // 200px node + 50px spacing
		const treeCenterX = currentX + treeWidth / 2;

		const usedWidth = positionSubtree(rootNode, treeCenterX, startY, 0);

		currentX += Math.max(treeWidth, usedWidth) + 100; // Extra spacing between root trees
	});

	console.log('=== Tree Positioning Complete ===');
	console.log(`Total nodes positioned: ${nodes.length}`);
	console.log(`Total edges created: ${edges.length}`);
	console.log(`Max dimensions: ${maxX} x ${maxY}`);

	return { nodes, edges, maxX, maxY };
}

export const loadResourceNodes = (template: ArmTemplate | null) => {
	if (!template) {
		return { nodes: [], edges: [] };
	}

	console.log('\n🚀 === Starting loadResourceNodes ===');
	console.log('Template:', template);

	const nodes: Node[] = [];
	const edges: Edge[] = [];

	// 1. Create Root Node (ARM Template)
	const rootNode: Node = {
		id: 'root-template',
		type: 'template',
		data: {
			name: 'ARM Template',
			schema: template.$schema,
			contentVersion: template.contentVersion,
			parameterCount: template.parameters
				? Object.keys(template.parameters).length
				: 0,
			resourceCount: template.resources
				? Array.isArray(template.resources)
					? template.resources.length
					: Object.keys(template.resources).length
				: 0,
		},
		position: LAYOUT_CONFIG.ROOT_POSITION,
	};
	nodes.push(rootNode);

	// 2. Create Parameters Category Node (if parameters exist)
	if (template.parameters && Object.keys(template.parameters).length > 0) {
		const parametersNode: Node = {
			id: 'category-parameters',
			type: 'category',
			data: {
				name: 'Parameters',
				count: Object.keys(template.parameters).length,
				category: 'parameters',
			},
			position: {
				x: LAYOUT_CONFIG.ROOT_POSITION.x - LAYOUT_CONFIG.CATEGORY_SPACING / 2,
				y: LAYOUT_CONFIG.ROOT_POSITION.y + LAYOUT_CONFIG.CATEGORY_Y_OFFSET,
			},
		};
		nodes.push(parametersNode);

		// Edge from root to parameters category
		edges.push({
			id: 'root-to-parameters',
			source: 'root-template',
			target: 'category-parameters',
			type: 'smoothstep',
			animated: true,
			style: { stroke: '#3b82f6', strokeWidth: 2 },
		});

		// Create individual parameter nodes in linear chain
		const paramEntries = Object.entries(template.parameters);
		let previousParamId = 'category-parameters';

		paramEntries.forEach(([paramName, paramDef], index) => {
			const paramData = paramDef as any;
			const paramId = `param-${paramName}`;

			const paramNode: Node = {
				id: paramId,
				type: 'parameter',
				data: {
					name: paramName,
					type: paramData.type || 'unknown',
					description: paramData.metadata?.description || '',
					defaultValue: paramData.defaultValue,
				},
				position: {
					x: parametersNode.position.x,
					y:
						parametersNode.position.y +
						LAYOUT_CONFIG.PARAMETER_SPACING * (index + 1),
				},
			};
			nodes.push(paramNode);

			// Create edge from previous node to current parameter
			edges.push({
				id: `${previousParamId}-${paramId}`,
				source: previousParamId,
				target: paramId,
				type: 'smoothstep',
				animated: true,
				style: { stroke: '#3b82f6', strokeWidth: 2 },
			});

			previousParamId = paramId;
		});
	}

	// 3. Create Resources Category Node (if resources exist)
	if (
		template.resources &&
		((Array.isArray(template.resources) && template.resources.length > 0) ||
			(!Array.isArray(template.resources) &&
				Object.keys(template.resources).length > 0))
	) {
		const resourcesNode: Node = {
			id: 'category-resources',
			type: 'category',
			data: {
				name: 'Resources',
				count: Array.isArray(template.resources)
					? template.resources.length
					: Object.keys(template.resources).length,
				category: 'resources',
			},
			position: {
				x: LAYOUT_CONFIG.ROOT_POSITION.x + LAYOUT_CONFIG.CATEGORY_SPACING / 2,
				y: LAYOUT_CONFIG.ROOT_POSITION.y + LAYOUT_CONFIG.CATEGORY_Y_OFFSET,
			},
		};
		nodes.push(resourcesNode);

		// Edge from root to resources category
		edges.push({
			id: 'root-to-resources',
			source: 'root-template',
			target: 'category-resources',
			type: 'smoothstep',
			animated: true,
			style: { stroke: '#059669', strokeWidth: 2 },
		});

		// Process resources if they are in array format
		if (Array.isArray(template.resources)) {
			console.log('\n📦 Processing resources array...');

			// Build resource dependency tree
			const resourceTree = buildResourceDependencyTree(template.resources);
			console.log('\n🌳 Resource tree built:', resourceTree);

			// Position resource tree
			const resourceStartX = resourcesNode.position.x - 100;
			const resourceStartY =
				resourcesNode.position.y + LAYOUT_CONFIG.RESOURCE_SPACING.y;

			const { nodes: resourceNodes, edges: resourceEdges } =
				positionResourceTree(resourceTree, resourceStartX, resourceStartY);

			console.log(
				`\n✅ Adding ${resourceNodes.length} resource nodes and ${resourceEdges.length} resource edges`
			);
			nodes.push(...resourceNodes);
			edges.push(...resourceEdges);

			// Create edges from resources category to root resources (resources with no dependencies)
			resourceTree.forEach((rootResource) => {
				edges.push({
					id: `category-resources-${rootResource.id}`,
					source: 'category-resources',
					target: rootResource.id,
					type: 'smoothstep',
					animated: true,
					style: { stroke: '#059669', strokeWidth: 2 },
					targetHandle: 'category-input',
				});
			});
		}
	}

	console.log('\n🎉 === loadResourceNodes Complete ===');
	console.log(`Total nodes: ${nodes.length}`);
	console.log(`Total edges: ${edges.length}`);

	return { nodes, edges };
};
