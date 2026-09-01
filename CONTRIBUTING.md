# Contributing to Hooyar (هویار)

First off, thank you for considering a contribution! 🎉
This document describes how to set up the project, code conventions, and the pull request process.

## 🛠 Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode (Vite + Electron)
npm run electron:dev

# 3. Type-check before committing
npx tsc --noEmit

# 4. Build the Windows installer (.exe)
npm run dist
```

> Windows is the primary target platform (the terminal layer uses PowerShell).

## 📁 Project Structure

```
electron/           Main process (IPC handlers, window, sandbox rules)
  main.js             All privileged logic: file system, terminal, config, AI proxy
  preload.js          contextBridge exposing window.hooyarNative
src/
  types/            Shared TypeScript types (incl. the native bridge contract)
  services/         Agent engine (LLM calls + tool execution) & provider catalog
  components/       React UI components
  App.tsx           State management + the agent loop
```

## 🔒 Security Rules (please read)

Because Hooyar executes tools on a real machine, these rules are **non-negotiable**:

1. **Workspace sandbox:** every `fs:*` IPC handler must validate paths with
   `isPathAllowed()`. Never add a raw `fs` handler without the guard.
2. **No `webSecurity: false`:** renderer HTTP goes through the `ai:request`
   main-process proxy. Do not bypass it with direct cross-origin fetches.
3. **Secrets:** provider API keys live only in the `safeStorage`-encrypted
   config file. Never log keys or embed them in code.
4. **Terminal:** commands run with a hard timeout; do not add interactive
   shell features that would hang the tool pipeline.
5. **Auto-Approve stays opt-in:** never enable tool auto-execution by default.

## 📝 Code Conventions

- TypeScript strict mode must pass (`npx tsc --noEmit`).
- Use Persian for all user-facing strings; code, identifiers and commit
  messages stay in English.
- Prefer small, focused components; keep the main process free of UI logic.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `security:`).

## 🔁 Pull Request Process

1. Fork the repo and create your branch from `main`:
   `git checkout -b feat/my-feature`
2. Make your changes and verify: `npx tsc --noEmit` passes and
   `npm run electron:dev` still boots cleanly.
3. Describe **what** changed and **why**, including any security impact.
4. Link related issues; for security-sensitive changes, explain the threat
   model in the PR description.

## 🐛 Reporting Bugs

Open an issue with: OS version, Hooyar version, provider used, steps to
reproduce, and expected vs actual behaviour. For security vulnerabilities,
please do **not** open a public issue — contact the maintainer directly.
