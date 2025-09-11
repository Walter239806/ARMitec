import Flow from './components/flow';
import { useEffect, useState } from 'react';
import { useArmTemplateStore } from './service/ParsedJSON';
import type { ArmTemplate } from './types/template';
import Welcome from './components/welcome';

function App() {
	const [fileExists, setFileExists] = useState<boolean | null>(null);
	const setTemplate = useArmTemplateStore((state) => state.setTemplate);

	useEffect(() => {
		const checkFile = async () => {
			try {
				// First check if there's a template in localStorage
				const storedTemplate = localStorage.getItem('armTemplate');
				if (storedTemplate) {
					const template = JSON.parse(storedTemplate) as ArmTemplate;
					setFileExists(true);
					setTemplate(template);
					return;
				}

				// If no stored template, try to fetch from assets
				const response = await fetch('./assets/armTemplateEx.json');
				if (!response.ok) {
					setFileExists(false);
					return;
				}
				const data = await response.json();
				setFileExists(true);
				setTemplate(data as ArmTemplate);
			} catch (error) {
				console.error('Error fetching the file:', error);
				setFileExists(false);
			}
		};
		
		checkFile();
	}, [setTemplate]);

	if (fileExists === null) {
		return <div>Loading...</div>;
	}

	if (!fileExists) {
		return <Welcome />;
	}

	//const template = useArmTemplateStore((state) => state.template);
	//console.log(template);

	return (
		<div>
			<Flow />)
		</div>
	);
}

export default App;
