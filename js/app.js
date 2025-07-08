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

function parseMarkdown(text) {
    const linkPlaceholders = [];
    let linkIndex = 0;

    text = text.replace(/<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi, (match, href, linkText) => {
        const placeholder = `__LINK_PLACEHOLDER_${linkIndex}__`;
        linkPlaceholders[linkIndex] = match;
        linkIndex++;
        return placeholder;
    });

    text = text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#39;');

    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');

    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>');
    text = text.replace(/(^|[^"'>])(https?:\/\/[^\s<>"'\[\]]+)/gi, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$2</a>');
    text = text.replace(/(^|[^"'>])(www\.[^\s<>"'\[\]]+)/gi, '$1<a href="http://$2" target="_blank" rel="noopener noreferrer" class="chat-link">$2</a>');

    text = text.replace(/\n/g, '<br>');

    linkPlaceholders.forEach((originalLink, index) => {
        const placeholder = `__LINK_PLACEHOLDER_${index}__`;
        text = text.replace(placeholder, originalLink);
    });

    return text;
}

function handleHTMLContent(content) {
    // 🔧 Fix malformed <a> links
    content = content.replace(
        /(https?:\/\/[^\s"'>]+)"\s+target="_blank"\s+rel="noopener noreferrer"\s+class="chat-link">https?:\/\/[^\s<]+/gi,
        (match) => {
            const cleanUrl = match.match(/(https?:\/\/[^\s"'>]+)/)[1];
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="chat-link">${cleanUrl}</a>`;
        }
    );

    if (content.includes('<a ') || content.includes('<strong>') || content.includes('<em>')) {
        const htmlPlaceholders = {};
        let placeholderIndex = 0;

        content = content.replace(/<a\s+[^>]*>.*?<\/a>/gi, (match) => {
            const placeholder = `__HTML_LINK_${placeholderIndex}__`;
            htmlPlaceholders[placeholder] = match;
            placeholderIndex++;
            return placeholder;
        });

        content = content.replace(/<(strong|em|code|b|i)\s*[^>]*>.*?<\/\1>/gi, (match) => {
            const placeholder = `__HTML_TAG_${placeholderIndex}__`;
            htmlPlaceholders[placeholder] = match;
            placeholderIndex++;
            return placeholder;
        });

        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
        content = content.replace(/`(.*?)`/g, '<code>$1</code>');
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>');
        content = content.replace(/(^|[^"'>])(https?:\/\/[^\s<>"'\[\]]+)/gi, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$2</a>');
        content = content.replace(/(^|[^"'>])(www\.[^\s<>"'\[\]]+)/gi, '$1<a href="http://$2" target="_blank" rel="noopener noreferrer" class="chat-link">$2</a>');
        content = content.replace(/\n/g, '<br>');

        Object.keys(htmlPlaceholders).forEach(placeholder => {
            content = content.replace(placeholder, htmlPlaceholders[placeholder]);
        });

        content = content.replace(/<a\s+([^>]*?)>/gi, (match, attributes) => {
            let newAttributes = attributes;
            if (!newAttributes.includes('class=')) {
                newAttributes += ' class="chat-link"';
            } else if (!newAttributes.includes('chat-link')) {
                newAttributes = newAttributes.replace(/class\s*=\s*["']([^"']*?)["']/i, 'class="$1 chat-link"');
            }
            if (!newAttributes.includes('target=')) {
                newAttributes += ' target="_blank"';
            }
            if (!newAttributes.includes('rel=')) {
                newAttributes += ' rel="noopener noreferrer"';
            }
            return `<a ${newAttributes}>`;
        });

        return content;
    } else {
        return parseMarkdown(content);
    }
}

function createMessageElement(message, sender = "user") {
    const messageEl = document.createElement("div");
    messageEl.classList.add("message", `${sender}-message`);

    const avatar = document.createElement("div");
    avatar.classList.add("message-avatar");
    avatar.textContent = sender === "user" ? "👤" : "🍔";

    const content = document.createElement("div");
    content.classList.add("message-content");

    if (sender === "bot") {
        content.innerHTML = `<p>${handleHTMLContent(message)}</p>`;
    } else {
        const escapedMessage = message.replace(/&/g, '&amp;')
                                      .replace(/</g, '&lt;')
                                      .replace(/>/g, '&gt;')
                                      .replace(/"/g, '&quot;')
                                      .replace(/'/g, '&#39;');
        content.innerHTML = `<p>${escapedMessage}</p>`;
    }

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
    localStorage.removeItem('cheapfood_chat_id');
    addMessage("Hi there! I'm your CheapFood Assistant. I can help you find affordable and delicious food options nearby. Just ask me about restaurants, cuisines, or specific dishes you're craving!", "bot");

    const newId = crypto.randomUUID();
    localStorage.setItem('cheapfood_chat_id', newId);
});

document.getElementById("welcome-time").textContent = formatTime();

window.testLinkProcessing = function(testText) {
    console.log("Original text:", testText);
    console.log("Processed text:", handleHTMLContent(testText));
    return handleHTMLContent(testText);
};
