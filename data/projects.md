# Project Organizer

> Edit this file to add, remove, or change projects. Use the "Import .md" button in the app to load changes.
> Status sections: Running, In Progress, Ideas, Deferred, Abandoned

---

## Status: Running

### LeftyDevKit
- **URL:** https://leftydevkit.com
- **Tags:** civic-tech, svelte, coolify, docker
- **Why:** Progressive civic-tech platform countering right-wing political tech infrastructure. Free tools for progressive candidates.
- **Notes:** Deployed on Coolify at 192.168.5.197:8000. YouTube channel @leftydevkit. Neobrutalist design aesthetic.

### Geography of Power
- **URL:** http://192.168.5.197:3000 (if running locally)
- **Tags:** d3, svelte, data-viz, politics, history
- **Why:** Interactive visualization of U.S. House ideological positioning over time. Shows the "flippin" of parties.
- **Notes:** TX test bed. Zoom 1300-1600. Roberts Legacy sidebar. District dots colored by ideology, numbered seats, stable IDs.

### Project Organizer
- **URL:** http://192.168.5.197:3001
- **Tags:** svelte, tooling, productivity
- **Why:** This app! Organize all projects by status. Markdown-friendly project management.
- **Notes:** SvelteKit + PostgreSQL on Coolify.

### Voicebox
- **URL:** http://127.0.0.1:17493 (GPU mode)
- **Tags:** ai, tts, voice, gpu, xpu
- **Why:** AI voice generation. Two modes: CPU (Kokoro 82M) and GPU (IPEX+XPU on Arc A770 16GB).
- **Notes:** GPU backend at D:\voicebox-backend\backend\venv\. For gaming: STOP GPU first (6-8GB VRAM), use CPU Kokoro.

### Coolify Server
- **URL:** http://192.168.5.197:8000
- **Tags:** hosting, docker, devops, proxmox
- **Why:** Central deploy hub for all projects. Docker-based PaaS on Proxmox LXC container.
- **Notes:** Login: agent@local.network. Public IP: 47.195.203.243. Domain changes need Save+Redeploy.

---

## Status: In Progress

### Corruption Counter
- **URL:** C:\Users\techydad06\Projects\corruption-counter
- **Tags:** civic-tech, politics, tracking
- **Why:** Track political corruption — politicians, donors, votes, conflicts of interest.
- **Notes:** Progressive civic-tech tool. Part of LeftyDevKit ecosystem.

### Scraping Hate
- **Tags:** scraping, data, civic-tech
- **Why:** Identify and track sources of hate speech and disinformation in political discourse.
- **Notes:** Early research phase.

### Stream Control Panel
- **URL:** (part of this app — /stream-control)
- **Tags:** streaming, tools, broadcasting
- **Why:** Custom OBS/streaming control browser source for live political commentary.
- **Notes:** Build tools for good live — educate, inform, organize.

---

## Status: Ideas

### The Bloc
- **Tags:** social, politics, community
- **Why:** Political social media app with ideological neighborhood mapping.
- **Notes:** Svelte prototype concept. Think "political neighborhood meetup."

### CommonCents
- **Tags:** youtube, education, animation, economics
- **Why:** YouTube channel with animated cartoon coins as hosts explaining progressive economics.
- **Notes:** Similar vibe to the Platner dinosaur comic.

### ai-campaign-video Generator
- **Tags:** ai, video, politics, automation
- **Why:** Tool to auto-generate campaign videos for progressive candidates using AI images + TTS.
- **Notes:** Proof of concept done with Platner dinosaur comic. Template-able for any candidate.

### Democratic Data Dashboard
- **Tags:** data-viz, politics, api
- **Why:** Real-time dashboard tracking Democratic caucus positions, votes, polling.
- **Notes:** Similar to Geography of Power but focused on current state.

### CodeFist Banner / Brand Assets
- **Tags:** design, branding, leftydevkit
- **Why:** Logo and brand identity for LeftyDevKit. Fist made of code brackets — progressive + tech fusion.
- **Notes:** Hates clichés (wrenches, capitol buildings). Wants clever concept fusion.

---

## Status: Deferred

### llama.cpp Quantization Benchmarks
- **Notes:** Test Q5_K_M, IQ2_XS, Q4_K_M on Arc A770 16GB. Compare VRAM usage vs quality.
- **Notes:** Related to Voicebox GPU work. Benchmark context sizes: 32768 vs 262144.

---

## Status: Abandoned

### (nothing here yet)
