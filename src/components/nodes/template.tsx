import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';

interface TemplateData {
	name?: string;
	schema?: string;
	contentVersion?: string;
	parameterCount?: number;
	resourceCount?: number;
}

function TemplateNode(props: NodeProps) {
	const data = props.data as TemplateData;
	const name = data?.name || 'ARM Template';
	const schema = data?.schema;
	const contentVersion = data?.contentVersion;
	const parameterCount = data?.parameterCount || 0;
	const resourceCount = data?.resourceCount || 0;

	return (
		<div style={{ position: 'relative', width: '200px', minHeight: '120px' }}>
			<div
				style={{
					padding: '16px',
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					border: '3px solid #4f46e5',
					borderRadius: '12px',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 4px 8px rgba(79, 70, 229, 0.2)',
					color: 'white',
				}}
			>
				<strong
					style={{
						marginBottom: '8px',
						textAlign: 'center',
						fontSize: '16px',
						fontWeight: '700',
						wordBreak: 'break-word',
						lineHeight: '1.2',
					}}
				>
					{name}
				</strong>

				{contentVersion && (
					<div
						style={{
							fontSize: '11px',
							color: '#e0e7ff',
							marginBottom: '6px',
							textAlign: 'center',
							fontFamily: 'monospace',
						}}
					>
						v{contentVersion}
					</div>
				)}

				<div
					style={{
						fontSize: '12px',
						color: '#c7d2fe',
						textAlign: 'center',
						display: 'flex',
						justifyContent: 'space-around',
						marginTop: '8px',
					}}
				>
					<div>
						<div style={{ fontWeight: '600' }}>{parameterCount}</div>
						<div style={{ fontSize: '10px' }}>Parameters</div>
					</div>
					<div>
						<div style={{ fontWeight: '600' }}>{resourceCount}</div>
						<div style={{ fontSize: '10px' }}>Resources</div>
					</div>
				</div>
			</div>

			{/* Bottom handles for connections to parameters and resources */}
			<Handle
				type="source"
				position={Position.Bottom}
				style={{ background: '#4f46e5', left: '35%' }}
				id="template-to-params"
			/>
			<Handle
				type="source"
				position={Position.Bottom}
				style={{ background: '#059669', left: '65%' }}
				id="template-to-resources"
			/>
		</div>
	);
}

export default TemplateNode;
