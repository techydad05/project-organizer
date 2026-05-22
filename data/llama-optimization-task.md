# Task: Test llama.cpp Quantization Optimizations

**Source:** Telegram conversation (May 15, 2026)
**Status:** Pending

## What
Benchmark and test different quantization/configurations for llama.cpp on the Intel Arc A770 (16GB VRAM).

## Current Config (Gemma 4 26B-A4B)
- `--ctx-size 262144 --ubatch-size 256 --batch-size 256 -ngl 99 -ctk q4_0 -ctv q4_0`

## Quantization Tweaks to Test (in order)

1. **Q5_K_M** (`-ctk q5_k_m -ctv q5_k_m`) — ~10-15% slower, noticeably better reasoning/coding
2. **IQ2_XS** (`-ctk iq2_xs -ctv iq2_xs`) — 2-3x faster than Q4_0, good for simple tasks
3. **Q4_K_M** (`-ctk q4_k_m -ctv q4_k_m`) — slightly better quality than current Q4_0

## Context Size Adjustment
Current 262144 (256K) is massive. Try `--ctx-size 32768` for dashboard/dev work — frees VRAM for larger batch sizes or higher -ngl.

## Alternative Models to Try
- Qwen3 8B Q4_K_M (~5GB) — general dev
- Mistral Small 3 7B (~4.5GB) — fastest local option
- Phi-4-mini 3.8B Q4 (~2.5GB) — ultra-lightweight

## When to Use Free OpenRouter Instead
- Complex PR reviews/architecture: qwen-coder-480b (free)
- Tricky logic: deepseek-r1-0528 (free)
- Quick checks: llama-3.3-70b (free)

## Verification
After adjustments, verify VRAM actually has room—running game + model = GPU watchdog crash (0x141).
