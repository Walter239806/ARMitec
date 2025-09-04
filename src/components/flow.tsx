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
		// Load the new hierarchical tree structure
		const { nodes: treeNodes, edges: treeEdges } = loadResourceNodes(template);

		setNodes(treeNodes);
		setEdges(treeEdges);
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
				style={{
					background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
				}}
			/>
		</div>
	);
}

export default Flow;
