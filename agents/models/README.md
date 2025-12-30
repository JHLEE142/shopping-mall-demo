# AI Models Directory

This directory stores AI models used by the AI Shopping Assistant.

## Structure

```
models/
├── base/              # Base models (e.g., GPT-4, Claude)
├── finetuned/         # Fine-tuned models for specific agents
├── adapters/          # LoRA/Adapter weights
└── README.md          # This file
```

## Model Storage Rules

### What to Store

- **Fine-tuned model weights** (`.safetensors`, `.bin`)
- **Adapter weights** (LoRA, PEFT adapters)
- **Model configuration files** (`config.json`, `tokenizer.json`)
- **Model metadata** (training logs, evaluation results)

### What NOT to Store (Git)

- Large model files (`.safetensors`, `.gguf`, `.bin`) - use Git LFS or external storage
- Training checkpoints (unless final model)
- Intermediate training artifacts

### File Naming Convention

```
{agent_name}_{version}_{date}.{ext}
```

Example:
- `12_product_search_v1.0_20241230.safetensors`
- `orchestrator_lora_v1.0_20241230.bin`

## Version Control

- Use Git LFS for model files > 100MB
- Store model metadata (config, eval results) in Git
- Document model versions in `models/VERSIONS.md`

## Access

Models are loaded by the runtime at:
- `/server/src/ai_runtime/models/` (symlink or copy from here)

## Security

- Never commit API keys or secrets
- Model files are in `.gitignore`
- Access logs should be maintained

