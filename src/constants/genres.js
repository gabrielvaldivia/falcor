export const GENRES = [
  { id: "fantasy", label: "Fantasy", mood: 7, prompt: "mythical creatures, ancient magic, epic quests" },
  { id: "drama", label: "Drama", mood: 5, dialogue: 6, prompt: "conflict, moral dilemmas, human struggle, high stakes" },
  { id: "mystery", label: "Mystery", mood: 3, prompt: "clues, suspicion, hidden truths, tension" },
  { id: "scifi", label: "Sci-Fi", mood: 5, prompt: "technology, alien worlds, future societies" },
  { id: "bedtime", label: "Children", mood: 7, prompt: "wonder, imagination, gentle lessons, playful adventures" },
  { id: "horror", label: "Horror", mood: 1, prompt: "dread, the uncanny, creeping fear" },
];

export const VOICES_BY_GENRE = {
  fantasy: [
    { id: "lyrical", label: "Lyrical & Labyrinthine", tone: 7, length: 6, description: "Winding, dreamlike, nested clauses" },
    { id: "poetic", label: "Poetic & Dramatic", tone: 8, length: 5, description: "Elevated language, rhythm, metaphor" },
    { id: "gothic", label: "Lush & Gothic", tone: 8, length: 7, description: "Dense atmosphere, ornate description" },
    { id: "cinematic", label: "Cinematic & Vivid", tone: 6, length: 5, dialogue: 4, description: "Visual, fast-paced, sensory-driven" },
    { id: "mythic", label: "Mythic & Ancient", tone: 7, length: 5, description: "Timeless cadence, legend-like narration" },
    { id: "spare", label: "Spare & Direct", tone: 2, length: 3, description: "Short sentences, no embellishment" },
  ],
  drama: [
    { id: "raw", label: "Raw & Unflinching", tone: 4, length: 5, dialogue: 5, description: "Brutally honest, no sentimentality" },
    { id: "literary", label: "Literary & Layered", tone: 7, length: 6, description: "Rich subtext, moral complexity" },
    { id: "tense", label: "Tense & Restrained", tone: 5, length: 4, dialogue: 6, description: "Simmering conflict, controlled prose" },
    { id: "passionate", label: "Passionate & Bold", tone: 8, length: 5, dialogue: 5, description: "Intense emotions, dramatic moments" },
    { id: "spare", label: "Spare & Direct", tone: 3, length: 3, description: "Understated, emotionally direct" },
    { id: "cinematic", label: "Cinematic & Vivid", tone: 6, length: 5, dialogue: 4, description: "Visual, fast-paced, sensory-driven" },
  ],
  mystery: [
    { id: "spare", label: "Spare & Direct", tone: 2, length: 3, description: "Short sentences, no embellishment" },
    { id: "noir", label: "Noir & Hardboiled", tone: 4, length: 4, dialogue: 5, description: "Cynical voice, streetwise, moody" },
    { id: "wry", label: "Wry & Observant", tone: 4, length: 4, dialogue: 5, description: "Dry wit, sharp observation" },
    { id: "atmospheric", label: "Atmospheric & Tense", tone: 6, length: 5, description: "Slow dread, layered detail" },
    { id: "clinical", label: "Clinical & Precise", tone: 2, length: 3, description: "Forensic eye, methodical, detached" },
    { id: "cinematic", label: "Cinematic & Vivid", tone: 6, length: 5, dialogue: 4, description: "Visual, fast-paced, sensory-driven" },
  ],
  scifi: [
    { id: "spare", label: "Spare & Direct", tone: 2, length: 3, description: "Short sentences, no embellishment" },
    { id: "cinematic", label: "Cinematic & Vivid", tone: 6, length: 5, dialogue: 4, description: "Visual, fast-paced, sensory-driven" },
    { id: "cerebral", label: "Cerebral & Cool", tone: 3, length: 5, description: "Ideas-driven, detached, philosophical" },
    { id: "lyrical", label: "Lyrical & Strange", tone: 7, length: 6, description: "Alien beauty, dreamlike imagery" },
    { id: "wry", label: "Wry & Observant", tone: 4, length: 4, dialogue: 5, description: "Dry wit, sharp observation" },
    { id: "clinical", label: "Clinical & Precise", tone: 2, length: 4, description: "Detached, technical, matter-of-fact" },
  ],
  bedtime: [
    { id: "warm", label: "Warm & Gentle", tone: 5, length: 4, description: "Soft, soothing, reassuring" },
    { id: "playful", label: "Playful & Silly", tone: 4, length: 3, dialogue: 5, description: "Fun voices, giggles, surprises" },
    { id: "whimsical", label: "Whimsical & Magical", tone: 6, length: 4, description: "Fairy-tale wonder, enchanting details" },
    { id: "rhyming", label: "Rhythmic & Singsongy", tone: 5, length: 3, description: "Musical cadence, near-rhymes" },
    { id: "adventurous", label: "Adventurous & Brave", tone: 5, length: 4, dialogue: 4, description: "Exciting journeys, can-do spirit" },
    { id: "cozy", label: "Cozy & Snug", tone: 5, length: 4, description: "Blanket-soft narration, safe and calm" },
  ],
  horror: [
    { id: "gothic", label: "Lush & Gothic", tone: 8, length: 7, description: "Dense atmosphere, ornate description" },
    { id: "spare", label: "Spare & Dread", tone: 2, length: 3, description: "Stark, stripped-down, unsettling" },
    { id: "atmospheric", label: "Creeping & Slow", tone: 6, length: 6, description: "Building unease, lingering detail" },
    { id: "clinical", label: "Clinical & Wrong", tone: 2, length: 4, description: "Detached tone that makes it worse" },
    { id: "feverish", label: "Feverish & Unhinged", tone: 8, length: 5, dialogue: 3, description: "Frantic, unreliable, spiraling" },
    { id: "wry", label: "Darkly Comic", tone: 4, length: 4, dialogue: 4, description: "Gallows humor, ironic detachment" },
  ],
};

export const ALL_VOICES = Object.values(VOICES_BY_GENRE).flat();
export function getVoicesForGenre(genreId) {
  return VOICES_BY_GENRE[genreId] || VOICES_BY_GENRE.fantasy;
}

export const THEMES_BY_GENRE = {
  fantasy: [
    { id: "redemption", label: "Redemption", prompt: "seeking forgiveness and second chances" },
    { id: "power", label: "Power & Corruption", prompt: "the corrupting influence of power and ambition" },
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "freedom", label: "Freedom", prompt: "the struggle for liberation and autonomy" },
    { id: "sacrifice", label: "Sacrifice", prompt: "giving up what matters most for a greater cause" },
    { id: "legacy", label: "Legacy", prompt: "what we inherit and what we leave behind" },
  ],
  drama: [
    { id: "power", label: "Power", prompt: "the pursuit of control and its corrupting influence" },
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "betrayal", label: "Betrayal", prompt: "broken trust and its consequences" },
    { id: "justice", label: "Justice", prompt: "the fight for what is right against impossible odds" },
    { id: "sacrifice", label: "Sacrifice", prompt: "what we give up for something greater" },
    { id: "legacy", label: "Legacy", prompt: "what we leave behind and how we are remembered" },
  ],
  mystery: [
    { id: "betrayal", label: "Betrayal", prompt: "broken trust and its consequences" },
    { id: "justice", label: "Justice", prompt: "the pursuit of what is right against what is easy" },
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "power", label: "Power & Corruption", prompt: "the corrupting influence of power and ambition" },
    { id: "obsession", label: "Obsession", prompt: "a fixation that consumes and distorts" },
    { id: "truth", label: "Truth & Deception", prompt: "the gap between what is seen and what is real" },
  ],
  scifi: [
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "survival", label: "Survival", prompt: "endurance against overwhelming odds" },
    { id: "freedom", label: "Freedom", prompt: "the struggle for liberation and autonomy" },
    { id: "power", label: "Power & Corruption", prompt: "the corrupting influence of power and ambition" },
    { id: "evolution", label: "Evolution", prompt: "transformation of species, society, or self" },
    { id: "connection", label: "Connection", prompt: "bridging distance, species, or understanding" },
  ],
  bedtime: [
    { id: "friendship", label: "Friendship", prompt: "the power of companionship and loyalty" },
    { id: "courage", label: "Courage", prompt: "finding bravery even when you're scared" },
    { id: "kindness", label: "Kindness", prompt: "small acts of generosity that change everything" },
    { id: "belonging", label: "Belonging", prompt: "finding where you fit in the world" },
    { id: "curiosity", label: "Curiosity", prompt: "the wonder of exploring and discovering" },
    { id: "growing-up", label: "Growing Up", prompt: "learning new things and becoming who you are" },
  ],
  horror: [
    { id: "survival", label: "Survival", prompt: "endurance against overwhelming odds" },
    { id: "betrayal", label: "Betrayal", prompt: "broken trust and its consequences" },
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "isolation", label: "Isolation", prompt: "being cut off, alone, and vulnerable" },
    { id: "guilt", label: "Guilt", prompt: "sins that follow and demand payment" },
    { id: "forbidden", label: "Forbidden Knowledge", prompt: "truths that should have stayed buried" },
  ],
};

export const ALL_THEMES = Object.values(THEMES_BY_GENRE).flat();
export function getThemesForGenre(genreId) {
  return THEMES_BY_GENRE[genreId] || THEMES_BY_GENRE.fantasy;
}

export const PROTAGONISTS_BY_GENRE = {
  fantasy: [
    { id: "reluctant-hero", label: "Reluctant Hero", prompt: "a protagonist thrust unwillingly into action" },
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "scholar", label: "Scholar", prompt: "a seeker of knowledge drawn into events beyond the academic" },
    { id: "wanderer", label: "Wanderer", prompt: "a rootless traveler searching for meaning or home" },
    { id: "ruler", label: "Ruler", prompt: "a leader burdened by the weight of command and consequence" },
    { id: "outcast", label: "Outcast", prompt: "a rejected figure forging their own path" },
  ],
  drama: [
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "patriarch", label: "Patriarch / Matriarch", prompt: "a family leader holding everything together — or apart" },
    { id: "whistleblower", label: "Whistleblower", prompt: "someone who risks everything to expose the truth" },
    { id: "rebel", label: "Rebel", prompt: "a free spirit who resists expectations" },
    { id: "fallen", label: "Fallen Figure", prompt: "someone powerful brought low, seeking redemption or revenge" },
    { id: "stranger", label: "Stranger in Town", prompt: "a newcomer who disrupts the familiar" },
  ],
  mystery: [
    { id: "detective", label: "Detective", prompt: "an investigator driven to uncover the truth" },
    { id: "anti-hero", label: "Anti-Hero", prompt: "a morally ambiguous protagonist with questionable methods" },
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "journalist", label: "Journalist", prompt: "a reporter who won't let go of a story" },
    { id: "witness", label: "Witness", prompt: "someone who saw too much and can't unsee it" },
    { id: "suspect", label: "Suspect", prompt: "accused and racing to prove their innocence" },
  ],
  scifi: [
    { id: "reluctant-hero", label: "Reluctant Hero", prompt: "a protagonist thrust unwillingly into action" },
    { id: "scholar", label: "Scientist", prompt: "a researcher confronting the consequences of discovery" },
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "android", label: "Artificial Being", prompt: "a created intelligence questioning its own nature" },
    { id: "pilot", label: "Pilot", prompt: "a navigator of ships, stations, or unknown frontiers" },
    { id: "survivor", label: "Last Survivor", prompt: "the sole remaining witness to a lost world" },
  ],
  bedtime: [
    { id: "child", label: "Curious Child", prompt: "a young explorer discovering the world with wonder" },
    { id: "animal", label: "Brave Animal", prompt: "a loyal creature on an unexpected adventure" },
    { id: "tiny-creature", label: "Tiny Creature", prompt: "a small being proving that size doesn't matter" },
    { id: "lost-toy", label: "Lost Toy", prompt: "a beloved toy on a journey back home" },
    { id: "sibling", label: "Big Sibling", prompt: "an older brother or sister learning to protect and share" },
    { id: "magical-friend", label: "Magical Friend", prompt: "a fantastical companion who appears when needed most" },
  ],
  horror: [
    { id: "anti-hero", label: "Anti-Hero", prompt: "a morally ambiguous protagonist with questionable methods" },
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "child", label: "Child", prompt: "a young protagonist experiencing the world with fresh, terrified eyes" },
    { id: "skeptic", label: "Skeptic", prompt: "a rational mind forced to confront the inexplicable" },
    { id: "caretaker", label: "Caretaker", prompt: "someone responsible for others in an impossible situation" },
    { id: "inheritor", label: "Inheritor", prompt: "someone who has received something they shouldn't have" },
  ],
};

export const ALL_PROTAGONISTS = Object.values(PROTAGONISTS_BY_GENRE).flat();
export function getProtagonistsForGenre(genreId) {
  return PROTAGONISTS_BY_GENRE[genreId] || PROTAGONISTS_BY_GENRE.fantasy;
}

export const TENSIONS_BY_GENRE = {
  fantasy: [
    { id: "vs-nature", label: "Person vs Nature", prompt: "conflict against the natural world and its forces" },
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-person", label: "Person vs Person", prompt: "direct conflict between characters with opposing goals" },
    { id: "fate", label: "Fate / Prophecy", prompt: "the tension between destiny and free will" },
    { id: "vs-power", label: "Person vs Power", prompt: "standing against a force far greater than oneself" },
    { id: "quest", label: "The Quest", prompt: "a journey toward a goal that keeps shifting" },
  ],
  drama: [
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-person", label: "Person vs Person", prompt: "direct conflict between characters with opposing goals" },
    { id: "vs-society", label: "Person vs Society", prompt: "rebellion against social norms and institutions" },
    { id: "moral-dilemma", label: "Moral Dilemma", prompt: "a choice where every option demands a price" },
    { id: "secret", label: "Hidden Truth", prompt: "a secret that could change everything" },
    { id: "downfall", label: "Downfall", prompt: "pride, ambition, or obsession leading to ruin" },
  ],
  mystery: [
    { id: "vs-person", label: "Person vs Person", prompt: "direct conflict between characters with opposing goals" },
    { id: "mystery", label: "Mystery / Secret", prompt: "a hidden truth that drives the narrative forward" },
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-society", label: "Person vs Society", prompt: "rebellion against social norms and institutions" },
    { id: "clock", label: "Race Against Time", prompt: "a deadline that tightens with every chapter" },
    { id: "trust", label: "Shifting Trust", prompt: "allies who might be enemies in disguise" },
  ],
  scifi: [
    { id: "vs-nature", label: "Person vs Nature", prompt: "conflict against the natural world and its forces" },
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-society", label: "Person vs Society", prompt: "rebellion against social norms and institutions" },
    { id: "vs-technology", label: "Person vs Technology", prompt: "conflict with the machines and systems we created" },
    { id: "vs-unknown", label: "Person vs Unknown", prompt: "encountering something beyond comprehension" },
    { id: "paradox", label: "Paradox", prompt: "contradictions that unravel the rules of the world" },
  ],
  bedtime: [
    { id: "getting-lost", label: "Getting Lost", prompt: "wandering far from home and finding the way back" },
    { id: "big-fear", label: "Facing a Fear", prompt: "confronting something scary and discovering bravery" },
    { id: "new-friend", label: "Making a Friend", prompt: "overcoming shyness to form an unlikely bond" },
    { id: "vs-nature", label: "Wild Weather", prompt: "a storm, a flood, or a long winter to outlast" },
    { id: "mix-up", label: "A Big Mix-Up", prompt: "a silly misunderstanding that snowballs into adventure" },
    { id: "promise", label: "A Promise to Keep", prompt: "a vow that's harder to honor than expected" },
  ],
  horror: [
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-nature", label: "Person vs Nature", prompt: "conflict against the natural world and its forces" },
    { id: "vs-unknown", label: "Person vs Unknown", prompt: "encountering something beyond comprehension" },
    { id: "mystery", label: "Mystery / Secret", prompt: "a hidden truth that drives the narrative forward" },
    { id: "confinement", label: "Confinement", prompt: "trapped with no clear way out" },
    { id: "corruption", label: "Corruption", prompt: "something familiar slowly becoming wrong" },
  ],
};

export const ALL_TENSIONS = Object.values(TENSIONS_BY_GENRE).flat();
export function getTensionsForGenre(genreId) {
  return TENSIONS_BY_GENRE[genreId] || TENSIONS_BY_GENRE.fantasy;
}
