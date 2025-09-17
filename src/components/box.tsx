import { useState, useRef } from 'react';
import { Box, IconButton, Fab, Slide } from '@mui/material';
import {
	Chat as ChatIcon,
	Close as CloseIcon,
} from '@mui/icons-material';
// Update the path below to the correct location and filename for ChatBox
import ChatBox from './chatComponents/chatBox';
import type { ChatBoxRef } from './chatComponents/chatBox';
import Flow from './flow';
import { LeftDrawer } from './LeftDrawer';

export function BoxLayout() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [chatOpen, setChatOpen] = useState(false);
	const chatBoxRef = useRef<ChatBoxRef>(null);

	console.log('BoxLayout render - chatOpen:', chatOpen);

	const toggleDrawer = () => {
		setDrawerOpen(!drawerOpen);
	};

	const toggleChat = () => {
		setChatOpen(!chatOpen);
	};

	return (
		<Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
			<LeftDrawer drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />

			{/* Main Content Area */}
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					transition: 'margin-left 0.3s',
					marginLeft: drawerOpen ? '400px' : '0px',
					marginRight: chatOpen ? '300px' : '0px',
					position: 'relative',
					overflow: 'hidden',
					height: '100vh',
					width: '100%',
				}}
			>
				<Flow />
			</Box>
			{/* Right Chat Toggle Button */}
			{!chatOpen && (
				<Fab
					color="secondary"
					onClick={toggleChat}
					sx={{
						position: 'fixed',
						bottom: 16,
						right: 16,
						zIndex: 1200,
					}}
				>
					<ChatIcon />
				</Fab>
			)}
			{/* Right Chat Panel */}
			{chatOpen && (
				<Slide direction="left" in={chatOpen} mountOnEnter unmountOnExit>
					<Box
						sx={{
							position: 'fixed',
							top: 0,
							right: 0,
							height: '100%',
							width: 400,
							backgroundColor: 'white',
							boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
							zIndex: 1100,
							display: 'flex',
							flexDirection: 'column',
						}}
					>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								p: 2,
								borderBottom: '1px solid #e0e0e0',
								color: 'black',
							}}
						>
							<h3>Chat Assistant</h3>
							<Box sx={{ display: 'flex', gap: 1 }}>
								{/* <IconButton
									size="small"
									onClick={() => chatBoxRef.current?.clearChat()}
									title="Clear Chat"
								>
									<ClearIcon fontSize="small" />
								</IconButton> */}
								<IconButton onClick={toggleChat} title="Close Chat">
									<CloseIcon />
								</IconButton>
							</Box>
						</Box>
						<Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'end' }}>
							<ChatBox ref={chatBoxRef} className="w-full h-full" />
						</Box>
					</Box>
				</Slide>
			)}
		</Box>
	);
}
