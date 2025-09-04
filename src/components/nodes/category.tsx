// src/components/nodes/category.tsx
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

interface CategoryData {
	name: string;
	count: number;
	category: 'parameters' | 'resources';
}

function CategoryNode(props: NodeProps) {
	const data = props.data as CategoryData;

	// Define colors based on category
	const categoryConfig = {
		parameters: {
			background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
			border: '#2563eb',
			icon: '⚙️',
			shadowColor: 'rgba(37, 99, 235, 0.3)',
		},
		resources: {
			background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
			border: '#10b981',
			icon: '🏗️',
			shadowColor: 'rgba(16, 185, 129, 0.3)',
		},
	};

	const config = categoryConfig[data?.category || 'parameters'];

	return (
		<div style={{ position: 'relative', width: '200px', minHeight: '100px' }}>
			{/* Top handle for connection from root */}
			<Handle
				type="target"
				position={Position.Top}
				style={{ background: config.border }}
			/>

			<div
				style={{
					padding: '16px',
					background: config.background,
					border: `2px solid ${config.border}`,
					borderRadius: '10px',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					boxShadow: `0 4px 12px ${config.shadowColor}`,
					color: 'white',
				}}
			>
				{/* Category Icon and Title */}
				<div
					style={{
						fontSize: '18px',
						fontWeight: 'bold',
						marginBottom: '8px',
						textAlign: 'center',
						textShadow: '0 2px 4px rgba(0,0,0,0.3)',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<span>{config.icon}</span>
					{data?.name || 'Category'}
				</div>

				{/* Count Badge */}
				<div
					style={{
						background: 'rgba(255,255,255,0.3)',
						padding: '6px 12px',
						borderRadius: '20px',
						fontSize: '14px',
						fontWeight: 'bold',
						border: '1px solid rgba(255,255,255,0.2)',
					}}
				>
					{data?.count || 0} {(data?.count || 0) === 1 ? 'Item' : 'Items'}
				</div>

				{/* Category Description */}
				<div
					style={{
						fontSize: '10px',
						marginTop: '8px',
						opacity: 0.8,
						textAlign: 'center',
						fontStyle: 'italic',
					}}
				>
					{data?.category === 'parameters'
						? 'Input values for template'
						: 'Azure resources to deploy'}
				</div>
			</div>

			{/* Bottom handle for connections to items */}
			<Handle
				type="source"
				position={Position.Bottom}
				style={{ background: config.border }}
			/>
		</div>
	);
}

export default CategoryNode;
