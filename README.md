
#  ChatGPT CLI

![alt text](/app/assets/terminal-image.png)

A terminal-based ChatGPT client with streaming responses, saved sessions, customizable personalities, and developer-friendly output formatting.

## Features

- **Streaming responses** with token-by-token output
- **Persistent sessions** — save and load conversations
- **Configurable system prompts** and enforced identities
- **Developer-focused output**:
  - Syntax highlighting for code blocks
  - Pretty Markdown rendering
- **Customizable appearance** (themes, ASCII banners, minimal mode)
- **Slash commands** for full control
- **Retry logic** for transient API errors
- **Profiles** for quick persona/model switching
- **Autosave** mode for hands-free transcript saving
- **Export to Markdown**

---

## Requirements

- Node.js **18+**
- An [OpenAI API key](https://platform.openai.com/account/api-keys)

---

## Installation

```bash
# Clone this repository
git clone https://github.com/yourusername/terminal-gpt-cli.git
cd terminal-gpt-cli

# Install dependencies
npm install
```

---

## Configuration

When the CLI runs for the first time, it will create a config file at:

```
~/.terminal-gpt/config.json
```

Edit this file to customize:

- **model** — default OpenAI model (e.g., `gpt-4o-mini`)
- **systemPrompt** — main personality and behavior
- **identityRule** — enforced rule for every request
- **theme** — `default`, `mono`, or `highContrast`
- **bannerFonts** — ASCII fonts for startup banner
- **autosave** — automatically save conversation after each reply

You can also edit the config live in the CLI:
```
/set systemPrompt Your new prompt here
/saveconfig
```

---

## Environment Variables

The CLI expects your API key in one of two ways:

1. **Environment variable** (default mode):
   ```bash
   export OPENAI_API_KEY="sk-yourkey"
   ```

2. **.env file** (if `envMode` in config is set to `"dotenv"`):
   ```env
   OPENAI_API_KEY=sk-yourkey
   ```

---

## Usage

Start the CLI:
```bash
node chatgpt-stream-cli.js
```
or, if installed globally:
```bash
terminal-gpt
```

You'll see an ASCII art banner and the prompt:
```
You>
```

Type your message and watch the streaming output.

---

## Slash Commands

| Command                | Description |
|------------------------|-------------|
| `/help`                | Show command list |
| `/exit`                | Say goodbye and exit |
| `/clear`               | Clear conversation (keep system prompt) |
| `/new`                 | New conversation (reset to config system prompt) |
| `/save [name]`         | Save current conversation |
| `/list`                | List saved sessions |
| `/load <name|#>`       | Load a saved session |
| `/system <text>`       | Set system prompt (in-memory) |
| `/model <name>`        | Set model (in-memory) |
| `/export <file.md>`    | Export transcript to Markdown |
| `/config`              | Show current config |
| `/set <key> <value>`   | Update config in memory |
| `/saveconfig`          | Persist current config to disk |
| `/reloadconfig`        | Reload config from disk |
| `/retry`               | Resend last user prompt |
| `/continue`            | Ask the assistant to continue |
| `/profile list`        | List profiles |
| `/profile use <name>`  | Apply a profile |
| `/profile add <n> <j>` | Add a profile from JSON |

Shortcuts:
- `/n` = `/new`
- `/q` = `/exit`
- `/r` = `/retry`

---

## Example Config for a Software Engineer CLI

```json
{
  "systemPrompt": "You are a terminal-based ChatGPT CLI assistant. You run entirely inside a command-line interface and do not have a GUI. You are a knowledgeable, pragmatic software engineer who explains concepts clearly, writes concise and well-commented code, and offers practical advice. You speak in plain, professional language with a dash of informal friendliness. You understand that the user may paste commands, scripts, or errors, and you respond with relevant technical solutions. When outputting code, always use fenced code blocks with the appropriate language identifier. Avoid unnecessary fluff, stay focused on solving the user's problem, and respect the limitations of a CLI environment.",
  "identityRule": "You are a terminal-based ChatGPT CLI assistant, not a website or graphical application. You run entirely in a text-based environment and cannot render images or interactive elements. You are a pragmatic, knowledgeable software engineer. Always provide clear, concise explanations, practical examples, and well-structured code with proper fenced code blocks (```<language> ... ```). Avoid unnecessary filler, keep your answers focused, and tailor all solutions to be usable directly from a command-line context when possible."
}
```

---

## License

MIT
