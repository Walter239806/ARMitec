import axios from 'axios';
import React, {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import {
	TextField,
	Button,
	Typography,
	Card,
	CardContent,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useArmTemplateStore } from '../../service/ParsedJSON';
import { useTemplateHistoryStore } from '../../service/TemplateHistoryStore';
import DeleteIcon from '@mui/icons-material/Delete';

interface Message {
	id: string;
	content: string;
	role: 'user' | 'assistant';
	timestamp: Date;
}

interface ChatBoxProps {
	placeholder?: string;
	className?: string;
	onMessageSend?: (message: string) => void;
}

export interface ChatBoxRef {
	clearChat: () => void;
}

const ChatBox = forwardRef<ChatBoxRef, ChatBoxProps>(
	(
		{
			placeholder = 'Ask me anything about ARM templates...',
			className = '',
			onMessageSend,
		},
		ref
	) => {
		const [messages, setMessages] = useState<Message[]>([]);
		const [inputText, setInputText] = useState('');
		const [isLoading, setIsLoading] = useState(false);
		const messagesEndRef = useRef<HTMLDivElement>(null);
		const inputRef = useRef<HTMLInputElement>(null);

		// Get the setTemplate function from the store
		const setTemplate = useArmTemplateStore((state) => state.setTemplate);

		// Get the template history store functions
		const { addTemplate: addToHistory } = useTemplateHistoryStore();

		// Load persisted messages on component mount
		useEffect(() => {
			const savedMessages = localStorage.getItem('chatMessages');
			if (savedMessages) {
				try {
					const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
						...msg,
						timestamp: new Date(msg.timestamp),
					}));
					setMessages(parsedMessages);
				} catch (error) {
					console.error('Error loading saved messages:', error);
				}
			}
		}, []);

		// Save messages to localStorage whenever messages change
		useEffect(() => {
			if (messages.length > 0) {
				localStorage.setItem('chatMessages', JSON.stringify(messages));
			}
		}, [messages]);

		const scrollToBottom = () => {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		};

		useEffect(() => {
			scrollToBottom();
		}, [messages]);

		const sendMessage = async () => {
			if (!inputText.trim() || isLoading) return;

			const userMessage: Message = {
				id: Date.now().toString(),
				content: inputText.trim(),
				role: 'user',
				timestamp: new Date(),
			};

			setMessages((prev) => {
				console.log('Adding user message:', userMessage);
				const newMessages = [...prev, userMessage];
				console.log('Updated messages after user:', newMessages);
				return newMessages;
			});
			setInputText('');
			setIsLoading(true);

			onMessageSend?.(userMessage.content);

			// Create initial AI message for streaming
			const aiMessageId = (Date.now() + 1).toString();
			const initialAiMessage: Message = {
				id: aiMessageId,
				content: '',
				role: 'assistant',
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, initialAiMessage]);

			try {
				const requestBody = {
					message: userMessage.content,
					currentTemplate: localStorage.getItem('armTemplate')
						? JSON.parse(localStorage.getItem('armTemplate') as string)
						: null,
					chatHistory: [...messages, userMessage],
				};

				//console.log('Sending request to API:', requestBody);
				setIsLoading(true);
				const response = await axios.post(
					'http://localhost:3001/api/chat/message',
					requestBody
				);

				const apiResponse = response.data;
				const data = apiResponse.data; // Access the nested data object

				initialAiMessage.content = data.message;

				setMessages((prev) => {
					const updatedMessages = prev.map((msg) =>
						msg.id === aiMessageId
							? { ...msg, content: initialAiMessage.content }
							: msg
					);
					return updatedMessages;
				});

				if (data.template) {
					console.log(
						'Updating template in store and localStorage:',
						data.template
					);

					// Get current template before updating for history tracking
					const currentTemplate = JSON.parse(
						localStorage.getItem('armTemplate') || 'null'
					);

					// Add current template to history before AI modification (if it exists)
					if (currentTemplate) {
						addToHistory(currentTemplate);
						console.log(
							'Added previous template to history before AI modification'
						);
					}

					// Save to localStorage for persistence
					localStorage.setItem('armTemplate', JSON.stringify(data.template));

					// Update the store to trigger flow refresh without reload
					// Set addToHistory to true to track the AI-modified template
					setTemplate(data.template, true);

					console.log(
						'Template updated successfully - both previous and current templates added to history'
					);
				}
			} catch (error) {
				console.error('Error sending message:', error);
				// Update the AI message with error text
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === aiMessageId
							? {
									...msg,
									content: 'Sorry, I encountered an error. Please try again.',
							  }
							: msg
					)
				);
			} finally {
				setIsLoading(false);
			}
		};

		const handleKeyPress = (e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		};

		const clearChat = () => {
			setMessages([]);
			localStorage.removeItem('chatMessages');
		};

		useImperativeHandle(ref, () => ({
			clearChat,
		}));

		// console.log('ChatBox render - messages:', messages);
		// console.log('Messages length:', messages.length);

		return (
			<div className={`flex flex-col h-full bg-transparent pb-6 ${className}`}>
				{/* Messages Container */}
				<div className="flex-1 overflow-y-auto p-4 pb-12 flex flex-col">
					{messages.length === 0 ? (
						<div className="flex-1 flex items-center justify-center">
							<div className="text-center text-black">
								<p>Start a conversation with the AI assistant!</p>
								<p className="text-sm mt-2">
									Ask questions about ARM templates, Azure resources, or get
									help with your infrastructure.
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{messages.map((message) => {
								// console.log('Rendering message:', message);
								return (
									<div
										key={message.id}
										className={`flex ${
											message.role === 'user' ? 'justify-end' : 'justify-start'
										}`}
									>
										<Card
											sx={{
												maxWidth: { xs: '300px', lg: '400px' },
												backgroundColor:
													message.role === 'user' ? '#1976d2' : '#f5f5f5',
												boxShadow: 2,
												borderRadius: 2,
												padding: '8px',
												marginBottom: '8px',
											}}
										>
											<CardContent sx={{ padding: '12px 16px !important' }}>
												<Typography
													variant="body2"
													sx={{
														fontWeight: 'bold',
														color: message.role === 'user' ? 'white' : 'black',
														fontSize: '0.875rem',
													}}
												>
													{message.content}
												</Typography>
												<Typography
													variant="caption"
													sx={{
														color:
															message.role === 'user'
																? 'rgba(255,255,255,0.7)'
																: 'rgba(0,0,0,0.7)',
														fontSize: '0.75rem',
														marginTop: '4px',
														display: 'block',
													}}
												>
													{message.timestamp.toLocaleTimeString([], {
														hour: '2-digit',
														minute: '2-digit',
													})}
												</Typography>
											</CardContent>
										</Card>
									</div>
								);
							})}

							{isLoading && (
								<div className="flex justify-start">
									<div className="bg-gray-200 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
										<div className="flex items-center space-x-2">
											<div className="flex space-x-1">
												<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
												<div
													className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
													style={{ animationDelay: '0.1s' }}
												></div>
												<div
													className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
													style={{ animationDelay: '0.2s' }}
												></div>
											</div>
											<span className="text-sm text-black">
												AI is typing...
											</span>
										</div>
									</div>
								</div>
							)}
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input Area - Fixed at bottom */}
				<div className="flex flex-col p-6 border-t border-gray-200 bg-white mt-4 mb-4">
					<div className="flex gap-4 items-end">
						<TextField
							inputRef={inputRef}
							fullWidth
							multiline
							maxRows={4}
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder={placeholder}
							disabled={isLoading}
							variant="outlined"
							size="small"
							sx={{
								'& .MuiOutlinedInput-root': {
									backgroundColor: 'white',
									fontSize: '14px',
								},
							}}
						/>
						<div>
							<Button
								endIcon={<SendIcon />}
								onClick={sendMessage}
								disabled={!inputText.trim() || isLoading}
								variant="contained"
								color="primary"
								size="medium"
								sx={{
									minWidth: '80px',
									height: '40px',
									fontSize: '14px',
									marginTop: '8px',
								}}
							>
								Send
							</Button>
							<Button
								endIcon={<DeleteIcon />}
								onClick={clearChat}
								disabled={messages.length === 0 && !isLoading}
								variant="contained"
								color="secondary"
								size="medium"
								sx={{
									minWidth: '80px',
									height: '40px',
									fontSize: '14px',
									marginLeft: '8px',
									marginTop: '8px',
								}}
							>
								Clear
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}
);

ChatBox.displayName = 'ChatBox';

export default ChatBox;
