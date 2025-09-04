import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { Resource } from '../../types/template';

function ResourceNode(_: NodeProps) {
	let resource = _.data as Resource;

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
					style={{
						marginBottom: '6px',
						textAlign: 'center',
						fontSize: '90%',
					}}
				>
					{resource.name}
				</strong>
				{resource.type && <span>{resource.type}</span>}
				{resource.location && <span>{resource.location}</span>}
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
					{resource.properties ? (
						Object.keys(resource.properties).map((key, value) => (
							<li key={key}>
								<span>{key}</span>: {JSON.stringify(value)}
							</li>
						))
					) : (
						<li>No properties</li>
					)}
				</ul>
			</div>
			<Handle type="source" position={Position.Bottom} />
		</div>
	);
}

export default ResourceNode;
