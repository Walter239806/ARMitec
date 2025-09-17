import { useState } from 'react';
import {
	Button,
	Menu,
	MenuItem,
	Typography,
	Box,
} from '@mui/material';
import {
	ArrowDropDown as ArrowDropDownIcon,
	Description as NewIcon,
	FolderOpen as OpenIcon,
	Save as SaveIcon,
	GetApp as ExportIcon,
	ArrowBack as PrevIcon,
	ArrowForward as NextIcon,
} from '@mui/icons-material';

interface MenuBarProps {
	onFileAction?: (action: 'new' | 'open' | 'save' | 'export') => void;
	onEditAction?: (action: 'prev' | 'next') => void;
}

export function MenuBar({ onFileAction, onEditAction }: MenuBarProps) {
	const [fileMenuAnchor, setFileMenuAnchor] = useState<null | HTMLElement>(null);
	const [editMenuAnchor, setEditMenuAnchor] = useState<null | HTMLElement>(null);

	const handleFileMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
		setFileMenuAnchor(event.currentTarget);
	};

	const handleEditMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
		setEditMenuAnchor(event.currentTarget);
	};

	const handleFileMenuClose = () => {
		setFileMenuAnchor(null);
	};

	const handleEditMenuClose = () => {
		setEditMenuAnchor(null);
	};

	const handleFileAction = (action: 'new' | 'open' | 'save' | 'export') => {
		onFileAction?.(action);
		handleFileMenuClose();
	};

	const handleEditAction = (action: 'prev' | 'next') => {
		onEditAction?.(action);
		handleEditMenuClose();
	};

	return (
		<Box
			sx={{
				height: '48px',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				padding: '0 16px',
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 1000,
			}}
		>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 0,
				}}
			>
					{/* File Menu */}
					<Button
						onClick={handleFileMenuOpen}
						endIcon={<ArrowDropDownIcon />}
						sx={{
							color: '#333',
							textTransform: 'none',
							fontSize: '14px',
							fontWeight: 'normal',
							minWidth: 'auto',
							padding: '4px 12px',
							backgroundColor: 'rgba(255, 255, 255, 0.9)',
							border: '1px solid rgba(0, 0, 0, 0.1)',
							borderRadius: '4px',
							margin: '0 2px',
							'&:hover': {
								backgroundColor: 'rgba(255, 255, 255, 0.95)',
								boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
							},
						}}
					>
						File
					</Button>
					<Menu
						anchorEl={fileMenuAnchor}
						open={Boolean(fileMenuAnchor)}
						onClose={handleFileMenuClose}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'left',
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'left',
						}}
					>
						<MenuItem onClick={() => handleFileAction('new')}>
							<NewIcon sx={{ mr: 1, fontSize: '18px' }} />
							<Typography variant="body2">New</Typography>
						</MenuItem>
						<MenuItem onClick={() => handleFileAction('open')}>
							<OpenIcon sx={{ mr: 1, fontSize: '18px' }} />
							<Typography variant="body2">Open</Typography>
						</MenuItem>
						<MenuItem onClick={() => handleFileAction('save')}>
							<SaveIcon sx={{ mr: 1, fontSize: '18px' }} />
							<Typography variant="body2">Save</Typography>
						</MenuItem>
						<MenuItem onClick={() => handleFileAction('export')}>
							<ExportIcon sx={{ mr: 1, fontSize: '18px' }} />
							<Typography variant="body2">Export</Typography>
						</MenuItem>
					</Menu>

					{/* Edit Menu */}
					<Button
						onClick={handleEditMenuOpen}
						endIcon={<ArrowDropDownIcon />}
						sx={{
							color: '#333',
							textTransform: 'none',
							fontSize: '14px',
							fontWeight: 'normal',
							minWidth: 'auto',
							padding: '4px 12px',
							backgroundColor: 'rgba(255, 255, 255, 0.9)',
							border: '1px solid rgba(0, 0, 0, 0.1)',
							borderRadius: '4px',
							margin: '0 2px',
							'&:hover': {
								backgroundColor: 'rgba(255, 255, 255, 0.95)',
								boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
							},
						}}
					>
						Edit
					</Button>
					<Menu
						anchorEl={editMenuAnchor}
						open={Boolean(editMenuAnchor)}
						onClose={handleEditMenuClose}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'left',
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'left',
						}}
					>
						<MenuItem onClick={() => handleEditAction('prev')}>
							<PrevIcon sx={{ mr: 1, fontSize: '18px' }} />
							<Typography variant="body2">Previous</Typography>
						</MenuItem>
						<MenuItem onClick={() => handleEditAction('next')}>
							<NextIcon sx={{ mr: 1, fontSize: '18px' }} />
							<Typography variant="body2">Next</Typography>
						</MenuItem>
					</Menu>
			</Box>
		</Box>
	);
}