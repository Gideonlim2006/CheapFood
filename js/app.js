// Chatbot Application for SmartSave: CheapFood
// This integrates with Flowise and provides a chat interface

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');
const botStatus = document.getElementById('bot-status');
const quickSuggestions = document.getElementById('quick-suggestions');
const welcomeTime = document.getElementById('welcome-time');

// Configuration for Flowise integration
const FLOWISE_CONFIG = {
    apiHost: window.FLOWISE_CONFIG?.apiHost || 'https://gideonlim-flowise.hf.space',
    chatflowid: window.FLOWISE_CONFIG?.chatflowid || '10b2d13f-5baf-42c5-b4c8-244a67aeff54',
};

// Application State
let isConnected = false;
let messageHistory = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeChatbot();
    setupEventListeners();
    setWelcomeTime();
    checkFlowiseConnection();
});

// Set welcome message timestamp
function setWelcomeTime() {
    const now = new Date();
    welcomeTime.textContent = formatTime(now);
}

// Initialize chatbot interface
function initializeChatbot() {
    // Set initial bot status
    updateBotStatus('Online - Ready to help!', 'online');
    
    // Focus on input
    chatInput.focus();
    
    // Load any saved conversation history
    loadConversationHistory();
}

// Setup all event listeners
function setupEventListeners() {
    // Send button click
    sendButton.addEventListener('click', handleSendMessage);
    
    // Enter key in input
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Input change to enable/disable send button
    chatInput.addEventListener('input', function() {
        const hasText = chatInput.value.trim().length > 0;
        sendButton.disabled = !hasText;
        
        // Auto-resize input if needed (for future textarea upgrade)
        adjustInputHeight();
    });
    
    // Quick suggestion buttons
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    suggestionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const suggestion = this.getAttribute('data-suggestion');
            chatInput.value = suggestion;
            sendButton.disabled = false;
            chatInput.focus();
            handleSendMessage();
        });
    });
    
    // Keyboard navigation for suggestions
    setupKeyboardNavigation();
    
    // Reset chat button
    const resetButton = document.getElementById('reset-chat');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            resetChatConversation();
        });
    }
}

// Handle sending a message
async function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Clear input and disable send button
    chatInput.value = '';
    sendButton.disabled = true;
    adjustInputHeight();
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Hide quick suggestions after first message
    hideQuickSuggestions();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send message to Flowise
        const response = await sendToFlowise(message);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response
        addMessage(response, 'bot');
        
    } catch (error) {
        console.error('Error sending message to Flowise:', error);
        
        hideTypingIndicator();
        
        // Fallback response
        const fallbackResponse = getFallbackResponse(message);
        addMessage(fallbackResponse, 'bot');
        
        updateBotStatus('Connection issue - Using offline mode', 'offline');
    }
    
    // Focus back on input
    chatInput.focus();
}

// Send message to Flowise API
async function sendToFlowise(message) {
    try {
        console.log('Sending message to Flowise:', message);
        console.log('Using config:', FLOWISE_CONFIG);
        
        // Format the request body according to Flowise API specification
        const requestBody = {
            question: message
        };
        
        // Add chat history if available
        if (messageHistory && messageHistory.length > 0) {
            requestBody.history = messageHistory.slice(-6); // Keep last 6 messages for context
        }
        
        const response = await fetch(`${FLOWISE_CONFIG.apiHost}/api/v1/prediction/${FLOWISE_CONFIG.chatflowid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Flowise API error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Flowise response:', data);
        
        // Handle different response formats from Flowise
        if (typeof data === 'string') {
            return data;
        } else if (data.text) {
            return data.text;
        } else if (data.answer) {
            return data.answer;
        } else if (data.response) {
            return data.response;
        } else if (data.data) {
            return data.data;
        } else {
            console.warn('Unexpected response format:', data);
            return data.toString() || 'I received your message but couldn\'t process it properly.';
        }
        
    } catch (error) {
        console.error('Error in sendToFlowise:', error);
        throw error;
    }
}

// Parse markdown formatting
function parseMarkdown(text) {
    // Convert **text** to <strong>text</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *text* to <em>text</em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert `code` to <code>code</code>
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Add message to chat interface
function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🍔';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const messageP = document.createElement('p');
    
    // Apply markdown formatting for bot messages, keep user messages as plain text
    if (sender === 'bot') {
        messageP.innerHTML = parseMarkdown(content);
    } else {
        messageP.textContent = content;
    }
    
    contentDiv.appendChild(messageP);
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(new Date());
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeSpan);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    scrollToBottom();
    
    // Add to message history for context (Flowise format)
    if (sender === 'user') {
        messageHistory.push({
            message: content,
            type: 'userMessage'
        });
    } else {
        messageHistory.push({
            message: content,
            type: 'apiMessage'
        });
    }
    
    // Keep only last 8 messages for context (4 exchanges)
    if (messageHistory.length > 8) {
        messageHistory = messageHistory.slice(-8);
    }
    
    // Save to localStorage
    saveConversationHistory();
    
    // Update reset button state
    updateResetButtonState();
}

// Update reset button visual state
function updateResetButtonState() {
    const resetButton = document.getElementById('reset-chat');
    if (resetButton) {
        const messageCount = chatMessages.querySelectorAll('.message').length;
        if (messageCount > 1) { // More than just the welcome message
            resetButton.classList.add('has-messages');
            resetButton.title = 'Clear chat conversation';
        } else {
            resetButton.classList.remove('has-messages');
            resetButton.title = 'No messages to clear';
        }
    }
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.classList.add('hidden');
}

// Hide quick suggestions
function hideQuickSuggestions() {
    quickSuggestions.style.display = 'none';
}

// Update bot status
function updateBotStatus(status, type = 'online') {
    botStatus.textContent = status;
    botStatus.className = `bot-status ${type}`;
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format time for messages
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Adjust input height (for future textarea implementation)
function adjustInputHeight() {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
}

// Keyboard navigation setup
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            chatInput.focus();
        }
    });
}

// Check Flowise connection
async function checkFlowiseConnection() {
    try {
        console.log('Testing Flowise connection to:', FLOWISE_CONFIG.apiHost);
        
        // Test with a simple ping to the Flowise instance
        const testResponse = await fetch(`${FLOWISE_CONFIG.apiHost}`, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/json',
            }
        });
        
        console.log('Connection test response:', testResponse.status);
        
        if (testResponse.ok || testResponse.status === 404) {
            // 404 is expected for root endpoint, means server is responding
            isConnected = true;
            updateBotStatus('Online - Connected to AI assistant', 'online');
            console.log('Flowise connection successful');
        } else {
            throw new Error(`Connection failed with status: ${testResponse.status}`);
        }
    } catch (error) {
        console.warn('Flowise connection test failed:', error);
        
        // Try a direct test message to see if the chatflow works
        try {
            console.log('Attempting direct chatflow test...');
            await sendToFlowise('test');
            isConnected = true;
            updateBotStatus('Online - Chatflow working', 'online');
            console.log('Direct chatflow test successful');
        } catch (chatflowError) {
            console.error('Chatflow test also failed:', chatflowError);
            isConnected = false;
            updateBotStatus('Connection issue - Using offline mode', 'offline');
        }
    }
}

// Fallback responses when Flowise is not available
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Food-related responses
    if (lowerMessage.includes('pizza')) {
        return "🍕 For great pizza deals, I'd recommend checking out Tony's Pizza Corner on Campus North - they have student specials from $5-8! You can also try local pizza places that offer student discounts.";
    }
    
    if (lowerMessage.includes('cheap') || lowerMessage.includes('budget') || lowerMessage.includes('under')) {
        return "💰 Here are some budget-friendly options:\n• Taco Fiesta - meals from $2-5\n• Coffee & Bagels - breakfast from $2-4\n• Noodle Express - filling meals $3-6\n\nMany places offer student discounts too!";
    }
    
    if (lowerMessage.includes('healthy')) {
        return "🥗 For healthy options, try:\n• Salad Station on Health Campus\n• Falafel Friends for vegetarian options\n• Greek Gyro Spot for fresh Mediterranean food\n\nThese places focus on fresh, nutritious meals at student-friendly prices!";
    }
    
    if (lowerMessage.includes('late') || lowerMessage.includes('night')) {
        return "🌙 For late-night food, many campus locations stay open late:\n• Pizza places often deliver until midnight\n• Some burger joints have extended hours\n• Check delivery apps for 24/7 options\n\nWould you like specific recommendations for your area?";
    }
    
    if (lowerMessage.includes('delivery')) {
        return "🚚 Most local restaurants offer delivery through popular apps. Student tip: Look for delivery promotions and free delivery deals to save money!";
    }
    
    // General responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hi there! I'm here to help you find affordable and delicious food options. What type of food are you craving today?";
    }
    
    if (lowerMessage.includes('help')) {
        return "I can help you find:\n• Cheap eats near campus\n• Student meal deals\n• Healthy food options\n• Late-night delivery\n• Specific cuisines\n\nJust tell me what you're looking for!";
    }
    
    // Default response
    return "I'd love to help you find great food options! While I'm in offline mode right now, I can still give you some general recommendations. Try asking about specific types of food, budget ranges, or locations you're interested in!";
}

// Save conversation to localStorage
function saveConversationHistory() {
    try {
        localStorage.setItem('cheapfood_chat_history', JSON.stringify(messageHistory));
    } catch (error) {
        console.warn('Could not save conversation history:', error);
    }
}

// Load conversation from localStorage
function loadConversationHistory() {
    try {
        const saved = localStorage.getItem('cheapfood_chat_history');
        if (saved) {
            messageHistory = JSON.parse(saved);
        }
    } catch (error) {
        console.warn('Could not load conversation history:', error);
        messageHistory = [];
    }
}

// Reset chat conversation with user feedback
function resetChatConversation() {
    // Add a brief loading state
    const resetButton = document.getElementById('reset-chat');
    if (resetButton) {
        resetButton.style.transform = 'rotate(360deg)';
        resetButton.style.pointerEvents = 'none';
    }
    
    // Clear conversation history and messages
    clearConversationHistory();
    
    // Show quick suggestions again
    if (quickSuggestions) {
        quickSuggestions.style.display = 'block';
    }
    
    // Reset welcome time
    setWelcomeTime();
    
    // Focus on input
    if (chatInput) {
        chatInput.focus();
    }
    
    // Re-enable reset button after animation
    setTimeout(() => {
        if (resetButton) {
            resetButton.style.transform = '';
            resetButton.style.pointerEvents = '';
        }
        // Update reset button state
        updateResetButtonState();
    }, 300);
    
    console.log('Chat conversation reset');
}

// Clear conversation history
function clearConversationHistory() {
    messageHistory = [];
    localStorage.removeItem('cheapfood_chat_history');
    
    // Clear chat messages except welcome message
    const messages = chatMessages.querySelectorAll('.message:not(:first-child)');
    messages.forEach(msg => msg.remove());
}

// Export functions for potential testing or extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addMessage,
        getFallbackResponse,
        formatTime,
        clearConversationHistory
    };
}

// Initialize Flowise Web Widget (if available)
window.addEventListener('load', function() {
    // This is where you would initialize the Flowise web widget
    // if you prefer to use their embed widget instead of custom chat
    
    /*
    // Example Flowise widget initialization:
    if (window.FlowiseWebWidget) {
        window.FlowiseWebWidget.init({
            chatflowid: FLOWISE_CONFIG.chatflowid,
            apiHost: FLOWISE_CONFIG.apiHost,
            theme: window.FLOWISE_CONFIG?.theme || {}
        });
    }
    */
});
