import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { useArmTemplateStore } from '../../service/ParsedJSON';

type Parameter = { key: string; description: string };

function ParameterNode(_: NodeProps) {
	const template = useArmTemplateStore((state) => state.template);

	let parameters: Parameter[] = [];
	if (template && template.parameters) {
		parameters = Object.entries(template.parameters).map(([key, value]) => {
			const param = value as { metadata?: { description?: string } };
			return {
				key,
				description: param.metadata?.description || '',
			};
		});
	}

	return (
		<div style={{ position: 'relative', width: '180px', minHeight: '80px' }}>
			{/* Handles flush with the box edge */}
			<Handle type="target" position={Position.Top} />
			<div
				style={{
					padding: '8px 8px',
					background: '#fff',
					border: '1px solid #888',
					borderRadius: '7px',
					width: '100%',
					maxHeight: '200px',
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'stretch',
					justifyContent: 'flex-start',
				}}
			>
				<strong
					style={{ marginBottom: '6px', textAlign: 'center', fontSize: '90%' }}
				>
					Parameters
				</strong>
				<ul
					style={{
						margin: 0,
						padding: 0,
						listStyle: 'none',
						display: 'flex',
						flexDirection: 'column',
						gap: '6px',
						fontSize: '90%',
					}}
				>
					{parameters.length > 0 ? (
						parameters.map((param) => (
							<li key={param.key} style={{ wordBreak: 'break-word' }}>
								<span style={{ fontWeight: 500 }}>{param.key}</span>
								{param.description && (
									<span style={{ color: '#666' }}> — {param.description}</span>
								)}
							</li>
						))
					) : (
						<li style={{ color: '#999' }}>No parameters</li>
					)}
				</ul>
			</div>
			<Handle type="source" position={Position.Bottom} />
		</div>
	);
}

export default ParameterNode;
