// src/components/nodes/loadsResourceNodes.ts
import type { ArmTemplate } from '../../types/template';
import type { Node, Edge } from '@xyflow/react';

interface TemplateNode {
	id: string;
	type: string;
	data: any;
	position: { x: number; y: number };
}

// Layout configuration
const LAYOUT_CONFIG = {
	ROOT_POSITION: { x: 400, y: 50 },
	CATEGORY_SPACING: 400,
	CATEGORY_Y_OFFSET: 200,
	PARAMETER_SPACING: 120, // Increased from 100 to 120 (20px more padding)
	RESOURCE_SPACING: { x: 250, y: 150 },
	PADDING: 50,
};

// Function to extract parameter references from a string
function extractParameterReferences(value: any): string[] {
	if (typeof value !== 'string') return [];

	const parameterRegex = /parameters\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
	const matches: string[] = [];
	let match;

	while ((match = parameterRegex.exec(value)) !== null) {
		matches.push(match[1]);
	}

	return matches;
}

// Function to find parameter references in resource properties
function findParameterReferencesInResource(resource: any): string[] {
	const references = new Set<string>();

	function traverse(obj: any) {
		if (typeof obj === 'string') {
			extractParameterReferences(obj).forEach((ref) => references.add(ref));
		} else if (Array.isArray(obj)) {
			obj.forEach((item) => traverse(item));
		} else if (obj && typeof obj === 'object') {
			Object.values(obj).forEach((value) => traverse(value));
		}
	}

	traverse(resource);
	return Array.from(references);
}

// Parse ARM template resource ID expressions
function parseResourceId(
	resourceIdExpression: string
): { resourceType: string; resourceName: string } | null {
	const cleaned = resourceIdExpression.replace(/[\[\]'"]/g, '');
	const resourceIdMatch = cleaned.match(
		/resourceId\s*\(\s*([^,]+)\s*,\s*(.+)\s*\)/
	);
	if (!resourceIdMatch) return null;

	const resourceType = resourceIdMatch[1].replace(/'/g, '').trim();
	const resourceNameExpr = resourceIdMatch[2].trim();

	let resourceName = resourceNameExpr;
	const variableMatch = resourceNameExpr.match(
		/variables\s*\(\s*'([^']+)'\s*\)/
	);
	const paramMatch = resourceNameExpr.match(/parameters\s*\(\s*'([^']+)'\s*\)/);

	if (variableMatch) {
		resourceName = variableMatch[1];
	} else if (paramMatch) {
		resourceName = paramMatch[1];
	} else {
		resourceName = resourceNameExpr.replace(/'/g, '');
	}

	return { resourceType, resourceName };
}

// Build resource dependency tree
function buildResourceDependencyTree(resources: any[]): any[] {
	if (!Array.isArray(resources)) return [];

	const resourceMap = new Map<string, any>();
	const resourcesByType = new Map<string, any[]>();

	// Create all resource nodes
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
		};

		resourceMap.set(resourceName, node);

		if (!resourcesByType.has(resource.type)) {
			resourcesByType.set(resource.type, []);
		}
		resourcesByType.get(resource.type)!.push(node);
	});

	// Build parent-child relationships
	const childrenSet = new Set<string>();

	resources.forEach((resource, index) => {
		const currentNode = resourceMap.get(
			typeof resource.name === 'string' && resource.name.startsWith('[')
				? resource.name
				: resource.name || `Resource ${index}`
		);

		if (!currentNode) return;

		const dependencies = resource.dependsOn || [];

		dependencies.forEach((dep: string) => {
			const parsedDep = parseResourceId(dep);
			if (!parsedDep) return;

			let parentNode: any;

			// Try to find the parent resource
			parentNode = resourceMap.get(parsedDep.resourceName);

			if (!parentNode) {
				const resourcesOfType =
					resourcesByType.get(parsedDep.resourceType) || [];
				parentNode = resourcesOfType.find((r: any) => {
					const resourceNameClean = r.name
						.replace(/[\[\]'()]/g, '')
						.toLowerCase();
					const parsedNameClean = parsedDep.resourceName.toLowerCase();

					return (
						resourceNameClean.includes(parsedNameClean) ||
						parsedNameClean.includes(resourceNameClean)
					);
				});
			}

			if (!parentNode) {
				for (const [_, node] of resourceMap.entries()) {
					if (node.type === parsedDep.resourceType) {
						if (
							node.name
								.toLowerCase()
								.includes(parsedDep.resourceName.toLowerCase()) ||
							parsedDep.resourceName
								.toLowerCase()
								.includes(node.name.toLowerCase())
						) {
							parentNode = node;
							break;
						}
					}
				}
			}

			if (parentNode && parentNode !== currentNode) {
				if (
					!parentNode.children.find((child: any) => child.id === currentNode.id)
				) {
					parentNode.children.push(currentNode);
					childrenSet.add(currentNode.id);
				}
			}
		});
	});

	// Return root nodes (nodes that are not children of any other node)
	const rootNodes: any[] = [];
	for (const [_, node] of resourceMap.entries()) {
		if (!childrenSet.has(node.id)) {
			rootNodes.push(node);
		}
	}

	return rootNodes;
}

// Position resources in a tree layout
function positionResourceTree(
	resourceTree: any[],
	startX: number,
	startY: number
): { nodes: Node[]; edges: Edge[]; maxX: number; maxY: number } {
	const nodes: Node[] = [];
	const edges: Edge[] = [];
	let currentX = startX;
	let maxY = startY;

	function calculateSubtreeWidth(node: any): number {
		if (node.children.length === 0) return 1;
		return node.children.reduce(
			(sum: number, child: any) => sum + calculateSubtreeWidth(child),
			0
		);
	}

	function positionNode(
		node: any,
		x: number,
		y: number,
		level: number
	): { x: number; y: number } {
		// Create the React Flow node
		nodes.push({
			id: node.id,
			type: 'resource',
			data: {
				name: node.name,
				type: node.type,
				location: node.location,
				properties: node.properties,
			},
			position: { x, y },
		});

		maxY = Math.max(maxY, y);

		// Position children
		if (node.children.length > 0) {
			let childX = x;
			const childY = y + LAYOUT_CONFIG.RESOURCE_SPACING.y;

			node.children.forEach((child: any) => {
				const subtreeWidth = calculateSubtreeWidth(child);
				const childPosition = positionNode(child, childX, childY, level + 1);

				// Create edge from parent to child
				edges.push({
					id: `${node.id}-${child.id}`,
					source: node.id,
					target: child.id,
					type: 'smoothstep',
					animated: true,
					style: { stroke: '#6b7280', strokeWidth: 2 },
				});

				childX = childPosition.x + LAYOUT_CONFIG.RESOURCE_SPACING.x;
			});
		}

		return { x: x + LAYOUT_CONFIG.RESOURCE_SPACING.x, y };
	}

	// Position all root nodes
	resourceTree.forEach((rootNode) => {
		const result = positionNode(rootNode, currentX, startY, 0);
		currentX = result.x + LAYOUT_CONFIG.RESOURCE_SPACING.x;
	});

	return { nodes, edges, maxX: currentX, maxY };
}

export const loadResourceNodes = (template: ArmTemplate | null) => {
	if (!template) {
		return { nodes: [], edges: [] };
	}

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
			// Build resource dependency tree
			const resourceTree = buildResourceDependencyTree(template.resources);

			// Position resource tree
			const resourceStartX = resourcesNode.position.x - 100;
			const resourceStartY =
				resourcesNode.position.y + LAYOUT_CONFIG.RESOURCE_SPACING.y;

			const { nodes: resourceNodes, edges: resourceEdges } =
				positionResourceTree(resourceTree, resourceStartX, resourceStartY);

			nodes.push(...resourceNodes);
			edges.push(...resourceEdges);

			// Create edges from parameters category to root resources (resources with no dependencies)
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

			// Remove the parameter-to-resource reference edges section
			// (Commented out the parameter reference edges to resources)
			/*
			// Create parameter-to-resource reference edges
			if (template.parameters) {
				template.resources.forEach((resource, resourceIndex) => {
					const resourceId = `resource-${resourceIndex}`;
					const parameterRefs = findParameterReferencesInResource(resource);
					
					parameterRefs.forEach(paramName => {
						const paramId = `param-${paramName}`;
						const paramNode = nodes.find(n => n.id === paramId);
						const resourceNode = nodes.find(n => n.id === resourceId);
						
						if (paramNode && resourceNode) {
							edges.push({
								id: `${paramId}-ref-${resourceId}`,
								source: paramId,
								target: resourceId,
								type: 'smoothstep',
								animated: true,
								style: { 
									stroke: '#8b5cf6', 
									strokeWidth: 2,
									strokeDasharray: '5,5'
								},
								sourceHandle: 'param-reference',
								targetHandle: 'param-reference-input',
							});
						}
					});
				});
			}
			*/
		}
	}

	return { nodes, edges };
};
