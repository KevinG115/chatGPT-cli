#!/usr/bin/env node
import readline from 'readline';
import figlet from 'figlet';
import chalk from 'chalk';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

const DATA_DIR = path.join(os.homedir(), '.terminal-gpt');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

/* Default Configuration */
function defaultConfig() {
    return {
        envMode: "env",
        model: "gpt-4o-mini",
        systemPrompt: "You are a terminal-based ChatGPT CLI assistant. You run entirely inside a command-line interface and do not have a GUI. You are a knowledgeable, pragmatic software engineer who explains concepts clearly, writes concise and well-commented code, and offers practical advice. You speak in plain, professional language with a dash of informal friendliness. You understand that the user may paste commands, scripts, or errors, and you respond with relevant technical solutions. When outputting code, always use fenced code blocks with the appropriate language identifier. Avoid unnecessary fluff, stay focused on solving the user's problem, and respect the limitations of a CLI environment.",
        bannerFonts: ["Standard","Slant","3-D","Big","Block","Banner","Isometric1","Larry 3D","Ogre","Puffy","Star Wars"],
        autosave: false,
        sessionsDir: SESSIONS_DIR,
        identityRule: "You are a terminal-based ChatGPT CLI assistant, not a website or graphical application. You run entirely in a text-based environment and cannot render images or interactive elements. You are a pragmatic, knowledgeable software engineer. Always provide clear, concise explanations, practical examples, and well-structured code with proper fenced code blocks (```<language> ... ```). Avoid unnecessary filler, keep your answers focused, and tailor all solutions to be usable directly from a command-line context when possible."
    };
}

async function ensureDirs() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const cfg = await loadConfig(); // ensures config exists
    await fs.mkdir(cfg.sessionsDir, { recursive: true });
    return cfg;
}

async function loadConfig() {
    try {
        const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        // merge in any new defaults not present
        return { ...defaultConfig(), ...parsed };
    } catch {
        const cfg = defaultConfig();
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
        return cfg;
    }
}

async function saveConfig(cfg) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    console.log(chalk.gray(`Config saved to ${CONFIG_PATH}`));
}

async function maybeLoadDotenv(cfg) {
    if (cfg.envMode === "dotenv") {
        try {
            const { default: dotenv } = await import('dotenv');
            dotenv.config();
        } catch {
            console.log(chalk.yellow("envMode is 'dotenv' but 'dotenv' package is not installed. Run: npm i dotenv"));
        }
    }
}

/* Global Variables */
let CONFIG = await ensureDirs();
await maybeLoadDotenv(CONFIG);

const API_URL = 'https://api.openai.com/v1/chat/completions';
let MODEL = CONFIG.model;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const VERBOSE = process.env.VERBOSE === '1';

let OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error("No API key found. Set OPENAI_API_KEY (or use .env with envMode='dotenv').");
    process.exit(1);
}

function defaultSystemPrompt(text) {
    return [{ role: 'system', content: text ?? CONFIG.systemPrompt }];
}
let messages = defaultSystemPrompt();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('You> ')
});

function timestampSlug() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

async function listSessions() {
    const files = await fs.readdir(CONFIG.sessionsDir);
    return files.filter(f => f.endsWith('.json')).sort()
        .map((f, i) => ({ index: i + 1, file: f, name: f.replace(/\.json$/, '') }));
}

async function saveSession(name = '') {
    const base = name || `session_${timestampSlug()}`;
    const file = path.join(CONFIG.sessionsDir, `${base}.json`);
    const meta = { model: MODEL, savedAt: new Date().toISOString() };
    await fs.writeFile(file, JSON.stringify({ messages, meta }, null, 2), 'utf-8');
    console.log(chalk.gray(`Saved to ${file}`));
}

async function loadSession(identifier) {
    const all = await listSessions();
    if (!all.length) {
        console.log(chalk.yellow('No saved sessions.'));
        return false;
    }
    let chosen = null;
    if (/^\d+$/.test(identifier)) {
        const idx = parseInt(identifier, 10);
        chosen = all.find(x => x.index === idx);
    } else {
        chosen = all.find(x => x.name === identifier) || all.find(x => x.file === identifier);
    }
    if (!chosen) {
        console.log(chalk.red('Session not found. Use /list to see available sessions.'));
        return false;
    }
    const filePath = path.join(CONFIG.sessionsDir, chosen.file);
    const json = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    messages = json.messages || defaultSystemPrompt();
    if (json.meta?.model) MODEL = json.meta.model;
    console.log(chalk.gray(`Loaded session: ${chosen.name} (model=${MODEL})`));
    return true;
}

async function exportMarkdown(filepath) {
    const lines = [];
    lines.push(`# Terminal ChatGPT Transcript\n`);
    lines.push(`- Model: \`${MODEL}\``);
    lines.push(`- Exported: ${new Date().toISOString()}\n`);
    for (const m of messages) {
        if (m.role === 'system') lines.push(`> **System**: ${m.content}\n`);
        else if (m.role === 'user') lines.push(`**You:** ${m.content}\n`);
        else if (m.role === 'assistant') lines.push(`**Assistant:**\n\n${m.content}\n`);
    }
    await fs.writeFile(filepath, lines.join('\n'), 'utf-8');
    console.log(chalk.gray(`Exported markdown to ${filepath}`));
}

function showBanner() {
    console.clear();
    const fonts = Array.isArray(CONFIG.bannerFonts) && CONFIG.bannerFonts.length
        ? CONFIG.bannerFonts
        : defaultConfig().bannerFonts;

    const font = fonts[Math.floor(Math.random() * fonts.length)];
    let ascii = '';
    try {
        ascii = figlet.textSync('ChatGPT', { font });
    } catch {
        ascii = figlet.textSync('ChatGPT');
    }
    console.log(chalk.cyan(ascii));
    console.log(chalk.gray(`Font: ${font} | Model: ${MODEL} | Streaming Mode\n`));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

class CodeBlockFormatter {
    constructor() {
        this.inCode = false;
        this.pending = '';
        this.currentLang = '';
    }
    formatToken(token) {
        let out = '';
        this.pending += token;
        let i = 0;
        while (i < this.pending.length) {
            if (this.pending.startsWith('```', i)) {
                if (!this.inCode) {
                    // opening
                    this.inCode = true;
                    i += 3;
                    let j = i;
                    while (j < this.pending.length && this.pending[j] !== '\n') j++;
                    this.currentLang = this.pending.slice(i, j).trim();
                    if (j < this.pending.length && this.pending[j] === '\n') j++;
                    i = j;
                    out += chalk.yellow(`\n┌── code${this.currentLang ? ` (${this.currentLang})` : ''} ─────────────────────────\n`);
                } else {
                    // closing
                    this.inCode = false;
                    i += 3;
                    this.currentLang = '';
                    out += chalk.yellow(`\n└──────────────────────────────────────────────\n`);
                }
                continue;
            }
            const ch = this.pending[i];
            out += this.inCode ? chalk.reset(ch) : chalk.cyan(ch);
            i++;
        }
        this.pending = '';
        return out;
    }
}

async function streamChatOnce() {
    const body = { model: MODEL, messages, stream: true };

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => '');
        if (VERBOSE) console.error(`HTTP ${res.status} ${res.statusText} – ${errorText}`);
        return { ok: false, status: res.status, errorText };
    }

    process.stdout.write(chalk.cyan('\nGPT> '));

    let reply = '';
    const decoder = new TextDecoder();
    let buffer = '';
    const formatter = new CodeBlockFormatter();

    for await (const chunk of res.body) {
        const text = decoder.decode(chunk, { stream: true });
        buffer += text;

        let lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const raw of lines) {
            const line = raw.trim();
            if (!line) continue;
            if (line === 'data: [DONE]') {
                process.stdout.write('\n\n');
                messages.push({ role: 'assistant', content: reply });
                if (CONFIG.autosave) await saveSession(); // autosave if enabled
                return { ok: true };
            }
            if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                try {
                    const data = JSON.parse(jsonStr);
                    const token = data.choices?.[0]?.delta?.content || '';
                    if (token) {
                        const styled = formatter.formatToken(token);
                        process.stdout.write(styled);
                        reply += token;
                    }
                } catch { /* ignore partial */ }
            }
        }
    }

    process.stdout.write('\n\n');
    if (reply) messages.push({ role: 'assistant', content: reply });
    if (CONFIG.autosave) await saveSession();
    return { ok: true };
}

const TRANSIENT_CODES = new Set([429]);
function isRetriable(status) {
    return TRANSIENT_CODES.has(status) || status >= 500;
}

async function askGPTStreamWithRetry(userText) {
    messages.push({ role: 'user', content: userText });

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const r = await streamChatOnce();
        if (r.ok) {
            rl.prompt();
            return;
        }
        const status = r.status ?? 0;
        if (!isRetriable(status) || attempt === MAX_RETRIES) {
            console.error(chalk.red(`\nRequest failed (status ${status}).`));
            if (!VERBOSE && r.errorText) console.error(chalk.gray('Enable VERBOSE=1 to see full error details.'));
            rl.prompt();
            return;
        }
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.error(chalk.yellow(`\nTransient error (status ${status}). Retrying in ${delay / 1000}s...`));
        await sleep(delay);
    }
}

async function sayGoodbyeAndExit() {
    const farewell = 'Please say a short, warm goodbye to the user before we end the session.';
    messages.push({ role: 'user', content: farewell });

    const r = await streamChatOnce();
    if (!r.ok) console.log('Goodbye.');
    process.exit(0);
}

function showHelp() {
    console.log(chalk.gray(`
Slash commands:
  /help                 Show this help
  /exit                 Say goodbye and exit
  /clear                Clear conversation (keep system prompt)
  /new                  New conversation (reset to config system prompt)
  /save [name]          Save current conversation
  /list                 List saved sessions
  /load <name|#>        Load a saved session
  /system <text>        Set system prompt (in-memory only)
  /model <name>         Set model (in-memory only)
  /export <file.md>     Export transcript to Markdown
  /config               Show current config
  /set <key> <value>    Update config in memory (e.g., /set autosave true)
  /saveconfig           Persist current in-memory config to disk
  /reloadconfig         Reload config from disk
`));
}

function printConfig() {
    console.log(chalk.gray(`Current config (${CONFIG_PATH}):\n`));
    console.log(JSON.stringify(CONFIG, null, 2));
    console.log('');
}

function coerceValue(v) {
    if (v === 'true') return true;
    if (v === 'false') return false;
    const num = Number(v);
    if (!Number.isNaN(num) && v.trim() !== '') return num;
    // If looks like JSON array/object, try parse
    if ((v.startsWith('[') && v.endsWith(']')) || (v.startsWith('{') && v.endsWith('}'))) {
        try { return JSON.parse(v); } catch {}
    }
    return v;
}

async function handleCommand(input) {
    const [cmd, ...rest] = input.slice(1).split(' ');
    const argStr = rest.join(' ').trim();

    switch (cmd) {
        case 'help': showHelp(); break;
        case 'exit': await sayGoodbyeAndExit(); break;
        case 'clear':
            messages = [{ ...messages.find(m => m.role === 'system') }];
            console.log(chalk.gray('Conversation cleared (system prompt kept).'));
            break;
        case 'new':
            messages = defaultSystemPrompt();
            console.log(chalk.gray('Started a new conversation (using config system prompt).'));
            break;
        case 'save': await saveSession(argStr); break;
        case 'list': {
            const list = await listSessions();
            if (!list.length) { console.log(chalk.yellow('No saved sessions.')); break; }
            console.log(chalk.gray('Saved sessions:'));
            for (const s of list) console.log(`  ${s.index}. ${s.name}`);
            break;
        }
        case 'load':
            if (!argStr) { console.log(chalk.yellow('Usage: /load <name|#>')); break; }
            await loadSession(argStr);
            break;
        case 'system':
            if (!argStr) { console.log(chalk.yellow('Usage: /system <text>')); break; }
        {
            const sysIdx = messages.findIndex(m => m.role === 'system');
            if (sysIdx >= 0) messages[sysIdx].content = argStr;
            else messages.unshift({ role: 'system', content: argStr });
            console.log(chalk.gray('System prompt updated (in-memory).'));
        }
            break;
        case 'model':
            if (!argStr) { console.log(chalk.yellow('Usage: /model <name>')); break; }
            MODEL = argStr;
            console.log(chalk.gray(`Model set to ${MODEL} (in-memory).`));
            break;
        case 'export':
            if (!argStr) { console.log(chalk.yellow('Usage: /export <file.md>')); break; }
            await exportMarkdown(argStr);
            break;
        case 'config':
            printConfig();
            break;
        case 'set': {
            if (!argStr) { console.log(chalk.yellow('Usage: /set <key> <value>')); break; }
            const sp = argStr.split(' ');
            const key = sp.shift();
            if (!key) { console.log(chalk.yellow('Usage: /set <key> <value>')); break; }
            const val = coerceValue(sp.join(' ').trim());
            if (!(key in defaultConfig())) {
                console.log(chalk.yellow(`Unknown key '${key}'. Keys: ${Object.keys(defaultConfig()).join(', ')}`));
                break;
            }
            CONFIG[key] = val;
            if (key === 'model') MODEL = String(val);
            if (key === 'systemPrompt') {
                // update current conversation's system prompt if present
                const idx = messages.findIndex(m => m.role === 'system');
                if (idx >= 0) messages[idx].content = String(val);
            }
            console.log(chalk.gray(`Set ${key} = ${JSON.stringify(val)} (in-memory). Use /saveconfig to persist.`));
            break;
        }
        case 'saveconfig':
            await saveConfig(CONFIG);
            break;
        case 'reloadconfig':
            CONFIG = await loadConfig();
            await maybeLoadDotenv(CONFIG);
            MODEL = CONFIG.model;
            console.log(chalk.gray('Config reloaded from disk.'));
            break;
        default:
            console.log(chalk.yellow('Unknown command. Use /help.'));
    }
}

showBanner();
console.log(chalk.gray("Type '/help' for commands. Type 'exit' to quit.\n"));
rl.prompt();

rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) return rl.prompt();

    if (input.startsWith('/')) {
        await handleCommand(input);
        rl.prompt();
        return;
    }
    await askGPTStreamWithRetry(input);
});

rl.on('SIGINT', async () => { await sayGoodbyeAndExit(); });
rl.on('close', async () => { await sayGoodbyeAndExit(); });