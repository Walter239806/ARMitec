import axios from 'axios';
import React, {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';

interface Message {
	id: string;
	text: string;
	sender: 'user' | 'ai';
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
				text: inputText.trim(),
				sender: 'user',
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, userMessage]);
			setInputText('');
			setIsLoading(true);

			onMessageSend?.(userMessage.text);

			try {
				const response = await axios.post(
					'http://localhost:3001/api/chat/m',
					{
						message: userMessage.text,
						context: 'ARM template assistance',
					}
				);

				const aiMessage: Message = {
					id: (Date.now() + 1).toString(),
					text:
						response.data.response ||
						'Sorry, I could not process your request.',
					sender: 'ai',
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, aiMessage]);
			} catch (error) {
				console.error('Error sending message:', error);
				const errorMessage: Message = {
					id: (Date.now() + 1).toString(),
					text: 'Sorry, I encountered an error. Please try again.',
					sender: 'ai',
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, errorMessage]);
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
		};

		useImperativeHandle(ref, () => ({
			clearChat,
		}));

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
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${
										message.sender === 'user' ? 'justify-end' : 'justify-start'
									}`}
								>
									<div
										className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
											message.sender === 'user'
												? 'bg-blue-500 text-white'
												: 'bg-gray-200 text-gray-800'
										}`}
									>
										<p className="text-sm">{message.text}</p>
										<p
											className={`text-xs mt-1 ${
												message.sender === 'user'
													? 'text-blue-100'
													: 'text-gray-500'
											}`}
										>
											{message.timestamp.toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit',
											})}
										</p>
									</div>
								</div>
							))}

							{isLoading && (
								<div className="flex justify-start">
									<div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
										<div className="flex items-center space-x-2">
											<div className="flex space-x-1">
												<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
												<div
													className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
													style={{ animationDelay: '0.1s' }}
												></div>
												<div
													className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
													style={{ animationDelay: '0.2s' }}
												></div>
											</div>
											<span className="text-sm">AI is typing...</span>
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
					<div className="flex gap-4">
						<input
							ref={inputRef}
							type="text"
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder={placeholder}
							className="flex-1 px-100 py-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-200"
							disabled={isLoading}
						/>
						<button
							onClick={sendMessage}
							disabled={!inputText.trim() || isLoading}
							className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
						>
							Send
						</button>
					</div>
				</div>
			</div>
		);
	}
);

ChatBox.displayName = 'ChatBox';

export default ChatBox;
