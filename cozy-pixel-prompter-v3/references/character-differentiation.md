# character differentiation system

Use this file together with `character-clothing-lexicon.md` whenever the request involves a **person**. Its purpose is to prevent different roles from collapsing into one default young-adult template.

## core rule

Keep the **family style** stable, but vary the **human identity system** aggressively enough that different roles are readable at a glance.

The following should usually stay unified across a set:
- palette softness
- pixel density
- line weight
- shading softness
- production-safe framing

The following should be allowed to vary strongly:
- age impression
- body build
- head shape
- hairstyle
- posture habit
- garment structure
- lower-body structure
- footwear
- carried object
- work-wear traces
- dominant outfit color family

## minimum separation rule

When generating two different characters in the same family, make sure at least **4 of these 10 axes** differ:
1. age impression
2. body build
3. head or jaw shape
4. hairstyle or hair volume
5. stance
6. top-layer garment structure
7. lower-body garment structure
8. footwear type
9. carried item / work accessory
10. dominant outfit color family

For large role gaps such as courier vs farmer vs cook vs shop worker, aim for **6 or more axes**.

## age impression library

### teen / student
- smoother face
- narrower shoulders
- lighter stance
- simpler layering
- backpack or school bag
- cleaner shoes

### young adult
- balanced build
- commuter or worker casual styling
- moderate confidence in stance
- sharper outfit structure than teen characters

### middle-aged adult
- slightly heavier torso or more practical build
- broader or more settled stance
- more lived-in clothing logic
- less fashion-led layering

### older adult / elder
- softer or more lined face logic
- mild stoop or relaxed stance
- looser cardigan, work shirt, quilted jacket, or homewear silhouettes
- practical shoes or slippers
- reading glasses, cane, folded hands, or simple bag when relevant

## build library

Use these as silhouette-level cues, not anatomy realism.

- slim upright build
- compact balanced build
- long-legged lean build
- stockier practical build
- soft rounded build
- sturdy outdoor-work build
- narrow-shouldered shy build
- broad-shouldered service-worker build
- older slightly stooped build

## head and face cues

Keep facial features minimal, but vary face structure enough to help recognition.

- round face
- soft oval face
- longer face
- squarer jaw
- fuller cheeks
- narrower chin
- heavier brow suggestion
- gentler elder smile lines
- tired under-eye cue kept subtle

## hairstyle differentiation

Do not default everyone to a near-identical neat short cut.

### feminine-coded options
- straight bob with clip
- blunt bob
- side-part bob
- shoulder-length tied back hair
- short practical ponytail
- soft permed short hair for older women
- tucked-behind-ear medium hair
- low bun

### masculine-coded options
- neat short crop
- side-part short hair
- slightly messy commuter hair
- older receding hairline
- gray short hair
- under-hat short hair
- simple brushed-up cut

### elder and worker cues
- gray temple hair
- sparse crown hair under straw hat
- tied-back kitchen hair
- tucked cap hair
- wind-pressed short hair

## stance and posture library

Use mild pose changes only. Keep them sprite-safe.

- neutral symmetrical stand
- weight on one leg
- slight forward lean
- one shoulder slightly raised by bag strap
- hands behind back
- one hand lightly holding apron edge
- one hand carrying parcel or produce bag
- practical wide worker stance
- gentle elder stoop
- attentive service stance

## profession silhouette kits

Each profession should read from the whole body, not one token.

### courier / delivery worker
- practical commuter or workwear silhouette
- light or medium work jacket, windbreaker, or utility layer
- functional tapered or sturdier straight pants kept simple
- sturdier sneakers or work shoes
- crossbody delivery bag, parcel bag, or insulated box silhouette
- brisk, slightly forward, ready-to-move stance
- muted navy, fog blue, washed teal, or faded indigo as dominant outfit tones
- age usually young adult to middle-aged unless otherwise requested

### farmer / field elder
- straw hat or sun hat optional but not mandatory
- older or sun-exposed impression
- rolled work shirt or faded light shirt
- loose field trousers, cuffed work pants, or work-rough slacks
- rubber boots, work shoes, or practical sandals
- relaxed but sturdy outdoor stance
- produce basket, hand towel, or work gloves if needed
- moss, cocoa, clay red, dusty olive, or washed brown as dominant tones

### cook / kitchen worker
- apron type should vary: waist apron, full apron, work smock, or kitchen overlayer
- tied-back hair or practical short hair
- service or kitchen shoes / clogs
- cleaner upper body but practical work silhouette
- one hand near apron seam or relaxed service stance
- can read as warm, attentive, efficient rather than fashionable
- fog blue, muted mauve, warm gray, washed teal, or smoke purple as dominant tones
- lower body should often vary away from default straight pants: cropped kitchen pants, narrow ankle pants, or skirt-over-leggings

### shop worker / convenience clerk
- tidy practical silhouette
- apron, vest, or layered service top
- straighter posture than outdoor labor roles
- walking shoes or simple flats
- understated but organized appearance
- name-tag zone implied only by shape, not by text
- sage, muted navy, fog blue, warm gray, or dusty plum dominant tones
- lower body may be narrow ankle pants, loose slacks, soft skirt, or skirt-over-leggings

### market vendor
- rolled sleeves
- apron or protective overlayer
- practical pants or skirt-over-pants logic
- boots, sandals, or worn walking shoes
- wider planted stance
- produce basket, plastic bag, or towel if needed
- clay red, moss, faded indigo, cocoa, or dusty mauve dominant tones

### office commuter
- collared layer, knit layer, or neat jacket
- tote or shoulder bag
- cleaner shoes
- calm upright stance
- less visible wear than manual work roles
- fog blue, muted navy, sage, or charcoal dominant tones

### barber / salon worker
- smock or neat dark apron layer
- precise but relaxed service stance
- simpler footwear
- slightly more groomed silhouette than outdoor workers
- charcoal, smoke purple, or muted navy dominant tones

## wear and work-trace cues

Use sparingly. This family should feel lived-in, not dirty.

- slightly sun-faded shirt
- lightly worn cuffs
- softened apron edges
- faint work creases
- practical rolled sleeves
- subtly dusty shoe tips
- slightly sagged tote or work bag
- gentle sun-warm skin tone shift

Avoid grease splatter overload, grime drama, or cartoon dirt unless the user explicitly wants it.

## anti-collapse rules

When different characters keep coming out too similar, explicitly instruct the model to avoid these defaults:
- same young-adult age impression
- same slim straight build
- same centered neutral pose
- same bob or short fringe hairstyle
- same cream shirt plus brown or khaki pants combination
- same black canvas sneaker solution
- same straight-leg pants solution
- same clean commuter face for every role
- same apron-over-shirt template for all service jobs
- same muted yellow dominant color family

## prompt injection pattern

For role-driven characters, add a short clause like this to the positive prompt:

- visually distinct from other neighborhood roles through age, build, stance, garment structure, lower-body shape, and work accessory
- profession readable at a glance, not just through one symbolic prop
- varied dominant clothing color family, not default beige or yellow workwear unless explicitly requested

## quick differentiation recipes

### female shop worker vs female cook
- shop worker: tidier posture, vest or apron, cleaner flats or walking shoes, organized service silhouette, sage / navy / fog-blue dominant clothing
- cook: fuller apron coverage or smock, tied-back hair or shorter practical hair, kitchen shoes/clogs, warmer work stance, mauve / gray / teal dominant clothing

### courier vs commuter man
- courier: more functional outerwear, practical bag, sturdier shoes, slight forward-ready stance, blue or teal dominant outerwear
- commuter: cleaner jacket or knit layer, lighter bag, calmer upright pose, less workwear feel, gray / navy / sage dominant clothing

### farmer elder vs older neighborhood resident
- farmer elder: sturdier outdoor build, sun hat, rolled sleeves, loose field trousers, work shoes, earthier green-brown-clay clothing mix
- neighborhood elder: cardigan or quilted layer, softer homewear silhouette, slippers or walking shoes, gentler indoor-community presence, gray-blue or olive clothing focus
