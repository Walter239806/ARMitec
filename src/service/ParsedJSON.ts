import { create } from 'zustand';
import type { ArmTemplate } from '../types/template';
import { useTemplateHistoryStore } from './TemplateHistoryStore';

export interface ArmTemplateState {
	template: ArmTemplate | null;
	setTemplate: (template: ArmTemplate | null, addToHistory?: boolean) => void;
}

export const useArmTemplateStore = create<ArmTemplateState>((set, get) => ({
	template: null,
	setTemplate: (template: ArmTemplate | null, addToHistory: boolean = true) => {
		set({ template });
		
		// Add to history if template is not null and addToHistory is true
		if (template && addToHistory) {
			// We need to access the history store instance
			// This will be called from components that have access to the hook
			const historyStore = useTemplateHistoryStore.getState();
			historyStore.addTemplate(template);
		}
	},
}));
