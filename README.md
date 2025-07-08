# SmartSave: CheapFood 🍔

Your AI assistant for finding cheap and tasty food nearby! Perfect for students looking for affordable dining options.

## Features

- 🤖 **AI-Powered Chat**: Integrated with Flowise for intelligent food recommendations
- 🍕 **Smart Search**: Find food by type, location, or budget
- 💰 **Student-Friendly**: Focus on affordable options under $10
- 📱 **Responsive Design**: Works perfectly on mobile and desktop
- ✨ **Modern UI**: Beautiful yellow-themed interface with smooth animations
- 🔄 **Reset Chat**: Clear conversation history with one click
- ⚡ **Fast & Lightweight**: No frameworks needed, pure HTML/CSS/JS

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI Backend**: Flowise (Hugging Face hosted)
- **Styling**: Custom CSS with modern design patterns
- **Icons**: Emoji-based for universal compatibility

## Getting Started

### Prerequisites
- A modern web browser
- Live Server extension for VS Code (recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Gideonlim2006/CheapFood.git
cd CheapFood
```

2. Open with Live Server:
   - Open the project in VS Code
   - Right-click on `index.html`
   - Select "Open with Live Server"

3. Start chatting! Ask about:
   - "Find cheap pizza near campus"
   - "Best student meal deals under $5"
   - "Healthy food options for students"
   - "Late night food delivery"

## Configuration

The chatbot is pre-configured to work with a Flowise instance. To use your own:

1. Update the configuration in `index.html`:
```javascript
window.FLOWISE_CONFIG = {
    chatflowid: "your-chatflow-id",
    apiHost: "your-flowise-instance-url"
};
```

## Features in Detail

### 🎨 **Beautiful Design**
- Bright yellow (#FFD400) primary theme
- Orange and coral accent colors
- Smooth hover animations and transitions
- Mobile-responsive layout

### 💬 **Smart Chat Interface**
- Real-time typing indicators
- Message history with timestamps
- Markdown formatting support (**bold**, *italic*, `code`)
- Quick suggestion buttons

### 🔧 **Developer Friendly**
- Clean, documented code
- Modular CSS architecture
- ES6+ JavaScript features
- Accessibility compliant (ARIA labels, keyboard navigation)

## File Structure

```
CheapFood/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styling
├── js/
│   └── app.js          # Chat functionality and Flowise integration
├── .gitignore          # Git ignore rules
├── package.json        # Project metadata
└── README.md           # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with ❤️ for students
- Powered by Flowise AI
- Icons and emojis for universal appeal
- Inspired by the need for affordable food discovery

---

**Made by students, for students** 🎓

*Find great food without breaking the bank!*
