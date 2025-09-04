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
	const initialNodes: Node[] = [
		{ id: 'schema', data: { label: 'Schema' }, position: { x: 5, y: 5 } },
		{
			id: 'parameter',
			type: 'parameter', // <-- This tells React Flow to use your custom node
			data: {},
			position: { x: 185, y: 125 },
		},
		...loadResourceNodes(),
	];

	const initialEdges: Edge[] = [];

	if (template && template?.parameters)
		initialEdges.push({
			id: 'e1-2',
			source: 'schema',
			target: 'parameter',
			animated: true,
		});

	useEffect(() => {
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

	const [nodes, setNodes] = useState<Node[]>(initialNodes);
	const [edges, setEdges] = useState<Edge[]>(initialEdges);

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
