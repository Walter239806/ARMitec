import React, { useRef } from 'react';
import { useArmTemplateStore } from '../service/ParsedJSON';
import type { ArmTemplate } from '../types/template';

const Welcome = () => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const setTemplate = useArmTemplateStore((state) => state.setTemplate);

	const handleFileImport = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
			
			// Force a page reload to trigger the App component's file check
			window.location.reload();
		} catch (error) {
			console.error('Error importing ARM template:', error);
			alert('Failed to import ARM template. Please ensure it\'s a valid JSON file with proper ARM template structure.');
		}
	};

	const handleReload = () => {
		window.location.reload();
	};

	return (
		<div>
			<h1>Welcome to ARMitec</h1>
			<p>Your one-stop solution for ARM template management.</p>
			<p>Get started by creating or importing an ARM template.</p>
			
			<div style={{ marginTop: '20px' }}>
				<button onClick={handleFileImport} style={{ marginRight: '10px' }}>
					Import ARM Template
				</button>
				<button onClick={handleReload}>
					Reload
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
