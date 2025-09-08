export type ArmTemplate = {
	$schema: string;
	languageVersion?: string;
	contentVersion?: string;
	apiProfile?: string;
	definitions?: Record<string, unknown>;
	parameters?: Record<string, unknown>;
	variables?: Record<string, unknown>;
	functions?: unknown[];
	resources?: unknown[] | Record<string, unknown>;
	outputs?: Record<string, unknown>;
};

export type Resource = {
	name: string;
	type: string;
	location?: string;
	properties?: Record<string, unknown>;
};
