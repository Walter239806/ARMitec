import { create } from 'zustand';
import type { ArmTemplate } from '../types/template';

export interface ArmTemplateState {
	template: ArmTemplate | null;
	setTemplate: (template: ArmTemplate) => void;
}

export const useArmTemplateStore = create<ArmTemplateState>((set) => ({
	template: null,
	setTemplate: (template: ArmTemplate | null) => set({ template }),
}));
