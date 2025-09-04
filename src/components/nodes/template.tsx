import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';

interface ParameterData {
	name?: string;
	type?: string;
	description?: string;
	defaultValue?: any;
}

function ParameterNode(props: NodeProps) {
	const data = props.data as ParameterData;
	const name = data?.name || 'Unknown Parameter';
	const type = data?.type;
	const description = data?.description;
	const defaultValue = data?.defaultValue;

	// Format default value for display
	const formatDefaultValue = (value: any): string => {
		if (value === undefined || value === null) return '';
		if (typeof value === 'string') return value;
		if (typeof value === 'object') return JSON.stringify(value);
		return String(value);
	};

	const displayDefaultValue = formatDefaultValue(defaultValue);

	return (
		<div style={{ position: 'relative', width: '180px', minHeight: '80px' }}>
			{/* Top handle for connection from previous parameter or category */}
			<Handle
				type="target"
				position={Position.Top}
				style={{ background: '#3b82f6' }}
				id="param-input"
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
						fontSize: '10px',
						color: '#1e40af',
						marginBottom: '4px',
						fontWeight: '600',
						textAlign: 'center',
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
					}}
				>
					Parameter
				</div>

				<strong
					style={{
						marginBottom: '6px',
						textAlign: 'center',
						fontSize: '14px',
						color: '#1f2937',
						wordBreak: 'break-word',
						lineHeight: '1.2',
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
							fontWeight: '500',
						}}
					>
						{type}
					</div>
				)}

				{displayDefaultValue && (
					<div
						style={{
							fontSize: '10px',
							color: '#059669',
							marginBottom: '4px',
							textAlign: 'center',
							background: '#ecfdf5',
							padding: '2px 6px',
							borderRadius: '3px',
							border: '1px solid #d1fae5',
							wordBreak: 'break-word',
						}}
					>
						Default: {displayDefaultValue}
					</div>
				)}

				{description && (
					<div
						style={{
							fontSize: '9px',
							color: '#6b7280',
							textAlign: 'center',
							lineHeight: '1.3',
							fontStyle: 'italic',
							marginTop: '2px',
						}}
					>
						{description.length > 80
							? `${description.substring(0, 80)}...`
							: description}
					</div>
				)}
			</div>

			{/* Bottom handle for connection to next parameter */}
			<Handle
				type="source"
				position={Position.Bottom}
				style={{ background: '#3b82f6' }}
				id="param-output"
			/>

			{/* Right handle for parameter references to resources */}
			<Handle
				type="source"
				position={Position.Right}
				style={{ background: '#8b5cf6' }}
				id="param-reference"
			/>
		</div>
	);
}

export default ParameterNode;
