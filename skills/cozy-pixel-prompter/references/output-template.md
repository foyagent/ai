# output template

Use this exact structure unless the user explicitly asks for a different format.

## 1. style alignment

Provide 2 to 4 short bullets that explain how the request is being fitted into the family style.

Cover:
- asset type
- core preserved family traits
- any notable user-specific customizations
- any production-safe asset decisions that materially affect usability

## 2. positive prompt

Provide one production-ready positive prompt.

Rules:
- default to english
- one paragraph only
- start with the subject, then identity details, then family-style anchors, then asset-format and production constraints
- keep it dense and usable, not verbose prose
- preserve unchanged reference traits in edit mode
- include direct-use constraints when relevant, such as fully transparent background, centered object, full body inside frame, bottom baseline alignment without a visible floor line, no extra props, or clean icon framing

After the english prompt, optionally add:
- `中文意图:` followed by a concise chinese gloss when the conversation is in chinese

## 3. negative prompt

Provide one production-ready negative prompt.

Rules:
- remove items that conflict with the user's request
- focus on the most likely drift for this asset type
- explicitly block background, crop, shadow, framing, checkerboard, backdrop, floor-line, paper-texture, or multi-subject problems when those would reduce direct usability
- do not flood with unnecessary generic negatives

## 4. asset specs

Output a compact bullet list with:
- subject type
- recommended canvas size
- framing / crop
- viewpoint
- background handling
- alignment rule
- subject coverage
- silhouette priority
- palette direction
- shading density
- detail density
- must-preserve traits

## 5. optional model notes

Only include this section when it adds value.

Examples:
- transparent background preferred
- keep sprite readable at tiny size
- feet aligned to the bottom baseline
- center the item with even padding
- avoid extra limbs or duplicate accessories
- preserve reference hairstyle and outfit structure

## asset-type defaults

### portrait / standee
- recommended canvas size: 128x192 or 192x256
- framing: full body or near full body
- viewpoint: front or slight three-quarter
- background: fully transparent by default; plain or lightly contextual only if requested
- alignment rule: subject centered vertically and horizontally
- subject coverage: around 80 to 90 percent of canvas height
- silhouette priority: medium-high
- detail density: medium

### sprite
- recommended canvas size: 32x48, 48x64, 64x96, or 96x128
- framing: single full-body in-game sprite
- viewpoint: front, side, or slight three-quarter as requested
- background: fully transparent by default
- alignment rule: both feet aligned to bottom baseline
- subject coverage: nearly full height with small safety margin
- silhouette priority: very high
- detail density: low-medium

### equipment / prop / item
- recommended canvas size: 32x32, 48x48, 64x64, or 128x128
- framing: centered single object
- viewpoint: profile, front, or slight three-quarter based on readability
- background: fully transparent by default
- alignment rule: object centered with even padding
- subject coverage: around 70 to 85 percent of canvas area
- silhouette priority: highest
- detail density: low-medium

### small avatar
- recommended canvas size: 64x64, 96x96, or 128x128
- framing: bust, head-and-shoulders, or simplified tiny full figure
- viewpoint: front or slight three-quarter
- background: fully transparent by default; flat backdrop only if requested
- alignment rule: head or bust centered
- subject coverage: head occupies dominant visual area
- silhouette priority: very high
- detail density: low

## direct-use defaults

If the user does not specify otherwise, assume:
- no text labels
- no decorative border
- no UI frame
- no cast shadow
- no contact shadow
- no floor platform
- no floor line or baseline marker
- no checkerboard transparency pattern
- no paper texture or studio backdrop
- no scene clutter
- no cropped limbs
- one primary subject only

## transparency fallback rule

When the model is known not to output true alpha transparency, state this in optional model notes and switch the background handling line to:
- flat single-color cleanup-friendly background only because the model may not support alpha transparency; no checkerboard, no texture, no gradient, no floor line, no shadow

Do not pretend a checkerboard preview is transparency.

## preservation logic for reference edits

When the request is based on a reference image, include a precise must-preserve bullet such as:
- preserve original face shape, hairstyle silhouette, clothing structure, palette temperature, overall pixel rendering density, and usable asset framing; change only the requested attributes

## example skeleton

### style alignment
- single standing sprite adapted into the cozy modern east-asian neighborhood pixel-art family
- preserve restrained chibi proportions, soft muted palette, and clean pixel clusters
- user customization focuses on changing the jacket color and adding a canvas shoulder bag
- output is treated as a direct-use in-game sprite with transparent background and bottom baseline alignment

### positive prompt
A single standing pixel-art character sprite, young adult woman, short black bob hair with a small gold hair clip, calm expression, loose sage-green sweater, fog-blue tapered pants, canvas shoulder bag, cozy modern pixel art, soft muted palette, restrained chibi proportions, clean readable silhouette, subtle shading, modern indie game pixel-art feel, east-asian neighborhood slice-of-life atmosphere, front-facing standing pose, fully transparent background, real alpha transparency if supported, full body inside frame, feet aligned to an invisible bottom baseline, no extra props, no floor line, no shadow, no checkerboard, simplified but recognizable clothing folds, readable at small in-game size
中文意图：一个单人站立像素角色，小黑发金色发卡，鼠尾草绿毛衣和雾蓝锥形长裤，治愈低饱和现代生活感像素风，正面站姿，真正透明背景，整个人完整入画，双脚按隐形底部基准对齐，不要地面线、阴影或棋盘格，小尺寸也清晰可读

### negative prompt
high saturation, cyberpunk neon, glossy 3d render, realistic anatomy, giant anime eyes, thick black outlines, heavy dithering, dramatic cinematic lighting, ornate fantasy costume, cluttered background, checkerboard transparency pattern, cream background, beige background, paper texture, studio backdrop, display card, cast shadow, contact shadow, floor platform, floor line, cropped feet, multiple subjects, text labels, decorative frame

### asset specs
- subject type: sprite
- recommended canvas size: 64x96
- framing / crop: single full-body sprite
- viewpoint: front-facing
- background handling: transparent background
- alignment rule: both feet aligned to bottom baseline
- subject coverage: nearly full height with small safety margin
- silhouette priority: very high
- palette direction: muted greens, fog blue, warm neutrals, low saturation
- shading density: light
- detail density: low-medium
- must-preserve traits: preserve the original hairstyle silhouette and calm everyday outfit logic; only apply the requested color and accessory changes

### optional model notes
- transparent background preferred
- keep sprite readable at tiny size
- avoid extra limbs or duplicate accessories
