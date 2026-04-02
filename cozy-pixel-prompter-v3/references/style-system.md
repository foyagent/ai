# family style system

Use this file to keep the visual family stable.

## one-line definition

A cozy modern east-asian neighborhood pixel-art family style: soft muted colors, everyday slice-of-life subject matter, restrained chibi proportions, clean pixel clusters, gentle seasonal atmosphere, and dense but readable lived-in details.

## core mood

- quiet
- warm
- everyday
- nostalgic without strong retro gimmicks
- community-centered
- seasonal
- gentle rather than dramatic

## rendering identity

This family is **modern indie pixel art**, not hard-retro arcade pixel art.

### keep
- clean pixel readability
- controlled detail density
- soft shading
- low to medium contrast
- limited but expressive palette shifts by season
- restrained outlines rather than heavy black contour lines
- clear object grouping and tidy cluster logic

### avoid
- heavy dithering
- CRT / scanline / fake old-screen filters
- noisy single-pixel speckling everywhere
- thick comic-book outlines
- glossy 3d render lighting
- painterly blur that destroys pixel discipline

## color system

### global behavior
- keep the base palette low to medium-low saturation
- favor dusty greens, foggy blues, warm creams, pale browns, muted yellows, and occasional soft pinks
- keep large color relationships calm and harmonized rather than loud
- allow **small pockets of warm emphasis** in foliage, shop interiors, signs, produce, or companion animals while keeping the overall harmony subdued
- do not turn accent warmth into neon or cyberpunk glow

### seasonal bias
- spring: fresh light greens, soft blossom pinks, pale sky blues
- summer: gentle leaf greens, light turquoise, sun-washed neutrals
- autumn: muted gold, dry leaf orange, warm gray-browns, dusty olive, pink-orange foliage
- winter: cool gray-blue, off-white, charcoal, sparse warm accents

## neighborhood realism

This family should preserve a **softened old-neighborhood realism**.

### keep
- weathered walls
- faded paint
- tiled facades
- old concrete and curb wear
- utility boxes, railings, shutters, pipes, mailboxes
- mild grime patches and chipped edges
- visible use history without making the scene dirty or bleak

### avoid
- idealized spotless streets
- luxury urban styling
- hyper-detailed decay
- grunge overload
- abandoned-apocalypse mood

## clutter rhythm

Use **organized micro-clutter**, not random decorative noise.

### keep
- believable everyday object grouping
- humble street-side props such as stools, baskets, crates, bottles, flower pots, signs, umbrellas, paper boxes, racks, or curbside storage
- local visual logic: objects should feel placed by residents or shopkeepers for practical use
- scenes that feel lived-in but still readable and tidy

### avoid
- prop spam with no real-world logic
- excessive trash or mess
- high-frequency texture clutter
- making every empty corner busy just to look detailed

## character design rules

### proportion
- roughly 2 to 3 heads tall
- slightly enlarged head but not ultra-baby proportions
- compact torso and short limbs
- stable toy-like standing presence

### face
- minimal facial features
- calm and restrained expressions
- avoid giant anime eyes, glossy irises, or exaggerated emotional acting

### clothing
- prioritize modern everyday clothing
- use broad readable garment shapes
- simplify folds and seams
- let hairstyle and outer silhouette carry most identity

### accessories
- use one to three key accessories at most
- each accessory should improve recognition at small scale

### character presence
- when scene context matters, characters should feel like ordinary residents inside a living neighborhood
- favor calm posture and understated presence over heroic staging
- avoid dramatic combat posing unless the user explicitly asks for an action asset

## item and equipment rules

- silhouette first
- material separation second
- tiny engraved details last
- everyday grounded objects should stay grounded unless the user explicitly asks for fantasy rarity or magical treatment
- for icons and props, isolate the object and reduce background information

## environment cues

When a background is requested, prefer modern east-asian neighborhood life details with a strong **mainland chinese old-community flavor** when relevant to the request:
- street trees with broad clustered canopies
- storefronts and apartment facades
- convenience shops, corner stores, market stalls, barber shops, snack counters
- bicycles, scooters, buses
- signs, tiled walls, flower pots, laundry, leaves, curbside objects
- half-open shutters, handwritten price cards, plastic stools, bins, utility fixtures, simple chinese signage when text is needed

These cues should support the scene without overwhelming the main subject.

## foliage and plant language

- use broad clustered leaf masses
- shape tree canopies like layered soft pixel clouds, not individual leaves
- prefer dusty green, muted pink-orange, or warm seasonal foliage blocks
- keep plants readable at a distance
- use a few decisive color groups rather than leaf-by-leaf rendering

## composition and camera

- prioritize game readability over dramatic perspective
- allow frontal, side, or slight three-quarter views
- allow mild top-down logic for scene-compatible assets, but avoid strict isometric assumptions unless requested
- avoid cinematic wide-angle distortion
- when a scene background is present, prefer slice-of-life framing with partial crops and edge cutoffs, as if capturing a real neighborhood moment rather than presenting a perfect stage set

## lighting

- default to soft daylight or gentle ambient light
- allow localized warm shop lighting, indoor glow, or pink-red market light as controlled accent sources
- keep all lighting matte and soft-edged
- avoid hard spotlight drama, nightclub neon, or sci-fi emissive effects

## shading and material language

- use soft, sparse shading blocks
- keep highlights controlled and matte
- describe materials with shape and value shifts more than with texture noise
- show subtle edge wear, chipped paint accents, and restrained surface aging through sparse pixel variation
- avoid metallic glare, plastic gloss, or hyper-rendered reflections unless explicitly requested

## small-life details

- when relevant, optional tiny companion animals such as resting cats or quiet dogs may appear as low-key neighborhood details
- use them to reinforce community warmth, not to steal focus
- keep them simple and integrated into the environment

## mandatory family anchors

Include enough of the following in every positive prompt so the family does not drift:
- cozy modern pixel art
- east-asian neighborhood slice-of-life feeling when relevant
- soft muted base palette with selective warm accents
- restrained chibi proportions for characters
- clean readable silhouette
- gentle seasonal atmosphere if a season or weather is present
- subtle shading
- modern indie game pixel-art feel
- lived-in old-neighborhood realism when background context is relevant

## negative anchors

Use these as defaults when they are relevant to block drift:
- cyberpunk neon
- high saturation
- heavy dithering
- thick black outlines
- arcade retro filter
- CRT scanlines
- glossy 3d render
- realistic anatomy
- dramatic cinematic lighting
- oversized anime eyes
- cluttered noisy texture
- fantasy overdesign unless requested
- post-apocalyptic grime
- luxury-clean showroom styling


## asset background discipline

For direct-use assets, background handling must stay clinical and invisible. Use real transparency when possible. Never substitute checkerboards, cream cards, textured paper, soft studio backdrops, or display-board presentations. Keep the family style in the subject itself, not in a decorative backing. Feet alignment for sprites should be solved compositionally, not by drawing a visible ground stripe.
