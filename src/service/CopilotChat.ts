import axios from 'axios';

export const createTemplate = async (idea: string) => {
	try {
		const response = await axios
			.post('http://localhost:3001/api/chat/generate-template', {
				requirements: idea,
			})
			.then((res) => res.data);
		console.log('API Response:', response);
		return response.data;
	} catch (error) {
		console.error('Error creating template:', error);
		throw error;
	}
};
