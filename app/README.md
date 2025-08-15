# Terminal GPT CLI

![alt text](https://raw.githubusercontent.com/KevinG115/chatGPT-cli/refs/heads/main/app/assets/terminal-image.png)

A fast, streaming ChatGPT client for your terminal.  
Supports saved sessions, configurable personalities, syntax highlighting, and Markdown rendering.

---

## Install

```bash
npm install -g terminal-gpt
```

---

## Quick Start

Set your OpenAI API key:

```bash
export OPENAI_API_KEY="sk-yourkey"
```

Run the CLI:

```bash
terminal-gpt
```

Example:
```
You> Write a function in JavaScript to reverse a string.
AI> ```javascript
function reverseString(str) {
  return str.split('').reverse().join('');
}
```
```

---

## Slash Commands (short list)

| Command        | Description |
|----------------|-------------|
| `/help`        | Show commands |
| `/exit`        | Exit the CLI |
| `/clear`       | Clear conversation |
| `/new`         | Reset conversation |
| `/save [name]` | Save chat |
| `/list`        | List saved chats |
| `/load <id>`   | Load chat |
| `/system <t>`  | Set system prompt |
| `/model <m>`   | Change model |
| `/retry`       | Retry last prompt |
| `/continue`    | Continue response |

---

## Configuration

The first time you run, a config file is created at:

```
~/.terminal-gpt/config.json
```

You can edit it to change:
- `model` (e.g., `"gpt-4o-mini"`)
- `systemPrompt` (default personality)
- `identityRule` (rules enforced every request)
- `theme` (`default`, `mono`, `highContrast`)
- `bannerFonts` (ASCII art fonts)

Example default personality:

```json
{
  "systemPrompt": "You are a terminal-based ChatGPT CLI assistant...",
  "identityRule": "You are a terminal-based ChatGPT CLI assistant, not a website..."
}
```

---

## Requirements

- Node.js **18+**
- An [OpenAI API key](https://platform.openai.com/account/api-keys)

---

## License

MIT

---

For full documentation and advanced features, visit:  
[GitHub Repository](https://github.com/yourusername/terminal-gpt-cli)
