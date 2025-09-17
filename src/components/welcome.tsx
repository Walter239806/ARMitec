import React, { useRef, useState } from 'react';
import {
	TextField,
	Button,
	Typography,
	Box,
	Container,
	Paper
} from '@mui/material';
import {
	Create as CreateIcon,
	Upload as UploadIcon
} from '@mui/icons-material';
import { useArmTemplateStore } from '../service/ParsedJSON';
import { createTemplate } from '../service/CopilotChat';
import type { ArmTemplate } from '../types/template';

const Welcome = () => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const setTemplate = useArmTemplateStore((state) => state.setTemplate);
	const [ideaText, setIdeaText] = useState(
		'Create a secure web application with Azure App Service, including SSL certificate, custom domain support, Application Insights monitoring, and auto-scaling capabilities.'
	);

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
			console.log(template);

			// Force a page reload to trigger the App component's file check
			window.location.reload();
		} catch (error) {
			console.error('Error importing ARM template:', error);
			alert(
				"Failed to import ARM template. Please ensure it's a valid JSON file with proper ARM template structure."
			);
		}
	};

	const handleDraftClick = async () => {
		if (!ideaText.trim()) {
			alert('Please enter your idea.');
			return;
		}

		try {
			const generatedTemplate = await createTemplate(ideaText);
			const template = generatedTemplate.template as ArmTemplate;
			console.log('Generated Template:', template);
			// Basic validation for ARM template
			if (!template.$schema) {
				throw new Error('Invalid ARM template: missing $schema property');
			} else {
				// Store in browser storage
				localStorage.setItem('armTemplate', JSON.stringify(template));

				// Create chat messages for the initial idea and AI response
				const userMessage = {
					id: Date.now().toString(),
					content: ideaText,
					role: 'user' as const,
					timestamp: new Date()
				};

				const aiMessage = {
					id: (Date.now() + 1).toString(),
					content: `I've generated an ARM template based on your idea: "${ideaText}". The template has been created and is now loaded in the editor.`,
					role: 'assistant' as const,
					timestamp: new Date()
				};

				const chatMessages = [userMessage, aiMessage];
				localStorage.setItem('chatMessages', JSON.stringify(chatMessages));

				// Update the store
				setTemplate(template);
				console.log(template);

				// Force a page reload to trigger the App component's file check
				window.location.reload();
			}
		} catch (error) {
			console.error('Error generating ARM template:', error);
			alert('Failed to generate ARM template. Please try again later.');
		}
	};

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Paper
				elevation={3}
				sx={{
					p: 4,
					textAlign: 'center',
					backgroundColor: '#f9f9f9',
					borderRadius: 2
				}}
			>
				<Typography variant="h3" component="h1" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
					Welcome to ARMitec
				</Typography>

				<Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
					Your one-stop solution for ARM template management.
				</Typography>

				<Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
					Get started by creating or importing an ARM template.
				</Typography>

				<Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
					You can start typing your idea here and copilot will draft it for you.
				</Typography>

				<Box sx={{ mb: 3 }}>
					<TextField
						fullWidth
						multiline
						rows={4}
						value={ideaText}
						onChange={(e) => setIdeaText(e.target.value)}
						placeholder="Type your idea here..."
						variant="outlined"
						sx={{
							mb: 2,
							'& .MuiOutlinedInput-root': {
								backgroundColor: 'white',
								fontSize: '16px',
							},
						}}
					/>

					<Button
						startIcon={<CreateIcon />}
						onClick={handleDraftClick}
						variant="contained"
						color="primary"
						size="large"
						sx={{
							minWidth: '200px',
							fontSize: '16px',
							py: 1.5,
						}}
					>
						Draft ARM Template
					</Button>
				</Box>

				<Typography variant="h6" color="text.secondary" sx={{ my: 2 }}>
					OR
				</Typography>

				<Box>
					<Button
						startIcon={<UploadIcon />}
						onClick={handleFileImport}
						variant="outlined"
						color="primary"
						size="large"
						sx={{
							minWidth: '200px',
							fontSize: '16px',
							py: 1.5,
						}}
					>
						Import ARM Template
					</Button>
				</Box>

				<input
					ref={fileInputRef}
					type="file"
					accept=".json"
					onChange={handleFileChange}
					style={{ display: 'none' }}
				/>
			</Paper>
		</Container>
	);
};

export default Welcome;
