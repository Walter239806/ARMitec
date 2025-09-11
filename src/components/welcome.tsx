import React, { useRef } from 'react';
import { useArmTemplateStore } from '../service/ParsedJSON';
import { createTemplate } from '../service/CopilotChat';
import type { ArmTemplate } from '../types/template';

const Welcome = () => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const setTemplate = useArmTemplateStore((state) => state.setTemplate);

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
		const idea = (document.querySelector('textarea') as HTMLTextAreaElement)
			.value;
		if (!idea) {
			alert('Please enter your idea.');
			return;
		}

		try {
			const generatedTemplate = await createTemplate(idea);
			const template = generatedTemplate.template as ArmTemplate;
			console.log('Generated Template:', template);
			// Basic validation for ARM template
			if (!template.$schema) {
				throw new Error('Invalid ARM template: missing $schema property');
			} else {
				// Store in browser storage
				localStorage.setItem('armTemplate', JSON.stringify(template));

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
		<div style={{ padding: '20px', textAlign: 'center' }}>
			<h1>Welcome to ARMitec</h1>
			<p>Your one-stop solution for ARM template management.</p>
			<p>Get started by creating or importing an ARM template.</p>
			<p>
				You can start typing your idea here and copilot will draft it for you.
			</p>
			<div>
				<textarea
					style={{
						width: '100%',
						padding: '10px',
						borderRadius: '5px',
						border: '1px solid #ccc',
						fontSize: '16px',
					}}
					rows={4}
					placeholder="Type your idea here..."
					value={
						'Create a secure web application with Azure App Service, including SSL certificate, custom domain support, Application Insights monitoring, and auto-scaling capabilities.'
					}
				/>
				<button style={{ marginTop: '10px' }} onClick={handleDraftClick}>
					Draft ARM Template
				</button>
			</div>
			<p>OR</p>
			<div style={{ marginTop: '20px' }}>
				<button onClick={handleFileImport} style={{ marginRight: '10px' }}>
					Import ARM Template
				</button>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept=".json"
				onChange={handleFileChange}
				style={{ display: 'none' }}
			/>
		</div>
	);
};

export default Welcome;
