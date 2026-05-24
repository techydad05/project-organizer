# Project: Gemma 4 26B-A4B (Local LLM)

**Status:** Active / Running via llama.cpp
**Last Updated:** May 15, 2026

## What It Is
Google's Gemma 4 26B-A4B (MoE, ~4B active params) running locally on Windows via llama.cpp server. Q3_K_M quantization. Vision-capable (mmproj loaded).

## Location
- **Model file:** `D:\models\gemma-4-26B-A4B-it-GGUF\google_gemma-4-26B-A4B-it-Q3_K_M.gguf`
- **mmproj:** `D:\models\gemma-4-26B-A4B-it-GGUF\mmproj-google_gemma-4-26B-A4B-it-f16.gguf`
- **Server:** llama.cpp on port 8082 (Windows)
- **Starter script:** `D:\llama.cpp\start-gemma4.ps1`
- **WSL provider:** WSL Hermes → `http://172.26.32.1:8082/v1`

## Current Config
`--ctx-size 262144 --ubatch-size 256 --batch-size 256 -ngl 99 -ctk q4_0 -ctv q4_0`
~15 tok/s on Intel Arc A770 (16GB VRAM)

## Related Files
- `/home/techydad06/project-organizer/data/llama-optimization-task.md` — quantization benchmarks to test

## History
- OpenArc + OpenVINO models all removed (~61GB freed); only this GGUF remains
- Has been ngrok'd to Telegram for remote access
- Was being used as Hermes' daily driver local provider

## Links
- Llama.cpp optimizations: `llama-optimization-task.md` (in this directory)
- Kanban tasks (cleared when Kanban board was reset): test script for OpenVINO export, model_configs.py fork viability