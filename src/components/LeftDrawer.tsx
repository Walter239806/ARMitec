import { useState, useEffect } from 'react';
import {
	Box,
	Drawer,
	IconButton,
	Fab,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Typography,
	CircularProgress,
	Alert,
} from '@mui/material';
import {
	Menu as MenuIcon,
	Close as CloseIcon,
	ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface LeftDrawerProps {
	drawerOpen: boolean;
	toggleDrawer: () => void;
}

interface ResourceSchema {
	[key: string]: any;
}

interface ResourceType {
	type: string;
	schema?: ResourceSchema;
	loading?: boolean;
	error?: string;
}

export function LeftDrawer({ drawerOpen, toggleDrawer }: LeftDrawerProps) {
	const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (drawerOpen) {
			fetchAvailableTypes();
		}
	}, [drawerOpen]);

	const fetchAvailableTypes = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await axios.get(
				'http://localhost:3001/api/arm-templates/available-types'
			);
			console.log('Fetched resource types:', response.data);
			const types = response.data.resourceTypes.map((type: string) => ({
				type,
				loading: false,
			}));
			setResourceTypes(types);
		} catch (err) {
			console.error('Error fetching available types:', err);
			setError('Failed to load resource types');
		} finally {
			setLoading(false);
		}
	};

	const fetchResourceSchema = async (resourceType: string) => {
		setResourceTypes((prev) =>
			prev.map((rt) =>
				rt.type === resourceType
					? { ...rt, loading: true, error: undefined }
					: rt
			)
		);

		try {
			const encodedResourceType = encodeURIComponent(resourceType);
			const response = await axios.get(
				`http://localhost:3001/api/arm-templates/resource/${encodedResourceType}/schema`
			);
			setResourceTypes((prev) =>
				prev.map((rt) =>
					rt.type === resourceType
						? { ...rt, schema: response.data.schema, loading: false }
						: rt
				)
			);
		} catch (err) {
			console.error(`Error fetching schema for ${resourceType}:`, err);
			setResourceTypes((prev) =>
				prev.map((rt) =>
					rt.type === resourceType
						? { ...rt, loading: false, error: 'Failed to load schema' }
						: rt
				)
			);
		}
	};

	const renderPropertyDropdown = (properties: any, depth: number = 0) => {
		if (!properties || typeof properties !== 'object') return null;

		return Object.entries(properties).map(([key, value]: [string, any]) => {
			const hasNestedProperties =
				value &&
				typeof value === 'object' &&
				(value.properties || value.items?.properties);

			return (
				<Accordion key={key} sx={{ ml: depth * 2 }}>
					<AccordionSummary
						expandIcon={hasNestedProperties ? <ExpandMoreIcon /> : null}
					>
						<Typography
							variant="body2"
							sx={{ fontWeight: depth === 0 ? 'bold' : 'normal' }}
						>
							{key}
							{value.type && (
								<Typography
									component="span"
									variant="caption"
									sx={{ ml: 1, color: 'text.secondary' }}
								>
									({value.type})
								</Typography>
							)}
						</Typography>
					</AccordionSummary>
					{hasNestedProperties && (
						<AccordionDetails sx={{ p: 1 }}>
							{value.properties &&
								renderPropertyDropdown(value.properties, depth + 1)}
							{value.items?.properties &&
								renderPropertyDropdown(value.items.properties, depth + 1)}
						</AccordionDetails>
					)}
				</Accordion>
			);
		});
	};

	return (
		<>
			{/* Left Drawer */}
			<Drawer
				variant="persistent"
				anchor="left"
				open={drawerOpen}
				sx={{
					width: 0,
					flexShrink: 0,
					'& .MuiDrawer-paper': {
						width: 400,
						boxSizing: 'border-box',
						backgroundColor: '#f5f5f5',
					},
				}}
			>
				<Box sx={{ p: 2 }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							mb: 2,
						}}
					>
						<h3>ARM Resources</h3>
						<IconButton onClick={toggleDrawer}>
							<CloseIcon />
						</IconButton>
					</Box>

					{loading && (
						<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
							<CircularProgress />
						</Box>
					)}

					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}

					{!loading && !error && (
						<Box sx={{ maxHeight: 'calc(100vh - 120px)', overflow: 'auto' }}>
							{resourceTypes.map((resourceType) => (
								<Accordion
									key={resourceType.type}
									onChange={(_, expanded) => {
										if (
											expanded &&
											!resourceType.schema &&
											!resourceType.loading
										) {
											fetchResourceSchema(resourceType.type);
										}
									}}
								>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Typography
											variant="h6"
											sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}
										>
											{resourceType.type}
										</Typography>
									</AccordionSummary>
									<AccordionDetails sx={{ p: 1 }}>
										{resourceType.loading && (
											<Box
												sx={{ display: 'flex', justifyContent: 'center', p: 1 }}
											>
												<CircularProgress size={20} />
											</Box>
										)}

										{resourceType.error && (
											<Alert severity="error" sx={{ mb: 1 }}>
												{resourceType.error}
											</Alert>
										)}

										{resourceType.schema && resourceType.schema.properties && (
											<Box>
												{renderPropertyDropdown(resourceType.schema.properties)}
											</Box>
										)}
									</AccordionDetails>
								</Accordion>
							))}
						</Box>
					)}
				</Box>
			</Drawer>

			{/* Left Drawer Toggle Button */}
			{!drawerOpen && (
				<Fab
					color="primary"
					size="small"
					onClick={toggleDrawer}
					sx={{
						position: 'fixed',
						top: 16,
						left: 16,
						zIndex: 1200,
					}}
				>
					<MenuIcon />
				</Fab>
			)}
		</>
	);
}
