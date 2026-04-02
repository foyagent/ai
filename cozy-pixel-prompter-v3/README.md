# Cozy Pixel Prompter

[中文文档](./README.zh-CN.md)

A production-ready skill for generating unified prompt packs for pixel-art game assets with a soft modern East-Asian neighborhood family style.

## Features

- **Family-Style Consistency**: Maintains a cohesive cozy modern pixel-art aesthetic across all assets
- **Asset Types Support**: Portraits, sprites, equipment, props, items, and small avatars
- **Production-Ready Output**: Generates clean, pipeline-usable assets with transparent backgrounds
- **Reference Image Editing**: Preserves original style while applying user-requested changes
- **Character Differentiation**: Ensures distinct identities for role-based characters
- **Bilingual Support**: Outputs in English with optional Chinese gloss

## Directory Structure

```
cozy-pixel-prompter-v3/
├── SKILL.md                              # Main skill definition and workflow
├── references/
│   ├── style-system.md                   # Visual family style anchors
│   ├── output-template.md                # Prompt output format template
│   ├── character-clothing-lexicon.md     # Clothing vocabulary for characters
│   ├── character-differentiation.md      # Rules for distinct character design
│   └── neighborhood-props-lexicon.md     # Props and environment vocabulary
└── agents/
    └── openai.yaml                       # OpenAI agent configuration
```

## Usage

This skill is designed for OpenClaw agents. When a user requests:

- A single character, standing sprite, or portrait
- Equipment, props, or items
- Small avatars or icons

The skill generates complete prompt packs including:

1. **Style Alignment**: How the request fits the family style
2. **Positive Prompt**: Production-ready generation prompt
3. **Negative Prompt**: Drift prevention constraints
4. **Asset Specs**: Canvas size, framing, alignment, etc.
5. **Optional Model Notes**: Model-specific recommendations

## Style Overview

**Core Aesthetic**: Cozy modern East-Asian neighborhood pixel art

- Soft muted colors with selective warm accents
- Restrained chibi proportions (~2-3 heads tall)
- Clean pixel clusters, gentle shading
- Everyday slice-of-life subject matter
- Lived-in old-neighborhood realism

## Requirements

- OpenClaw with skill support
- Image generation model (recommended: DALL-E, Midjourney, or similar)

## License

MIT
