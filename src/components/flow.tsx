// src/components/flow.tsx
import {
	ReactFlow,
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	MiniMap,
	type DefaultEdgeOptions,
	type Edge,
	type Node,
	type OnConnect,
	type OnEdgesChange,
	type OnNodeDrag,
	type OnNodesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useState } from 'react';
import ParameterNode from './nodes/parameter';
import ResourceNode from './nodes/resource';
import TemplateNode from './nodes/template';
import CategoryNode from './nodes/category';
import { loadResourceNodes } from './nodes/loadsResourceNodes';
import { useArmTemplateStore } from '../service/ParsedJSON';

const nodeTypes = {
	parameter: ParameterNode,
	resource: ResourceNode,
	template: TemplateNode,
	category: CategoryNode,
};

function Flow() {
	const template = useArmTemplateStore((state) => state.template);

	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	useEffect(() => {
		console.log('Flow component template:', template);
		// Load the new hierarchical tree structure
		const { nodes: treeNodes, edges: treeEdges } = loadResourceNodes(template);

		console.log('Generated nodes:', treeNodes);
		console.log('Generated edges:', treeEdges);

		setNodes(treeNodes);
		setEdges(treeEdges);
	}, [template]);

	// Calculate initial viewport based on ARM Template, Parameters, and Resources nodes
	const getInitialViewport = () => {
		const targetNodeTypes = ['template', 'parameter', 'resource'];
		const targetNodes = nodes.filter((node) =>
			targetNodeTypes.includes(node.type || '')
		);

		if (targetNodes.length === 0) {
			return { x: 0, y: 0, zoom: 0.8 };
		}

		// Calculate bounding box of target nodes
		const minX = Math.min(...targetNodes.map((node) => node.position.x));
		const maxX = Math.max(
			...targetNodes.map((node) => node.position.x + (node.width || 200))
		);
		const minY = Math.min(...targetNodes.map((node) => node.position.y));
		const maxY = Math.max(
			...targetNodes.map((node) => node.position.y + (node.height || 100))
		);

		// Calculate center of target nodes
		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;

		// Position viewport to center on these nodes
		return {
			x: -centerX + 400, // Offset to center in viewport
			y: -centerY + 300,
			zoom: 0.8,
		};
	};

	const nodeClassName = (node: Node) => {
		// Return a class name string based on node type or data
		return typeof node.type === 'string' ? `minimap-node-${node.type}` : '';
	};

	const defaultEdgeOptions: DefaultEdgeOptions = {
		animated: true,
	};

	const onNodeDrag: OnNodeDrag = (_, node) => {
		console.log('drag event', node.data);
	};

	const onNodesChange: OnNodesChange = useCallback(
		(changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
		[setNodes]
	);
	const onEdgesChange: OnEdgesChange = useCallback(
		(changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
		[setEdges]
	);
	const onConnect: OnConnect = useCallback(
		(connection) => setEdges((eds) => addEdge(connection, eds)),
		[setEdges]
	);

	return (
		<div
			style={{
				width: '100%',
				height: '100vh',
				color: 'black',
				position: 'relative',
			}}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeDrag={onNodeDrag}
				defaultViewport={getInitialViewport()}
				defaultEdgeOptions={defaultEdgeOptions}
				style={{
					background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
				}}
			>
				<MiniMap zoomable pannable nodeClassName={nodeClassName} />
			</ReactFlow>
			{nodes.length === 0 && (
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						textAlign: 'center',
						padding: '20px',
						backgroundColor: 'rgba(255, 255, 255, 0.9)',
						borderRadius: '8px',
						boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
					}}
				>
					<h3>No ARM Template Loaded</h3>
					<p>Load an ARM template to see the flow diagram</p>
				</div>
			)}
		</div>
	);
}

export default Flow;
