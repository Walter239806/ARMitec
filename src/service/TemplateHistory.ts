import type { ArmTemplate } from '../types/template';

export interface HistoryNode {
	template: ArmTemplate;
	timestamp: Date;
	prev: HistoryNode | null;
	next: HistoryNode | null;
}

export class TemplateHistory {
	private head: HistoryNode | null = null;
	private tail: HistoryNode | null = null;
	private current: HistoryNode | null = null;
	private size: number = 0;
	private readonly maxSize: number = 10;

	constructor() {
		this.head = null;
		this.tail = null;
		this.current = null;
		this.size = 0;
	}

	/**
	 * Add a new template to the history
	 * If at max size, remove the oldest (head) and add to tail
	 * If adding a new template while not at the latest, remove all future nodes
	 */
	addTemplate(template: ArmTemplate): void {
		// Create deep copy to avoid reference issues
		const templateCopy = JSON.parse(JSON.stringify(template)) as ArmTemplate;
		
		const newNode: HistoryNode = {
			template: templateCopy,
			timestamp: new Date(),
			prev: null,
			next: null,
		};

		// If we're not at the latest node, remove all future nodes
		if (this.current && this.current.next) {
			this.removeNodesAfterCurrent();
		}

		// If list is empty
		if (!this.head) {
			this.head = newNode;
			this.tail = newNode;
			this.current = newNode;
			this.size = 1;
			return;
		}

		// If we're at max size, remove the head
		if (this.size >= this.maxSize) {
			this.removeHead();
		}

		// Add to tail
		newNode.prev = this.tail;
		if (this.tail) {
			this.tail.next = newNode;
		}
		this.tail = newNode;
		this.current = newNode;
		this.size++;
	}

	/**
	 * Move to the previous template in history
	 */
	moveToPrevious(): ArmTemplate | null {
		if (!this.current || !this.current.prev) {
			return null;
		}

		this.current = this.current.prev;
		return this.current.template;
	}

	/**
	 * Move to the next template in history
	 */
	moveToNext(): ArmTemplate | null {
		if (!this.current || !this.current.next) {
			return null;
		}

		this.current = this.current.next;
		return this.current.template;
	}

	/**
	 * Get the current template
	 */
	getCurrentTemplate(): ArmTemplate | null {
		return this.current ? this.current.template : null;
	}

	/**
	 * Check if there's a previous template
	 */
	hasPrevious(): boolean {
		return this.current !== null && this.current.prev !== null;
	}

	/**
	 * Check if there's a next template
	 */
	hasNext(): boolean {
		return this.current !== null && this.current.next !== null;
	}

	/**
	 * Get the current position in history (1-based)
	 */
	getCurrentPosition(): number {
		if (!this.current) return 0;

		let position = 1;
		let node = this.head;
		while (node && node !== this.current) {
			position++;
			node = node.next;
		}
		return position;
	}

	/**
	 * Get the total size of history
	 */
	getSize(): number {
		return this.size;
	}

	/**
	 * Clear all history
	 */
	clear(): void {
		this.head = null;
		this.tail = null;
		this.current = null;
		this.size = 0;
	}

	/**
	 * Get all templates in chronological order (for debugging)
	 */
	getAllTemplates(): ArmTemplate[] {
		const templates: ArmTemplate[] = [];
		let node = this.head;
		while (node) {
			templates.push(node.template);
			node = node.next;
		}
		return templates;
	}

	/**
	 * Remove the head node
	 */
	private removeHead(): void {
		if (!this.head) return;

		const oldHead = this.head;
		this.head = this.head.next;
		
		if (this.head) {
			this.head.prev = null;
		} else {
			// List became empty
			this.tail = null;
			this.current = null;
		}

		// If current was the head, move current
		if (this.current === oldHead) {
			this.current = this.head;
		}

		this.size--;
	}

	/**
	 * Remove all nodes after the current node
	 */
	private removeNodesAfterCurrent(): void {
		if (!this.current) return;

		let nodeToRemove = this.current.next;
		this.current.next = null;
		this.tail = this.current;

		// Count removed nodes and update size
		while (nodeToRemove) {
			const next = nodeToRemove.next;
			this.size--;
			nodeToRemove = next;
		}
	}
}