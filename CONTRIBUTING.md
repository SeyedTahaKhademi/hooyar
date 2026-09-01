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
  preload.js          ContextBridge (safe bridge between main and renderer)
src/                Renderer process (React + Tailwind)
  components/         UI components (Header, Chat, Sidebar, Modals)
  services/           Core logic (Agent engine, AI providers)
  types/              TypeScript interfaces
assets/             Icons and static resources
```

## 📜 Code Style

- Use **React** with Functional Components and Hooks.
- Use **Tailwind CSS** for all styling.
- **TypeScript** is required for all new files.
- Ensure proper **RTL (Right-to-Left)** support for Persian text.
- Follow **Conventional Commits** (e.g., `feat: ...`, `fix: ...`, `docs: ...`).

## 🚀 Pull Request Process

1. Fork the repo and create your branch from `main`.
2. Ensure your code builds locally.
3. Keep PRs focused on one feature or bug fix.
4. Update documentation if you change logic.
5. Once your PR is merged, GitHub Actions will automatically handle the new release if a tag is pushed.

---
📢 Join our community: [t.me/hooshamoozan](https://t.me/hooshamoozan)
