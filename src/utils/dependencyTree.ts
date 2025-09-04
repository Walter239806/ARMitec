// Third pass: calculate levels and positions
function calculateLevelsAndPositions(
	nodes: ResourceNode[],
	level = 0,
	startY = 0
): number {
	let currentY = startY;

	nodes.forEach((node) => {
		node.level = level;
		node.position = {
			x: level * 300 + 50, // Horizontal spacing between levels
			y: currentY,
		};

		currentY += 150; // Vertical spacing between siblings

		if (node.children.length > 0) {
			currentY = calculateLevelsAndPositions(
				node.children,
				level + 1,
				currentY
			);
		}
	});

	return currentY;
} // src/utils/dependencyTree.ts
export interface ResourceNode {
	id: string;
	name: string;
	type: string;
	location?: string;
	properties?: Record<string, unknown>;
	dependsOn?: string[];
	children: ResourceNode[];
	level: number;
	position: { x: number; y: number };
}

export interface ParsedDependency {
	resourceType: string;
	resourceName: string;
}

/**
 * Parse ARM template resource ID expressions to extract resource information
 * Handles expressions like: "[resourceId('Microsoft.Network/networkSecurityGroups', variables('networkSecurityGroupName'))]"
 */
export function parseResourceId(
	resourceIdExpression: string
): ParsedDependency | null {
	// Remove brackets and quotes
	const cleaned = resourceIdExpression.replace(/[\[\]'"]/g, '');

	// Extract from resourceId() function
	const resourceIdMatch = cleaned.match(
		/resourceId\s*\(\s*([^,]+)\s*,\s*(.+)\s*\)/
	);
	if (!resourceIdMatch) return null;

	const resourceType = resourceIdMatch[1].replace(/'/g, '').trim();
	const resourceNameExpr = resourceIdMatch[2].trim();

	// Handle variables() and parameters() expressions
	let resourceName = resourceNameExpr;
	const variableMatch = resourceNameExpr.match(
		/variables\s*\(\s*'([^']+)'\s*\)/
	);
	const paramMatch = resourceNameExpr.match(/parameters\s*\(\s*'([^']+)'\s*\)/);

	if (variableMatch) {
		resourceName = `[variables('${variableMatch[1]}')]`;
	} else if (paramMatch) {
		resourceName = `[parameters('${paramMatch[1]}')]`;
	}

	return { resourceType, resourceName };
}

/**
 * Build a tree structure from ARM template resources based on dependencies
 */
export function buildDependencyTree(resources: any[]): ResourceNode[] {
	if (!Array.isArray(resources)) return [];

	// Create a map of all resources by their identifier
	const resourceMap = new Map<string, ResourceNode>();

	// First pass: create all nodes
	resources.forEach((resource, index) => {
		const node: ResourceNode = {
			id: `resource-${index}`,
			name: resource.name || `Resource ${index}`,
			type: resource.type || 'Unknown',
			location: resource.location,
			properties: resource.properties,
			dependsOn: resource.dependsOn || [],
			children: [],
			level: 0,
			position: { x: 0, y: 0 },
		};

		// Use resource name as key for dependency lookup
		resourceMap.set(resource.name, node);
		// Also use type + name combination for more specific matching
		resourceMap.set(`${resource.type}|${resource.name}`, node);
	});

	// Second pass: build parent-child relationships
	const rootNodes: ResourceNode[] = [];

	resources.forEach((resource) => {
		const currentNode = resourceMap.get(resource.name);
		if (!currentNode) return;

		const dependencies = resource.dependsOn || [];
		let hasParents = false;

		dependencies.forEach((dep: string) => {
			const parsedDep = parseResourceId(dep);
			if (!parsedDep) return;

			// Try to find the parent resource
			let parentNode = resourceMap.get(parsedDep.resourceName);
			if (!parentNode) {
				// Try with type + name combination
				parentNode = resourceMap.get(
					`${parsedDep.resourceType}|${parsedDep.resourceName}`
				);
			}

			// If still not found, try to find by matching resource type and similar name patterns
			if (!parentNode) {
				for (const [key, node] of resourceMap.entries()) {
					if (node.type === parsedDep.resourceType) {
						// Check if names match (handling variable/parameter expressions)
						if (
							key === parsedDep.resourceName ||
							node.name === parsedDep.resourceName ||
							key.includes(parsedDep.resourceName.replace(/[\[\]'()]/g, ''))
						) {
							parentNode = node;
							break;
						}
					}
				}
			}

			if (parentNode && parentNode !== currentNode) {
				parentNode.children.push(currentNode);
				hasParents = true;
			}
		});

		// If no parents found, it's a root node
		if (!hasParents) {
			rootNodes.push(currentNode);
		}
	});

	// Third pass: calculate levels and positions
	function calculateLevelsAndPositions(
		nodes: ResourceNode[],
		level = 0,
		startY = 0
	): number {
		let currentY = startY;

		nodes.forEach((node) => {
			node.level = level;
			node.position = {
				x: level * 300 + 50, // Horizontal spacing between levels
				y: currentY,
			};

			currentY += 150; // Vertical spacing between siblings

			if (node.children.length > 0) {
				currentY = calculateLevelsAndPositions(
					node.children,
					level + 1,
					currentY
				);
			}
		});

		return currentY;
	}

	calculateLevelsAndPositions(rootNodes);

	return rootNodes;
}

/**
 * Flatten the tree structure for React Flow consumption
 */
export function flattenTree(nodes: ResourceNode[]): ResourceNode[] {
	const flattened: ResourceNode[] = [];

	function traverse(nodeList: ResourceNode[]) {
		nodeList.forEach((node) => {
			flattened.push(node);
			if (node.children.length > 0) {
				traverse(node.children);
			}
		});
	}

	traverse(nodes);
	return flattened;
}

/**
 * Generate edges based on parent-child relationships
 */
export function generateTreeEdges(
	nodes: ResourceNode[]
): Array<{ id: string; source: string; target: string }> {
	const edges: Array<{ id: string; source: string; target: string }> = [];

	function traverse(nodeList: ResourceNode[]) {
		nodeList.forEach((node) => {
			node.children.forEach((child) => {
				edges.push({
					id: `${node.id}-${child.id}`,
					source: node.id,
					target: child.id,
				});
			});

			if (node.children.length > 0) {
				traverse(node.children);
			}
		});
	}

	traverse(nodes);
	return edges;
}
