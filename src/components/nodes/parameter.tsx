// src/components/nodes/parameter.tsx
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';

interface ParameterData {
	name?: string;
	type?: string;
	description?: string;
}

function ParameterNode(props: NodeProps) {
	const data = props.data as ParameterData;
	const name = data?.name || 'Unknown Parameter';
	const type = data?.type;
	const description = data?.description;

	return (
		<div style={{ position: 'relative', width: '180px', minHeight: '60px' }}>
			<Handle
				type="target"
				position={Position.Top}
				style={{ background: '#3b82f6' }}
			/>
			<div
				style={{
					padding: '12px',
					background: '#eff6ff',
					border: '2px solid #3b82f6',
					borderRadius: '8px',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
				}}
			>
				<div
					style={{
						fontSize: '12px',
						color: '#1e40af',
						marginBottom: '4px',
						fontWeight: '600',
						textAlign: 'center',
					}}
				>
					PARAMETER
				</div>

				<strong
					style={{
						marginBottom: '6px',
						textAlign: 'center',
						fontSize: '14px',
						color: '#1f2937',
						wordBreak: 'break-word',
					}}
				>
					{name}
				</strong>

				{type && (
					<div
						style={{
							fontSize: '11px',
							color: '#6366f1',
							marginBottom: '4px',
							textAlign: 'center',
							fontFamily: 'monospace',
							background: '#e0e7ff',
							padding: '2px 6px',
							borderRadius: '4px',
						}}
					>
						{type}
					</div>
				)}

				{description && (
					<div
						style={{
							fontSize: '10px',
							color: '#6b7280',
							textAlign: 'center',
							lineHeight: '1.3',
							fontStyle: 'italic',
						}}
					>
						{description}
					</div>
				)}
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				style={{ background: '#3b82f6' }}
			/>
		</div>
	);
}

export default ParameterNode;
