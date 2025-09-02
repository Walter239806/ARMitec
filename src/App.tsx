import React, { useState } from 'react';

const App: React.FC = () => {
	const [armJson, setArmJson] = useState<string>('');
	const [diagram, setDiagram] = useState<any>(null);
	const [aiSummary, setAiSummary] = useState<string>('');
	const [error, setError] = useState<string>('');

	// Map resource type to emoji icon and color
	const resourceTypeInfo = (type: string) => {
		if (type.includes('storage')) return { icon: '🗄️', color: '#4f8a8b' };
		if (type.includes('virtualMachine'))
			return { icon: '🖥️', color: '#6a4fb8' };
		if (type.includes('network')) return { icon: '🌐', color: '#2d9cdb' };
		if (type.includes('sql')) return { icon: '🗃️', color: '#b84f6a' };
		if (type.includes('web')) return { icon: '🌎', color: '#4fb86a' };
		return { icon: '🔹', color: '#5c6f8c' };
	};

	// Parse ARM template to resource list with dependencies
	const parseArmTemplateToDiagram = (json: string) => {
		try {
			const obj = JSON.parse(json);
			if (!obj.resources || !Array.isArray(obj.resources)) return [];
			return obj.resources.map((r: any, idx: number) => ({
				name: r.name || `Resource ${idx + 1}`,
				type: r.type || 'Unknown',
				dependsOn: r.dependsOn || [],
			}));
		} catch (e) {
			setError('Invalid ARM template JSON');
			return [];
		}
	};

	// Handle file upload
	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError('');
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			const json = event.target?.result as string;
			setArmJson(json);
			const diagramData = parseArmTemplateToDiagram(json);
			setDiagram(diagramData);
			setAiSummary('AI summary will appear here (mock or browser API)');
		};
		reader.readAsText(file);
	};

	// Export diagram as ARM template JSON
	const handleExport = () => {
		const blob = new Blob([armJson], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'arm-template.json';
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div
			style={{
				minHeight: '100vh',
				width: '100vw',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				background: '#f4f6fb',
				fontFamily: 'Inter, sans-serif',
			}}
		>
			<div
				style={{
					background: '#fff',
					borderRadius: 12,
					boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
					padding: '2rem',
					maxWidth: 480,
					width: '100%',
					textAlign: 'center',
				}}
			>
				<h1 style={{ color: '#2d3a4b', marginBottom: 16 }}>
					ARMitect: Visual ARM Template Editor
				</h1>
				<input
					type="file"
					accept="application/json"
					onChange={handleFileUpload}
					style={{ marginBottom: 16 }}
				/>
				{error && (
					<div style={{ color: '#d32f2f', marginBottom: 12 }}>{error}</div>
				)}
				<div style={{ margin: '1rem 0' }}>
					{/* SVG diagram with icons, colors, and dependency arrows */}
					<div
						style={{
							border: '1px solid #e0e3e7',
							minHeight: 260,
							padding: 0,
							background: '#f9fafc',
							borderRadius: 8,
							color: '#2d3a4b',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							overflowX: 'auto',
						}}
					>
						{diagram && diagram.length > 0 ? (
							<svg
								width={Math.max(diagram.length * 180, 480)}
								height={220}
								style={{
									display: 'block',
									margin: '0 auto',
									background: '#f9fafc',
									borderRadius: 8,
								}}
							>
								{/* Draw dependency arrows */}
								{diagram.map((r: any, idx: number) => {
									const x = 90 + idx * 160;
									const y = 110;
									// Find indices of dependencies
									return r.dependsOn.map((dep: string) => {
										const depIdx = diagram.findIndex(
											(d: any) => d.name === dep
										);
										if (depIdx === -1) return null;
										const depX = 90 + depIdx * 160;
										return (
											<g key={dep + '-' + r.name}>
												<line
													x1={depX + 80}
													y1={y}
													x2={x}
													y2={y}
													stroke="#b84f6a"
													strokeWidth={2}
													markerEnd="url(#arrowhead)"
												/>
											</g>
										);
									});
								})}
								{/* Arrowhead marker */}
								<defs>
									<marker
										id="arrowhead"
										markerWidth="8"
										markerHeight="8"
										refX="6"
										refY="4"
										orient="auto"
										markerUnits="strokeWidth"
									>
										<path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#b84f6a" />
									</marker>
								</defs>
								{/* Draw resource nodes */}
								{diagram.map((r: any, idx: number) => {
									const x = 90 + idx * 160;
									const y = 110;
									const info = resourceTypeInfo(r.type);
									return (
										<g key={idx}>
											{/* Node box */}
											<rect
												x={x}
												y={y - 40}
												width={100}
												height={80}
												rx={16}
												fill={info.color}
												stroke="#5c6f8c"
												strokeWidth={2}
											/>
											{/* Icon */}
											<text
												x={x + 50}
												y={y - 12}
												textAnchor="middle"
												fontSize={32}
											>
												{info.icon}
											</text>
											{/* Resource name */}
											<text
												x={x + 50}
												y={y + 16}
												textAnchor="middle"
												fontWeight="bold"
												fontSize={15}
												fill="#fff"
											>
												{r.name}
											</text>
											{/* Resource type */}
											<text
												x={x + 50}
												y={y + 36}
												textAnchor="middle"
												fontSize={12}
												fill="#e3eaf5"
											>
												{r.type}
											</text>
										</g>
									);
								})}
							</svg>
						) : (
							<span style={{ color: '#5c6f8c', padding: 16 }}>
								Upload an ARM template to visualize its structure.
							</span>
						)}
					</div>
				</div>
				<button
					onClick={handleExport}
					disabled={!armJson}
					style={{
						marginRight: 8,
						background: '#2d3a4b',
						color: '#fff',
						border: 'none',
						borderRadius: 6,
						padding: '10px 20px',
						fontWeight: 600,
						cursor: armJson ? 'pointer' : 'not-allowed',
						boxShadow: armJson ? '0 1px 4px rgba(45,58,75,0.08)' : 'none',
						transition: 'background 0.2s',
					}}
				>
					Export as ARM JSON
				</button>
				<div style={{ marginTop: 16, textAlign: 'left' }}>
					<strong style={{ color: '#2d3a4b' }}>AI Summary:</strong>
					<div
						style={{
							background: '#e3eaf5',
							padding: 8,
							borderRadius: 4,
							color: '#2d3a4b',
							marginTop: 4,
						}}
					>
						{aiSummary}
					</div>
				</div>
			</div>
		</div>
	);
};

export default App;
