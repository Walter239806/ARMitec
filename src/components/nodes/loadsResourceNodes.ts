import { useArmTemplateStore } from '../../service/ParsedJSON';

export const loadResourceNodes = () => {
	const template = useArmTemplateStore((state) => state.template);

	return Array.isArray(template?.resources)
		? template.resources.map((resource: any, idx: number) => {
				console.log('Resource:', resource);
				return {
					id: `resource-${idx}`,
					type: 'resource',
					data: resource,
					position: { x: 300, y: 100 + idx * 120 },
				};
		  })
		: [];
};
