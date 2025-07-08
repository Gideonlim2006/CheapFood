// Persistent chatId for Flowise memory
const chatId = localStorage.getItem('cheapfood_chat_id') || crypto.randomUUID();
localStorage.setItem('cheapfood_chat_id', chatId);

const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");
const chatMessages = document.getElementById("chat-messages");
const typingIndicator = document.getElementById("typing-indicator");
const quickSuggestions = document.querySelectorAll(".suggestion-btn");
const resetChatButton = document.getElementById("reset-chat");

let messageHistory = [];

function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createMessageElement(message, sender = "user") {
    const messageEl = document.createElement("div");
    messageEl.classList.add("message", `${sender}-message`);

    const avatar = document.createElement("div");
    avatar.classList.add("message-avatar");
    avatar.textContent = sender === "user" ? "👤" : "🍔";

    const content = document.createElement("div");
    content.classList.add("message-content");
    content.innerHTML = `<p>${message}</p>`;

    const time = document.createElement("span");
    time.classList.add("message-time");
    time.textContent = formatTime();

    messageEl.appendChild(avatar);
    messageEl.appendChild(content);
    messageEl.appendChild(time);

    return messageEl;
}

function addMessage(message, sender = "user") {
    const messageEl = createMessageElement(message, sender);
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    typingIndicator.classList.remove("hidden");
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.classList.add("hidden");
}

async function sendToFlowise(message) {
    showTypingIndicator();

    try {
        const response = await fetch(`https://gideonlim-flowise.hf.space/api/v1/prediction/10b2d13f-5baf-42c5-b4c8-244a67aeff54`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: message,
                chatId: chatId
            })
        });

        const data = await response.json();
        const botReply = data.text || "Sorry, I couldn't get a response.";

        addMessage(botReply, "bot");
    } catch (error) {
        console.error("Error sending message:", error);
        addMessage("Oops! Something went wrong. Please try again.", "bot");
    } finally {
        hideTypingIndicator();
    }
}

function handleUserMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    sendToFlowise(message);
    chatInput.value = "";
    sendButton.disabled = true;
}

chatInput.addEventListener("input", () => {
    sendButton.disabled = !chatInput.value.trim();
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !sendButton.disabled) {
        handleUserMessage();
    }
});

sendButton.addEventListener("click", handleUserMessage);

quickSuggestions.forEach(btn => {
    btn.addEventListener("click", () => {
        chatInput.value = btn.dataset.suggestion;
        sendButton.disabled = false;
        handleUserMessage();
    });
});

resetChatButton.addEventListener("click", () => {
    chatMessages.innerHTML = "";
    messageHistory = [];
    localStorage.removeItem('cheapfood_chat_id'); // Reset session
    addMessage("Hi there! I'm your CheapFood Assistant. I can help you find affordable and delicious food options nearby. Just ask me about restaurants, cuisines, or specific dishes you're craving!", "bot");

    // Generate new chatId for fresh session
    const newId = crypto.randomUUID();
    localStorage.setItem('cheapfood_chat_id', newId);
    window.location.reload();
});

// Show current time on welcome message
document.getElementById("welcome-time").textContent = formatTime();
