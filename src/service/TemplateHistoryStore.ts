import { create } from 'zustand';
import type { ArmTemplate } from '../types/template';
import { TemplateHistory } from './TemplateHistory';

interface TemplateHistoryState {
	history: TemplateHistory;
	currentTemplate: ArmTemplate | null;
	canGoBack: boolean;
	canGoForward: boolean;
	currentPosition: number;
	totalCount: number;
	
	// Actions
	addTemplate: (template: ArmTemplate) => void;
	goToPrevious: () => ArmTemplate | null;
	goToNext: () => ArmTemplate | null;
	clearHistory: () => void;
	updateNavigationState: () => void;
}

export const useTemplateHistoryStore = create<TemplateHistoryState>((set, get) => {
	const history = new TemplateHistory();

	const updateNavigationState = () => {
		const currentState = get();
		const currentTemplate = currentState.history.getCurrentTemplate();
		const canGoBack = currentState.history.hasPrevious();
		const canGoForward = currentState.history.hasNext();
		const currentPosition = currentState.history.getCurrentPosition();
		const totalCount = currentState.history.getSize();

		set({
			currentTemplate,
			canGoBack,
			canGoForward,
			currentPosition,
			totalCount,
		});
	};

	return {
		history,
		currentTemplate: null,
		canGoBack: false,
		canGoForward: false,
		currentPosition: 0,
		totalCount: 0,

		addTemplate: (template: ArmTemplate) => {
			const state = get();
			
			// Only add if template is different from current
			const currentTemplate = state.history.getCurrentTemplate();
			if (currentTemplate && JSON.stringify(currentTemplate) === JSON.stringify(template)) {
				return; // Don't add duplicate templates
			}

			state.history.addTemplate(template);
			updateNavigationState();
			
			console.log(`Template added to history. Position: ${state.history.getCurrentPosition()}/${state.history.getSize()}`);
		},

		goToPrevious: (): ArmTemplate | null => {
			const state = get();
			const previousTemplate = state.history.moveToPrevious();
			
			if (previousTemplate) {
				updateNavigationState();
				console.log(`Moved to previous template. Position: ${state.history.getCurrentPosition()}/${state.history.getSize()}`);
				return previousTemplate;
			}
			
			return null;
		},

		goToNext: (): ArmTemplate | null => {
			const state = get();
			const nextTemplate = state.history.moveToNext();
			
			if (nextTemplate) {
				updateNavigationState();
				console.log(`Moved to next template. Position: ${state.history.getCurrentPosition()}/${state.history.getSize()}`);
				return nextTemplate;
			}
			
			return null;
		},

		clearHistory: () => {
			const state = get();
			state.history.clear();
			updateNavigationState();
			console.log('Template history cleared');
		},

		updateNavigationState,
	};
});