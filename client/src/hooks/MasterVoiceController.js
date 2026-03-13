import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const useMasterVoiceController = (actions) => {
  const commands = [
    // --- 1. Call System ---
    { command: 'start voice call', callback: () => actions.initiateCall('voice') },
    { command: 'start video call', callback: () => actions.initiateCall('video') },
    { command: 'call *', callback: (name) => actions.initiateCall('voice', name) }, // "Call Shakib"
    { command: 'stop call', callback: () => actions.endCall() },
    { command: 'share screen', callback: () => actions.shareScreen() },

    // --- 2. Messaging & Search ---
    { command: 'open messenger', callback: () => actions.navigate('/messenger') },
    { command: 'search *', callback: (user) => actions.searchUser(user) }, // "Search Shakib"
    { command: 'send message *', callback: (msg) => actions.sendMessage(msg) },
    { command: 'delete message', callback: () => actions.deleteMsg() },
    { command: 'send voice note', callback: () => actions.sendVoiceNote() },

    // --- 3. Feed, Reels & Scrolling ---
    { command: 'scroll feed', callback: () => window.scrollBy({ top: 500, behavior: 'smooth' }) },
    { command: 'scroll down', callback: () => window.scrollBy({ top: 500, behavior: 'smooth' }) },
    { command: 'scroll up', callback: () => window.scrollBy({ top: -500, behavior: 'smooth' }) },
    { command: 'open reels', callback: () => actions.navigate('/reels') },
    { command: 'next video', callback: () => window.scrollBy(0, window.innerHeight) },
    { command: 'previous video', callback: () => window.scrollBy(0, -window.innerHeight) },
    { command: 'like this post', callback: () => actions.handleLike() },
    { command: 'comment *', callback: (text) => actions.postComment(text) },

    // --- 4. Upload System ---
    { command: 'post upload', callback: () => actions.openUploadModal('post') },
    { command: 'upload story', callback: () => actions.openUploadModal('story') },
    { command: 'story upload', callback: () => actions.openUploadModal('story') },

    // --- 5. Navigation & Profile ---
    { command: 'open my profile', callback: () => actions.navigate('/profile') },
    { command: 'go to home', callback: () => actions.navigate('/feed') },
    { command: 'open settings', callback: () => actions.navigate('/settings') },
    { command: 'change bio to *', callback: (bio) => actions.updateBio(bio) },

    // --- 6. Account & Privacy ---
    { command: 'block this user', callback: () => actions.blockUser() },
    { command: 'logout', callback: () => actions.logout() },
  ];

  const { transcript, listening, resetTranscript } = useSpeechRecognition({ commands });

  return { transcript, listening, resetTranscript, SpeechRecognition };
};

export default useMasterVoiceController;
