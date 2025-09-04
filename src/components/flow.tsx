// src/components/flow.tsx
import {
	ReactFlow,
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type DefaultEdgeOptions,
	type Edge,
	type FitViewOptions,
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
import { loadResourceNodes } from './nodes/loadsResourceNodes';
import { useArmTemplateStore } from '../service/ParsedJSON';

const nodeTypes = {
	parameter: ParameterNode,
	resource: ResourceNode,
};

function Flow() {
	const template = useArmTemplateStore((state) => state.template);

	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);

	useEffect(() => {
		// Load complete tree (parameters + resources)
		const { nodes: treeNodes, edges: treeEdges } = loadResourceNodes(template);

		// Create initial nodes - no need for separate schema or parameter nodes
		const initialNodes: Node[] = [...treeNodes];

		// Create initial edges
		const initialEdges: Edge[] = [
			...treeEdges.map((edge) => ({
				...edge,
				animated: true,
			})),
		];

		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [template]);

	const fitViewOptions: FitViewOptions = {
		padding: 0.2,
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
		<div style={{ width: '100vw', height: '100vh', color: 'black' }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeDrag={onNodeDrag}
				fitView
				fitViewOptions={fitViewOptions}
				defaultEdgeOptions={defaultEdgeOptions}
			/>
		</div>
	);
}

export default Flow;
