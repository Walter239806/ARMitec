import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { Resource } from '../../types/template';

function ResourceNode(props: NodeProps) {
	const resource = props.data as Resource;

	// Function to safely display property values
	const displayPropertyValue = (value: any): string => {
		if (typeof value === 'string') return value;
		if (typeof value === 'number' || typeof value === 'boolean')
			return String(value);
		if (Array.isArray(value)) return `[${value.length} items]`;
		if (typeof value === 'object' && value !== null) return '{object}';
		return String(value);
	};

	// Get important properties to display (limit to avoid overcrowding)
	const getDisplayProperties = (
		properties: Record<string, unknown> | undefined
	) => {
		if (!properties) return [];

		const important = [
			'sku',
			'kind',
			'adminUsername',
			'vmSize',
			'imageReference',
		];
		const entries = Object.entries(properties);

		// First show important properties
		const importantProps = entries.filter(([key]) =>
			important.some((imp) => key.toLowerCase().includes(imp.toLowerCase()))
		);

		// Then add other properties up to a limit
		const otherProps = entries
			.filter(
				([key]) =>
					!important.some((imp) =>
						key.toLowerCase().includes(imp.toLowerCase())
					)
			)
			.slice(0, Math.max(0, 4 - importantProps.length));

		return [...importantProps, ...otherProps];
	};

	const displayProperties = getDisplayProperties(resource.properties);

	return (
		<div style={{ position: 'relative', width: '200px', minHeight: '100px' }}>
			<Handle
				type="target"
				position={Position.Top}
				style={{ background: '#555' }}
			/>
			<div
				style={{
					padding: '12px',
					background: '#ffffff',
					border: '2px solid #e1e5e9',
					borderRadius: '8px',
					width: '100%',
					maxHeight: '300px',
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
				}}
			>
				{/* Resource Name */}
				<strong
					style={{
						marginBottom: '8px',
						textAlign: 'center',
						fontSize: '14px',
						color: '#1f2937',
						wordBreak: 'break-word',
					}}
				>
					{resource.name}
				</strong>

				{/* Resource Type */}
				{resource.type && (
					<div
						style={{
							fontSize: '11px',
							color: '#6b7280',
							marginBottom: '8px',
							textAlign: 'center',
							fontFamily: 'monospace',
							background: '#f3f4f6',
							padding: '2px 6px',
							borderRadius: '4px',
							wordBreak: 'break-word',
						}}
					>
						{resource.type}
					</div>
				)}

				{/* Location */}
				{resource.location && (
					<div
						style={{
							fontSize: '11px',
							color: '#059669',
							marginBottom: '8px',
							textAlign: 'center',
							fontWeight: '500',
						}}
					>
						📍 {resource.location}
					</div>
				)}

				{/* Properties */}
				<div
					style={{
						fontSize: '11px',
						display: 'flex',
						flexDirection: 'column',
						gap: '4px',
					}}
				>
					{displayProperties.length > 0 ? (
						displayProperties.map(([key, value]) => (
							<div
								key={key}
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'flex-start',
									padding: '2px 0',
									borderBottom: '1px solid #f3f4f6',
								}}
							>
								<span
									style={{
										fontWeight: '500',
										color: '#374151',
										marginRight: '8px',
										flex: '0 0 auto',
									}}
								>
									{key}:
								</span>
								<span
									style={{
										color: '#6b7280',
										textAlign: 'right',
										wordBreak: 'break-word',
										flex: '1',
									}}
								>
									{displayPropertyValue(value)}
								</span>
							</div>
						))
					) : (
						<div
							style={{
								color: '#9ca3af',
								fontStyle: 'italic',
								textAlign: 'center',
							}}
						>
							No properties to display
						</div>
					)}
				</div>

				{/* Show if there are more properties */}
				{resource.properties &&
					Object.keys(resource.properties).length >
						displayProperties.length && (
						<div
							style={{
								fontSize: '10px',
								color: '#9ca3af',
								textAlign: 'center',
								marginTop: '4px',
								fontStyle: 'italic',
							}}
						>
							+
							{Object.keys(resource.properties).length -
								displayProperties.length}{' '}
							more properties
						</div>
					)}
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				style={{ background: '#555' }}
			/>
		</div>
	);
}

export default ResourceNode;
