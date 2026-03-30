# Prompt blueprint

Use this blueprint to generate prompts that travel well across image models.

## Universal prompt structure

Write the universal prompt as one dense paragraph with this logic:

1. Start with the family anchor.
2. State the subject identity cues.
3. Lock face construction.
4. Lock hair color and hairstyle.
5. Add one visible garment cue.
6. Add one primary accessory or subtle personality accent.
7. Lock framing and view angle.
8. Lock lighting and materials.
9. Lock the plain solid background.
10. End with anti-drift exclusions in natural language.

## Family anchor formula

Open with wording close to:

"A youthful stylized 3D social-profile avatar portrait of [subject], designed to match the same six-reference family"

## Face-language formula

Include most of these cues:
- slightly enlarged natural-looking eyes
- visible eyelids
- readable irises when visible
- smooth youthful face
- tiny sculpted nose
- small relaxed mouth
- gentle jawline
- short-to-moderate neck
- restrained shoulders

## Hair-language formula

Always include both color and shape when hair was not fully specified.

Preferred hair wording:
- [color] hair
- soft sculpted hair clumps
- layered graphic hair masses
- clean stylish silhouette
- not realistic strands
- not hard blocky slabs

If the user did not specify hair color or hairstyle, infer both from [references/hair-guidance.md](references/hair-guidance.md).
Do not silently fall back to black hair.
Do not silently reuse the same generic male haircut.

## Accessory and personality-accent formula

This family benefits from one readable styling accent.

Use this order of preference:
1. Preserve a clearly stated accessory from the user.
2. If none is stated, infer one subtle accent that fits the character.
3. Keep the accent subordinate to the face and hair.

## Background formula

Use wording close to:

"clean solid pale pastel full-frame background, a single flat color filling the whole image, plain and uncluttered, with no scene elements and no gradient"

## Negative prompt formula

Always include blocks for:
- realism
- glamour/editorial drift
- toy/chibi/mascot drift
- low-poly/clay drift
- scene/background drift
- watermark/text/logo drift
- over-decoration drift
- repetitive default-hair drift

Recommended baseline:

"photorealistic, realistic skin pores, realistic hair strands, glamour portrait, fashion editorial, luxury cosmetics ad, cinematic lighting, harsh shadows, long neck, broad shoulders, emphasized torso, detailed clothing folds, full body, busy background, room interior, outdoor scene, multiple people, extra props, cluttered accessories, costume styling, heavy makeup, seductive expression, toy figurine, vinyl doll, mascot, chibi, kawaii baby face, blocky low poly, clay render, helmet hair, black button eyes, gradient background, watermark, ai generated watermark, ai badge, logo, signature, text overlay, caption, platform ui, repeated black hair default, generic same male haircut"

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
- mood-matched hair color and hairstyle
- minimal clothing detail
- one readable accessory or subtle personality accent
- clean solid pastel full-frame background
- soft low-contrast portrait lighting
- polished non-toy character finish
- no watermark, ai badge, logo, signature, or text overlay

## Anti-drift suffix formula

Use a short suffix like this:

"same six-reference avatar family, youthful young-adult face, not toy-like, not chibi, not low-poly, not glamour portrait, slight 3/4 social-profile avatar, visible eyelids and irises, soft sculpted hair clumps, mood-matched hair color and hairstyle, high shoulder crop, one subtle personality accent, clean solid pastel full-frame background, single flat color only, no scene, no gradient, no watermark, no ai badge, no logo, no text overlay"

## Writing rules

- Prefer structural terms over taste terms.
- Use "youthful", "stylized", "social-profile avatar", "high shoulder crop", "slight 3/4 view", "visible eyelids", "readable irises", "soft sculpted clumps", and "polished character render" more than vague words like "premium", "luxury", or "collectible".
- Never use "app icon", "mascot", or "collectible toy" as positive descriptors.
- If the subject is stylish, express that through one accessory, personal accent, haircut choice, or hair color choice, not through glamour language.
- If the subject is sunny or playful, allow warmer or lighter natural hair colors when they harmonize with the character.
- If the subject is calm or professional, deeper hair colors are fine, but do not collapse every character back to black.
- When a model tends to produce overly plain contact-card avatars, strengthen both the hair choice and the subtle personality accent.

## Example transformation

### Input
"活泼开朗阳光大男孩，运动感，亲切，有点潮流感"

### Universal prompt
A youthful stylized 3D social-profile avatar portrait of a bright, sporty, friendly young man with an upbeat fashionable vibe, designed to match the same six-reference family. Slightly enlarged natural-looking eyes with visible lids and readable irises, a smooth youthful face, tiny sculpted nose, small relaxed mouth, gentle jawline, short-to-moderate neck, and restrained shoulders. Warm golden-brown hair in an airy textured short cut with a lightly lifted fringe, built from soft sculpted clumps and a clean energetic silhouette, avoiding realistic strands and avoiding hard blocky slabs. Wearing a simple casual top with one subtle personal accent such as a small ear stud or lightly tinted glasses. Open cheerful expression, slight 3/4 view. Tight chest-up portrait with a high shoulder crop, face as the clear focal point, body secondary. Soft even portrait lighting with gentle fill, low contrast, controlled highlights, and no dramatic shadows. Clean solid pale mint full-frame background, a single flat color filling the whole image, plain and uncluttered, with no scene elements and no gradient. Smooth clean skin, satin-matte hair, simplified clothing surfaces, polished stylized character render, youthful and cohesive, not photorealistic, not glamorous, not toy-like, and not low-poly.
