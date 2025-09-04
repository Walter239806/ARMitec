// src/components/nodes/loadsResourceNodes.ts
import {
	buildDependencyTree,
	flattenTree,
	generateTreeEdges,
	type ResourceNode,
} from '../../utils/dependencyTree';
import type { ArmTemplate } from '../../types/template';
import type { Node, Edge } from '@xyflow/react';

interface ParameterInfo {
	name: string;
	type: string;
	description?: string;
	defaultValue?: any;
}

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

// Layout configuration for better spacing
const PARAMETER_LAYOUT = {
	COLUMN_WIDTH: 220,
	ROW_HEIGHT: 140,
	START_X: 50,
	START_Y: 50,
	COLUMNS: 2, // Number of parameter columns
};

export const loadResourceNodes = (template: ArmTemplate | null) => {
	if (!template) {
		return { nodes: [], edges: [] };
	}

	const nodes: Node[] = [];
	const edges: Edge[] = [];

	// Process parameters with improved grid layout
	const parameterNodes = new Map<string, Node>();
	if (template.parameters) {
		const paramEntries = Object.entries(template.parameters);

		paramEntries.forEach(([paramName, paramDef], index) => {
			const paramData = paramDef as any;

			// Calculate grid position for parameters
			const col = index % PARAMETER_LAYOUT.COLUMNS;
			const row = Math.floor(index / PARAMETER_LAYOUT.COLUMNS);

			const paramNode: Node = {
				id: `param-${paramName}`,
				type: 'parameter',
				data: {
					name: paramName,
					type: paramData.type || 'unknown',
					description: paramData.metadata?.description || '',
					defaultValue: paramData.defaultValue,
				},
				position: {
					x: PARAMETER_LAYOUT.START_X + col * PARAMETER_LAYOUT.COLUMN_WIDTH,
					y: PARAMETER_LAYOUT.START_Y + row * PARAMETER_LAYOUT.ROW_HEIGHT,
				},
			};

			nodes.push(paramNode);
			parameterNodes.set(paramName, paramNode);
		});
	}

	// Process resources if they exist
	if (Array.isArray(template.resources)) {
		// Build dependency tree for resources
		const dependencyTree = buildDependencyTree(template.resources);
		const flattenedNodes = flattenTree(dependencyTree);

		// Calculate offset to position resources to the right of parameters
		const parameterWidth =
			parameterNodes.size > 0
				? PARAMETER_LAYOUT.COLUMNS * PARAMETER_LAYOUT.COLUMN_WIDTH + 150
				: 0;

		// Convert to React Flow node format with adjusted positions
		const resourceNodes = flattenedNodes.map((node) => ({
			id: node.id,
			type: 'resource',
			data: {
				name: node.name,
				type: node.type,
				location: node.location,
				properties: node.properties,
			},
			position: {
				x: node.position.x + parameterWidth,
				y: node.position.y,
			},
		}));

		nodes.push(...resourceNodes);

		// Generate edges between resources based on dependencies
		const resourceEdges = generateTreeEdges(dependencyTree);
		edges.push(
			...resourceEdges.map((edge) => ({
				...edge,
				animated: true,
				style: { stroke: '#6b7280', strokeWidth: 2 },
				type: 'smoothstep',
				sourceHandle: 'dependency-output',
				targetHandle: 'dependency-input',
			}))
		);

		// Create edges from parameters to resources that use them
		template.resources.forEach((resource, resourceIndex) => {
			const resourceId = `resource-${resourceIndex}`;
			const parameterRefs = findParameterReferencesInResource(resource);

			parameterRefs.forEach((paramName) => {
				const paramNode = parameterNodes.get(paramName);
				if (paramNode) {
					edges.push({
						id: `${paramNode.id}-${resourceId}`,
						source: paramNode.id,
						target: resourceId,
						animated: true,
						style: {
							stroke: '#3b82f6',
							strokeWidth: 2,
							strokeDasharray: '5,5',
						},
						type: 'smoothstep',
						sourceHandle: 'param-output',
						targetHandle: 'param-input',
					});
				}
			});
		});
	}

	return { nodes, edges };
};
