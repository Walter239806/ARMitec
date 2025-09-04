// src/components/nodes/loadsResourceNodes.ts
import {
	buildDependencyTree,
	flattenTree,
	generateTreeEdges,
} from '../../utils/dependencyTree';
import type { ArmTemplate } from '../../types/template';

export const loadResourceNodes = (template: ArmTemplate | null) => {
	if (!Array.isArray(template?.resources)) {
		return { nodes: [], edges: [] };
	}

	// Build dependency tree
	const dependencyTree = buildDependencyTree(template.resources);

	// Flatten for React Flow
	const flattenedNodes = flattenTree(dependencyTree);

	// Convert to React Flow node format
	const nodes = flattenedNodes.map((node) => ({
		id: node.id,
		type: 'resource',
		data: {
			name: node.name,
			type: node.type,
			location: node.location,
			properties: node.properties,
		},
		position: node.position,
	}));

	// Generate edges based on dependencies
	const edges = generateTreeEdges(dependencyTree);

	return { nodes, edges };
};
