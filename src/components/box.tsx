import { useState, useRef } from 'react';
import { Box, IconButton, Fab, Slide } from '@mui/material';
import { Chat as ChatIcon, Close as CloseIcon } from '@mui/icons-material';
// Update the path below to the correct location and filename for ChatBox
import ChatBox from './chatComponents/chatBox';
import type { ChatBoxRef } from './chatComponents/chatBox';
import Flow from './flow';
import { LeftDrawer } from './LeftDrawer';
import { MenuBar } from './MenuBar';
import { useArmTemplateStore } from '../service/ParsedJSON';
import { useTemplateHistoryStore } from '../service/TemplateHistoryStore';
import type { ArmTemplate } from '../types/template';

export function BoxLayout() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [chatOpen, setChatOpen] = useState(false);
	const chatBoxRef = useRef<ChatBoxRef>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const template = useArmTemplateStore((state) => state.template);
	const setTemplate = useArmTemplateStore((state) => state.setTemplate);

	// History store
	const { canGoBack, canGoForward, goToPrevious, goToNext, clearHistory } =
		useTemplateHistoryStore();

	console.log('BoxLayout render - chatOpen:', chatOpen);

	const toggleDrawer = () => {
		setDrawerOpen(!drawerOpen);
	};

	const toggleChat = () => {
		setChatOpen(!chatOpen);
	};

	const handleFileImport = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const template = JSON.parse(text) as ArmTemplate;

			// Basic validation for ARM template
			if (!template.$schema) {
				throw new Error('Invalid ARM template: missing $schema property');
			}

			// Store in browser storage
			localStorage.setItem('armTemplate', JSON.stringify(template));

			// Update the store
			setTemplate(template);
			console.log('Template imported successfully:', template);
		} catch (error) {
			console.error('Error importing ARM template:', error);
			alert(
				"Failed to import ARM template. Please ensure it's a valid JSON file with proper ARM template structure."
			);
		}

		// Clear the input to allow re-importing the same file
		if (event.target) {
			event.target.value = '';
		}
	};

	const handleExportTemplate = () => {
		// Get template from store first, fallback to localStorage
		let templateToExport = template;

		if (!templateToExport) {
			const storedTemplate = localStorage.getItem('armTemplate');
			if (storedTemplate) {
				try {
					templateToExport = JSON.parse(storedTemplate);
				} catch (error) {
					console.error('Error parsing stored template:', error);
				}
			}
		}

		if (!templateToExport) {
			alert(
				'No template available to export. Please create or import a template first.'
			);
			return;
		}

		try {
			// Convert template to JSON string with formatting
			const jsonString = JSON.stringify(templateToExport, null, 2);

			// Create blob and download link
			const blob = new Blob([jsonString], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			// Create temporary download link
			const downloadLink = document.createElement('a');
			downloadLink.href = url;
			downloadLink.download = 'arm-template.json';
			document.body.appendChild(downloadLink);
			downloadLink.click();

			// Cleanup
			document.body.removeChild(downloadLink);
			URL.revokeObjectURL(url);

			console.log('Template exported successfully');
		} catch (error) {
			console.error('Error exporting template:', error);
			alert('Failed to export template. Please try again.');
		}
	};

	const handleFileAction = (action: 'new' | 'open' | 'save' | 'export') => {
		console.log('File action:', action);

		switch (action) {
			case 'new':
				// Clear the current template and localStorage
				setTemplate(null, false); // Don't add null to history
				localStorage.removeItem('armTemplate');
				localStorage.removeItem('chatMessages');
				clearHistory(); // Clear the history when creating new
				console.log('Template cleared - new file created');
				break;
			case 'open':
				handleFileImport();
				break;
			case 'save':
				// TODO: Implement save functionality
				break;
			case 'export':
				handleExportTemplate();
				break;
		}
	};

	const handleEditAction = (action: 'prev' | 'next') => {
		console.log('Edit action:', action);

		switch (action) {
			case 'prev':
				if (canGoBack) {
					const prevTemplate = goToPrevious();
					if (prevTemplate) {
						setTemplate(prevTemplate, false); // Don't add to history when navigating
						localStorage.setItem('armTemplate', JSON.stringify(prevTemplate));
					}
				}
				break;
			case 'next':
				if (canGoForward) {
					const nextTemplate = goToNext();
					if (nextTemplate) {
						setTemplate(nextTemplate, false); // Don't add to history when navigating
						localStorage.setItem('armTemplate', JSON.stringify(nextTemplate));
					}
				}
				break;
		}
	};

	return (
		<Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
			<MenuBar
				onFileAction={handleFileAction}
				onEditAction={handleEditAction}
				canGoBack={canGoBack}
				canGoForward={canGoForward}
			/>
			<LeftDrawer drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />

			{/* Main Content Area */}
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					transition: 'margin-left 0.3s',
					marginLeft: drawerOpen ? '400px' : '0px',
					marginRight: chatOpen ? '300px' : '0px',
					position: 'relative',
					overflow: 'hidden',
					height: '100vh',
					width: '100%',
				}}
			>
				<Flow />
			</Box>
			{/* Right Chat Toggle Button */}
			{!chatOpen && (
				<Fab
					color="primary"
					onClick={toggleChat}
					sx={{
						position: 'fixed',
						bottom: 16,
						right: 16,
						zIndex: 1200,
					}}
				>
					<ChatIcon />
				</Fab>
			)}
			{/* Right Chat Panel */}
			{chatOpen && (
				<Slide direction="left" in={chatOpen} mountOnEnter unmountOnExit>
					<Box
						sx={{
							position: 'fixed',
							top: 0,
							right: 0,
							height: '100%',
							width: 400,
							backgroundColor: 'white',
							boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
							zIndex: 1100,
							display: 'flex',
							flexDirection: 'column',
						}}
					>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								p: 2,
								borderBottom: '1px solid #e0e0e0',
								color: 'black',
							}}
						>
							<h3>Chat Assistant</h3>
							<Box sx={{ display: 'flex', gap: 1 }}>
								{/* <IconButton
									size="small"
									onClick={() => chatBoxRef.current?.clearChat()}
									title="Clear Chat"
								>
									<ClearIcon fontSize="small" />
								</IconButton> */}
								<IconButton onClick={toggleChat} title="Close Chat">
									<CloseIcon />
								</IconButton>
							</Box>
						</Box>
						<Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'end' }}>
							<ChatBox ref={chatBoxRef} className="w-full h-full" />
						</Box>
					</Box>
				</Slide>
			)}

			{/* Hidden file input for importing templates */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".json"
				onChange={handleFileChange}
				style={{ display: 'none' }}
			/>
		</Box>
	);
}
