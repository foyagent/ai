---
name: cozy-pixel-prompter
description: generate unified prompt packs for production-ready pixel-art game assets with a soft modern east-asian neighborhood family style. use when a user wants prompts for a single character, standing sprite, portrait, equipment, prop, or small avatar, either from a natural-language description or from one or more reference images plus edit instructions. produce complete positive and negative prompts, asset-specific canvas and background constraints, alignment rules, preservation rules, and family-style anchors so outputs can be used directly as consistent in-game assets with minimal or no post-processing.
---

# cozy pixel prompter

Generate prompt packs for pixel-art game assets that must stay inside one cohesive family style and be usable as production assets without requiring image cleanup afterward.

Use the references in `references/style-system.md` and `references/output-template.md` every time. Also consult `references/character-clothing-lexicon.md` and `references/character-differentiation.md` for character-facing assets, and `references/neighborhood-props-lexicon.md` for prop, item, storefront, or environment-aware requests. Keep the style anchor stable unless the user explicitly asks for a different family.

## workflow decision tree

1. Identify the asset type.
   - **portrait / standee**: a single character shown as a full-body or near full-body figure.
   - **sprite**: an in-game standing or action-ready character sprite.
   - **equipment / prop / item**: a single weapon, armor piece, tool, consumable, or icon-ready object.
   - **small avatar**: bust, head-and-shoulders, or simplified tiny character icon.

2. Identify the input mode.
   - **text-only request** -> create the asset from scratch.
   - **reference image plus edits** -> preserve the original family's style and all unchanged attributes.

3. Extract the user's must-keep constraints before writing prompts.
   - subject identity or object category
   - gender presentation, age impression, silhouette, hairstyle, accessories, clothing, materials
   - pose, facing direction, camera distance, asset crop, background preference
   - palette, season, mood, rarity tier, cleanliness or wear level
   - any exact keep / change instructions

4. Translate the request into **production-safe asset specs**.
   - decide the default canvas family and output size tier
   - decide transparent vs plain background behavior
   - decide subject scale inside the canvas
   - decide alignment baseline or centering rule
   - decide whether shadows, scene props, text, or floor planes must be suppressed

5. Fill missing details with conservative defaults based on asset type. Pull clothing choices from `references/character-clothing-lexicon.md` and prop or storefront object choices from `references/neighborhood-props-lexicon.md` when they help stabilize the family style. For character assets, explicitly choose one dominant clothing color family and one lower-body anchor instead of letting the model fall back to cream-and-khaki straight-pants defaults. Do not invent flamboyant details. Prefer readable silhouettes, clear material separation, restrained ornament, and direct usability inside a game pipeline.

6. Output the final result in the exact structure from `references/output-template.md`.


## character differentiation rules

When the request is for a character-facing asset, do **not** let family style consistency collapse all subjects into the same default young-adult standing template. Keep palette, rendering density, and asset specs unified, but deliberately differentiate the person.

### required identity separation

If the user implies different jobs, ages, or social roles, force at least **4** of these axes to change in the final prompt:
- age impression
- body build or body proportion
- head shape or facial structure
- hairstyle or hairline
- stance or resting pose
- garment structure
- footwear type
- carried object or work accessory
- wear level / lived-in work traces

### job readability priority

For role-driven characters, prioritize in this order:
1. profession silhouette
2. age and body impression
3. posture habit
4. garment structure
5. lower-body structure
6. footwear and carried tool
7. dominant outfit color family

Do not rely on a single token such as a hat, apron, or bag to communicate a profession. The whole figure should read correctly at a glance.

### clothing variation policy

For character-facing assets, force clothing diversity on two specific axes:
- choose a deliberate **dominant outfit color family** from `references/character-clothing-lexicon.md`; do not let every role drift to cream, khaki, beige, or muted yellow unless the user explicitly wants that palette
- choose a deliberate **lower-body anchor** from the clothing lexicon; do not default to straight-leg pants unless the reference or role clearly calls for it

For role-differentiated batches or repeated character requests, vary at least one of these between characters:
- dominant color family
- lower-body anchor
- apron type or outer layer structure
- footwear class

### pose policy

Keep poses production-safe, but allow **light stance variation** when it improves recognition: relaxed contrapposto, slight forward lean, weight on one leg, one hand holding a bag, hands behind back, loose worker stance, elder's mild stoop, or service-role attentive stance. Avoid dramatic action poses unless the user explicitly asks for them.

## style rules

- Treat the family style as the top-level visual constraint.
- Keep **style unity** in rendering and palette, not in making every character look like the same person.
- Treat **production usability** as the top-level asset constraint.
- Prioritize **accurate user intent** first, then fit that intent into the family style with the least distortion.
- Keep the look in a soft, modern, low-saturation pixel-art space. Use the lexicon files to keep garment choices and neighborhood objects consistent across requests. Avoid drifting into neon cyberpunk, arcade retro, glossy 3d, or exaggerated anime styling unless the user explicitly requests a deliberate blend.
- Preserve consistency across:
  - outline thickness
  - head-to-body ratio
  - facial simplification
  - palette restraint
  - shading softness
  - material readability
  - everyday grounded design language
  - canvas handling and background treatment for the same asset class

## production-ready asset rules

Assume the user wants outputs that can be used directly in a game pipeline unless they explicitly ask for scene art or concept art.

### hard defaults

- prefer **transparent background** for sprites, standees, item icons, and avatars unless the user explicitly wants a background color or contextual scene
- treat **transparent background** as a hard production requirement, not as a visual metaphor; do not allow checkerboard patterns, cream backdrops, paper textures, studio backdrops, floor planes, or display-card backgrounds when the user wants a direct-use asset
- suppress **all background residue** for asset-only outputs: no backdrop color, no grid, no checkerboard, no paper grain, no vignette, no floor line, no baseline marker except the invisible alignment logic, and no cast or contact shadow unless the user explicitly asks for one
- if the target model is known or suspected not to support real alpha transparency, fall back to a **flat single-color cleanup-friendly background** only as a last resort, and explicitly say this in optional model notes; still forbid checkerboards, gradients, and textured backdrops
- prefer **one primary subject only** unless the user explicitly asks for a multi-subject composition
- suppress decorative frames, captions, UI chrome, floor platforms, and scene clutter when generating asset-only outputs
- do not let limbs, weapons, hair masses, or accessories clip off the canvas unless the user explicitly requests a cropped composition
- keep the subject centered or baseline-aligned according to asset type
- use consistent subject scale for the same asset family

### direct-use priority order

When choosing between visual flourish and pipeline usability, prioritize:
1. clean silhouette
2. correct framing and crop
3. transparent or controlled background
4. stable alignment
5. readable details at target size
6. extra style flourishes


## background enforcement rules

For asset-only outputs, use strict language that leaves no room for decorative background drift.

### positive background language

Use explicit phrases such as:
- fully transparent background
- real alpha transparency if the model supports it
- isolated single character or isolated single object asset
- no background pixels outside the silhouette
- no floor plane
- no ground line
- no backdrop
- no shadow
- export-ready game asset

### negative background language

Block the most common failure modes explicitly:
- checkerboard transparency pattern
- grid background
- cream background
- beige background
- paper texture
- studio backdrop
- display card
- floor line
- ground marker
- cast shadow
- contact shadow
- vignette
- decorative border

### baseline clarification

For sprites, **feet aligned to bottom baseline** is an alignment instruction, not a request to draw a visible line. Do not let the model render a floor stripe, ruler mark, or contact line unless the user explicitly asks for one.

## reference-image workflow

When the user provides one or more reference images:

1. Infer the stable family traits from the references.
2. Separate them into:
   - **must preserve**: style family, proportion logic, line weight, palette behavior, shading behavior, rendering density
   - **user-requested changes**: only the edited attributes
3. Keep all non-mentioned traits unchanged by default.
4. Never rewrite the subject into a different genre, era, or rendering pipeline unless the user explicitly asks for it.
5. If multiple references conflict, prioritize in this order:
   - latest direct instruction from the user
   - repeated shared traits across the references
   - asset-type readability requirements

## preservation priority for reference edits

When editing from a reference, preserve traits in this order unless the user explicitly overrides them:

1. subject category and identity
2. asset type and usable framing
3. family style anchors
4. silhouette and proportion logic
5. palette temperature and rendering density
6. clothing or material structure
7. minor accessories and surface details

If the user asks to change one layer, do not casually rewrite higher-priority preserved layers.

## asset-specific defaults

### portrait / standee

- Default to a single full-body character with a clean readable stance.
- Keep clothing folds, hair masses, and accessories simplified into crisp pixel clusters.
- Prefer transparent background unless the user explicitly wants a contextual card-style background.
- Prefer a vertical canvas family such as **128x192**, **192x256**, or a proportional equivalent.
- Keep the subject centered.
- Keep the figure occupying roughly **80 to 90 percent** of canvas height with modest safety margins.
- Avoid floor shadows, floating props, or side objects unless requested.

### sprite

- Default to a single in-game standing sprite.
- Favor frontal or slight three-quarter readability over dynamic camera drama.
- Reduce tiny decorative details that would break readability at small size.
- If the user does not specify animation sheets, do not invent them.
- Prefer transparent background.
- Prefer a vertical sprite canvas family such as **32x48**, **48x64**, **64x96**, or **96x128**.
- Align both feet to a clear bottom baseline.
- Keep the full figure inside frame and avoid overhanging accessories that break tiling or collision readability.
- Avoid cast shadows unless explicitly requested.

### equipment / prop / item

- Default to a centered single-object presentation.
- Push silhouette clarity, material separation, and rarity readability.
- Avoid overtexturing. Let shape, palette, and a few decisive highlights carry the design.
- Prefer transparent background.
- Prefer square icon canvas families such as **32x32**, **48x48**, **64x64**, or **128x128**.
- Keep the object centered with even edge breathing room.
- Keep the subject occupying roughly **70 to 85 percent** of the canvas.
- Avoid hands, mannequins, platforms, labels, or scene dressing unless explicitly requested.

### small avatar

- Emphasize head shape, hair silhouette, and one to two key identity accessories.
- Simplify torso details aggressively.
- Keep the expression restrained and readable at tiny size.
- Prefer transparent background or one flat controlled backdrop only when explicitly requested.
- Prefer square canvas families such as **64x64**, **96x96**, or **128x128**.
- Center the head or bust.
- Let the head occupy the dominant visual area.
- Avoid full environment context unless explicitly requested.

## prompt construction rules

Build prompts in layers, not as a random bag of tags.

1. **subject layer**: what the asset is
2. **identity layer**: defining visual traits
3. **family-style layer**: shared style anchors from `references/style-system.md`
4. **asset-format layer**: sprite, portrait, item, or avatar requirements
5. **production-spec layer**: target canvas family, transparent background, subject scale, baseline or centering behavior, no extra props or text
6. **composition layer**: camera, crop, pose, orientation, background
7. **rendering layer**: palette, shading, line behavior, detail density, readability
8. **exclusion layer**: negative prompt that blocks common drift

The final positive prompt should be compact but complete. Remove redundant synonyms. For character assets, mention the chosen dominant clothing color family and lower-body structure explicitly. The negative prompt should target the most likely drift modes instead of becoming an endless list.

## language policy

- Explain decisions in the user's language.
- Write the final production-ready prompts in english by default because many image models respond more reliably to concise english prompt phrases.
- When the user writes in chinese, include a short chinese gloss for the positive prompt after the english prompt.
- If the user explicitly wants chinese-only prompts or names a model that works better with chinese prompting, follow that request.

## default behavior

- Do not generate multiple variants unless the user asks.
- Do not ask follow-up questions when a reasonable default can be inferred from the asset type.
- If one missing detail would materially change the result, ask only that one question.
- If the user did not specify size, choose the most practical default size family for that asset type and state it in asset specs.
- If the user did not specify background, default to transparent for asset-generation tasks.
- When the user asks for fidelity to a reference, favor preservation over embellishment.
- When the user asks for a brand-new design, favor clean silhouettes and restrained detail over spectacle.

## output quality checklist

Before finalizing, verify that the prompt pack:

- matches the requested asset type
- preserves the family style anchor
- contains only one primary subject unless asked otherwise
- has a readable silhouette at game scale
- uses a production-safe canvas suggestion
- uses transparent or otherwise controlled background handling
- has correct baseline or centering logic for the asset class
- avoids high-saturation or glossy rendering drift
- avoids turning everyday designs into fantasy or sci-fi by accident
- includes positive prompt, negative prompt, and asset specs
- keeps unchanged reference traits intact when in edit mode
