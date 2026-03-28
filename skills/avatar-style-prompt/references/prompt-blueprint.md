# Prompt blueprint

Use this structure to produce the final prompt.

## Universal prompt formula

Write one English paragraph with these blocks in roughly this order:

1. subject identity
2. house-style statement
3. face and proportion statement
4. hair statement
5. outfit and accessory statement
6. expression and pose
7. crop and camera statement
8. lighting statement
9. background statement
10. finish and anti-drift statement

## Strong default skeleton

"A youthful stylized 3D social-profile avatar portrait of [subject summary], designed to match the same six-reference family. Slightly enlarged natural-looking eyes with visible lids and readable irises, a smooth youthful face, tiny sculpted nose, small relaxed mouth, gentle jawline, short-to-moderate neck, and restrained shoulders. [Hair statement with soft sculpted clumps and stylish silhouette]. [Simple clothing cue] with [single dominant accessory if any]. [Expression statement], slight 3/4 view. Tight chest-up portrait with a high shoulder crop, face as the clear focal point, body secondary. Soft even portrait lighting with gentle fill, low contrast, controlled highlights, and no dramatic shadows. Clean solid pale [background hue] full-frame background, a single flat color filling the whole image, plain and uncluttered, with no scene elements and no gradient. Smooth clean skin, satin-matte hair, simplified clothing surfaces, polished stylized character render, youthful and cohesive, not photorealistic, not glamorous, not toy-like, not low-poly."

## Negative prompt formula

Keep it compact but strong. Start from this base and adapt only if necessary:

"photorealistic, realistic skin pores, realistic hair strands, glamour portrait, fashion editorial, luxury cosmetics ad, cinematic lighting, harsh shadows, long neck, broad shoulders, emphasized torso, detailed clothing folds, full body, busy background, room interior, outdoor scene, multiple people, extra props, heavy makeup, seductive expression, toy figurine, vinyl doll, mascot, chibi, kawaii baby face, blocky low poly, clay render, helmet hair, black button eyes, gradient background, corporate ID icon, watermark, ai generated watermark, ai badge, logo, signature, text overlay, caption, platform ui"

## Style-lock bullet formula

Prefer bullets such as:
- youthful stylized 3D social-profile avatar portrait
- same cohesive six-reference family
- face dominant, high shoulder crop
- slight 3/4 view by default
- eyes enlarged but still natural-looking
- visible eyelids and readable irises
- tiny sculpted nose, small mouth
- short-to-moderate neck, restrained shoulders
- soft sculpted hair clumps, not realistic strands
- minimal clothing detail
- one dominant accessory
- clean solid pastel full-frame background
- soft low-contrast portrait lighting
- polished non-toy character finish
- no watermark, ai badge, logo, signature, or text overlay

## Anti-drift suffix formula

Use a short suffix like this:

"same six-reference avatar family, youthful young-adult face, not toy-like, not chibi, not low-poly, not glamour portrait, slight 3/4 social-profile avatar, visible eyelids and irises, soft sculpted hair clumps, high shoulder crop, clean solid pastel full-frame background, single flat color only, no scene, no gradient, no watermark, no ai badge, no logo, no text overlay"

## Writing rules

- Prefer structural terms over taste terms.
- Use "youthful", "stylized", "social-profile avatar", "high shoulder crop", "slight 3/4 view", "visible eyelids", "readable irises", "soft sculpted clumps", and "polished character render" more than vague words like "premium", "luxury", or "collectible".
- Never use "app icon", "mascot", or "collectible toy" as positive descriptors.
- If the subject is stylish, express that through one accessory or haircut, not through glamour language.
- If sunglasses are present, keep them as a bold shape. Do not describe giant visible eyes through opaque lenses.
- If a shirt or jacket is present, keep it secondary to the face.
- Never let the body, chest, or fabric detailing become the focal point.
- When a model tends to produce front-facing icons, strengthen the 3/4-view wording.
- When a model tends to produce toys, strengthen the "young-adult face" and "not toy-like / not chibi / not low-poly" wording.

## Decision rules

### Sparse input
If the user description is sparse, infer only tasteful identity cues that fit the set.

### Heavy input
If the user description is dense, preserve the most recognizable identity markers and simplify the rest.

### Conflicting input
If the user asks for realism, a complex background, glamour, or a fashion-shoot feeling, keep the identity traits but rewrite the final prompt into the house style unless they explicitly ask to leave the bundled reference look.

## Example transformation for the broadcaster case

### Input
"年轻新闻主播，专业友好，深色头发，简洁西装外套"

### Universal prompt
A youthful stylized 3D social-profile avatar portrait of a young news broadcaster with neat dark hair and a calm professional-friendly expression, designed to match the same six-reference family. Slightly enlarged natural-looking eyes with visible lids and readable irises, a smooth youthful face, tiny sculpted nose, small relaxed mouth, gentle jawline, short-to-moderate neck, and restrained shoulders. Hair is neatly parted with soft sculpted clumps and a clean contemporary silhouette, avoiding realistic strands and avoiding blocky low-poly slabs. Wearing a simple dark blazer over a light inner shirt with minimal fabric detail. Quiet confident expression, slight 3/4 view. Tight chest-up portrait with a high shoulder crop, face as the clear focal point, body secondary. Soft even portrait lighting with gentle fill, low contrast, controlled highlights, and no dramatic shadows. Clean solid pale mint full-frame background, a single flat color filling the whole image, plain and uncluttered, with no scene elements and no gradient. Smooth clean skin, satin-matte hair, simplified clothing surfaces, polished stylized character render, youthful and cohesive, not photorealistic, not glamorous, not toy-like, not low-poly.

### Negative prompt
photorealistic, realistic skin pores, realistic hair strands, glamour portrait, fashion editorial, luxury cosmetics ad, cinematic lighting, harsh shadows, long neck, broad shoulders, emphasized torso, detailed clothing folds, full body, busy background, room interior, outdoor scene, multiple people, extra props, heavy makeup, seductive expression, toy figurine, vinyl doll, mascot, chibi, kawaii baby face, blocky low poly, clay render, helmet hair, black button eyes, gradient background, watermark, ai generated watermark, ai badge, logo, signature, text overlay, caption, platform ui

## Example transformation for the difficult sunglasses case

### Input
"一个24岁女生，白金色短发，戴红色墨镜，气质冷一点，穿黑色无袖上衣，有一点潮流感"

### Universal prompt
A youthful stylized 3D social-profile avatar portrait of a cool 24-year-old woman with short platinum-blonde hair, a black sleeveless top, and bold red sunglasses, designed to match the same six-reference family. Slightly enlarged natural-looking eyes, simplified around the lenses, with a smooth youthful face, tiny sculpted nose, small relaxed mouth, gentle jawline, short-to-moderate neck, and restrained shoulders. Hair is cut into a short asymmetrical bob with soft sculpted clumps and a clean stylish silhouette, avoiding realistic silky strands and avoiding hard blocky slabs. The red sunglasses are the single dominant accessory, bold and readable. Calm aloof expression, slight 3/4 view. Tight chest-up portrait with a high shoulder crop, face as the clear focal point, body secondary. Soft even portrait lighting with gentle fill, low contrast, controlled highlights, and no dramatic shadows. Clean solid pale lavender full-frame background, a single flat color filling the whole image, plain and uncluttered, with no scene elements and no gradient. Smooth clean skin, satin-matte hair, simplified clothing surfaces, polished stylized character render, youthful and cohesive, not photorealistic, not glamorous, not toy-like, and not low-poly.

### Negative prompt
photorealistic, realistic skin pores, realistic hair strands, glamour portrait, fashion editorial, luxury cosmetics ad, cinematic lighting, harsh shadows, long neck, broad shoulders, emphasized torso, detailed clothing folds, full body, busy background, room interior, outdoor scene, multiple people, extra props, heavy makeup, seductive expression, toy figurine, vinyl doll, mascot, chibi, kawaii baby face, blocky low poly, clay render, helmet hair, black button eyes, gradient background, watermark, ai generated watermark, ai badge, logo, signature, text overlay, caption, platform ui
