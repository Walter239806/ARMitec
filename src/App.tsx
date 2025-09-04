import Flow from './components/flow';
import { useEffect } from 'react';
import { useArmTemplateStore } from './service/ParsedJSON';
import armTemplateEx from './assets/armTemplateEx.json';
import type { ArmTemplate } from './types/template';

function App() {
	const setTemplate = useArmTemplateStore((state) => state.setTemplate);

	useEffect(() => {
		setTemplate(armTemplateEx as ArmTemplate);
	}, [setTemplate]);

	//const template = useArmTemplateStore((state) => state.template);
	//console.log(template);

	return (
		<div>
			<Flow />
		</div>
	);
}

export default App;
