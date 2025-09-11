// src/utils/dependencyTree.ts
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
	subtreeHeight?: number; // Height of the entire subtree rooted at this node
}

export interface ParsedDependency {
	resourceType: string;
	resourceName: string;
}

// Layout configuration
const LAYOUT_CONFIG = {
	NODE_WIDTH: 220,
	NODE_HEIGHT: 120,
	HORIZONTAL_SPACING: 120, // Space between levels (reduced from 200)
	VERTICAL_SPACING: 50, // Minimum space between siblings
	TREE_PADDING: 100, // Padding around the tree
	SUBTREE_SPACING: 50, // Extra space between different subtrees (reduced from 80)
};

/**
 * Parse ARM template resource ID expressions to extract resource information
 */
export function parseResourceId(
	resourceIdExpression: string
): ParsedDependency | null {
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

/**
 * Calculate the height of a subtree (number of leaf nodes it contains)
 */
function calculateSubtreeHeight(node: ResourceNode): number {
	if (node.children.length === 0) {
		node.subtreeHeight = 1;
		return 1;
	}

	let totalHeight = 0;
	node.children.forEach((child) => {
		totalHeight += calculateSubtreeHeight(child);
	});

	node.subtreeHeight = totalHeight;
	return totalHeight;
}

/**
 * Calculate positions for nodes in a horizontal tree layout
 */
function calculateTreePositions(
	nodes: ResourceNode[],
	level = 0,
	startX = 0,
	parentY = 0
): number {
	if (nodes.length === 0) return startX;

	// Calculate subtree widths for all nodes first
	nodes.forEach((node) => calculateSubtreeHeight(node));

	// Calculate total width needed for all subtrees at this level
	const totalSubtreeWidth = nodes.reduce(
		(sum, node) => sum + (node.subtreeHeight || 1),
		0
	);

	// Calculate the horizontal space each subtree should occupy
	const availableWidth = Math.max(
		totalSubtreeWidth *
			(LAYOUT_CONFIG.NODE_WIDTH + LAYOUT_CONFIG.HORIZONTAL_SPACING),
		nodes.length * LAYOUT_CONFIG.SUBTREE_SPACING
	);

	let currentX = startX;
	const levelY =
		level * LAYOUT_CONFIG.VERTICAL_SPACING + LAYOUT_CONFIG.TREE_PADDING;

	nodes.forEach((node) => {
		const subtreeWidth = node.subtreeHeight || 1;

		// Calculate the center X position for this subtree
		const subtreeSpace =
			subtreeWidth *
			(LAYOUT_CONFIG.NODE_WIDTH + LAYOUT_CONFIG.HORIZONTAL_SPACING);
		const subtreeCenterX = currentX + subtreeSpace / 2;

		// Position the current node
		node.level = level;
		node.position = {
			x: subtreeCenterX - LAYOUT_CONFIG.NODE_WIDTH / 2,
			y: levelY,
		};

		// Recursively position children if any exist
		if (node.children.length > 0) {
			// Calculate the X range for children
			const childrenStartX = currentX;
			const childrenEndX = calculateTreePositions(
				node.children,
				level + 1,
				childrenStartX,
				levelY
			);

			// If we have children, we might need to adjust our position to be centered
			if (node.children.length > 1) {
				const childrenCenterX = (childrenStartX + childrenEndX) / 2;
				node.position.x = childrenCenterX - LAYOUT_CONFIG.NODE_WIDTH / 2;
			}
		}

		// Move to next subtree position
		currentX += subtreeSpace + LAYOUT_CONFIG.SUBTREE_SPACING;
	});

	return currentX;
}

/**
 * Build a tree structure from ARM template resources based on dependencies
 */
export function buildDependencyTree(resources: any[]): ResourceNode[] {
	if (!Array.isArray(resources)) return [];

	const resourceMap = new Map<string, ResourceNode>();
	const resourcesByType = new Map<string, ResourceNode[]>();

	// Create all nodes and index them
	resources.forEach((resource, index) => {
		const resourceName =
			typeof resource.name === 'string' && resource.name.startsWith('[')
				? resource.name
				: resource.name || `Resource ${index}`;

		const node: ResourceNode = {
			id: `resource-${index}`,
			name: resourceName,
			type: resource.type || 'Unknown',
			location: resource.location,
			properties: resource.properties,
			dependsOn: resource.dependsOn || [],
			children: [],
			level: 0,
			position: { x: 0, y: 0 },
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

			let parentNode: ResourceNode | undefined;

			// Try different matching strategies
			parentNode = resourceMap.get(parsedDep.resourceName);

			if (!parentNode) {
				const resourcesOfType =
					resourcesByType.get(parsedDep.resourceType) || [];
				parentNode = resourcesOfType.find((r) => {
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
				// Avoid duplicate children
				if (!parentNode.children.find((child) => child.id === currentNode.id)) {
					parentNode.children.push(currentNode);
					childrenSet.add(currentNode.id);
				}
			}
		});
	});

	// Collect root nodes
	const rootNodes: ResourceNode[] = [];
	for (const [_, node] of resourceMap.entries()) {
		if (!childrenSet.has(node.id)) {
			rootNodes.push(node);
		}
	}

	// Sort root nodes by type and name for consistent layout
	rootNodes.sort((a, b) => {
		if (a.type !== b.type) {
			return a.type.localeCompare(b.type);
		}
		return a.name.localeCompare(b.name);
	});

	// Calculate positions using improved layout algorithm
	calculateTreePositions(rootNodes);

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
