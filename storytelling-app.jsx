import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { GoArrowLeft, GoInfo, GoPlus, GoDash, GoKebabHorizontal, GoLocation, GoChevronDown, GoPulse } from "react-icons/go";
import { TbLayoutListFilled, TbLayoutList } from "react-icons/tb";
import { MdOutlineViewCarousel } from "react-icons/md";
import { BsSliders2Vertical } from "react-icons/bs";

/* ────────────────────────────────────────────
   Genre & Voice Constants + Preset Mappings
   ──────────────────────────────────────────── */

const GENRES = [
  { id: "fantasy", label: "Fantasy", mood: 7, prompt: "mythical creatures, ancient magic, epic quests" },
  { id: "drama", label: "Drama", mood: 5, dialogue: 6, prompt: "conflict, moral dilemmas, human struggle, high stakes" },
  { id: "mystery", label: "Mystery", mood: 3, prompt: "clues, suspicion, hidden truths, tension" },
  { id: "scifi", label: "Sci-Fi", mood: 5, prompt: "technology, alien worlds, future societies" },
  { id: "bedtime", label: "Bedtime", mood: 7, prompt: "wonder, imagination, gentle lessons, playful adventures" },
  { id: "horror", label: "Horror", mood: 1, prompt: "dread, the uncanny, creeping fear" },
];

const VOICES_BY_GENRE = {
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

const ALL_VOICES = Object.values(VOICES_BY_GENRE).flat();
function getVoicesForGenre(genreId) {
  return VOICES_BY_GENRE[genreId] || VOICES_BY_GENRE.fantasy;
}

const THEMES_BY_GENRE = {
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

const ALL_THEMES = Object.values(THEMES_BY_GENRE).flat();
function getThemesForGenre(genreId) {
  return THEMES_BY_GENRE[genreId] || THEMES_BY_GENRE.fantasy;
}

const PROTAGONISTS_BY_GENRE = {
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

const ALL_PROTAGONISTS = Object.values(PROTAGONISTS_BY_GENRE).flat();
function getProtagonistsForGenre(genreId) {
  return PROTAGONISTS_BY_GENRE[genreId] || PROTAGONISTS_BY_GENRE.fantasy;
}

const TENSIONS_BY_GENRE = {
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

const ALL_TENSIONS = Object.values(TENSIONS_BY_GENRE).flat();
function getTensionsForGenre(genreId) {
  return TENSIONS_BY_GENRE[genreId] || TENSIONS_BY_GENRE.fantasy;
}

function getStyleForStory(genre, voice) {
  const g = GENRES.find((x) => x.id === genre) || GENRES[0];
  const v = ALL_VOICES.find((x) => x.id === voice) || getVoicesForGenre(genre)[0];
  return {
    tone: v.tone,
    length: v.length,
    mood: g.mood,
    dialogue: g.dialogue || v.dialogue || 2,
  };
}

/* ────────────────────────────────────────────
   Translations (EN / ES)
   ──────────────────────────────────────────── */

const TRANSLATIONS = {
  en: {
    // App
    app_name: "Falcor",
    // Nav & actions
    back: "Back",
    home: "Home",
    about: "About",
    all: "All",
    // Footer
    built_by: "Built by",
    copyright: "Copyright",
    // New story
    new_story: "New Story",
    continue_btn: "Continue",
    skip: "Skip",
    start_story: "Start Story",
    creating: "Creating...",
    step_genre: "Genre",
    step_voice: "Writing Voice",
    step_themes: "Themes",
    step_protagonist: "Protagonist",
    step_tension: "Narrative Tension",
    optional: "(optional)",
    up_to_2: ", up to 2",
    // Story view
    chapter: "Chapter",
    ch: "Ch.",
    in_progress: "In progress",
    loading: "Loading...",
    loading_activity: "Loading activity...",
    no_activity: "No activity yet",
    contributions: "contributions",
    contribution: "contribution",
    last_updated: "Last updated",
    select_chapter: "Select a chapter",
    copied: "Copied!",
    copy_link: "Copy Link",
    delete_btn: "Delete",
    confirm_delete: "Confirm delete?",
    untitled: "Untitled",
    // Interaction
    write_answer: "Write your answer...",
    writing: "Writing...",
    adding: "Adding...",
    preview: "PREVIEW",
    add: "ADD",
    back_btn: "BACK",
    rewrite: "REWRITE",
    local_fallback: "AI unavailable — used local fallback",
    // Errors
    error_generation: "Something went wrong. Please try again.",
    error_save: "Failed to save. Please try again.",
    error_rewrite: "Rewrite failed.",
    // Sliders
    slider_plot: "Plot",
    slider_dialogue: "Dialogue",
    slider_surprise: "Surprise",
    slider_emotion: "Emotion",
    slider_tooltip: "Passage style sliders",
    // Slider value labels
    plot_labels: ["Linger", "Dwell", "Savor", "Gentle", "Steady", "Moving", "Driven", "Urgent", "Racing", "Leaping"],
    dialogue_labels: ["None", "Minimal", "Sparse", "Light", "Moderate", "Balanced", "Frequent", "Rich", "Heavy", "All Talk"],
    surprise_labels: ["Steady", "Calm", "Gentle", "Mild", "Moderate", "Notable", "Bold", "Dramatic", "Shocking", "Wild"],
    emotion_labels: ["Stoic", "Reserved", "Subtle", "Restrained", "Moderate", "Open", "Warm", "Vivid", "Intense", "Raw"],
    // Location
    geo_on: "Using precise location",
    geo_off: "Enable precise location",
    // Popover
    popover_location: "Location",
    popover_date: "Date",
    popover_prompt: "Prompt",
    popover_answer: "Answer",
    // About page
    about_title: "About Falcor",
    about_p1: "Falcor is an experiment in co-creative storytelling. Anyone can contribute to a shared story. You answer a simple question about what should happen next, and AI turns it into prose. The result is a living artifact shaped by strangers.",
    about_why: "Why this exists",
    about_p2: 'Writing is hard. But answering "what should happen next?" is easy. This lowers the barrier to entry by turning storytelling into a back-and-forth, where your direction sets the path and AI carries it forward. This feels like a new kind of media experience. It isn\'t writing per se, but it is shaped by human input.',
    about_p3: "All stories are shared and open. You can see what each person wrote and where in the world they wrote it from. When strangers from different places contribute to a shared output, the world feels a little smaller.",
    about_how: "How it works",
    about_p4: "Start by choosing a genre. Each genre unlocks its own curated set of writing voices, themes, protagonist types, and narrative tensions, all tailored to fit the kind of story you want to tell.",
    about_p5: "Falcor generates a title and opening passage, then asks you questions about what happens next. Your brief answers become the seeds for each new passage. The AI considers everything that came before, building on earlier choices, tracking narrative arcs, deciding when chapters should end, and generating chapter titles.",
    about_p6: "Stories are stored in the cloud and can be shared with a direct link using the menu on any story page. Anyone with the link can read along and contribute to the story.",
    about_credits: "Credits",
    about_built_by: "Built by",
    about_powered_by: "Powered by",
    // Genres
    genre_fantasy: "Fantasy",
    genre_drama: "Drama",
    genre_mystery: "Mystery",
    genre_scifi: "Sci-Fi",
    genre_bedtime: "Bedtime",
    genre_horror: "Horror",
    // Voices — Fantasy
    voice_fantasy_lyrical: "Lyrical & Labyrinthine", voicedesc_fantasy_lyrical: "Winding, dreamlike, nested clauses",
    voice_fantasy_poetic: "Poetic & Dramatic", voicedesc_fantasy_poetic: "Elevated language, rhythm, metaphor",
    voice_fantasy_gothic: "Lush & Gothic", voicedesc_fantasy_gothic: "Dense atmosphere, ornate description",
    voice_fantasy_cinematic: "Cinematic & Vivid", voicedesc_fantasy_cinematic: "Visual, fast-paced, sensory-driven",
    voice_fantasy_mythic: "Mythic & Ancient", voicedesc_fantasy_mythic: "Timeless cadence, legend-like narration",
    voice_fantasy_spare: "Spare & Direct", voicedesc_fantasy_spare: "Short sentences, no embellishment",
    // Voices — Drama
    voice_drama_raw: "Raw & Unflinching", voicedesc_drama_raw: "Brutally honest, no sentimentality",
    voice_drama_literary: "Literary & Layered", voicedesc_drama_literary: "Rich subtext, moral complexity",
    voice_drama_tense: "Tense & Restrained", voicedesc_drama_tense: "Simmering conflict, controlled prose",
    voice_drama_passionate: "Passionate & Bold", voicedesc_drama_passionate: "Intense emotions, dramatic moments",
    voice_drama_spare: "Spare & Direct", voicedesc_drama_spare: "Understated, emotionally direct",
    voice_drama_cinematic: "Cinematic & Vivid", voicedesc_drama_cinematic: "Visual, fast-paced, sensory-driven",
    // Voices — Mystery
    voice_mystery_spare: "Spare & Direct", voicedesc_mystery_spare: "Short sentences, no embellishment",
    voice_mystery_noir: "Noir & Hardboiled", voicedesc_mystery_noir: "Cynical voice, streetwise, moody",
    voice_mystery_wry: "Wry & Observant", voicedesc_mystery_wry: "Dry wit, sharp observation",
    voice_mystery_atmospheric: "Atmospheric & Tense", voicedesc_mystery_atmospheric: "Slow dread, layered detail",
    voice_mystery_clinical: "Clinical & Precise", voicedesc_mystery_clinical: "Forensic eye, methodical, detached",
    voice_mystery_cinematic: "Cinematic & Vivid", voicedesc_mystery_cinematic: "Visual, fast-paced, sensory-driven",
    // Voices — Sci-Fi
    voice_scifi_spare: "Spare & Direct", voicedesc_scifi_spare: "Short sentences, no embellishment",
    voice_scifi_cinematic: "Cinematic & Vivid", voicedesc_scifi_cinematic: "Visual, fast-paced, sensory-driven",
    voice_scifi_cerebral: "Cerebral & Cool", voicedesc_scifi_cerebral: "Ideas-driven, detached, philosophical",
    voice_scifi_lyrical: "Lyrical & Strange", voicedesc_scifi_lyrical: "Alien beauty, dreamlike imagery",
    voice_scifi_wry: "Wry & Observant", voicedesc_scifi_wry: "Dry wit, sharp observation",
    voice_scifi_clinical: "Clinical & Precise", voicedesc_scifi_clinical: "Detached, technical, matter-of-fact",
    // Voices — Bedtime
    voice_bedtime_warm: "Warm & Gentle", voicedesc_bedtime_warm: "Soft, soothing, reassuring",
    voice_bedtime_playful: "Playful & Silly", voicedesc_bedtime_playful: "Fun voices, giggles, surprises",
    voice_bedtime_whimsical: "Whimsical & Magical", voicedesc_bedtime_whimsical: "Fairy-tale wonder, enchanting details",
    voice_bedtime_rhyming: "Rhythmic & Singsongy", voicedesc_bedtime_rhyming: "Musical cadence, near-rhymes",
    voice_bedtime_adventurous: "Adventurous & Brave", voicedesc_bedtime_adventurous: "Exciting journeys, can-do spirit",
    voice_bedtime_cozy: "Cozy & Snug", voicedesc_bedtime_cozy: "Blanket-soft narration, safe and calm",
    // Voices — Horror
    voice_horror_gothic: "Lush & Gothic", voicedesc_horror_gothic: "Dense atmosphere, ornate description",
    voice_horror_spare: "Spare & Dread", voicedesc_horror_spare: "Stark, stripped-down, unsettling",
    voice_horror_atmospheric: "Creeping & Slow", voicedesc_horror_atmospheric: "Building unease, lingering detail",
    voice_horror_clinical: "Clinical & Wrong", voicedesc_horror_clinical: "Detached tone that makes it worse",
    voice_horror_feverish: "Feverish & Unhinged", voicedesc_horror_feverish: "Frantic, unreliable, spiraling",
    voice_horror_wry: "Darkly Comic", voicedesc_horror_wry: "Gallows humor, ironic detachment",
    // Themes
    theme_redemption: "Redemption", theme_power: "Power & Corruption", theme_identity: "Identity",
    theme_freedom: "Freedom", theme_sacrifice: "Sacrifice", theme_legacy: "Legacy",
    theme_drama_power: "Power", theme_betrayal: "Betrayal", theme_justice: "Justice",
    theme_obsession: "Obsession", theme_truth: "Truth & Deception",
    theme_survival: "Survival", theme_evolution: "Evolution", theme_connection: "Connection",
    theme_friendship: "Friendship", theme_courage: "Courage", theme_kindness: "Kindness",
    theme_belonging: "Belonging", theme_curiosity: "Curiosity", theme_growing_up: "Growing Up",
    theme_isolation: "Isolation", theme_guilt: "Guilt", theme_forbidden: "Forbidden Knowledge",
    // Protagonists
    protag_reluctant_hero: "Reluctant Hero", protag_outsider: "Outsider", protag_scholar: "Scholar",
    protag_wanderer: "Wanderer", protag_ruler: "Ruler", protag_outcast: "Outcast",
    protag_patriarch: "Patriarch / Matriarch", protag_whistleblower: "Whistleblower",
    protag_rebel: "Rebel", protag_fallen: "Fallen Figure", protag_stranger: "Stranger in Town",
    protag_detective: "Detective", protag_anti_hero: "Anti-Hero", protag_journalist: "Journalist",
    protag_witness: "Witness", protag_suspect: "Suspect",
    protag_scientist: "Scientist", protag_android: "Artificial Being", protag_pilot: "Pilot",
    protag_survivor: "Last Survivor",
    protag_child: "Curious Child", protag_animal: "Brave Animal", protag_tiny_creature: "Tiny Creature",
    protag_lost_toy: "Lost Toy", protag_sibling: "Big Sibling", protag_magical_friend: "Magical Friend",
    protag_horror_child: "Child", protag_skeptic: "Skeptic", protag_caretaker: "Caretaker",
    protag_inheritor: "Inheritor",
    // Conflicts
    conflict_vs_nature: "Person vs Nature", conflict_vs_self: "Person vs Self",
    conflict_vs_person: "Person vs Person", conflict_fate: "Fate / Prophecy",
    conflict_vs_power: "Person vs Power", conflict_quest: "The Quest",
    conflict_vs_society: "Person vs Society", conflict_moral_dilemma: "Moral Dilemma",
    conflict_secret: "Hidden Truth", conflict_downfall: "Downfall",
    conflict_mystery: "Mystery / Secret", conflict_clock: "Race Against Time",
    conflict_trust: "Shifting Trust",
    conflict_vs_technology: "Person vs Technology", conflict_vs_unknown: "Person vs Unknown",
    conflict_paradox: "Paradox",
    conflict_getting_lost: "Getting Lost", conflict_big_fear: "Facing a Fear",
    conflict_new_friend: "Making a Friend", conflict_wild_weather: "Wild Weather",
    conflict_mix_up: "A Big Mix-Up", conflict_promise: "A Promise to Keep",
    conflict_confinement: "Confinement", conflict_corruption: "Corruption",
    // Fallback prompts
    fallback_1: "What happened next?",
    fallback_2: "Something unexpected appeared...",
    fallback_3: "A sound broke the silence...",
    fallback_4: "Someone arrived with news...",
    fallback_5: "The weather suddenly changed...",
  },
  es: {
    // App
    app_name: "Falcor",
    // Nav & actions
    back: "Atrás",
    home: "Inicio",
    about: "Acerca de",
    all: "Todo",
    // Footer
    built_by: "Creado por",
    copyright: "Derechos de autor",
    // New story
    new_story: "Nueva Historia",
    continue_btn: "Continuar",
    skip: "Omitir",
    start_story: "Comenzar Historia",
    creating: "Creando...",
    step_genre: "Género",
    step_voice: "Voz Narrativa",
    step_themes: "Temas",
    step_protagonist: "Protagonista",
    step_tension: "Tensión Narrativa",
    optional: "(opcional)",
    up_to_2: ", hasta 2",
    // Story view
    chapter: "Capítulo",
    ch: "Cap.",
    in_progress: "En progreso",
    loading: "Cargando...",
    loading_activity: "Cargando actividad...",
    no_activity: "Sin actividad aún",
    contributions: "contribuciones",
    contribution: "contribución",
    last_updated: "Última actualización",
    select_chapter: "Selecciona un capítulo",
    copied: "¡Copiado!",
    copy_link: "Copiar enlace",
    delete_btn: "Eliminar",
    confirm_delete: "¿Confirmar eliminación?",
    untitled: "Sin título",
    // Interaction
    write_answer: "Escribe tu respuesta...",
    writing: "Escribiendo...",
    adding: "Añadiendo...",
    preview: "VISTA PREVIA",
    add: "AÑADIR",
    back_btn: "ATRÁS",
    rewrite: "REESCRIBIR",
    local_fallback: "IA no disponible — se usó respaldo local",
    // Errors
    error_generation: "Algo salió mal. Por favor intenta de nuevo.",
    error_save: "No se pudo guardar. Por favor intenta de nuevo.",
    error_rewrite: "La reescritura falló.",
    // Sliders
    slider_plot: "Trama",
    slider_dialogue: "Diálogo",
    slider_surprise: "Sorpresa",
    slider_emotion: "Emoción",
    slider_tooltip: "Controles de estilo del pasaje",
    // Slider value labels
    plot_labels: ["Pausado", "Detenido", "Saborear", "Suave", "Constante", "Avanzando", "Decidido", "Urgente", "Veloz", "Vertiginoso"],
    dialogue_labels: ["Nada", "Mínimo", "Escaso", "Ligero", "Moderado", "Equilibrado", "Frecuente", "Rico", "Intenso", "Solo Diálogo"],
    surprise_labels: ["Estable", "Calmo", "Suave", "Leve", "Moderado", "Notable", "Audaz", "Dramático", "Impactante", "Salvaje"],
    emotion_labels: ["Estoico", "Reservado", "Sutil", "Contenido", "Moderado", "Abierto", "Cálido", "Vívido", "Intenso", "Crudo"],
    // Location
    geo_on: "Usando ubicación precisa",
    geo_off: "Activar ubicación precisa",
    // Popover
    popover_location: "Ubicación",
    popover_date: "Fecha",
    popover_prompt: "Pregunta",
    popover_answer: "Respuesta",
    // About page
    about_title: "Acerca de Falcor",
    about_p1: "Falcor es un experimento de narración co-creativa. Cualquiera puede contribuir a una historia compartida. Respondes una simple pregunta sobre qué debería pasar después, y la IA lo convierte en prosa. El resultado es un artefacto vivo moldeado por desconocidos.",
    about_why: "Por qué existe",
    about_p2: 'Escribir es difícil. Pero responder "¿qué debería pasar después?" es fácil. Esto reduce la barrera de entrada al convertir la narración en un ida y vuelta, donde tu dirección marca el camino y la IA lo lleva adelante. Se siente como un nuevo tipo de experiencia mediática. No es escritura en sí, pero está moldeada por la participación humana.',
    about_p3: "Todas las historias son compartidas y abiertas. Puedes ver qué escribió cada persona y desde dónde en el mundo lo hizo. Cuando desconocidos de diferentes lugares contribuyen a un resultado compartido, el mundo se siente un poco más pequeño.",
    about_how: "Cómo funciona",
    about_p4: "Empieza eligiendo un género. Cada género desbloquea su propio conjunto curado de voces narrativas, temas, tipos de protagonista y tensiones narrativas, todos adaptados al tipo de historia que quieras contar.",
    about_p5: "Falcor genera un título y un pasaje inicial, luego te hace preguntas sobre qué pasa después. Tus breves respuestas se convierten en las semillas de cada nuevo pasaje. La IA considera todo lo anterior, construyendo sobre decisiones previas, siguiendo arcos narrativos, decidiendo cuándo deben terminar los capítulos y generando títulos de capítulos.",
    about_p6: "Las historias se almacenan en la nube y se pueden compartir con un enlace directo usando el menú en cualquier página de historia. Cualquiera con el enlace puede leer y contribuir a la historia.",
    about_credits: "Créditos",
    about_built_by: "Creado por",
    about_powered_by: "Impulsado por",
    // Genres
    genre_fantasy: "Fantasía",
    genre_drama: "Drama",
    genre_mystery: "Misterio",
    genre_scifi: "Ciencia Ficción",
    genre_bedtime: "Para Dormir",
    genre_horror: "Terror",
    // Voices — Fantasy
    voice_fantasy_lyrical: "Lírica y Laberíntica", voicedesc_fantasy_lyrical: "Sinuosa, onírica, cláusulas anidadas",
    voice_fantasy_poetic: "Poética y Dramática", voicedesc_fantasy_poetic: "Lenguaje elevado, ritmo, metáfora",
    voice_fantasy_gothic: "Exuberante y Gótica", voicedesc_fantasy_gothic: "Atmósfera densa, descripción ornamentada",
    voice_fantasy_cinematic: "Cinematográfica y Vívida", voicedesc_fantasy_cinematic: "Visual, veloz, sensorial",
    voice_fantasy_mythic: "Mítica y Ancestral", voicedesc_fantasy_mythic: "Cadencia atemporal, narración de leyenda",
    voice_fantasy_spare: "Sobria y Directa", voicedesc_fantasy_spare: "Frases cortas, sin adornos",
    // Voices — Drama
    voice_drama_raw: "Cruda y Sin Rodeos", voicedesc_drama_raw: "Brutalmente honesta, sin sentimentalismo",
    voice_drama_literary: "Literaria y Profunda", voicedesc_drama_literary: "Subtexto rico, complejidad moral",
    voice_drama_tense: "Tensa y Contenida", voicedesc_drama_tense: "Conflicto latente, prosa controlada",
    voice_drama_passionate: "Apasionada y Audaz", voicedesc_drama_passionate: "Emociones intensas, momentos dramáticos",
    voice_drama_spare: "Sobria y Directa", voicedesc_drama_spare: "Sobria, emocionalmente directa",
    voice_drama_cinematic: "Cinematográfica y Vívida", voicedesc_drama_cinematic: "Visual, veloz, sensorial",
    // Voices — Mystery
    voice_mystery_spare: "Sobria y Directa", voicedesc_mystery_spare: "Frases cortas, sin adornos",
    voice_mystery_noir: "Noir y Dura", voicedesc_mystery_noir: "Voz cínica, callejera, sombría",
    voice_mystery_wry: "Irónica y Observadora", voicedesc_mystery_wry: "Humor seco, observación aguda",
    voice_mystery_atmospheric: "Atmosférica y Tensa", voicedesc_mystery_atmospheric: "Temor lento, detalle en capas",
    voice_mystery_clinical: "Clínica y Precisa", voicedesc_mystery_clinical: "Ojo forense, metódica, distante",
    voice_mystery_cinematic: "Cinematográfica y Vívida", voicedesc_mystery_cinematic: "Visual, veloz, sensorial",
    // Voices — Sci-Fi
    voice_scifi_spare: "Sobria y Directa", voicedesc_scifi_spare: "Frases cortas, sin adornos",
    voice_scifi_cinematic: "Cinematográfica y Vívida", voicedesc_scifi_cinematic: "Visual, veloz, sensorial",
    voice_scifi_cerebral: "Cerebral y Fría", voicedesc_scifi_cerebral: "Impulsada por ideas, distante, filosófica",
    voice_scifi_lyrical: "Lírica y Extraña", voicedesc_scifi_lyrical: "Belleza alienígena, imágenes oníricas",
    voice_scifi_wry: "Irónica y Observadora", voicedesc_scifi_wry: "Humor seco, observación aguda",
    voice_scifi_clinical: "Clínica y Precisa", voicedesc_scifi_clinical: "Distante, técnica, objetiva",
    // Voices — Bedtime
    voice_bedtime_warm: "Cálida y Tierna", voicedesc_bedtime_warm: "Suave, reconfortante, tranquilizadora",
    voice_bedtime_playful: "Juguetona y Divertida", voicedesc_bedtime_playful: "Voces graciosas, risitas, sorpresas",
    voice_bedtime_whimsical: "Fantástica y Mágica", voicedesc_bedtime_whimsical: "Asombro de cuento de hadas, detalles encantadores",
    voice_bedtime_rhyming: "Rítmica y Cantarina", voicedesc_bedtime_rhyming: "Cadencia musical, casi-rimas",
    voice_bedtime_adventurous: "Aventurera y Valiente", voicedesc_bedtime_adventurous: "Viajes emocionantes, espíritu emprendedor",
    voice_bedtime_cozy: "Acogedora y Cómoda", voicedesc_bedtime_cozy: "Narración suave como una manta, segura y tranquila",
    // Voices — Horror
    voice_horror_gothic: "Exuberante y Gótica", voicedesc_horror_gothic: "Atmósfera densa, descripción ornamentada",
    voice_horror_spare: "Sobria y Ominosa", voicedesc_horror_spare: "Austera, despojada, inquietante",
    voice_horror_atmospheric: "Sigilosa y Lenta", voicedesc_horror_atmospheric: "Inquietud creciente, detalle persistente",
    voice_horror_clinical: "Clínica e Incorrecta", voicedesc_horror_clinical: "Tono distante que lo empeora todo",
    voice_horror_feverish: "Febril y Desquiciada", voicedesc_horror_feverish: "Frenética, poco confiable, en espiral",
    voice_horror_wry: "Humor Negro", voicedesc_horror_wry: "Humor de horca, distanciamiento irónico",
    // Themes
    theme_redemption: "Redención", theme_power: "Poder y Corrupción", theme_identity: "Identidad",
    theme_freedom: "Libertad", theme_sacrifice: "Sacrificio", theme_legacy: "Legado",
    theme_drama_power: "Poder", theme_betrayal: "Traición", theme_justice: "Justicia",
    theme_obsession: "Obsesión", theme_truth: "Verdad y Engaño",
    theme_survival: "Supervivencia", theme_evolution: "Evolución", theme_connection: "Conexión",
    theme_friendship: "Amistad", theme_courage: "Valentía", theme_kindness: "Bondad",
    theme_belonging: "Pertenencia", theme_curiosity: "Curiosidad", theme_growing_up: "Crecimiento",
    theme_isolation: "Aislamiento", theme_guilt: "Culpa", theme_forbidden: "Conocimiento Prohibido",
    // Protagonists
    protag_reluctant_hero: "Héroe Reluctante", protag_outsider: "Forastero/a", protag_scholar: "Erudito/a",
    protag_wanderer: "Vagabundo/a", protag_ruler: "Gobernante", protag_outcast: "Marginado/a",
    protag_patriarch: "Patriarca / Matriarca", protag_whistleblower: "Denunciante",
    protag_rebel: "Rebelde", protag_fallen: "Figura Caída", protag_stranger: "Extraño/a en el Pueblo",
    protag_detective: "Detective", protag_anti_hero: "Antihéroe", protag_journalist: "Periodista",
    protag_witness: "Testigo", protag_suspect: "Sospechoso/a",
    protag_scientist: "Científico/a", protag_android: "Ser Artificial", protag_pilot: "Piloto",
    protag_survivor: "Último/a Sobreviviente",
    protag_child: "Niño/a Curioso/a", protag_animal: "Animal Valiente", protag_tiny_creature: "Criatura Diminuta",
    protag_lost_toy: "Juguete Perdido", protag_sibling: "Hermano/a Mayor", protag_magical_friend: "Amigo/a Mágico/a",
    protag_horror_child: "Niño/a", protag_skeptic: "Escéptico/a", protag_caretaker: "Cuidador/a",
    protag_inheritor: "Heredero/a",
    // Conflicts
    conflict_vs_nature: "Persona vs Naturaleza", conflict_vs_self: "Persona vs Sí Mismo",
    conflict_vs_person: "Persona vs Persona", conflict_fate: "Destino / Profecía",
    conflict_vs_power: "Persona vs Poder", conflict_quest: "La Búsqueda",
    conflict_vs_society: "Persona vs Sociedad", conflict_moral_dilemma: "Dilema Moral",
    conflict_secret: "Verdad Oculta", conflict_downfall: "Caída",
    conflict_mystery: "Misterio / Secreto", conflict_clock: "Contra el Tiempo",
    conflict_trust: "Confianza Cambiante",
    conflict_vs_technology: "Persona vs Tecnología", conflict_vs_unknown: "Persona vs lo Desconocido",
    conflict_paradox: "Paradoja",
    conflict_getting_lost: "Perderse", conflict_big_fear: "Enfrentar un Miedo",
    conflict_new_friend: "Hacer un Amigo", conflict_wild_weather: "Clima Salvaje",
    conflict_mix_up: "Un Gran Malentendido", conflict_promise: "Una Promesa que Cumplir",
    conflict_confinement: "Encierro", conflict_corruption: "Corrupción",
    // Fallback prompts
    fallback_1: "¿Qué pasó después?",
    fallback_2: "Algo inesperado apareció...",
    fallback_3: "Un sonido rompió el silencio...",
    fallback_4: "Alguien llegó con noticias...",
    fallback_5: "El clima cambió de repente...",
  },
};

function getStoryContext(meta) {
  const g = GENRES.find((x) => x.id === meta.genre);
  const v = ALL_VOICES.find((x) => x.id === meta.writingStyle);
  if (!g || !v) return "";
  let ctx = `This is a ${g.label} story written in a ${v.label.toLowerCase()} voice. Key themes: ${g.prompt}. Writing style: ${v.description.toLowerCase()}.`;
  if (meta.themes && meta.themes.length > 0) {
    const themeDescs = meta.themes.map((id) => ALL_THEMES.find((t) => t.id === id)).filter(Boolean);
    if (themeDescs.length > 0) ctx += ` Thematic focus: ${themeDescs.map((t) => t.prompt).join("; ")}.`;
  }
  if (meta.protagonist) {
    const p = ALL_PROTAGONISTS.find((x) => x.id === meta.protagonist);
    if (p) ctx += ` Protagonist: ${p.prompt}.`;
  }
  if (meta.tension) {
    const t = ALL_TENSIONS.find((x) => x.id === meta.tension);
    if (t) ctx += ` Central tension: ${t.prompt}.`;
  }
  return ctx;
}

/* ────────────────────────────────────────────
   Stories Index Helpers
   ──────────────────────────────────────────── */

const STORIES_INDEX_KEY = "stories-index-v1";

async function loadStoriesIndex() {
  try {
    const result = await window.storage.get(STORIES_INDEX_KEY, true);
    return result ? JSON.parse(result.value) : [];
  } catch {
    return [];
  }
}

async function saveStoriesIndex(index) {
  await window.storage.set(STORIES_INDEX_KEY, JSON.stringify(index), true);
}

function storyKey(id, suffix) {
  return `story-${id}-${suffix}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function findStoryBySlug(index, slug) {
  return index.find((s) => s.slug === slug);
}

/* ────────────────────────────────────────────
   Shared API Helper
   ──────────────────────────────────────────── */

async function callClaude(system, userMessage, maxTokens = 100) {
  const resp = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "unknown");
    throw new Error(`API ${resp.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await resp.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

async function deleteStoryData(id) {
  const suffixes = ["data-v1", "prompt-v1", "count-v1", "chapter-v1", "titles-v1"];
  for (const s of suffixes) {
    await window.storage.delete(storyKey(id, s), true).catch(() => {});
  }
}

/* ────────────────────────────────────────────
   AI Prompt Generation
   ──────────────────────────────────────────── */

async function generatePrompt(existingStory, chapter = 1, isNewChapter = false, genreVoiceCtx = "", plotPace = 5, lang = "en") {
  const storyContext = existingStory.length > 0
    ? existingStory.slice(-3).map((e) => e.text).join("\n\n")
    : "";

  const plotPaceInstruction = plotPace <= 2
    ? `\nIMPORTANT: Generate a question that invites the user to describe atmosphere, a sensory detail, or an emotion. Do NOT ask about events or what happens next. Examples: "What did the room smell like?", "What sound kept repeating?", "How did the air feel?"\n`
    : plotPace >= 7
    ? `\nIMPORTANT: Generate a question that drives the plot forward dramatically. Ask about actions, decisions, confrontations, or turning points. Examples: "What did they decide to do?", "Who appeared at the door?", "What secret was revealed?"\n`
    : "";

  const systemPrompt = `Generate a single question that a person can answer in a few words. It must be a question ending with "?" that invites a short, imaginative response. NOT a story sentence. NOT a statement. It should feel like a question a friend asks you.
${genreVoiceCtx ? `\nContext: ${genreVoiceCtx}\nThe question should fit naturally within this genre and voice.\n` : ""}${plotPaceInstruction}
Good examples:
- "What did the stranger have in their pocket?"
- "What was written on the note?"
- "What woke everyone up at 3am?"
- "What did it smell like inside?"

Bad examples (DO NOT do these):
- "The door creaked open revealing..." (this is a statement, not a question)
- "A mysterious light appeared in the sky." (this is a story sentence)
- "Continue the story about..." (this is an instruction)

Output ONLY the question. No quotes. Under 12 words.${lang === "es" ? "\n\nIMPORTANT: Generate the question in Spanish." : ""}`;

  let userMessage;
  if (existingStory.length === 0) {
    userMessage = "Generate an opening question that will seed the very first paragraph of a novel. The question should invite the user to establish a character, a place, or a mood — something that anchors the reader in a scene. Examples: \"Who was standing at the door?\" or \"What kind of town was it?\" or \"What was the first thing you noticed about the room?\"";
  } else if (isNewChapter) {
    userMessage = `STORY SO FAR (last passages):\n"""${storyContext}"""\n\nYou are starting Chapter ${chapter} of the story. Generate an opening question for this new chapter that shifts the setting, introduces a new thread, or jumps forward in time. It should feel like a fresh start while still connected to the world established so far.`;
  } else {
    userMessage = `STORY SO FAR (last passages):\n"""${storyContext}"""\n\nGenerate a short question about what happens next in Chapter ${chapter}, based on the story so far.`;
  }

  try {
    const text = await callClaude(systemPrompt, userMessage, 100);
    if (text && text.length > 5) return text;
  } catch (err) {
    console.warn("Prompt generation failed:", err.message);
  }

  const fb = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const fallbacks = [fb.fallback_1, fb.fallback_2, fb.fallback_3, fb.fallback_4, fb.fallback_5];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/* ────────────────────────────────────────────
   AI Story Generation via Anthropic API
   ──────────────────────────────────────────── */

function getStyleInstructions(settings) {
  const { tone, length, mood, dialogue, surprise = 3, emotion = 4, plot = 5 } = settings;

  const toneDesc = tone <= 3
    ? `minimalist and spare (${tone}/9) — short declarative sentences, very few adjectives`
    : tone <= 6
    ? `balanced literary prose (${tone}/9) — moderate detail and description`
    : `lush and ornate (${tone}/9) — richly descriptive with layered sensory detail and elaborate phrasing`;

  const sentenceCount = Math.round(1 + ((length ?? 4) / 9) * 5);
  const lengthDesc = `approximately ${sentenceCount} sentence${sentenceCount !== 1 ? "s" : ""}`;

  const paceDesc = plot <= 2
    ? "DO NOT advance the plot. Focus entirely on atmosphere, sensory detail, and describing what the user mentions. Linger in the moment. No new events, no plot movement."
    : plot <= 5
    ? "Gently advance the plot. Blend the user's answer with atmosphere and description. Small narrative steps."
    : `Push the plot forward significantly (${plot}/9). Use the user's answer to drive major story beats, introduce new events, and move the narrative forward decisively.`;

  const moodDesc = mood <= 3
    ? `dark and unsettling (${mood}/9) — undercurrents of dread and unease`
    : mood <= 6
    ? `mysterious and grounded (${mood}/9) — slightly magical, atmospheric`
    : `light and whimsical (${mood}/9) — playful with gentle humor`;

  const dialogueDesc = dialogue <= 2
    ? "no dialogue, only narration"
    : dialogue <= 5
    ? "occasional brief dialogue mixed with narration"
    : `dialogue-heavy (${dialogue}/9) — characters speaking to each other frequently`;

  const surpriseDesc = surprise <= 2
    ? "predictable and steady (keep the narrative on a familiar path)"
    : surprise <= 5
    ? "mild surprises (small twists or unexpected details woven in)"
    : `highly unexpected (${surprise}/9) — surprising turns, subverted expectations, strange revelations`;

  const emotionDesc = emotion <= 2
    ? "emotionally restrained — understated feelings, mostly implied"
    : emotion <= 5
    ? "moderate emotional depth — characters show feelings but stay grounded"
    : `emotionally expressive (${emotion}/9) — vivid inner life, strong feelings surfacing openly`;

  return `- Style: ${toneDesc}
- Length: ${lengthDesc}
- Mood: ${moodDesc}
- Dialogue: ${dialogueDesc}
- Surprise: ${surpriseDesc}
- Emotion: ${emotionDesc}
- Plot pace: ${paceDesc}`;
}

async function shouldEndChapter(story, currentChapter) {
  const chapterPassages = story.filter((e) => e.chapter === currentChapter);
  if (chapterPassages.length < 4) return false;

  const chapterText = chapterPassages.map((e) => e.text).join("\n\n");

  try {
    const answer = await callClaude(
      `You are a narrative structure analyst. Given the passages of a story chapter, determine if the chapter's narrative arc feels complete — has it built tension and reached a natural resolution or resting point? Consider: has there been a setup, development, and some form of payoff or shift? Chapters typically run 5-8 passages but can be shorter if the arc resolves early. Respond with ONLY "yes" or "no".`,
      `Here are the passages of Chapter ${currentChapter}:\n\n${chapterText}\n\nIs this chapter's narrative arc complete?`,
      10
    );
    return answer.toLowerCase().startsWith("yes");
  } catch (err) {
    console.warn("Chapter check failed:", err.message);
    return false;
  }
}

async function generateChapterTitle(story, chapter, lang = "en") {
  const chapterText = story
    .filter((e) => e.chapter === chapter)
    .map((e) => e.text)
    .join("\n\n");

  try {
    const title = await callClaude(
      `You are a literary editor. Given the text of a story chapter, produce a short, evocative chapter title. Output ONLY the title — no quotes, no "Chapter N:", no punctuation unless it's part of the title. 2-5 words.${lang === "es" ? " Write the title in Spanish." : ""}`,
      `Here is Chapter ${chapter}:\n\n${chapterText}\n\nWhat should this chapter be titled?`,
      30
    );
    const cleaned = title.replace(/^["']|["']$/g, "");
    return cleaned && cleaned.length > 0 ? cleaned : null;
  } catch (err) {
    console.warn("Chapter title generation failed:", err.message);
    return null;
  }
}

async function callClaudeAPI(existingStory, prompt, userAnswer, styleSettings, chapter = 1, genreVoiceCtx = "", lang = "en") {
  const storyContext =
    existingStory.length > 0
      ? (() => {
          const recent = existingStory.slice(-8);
          const first = existingStory[0];
          // Include first passage for grounding if it's not already in the recent window
          const passages = recent.includes(first) ? recent : [first, ...recent];
          return passages.map((e) => e.text).join("\n\n");
        })()
      : "";

  const styleInstructions = getStyleInstructions(styleSettings);

  const systemPrompt = `You are a collaborative storyteller writing Chapter ${chapter} of an evolving collaborative story. You take a user's brief answer to a creative writing prompt and transform it into prose that continues the story.
${genreVoiceCtx ? `\n${genreVoiceCtx}\n` : ""}
CRITICAL RULES:
- Write ONLY the story text. No preamble, no explanation, no quotes around it.
- Write in third person, past tense.
- Seamlessly continue from the existing story if provided.
- The output must be substantially different and richer than the user's raw input.
- Build toward a satisfying narrative arc within this chapter.

YOU MUST STRICTLY FOLLOW THESE STYLE SETTINGS — they are the most important constraint:
${styleInstructions}

These style settings override any other instinct you have. If the style says "spare", write bare-bones prose. If it says "ornate", write elaborate prose. If it says "1 sentence", write exactly 1 sentence. If dialogue is "none", include zero dialogue. Follow the settings literally.${lang === "es" ? "\n\nIMPORTANT: Write the entire story passage in Spanish." : ""}`;

  const userMessage =
    existingStory.length > 0
      ? `STORY SO FAR (last passages):\n"""${storyContext}"""\n\nPROMPT SHOWN TO USER: "${prompt}"\nUSER'S ANSWER: "${userAnswer}"\n\nTransform their answer into the next story passage following the style settings exactly. Continue naturally from what came before. Output ONLY the story text.`
      : `This is the FIRST passage of a brand new story — the opening paragraph.\n\nPROMPT SHOWN TO USER: "${prompt}"\nUSER'S ANSWER: "${userAnswer}"\n\nWrite this as the opening paragraph of a novel. It should establish setting, character, or atmosphere and draw the reader in immediately. Ground the reader in a specific scene — a place, a moment, a sensory detail. Weave the user's answer naturally into the prose. This must read like the first paragraph you'd find on page one of a published book. Follow the style settings exactly. Output ONLY the story text.`;

  const text = await callClaude(systemPrompt, userMessage, 1000);

  if (!text || text.length < 10) {
    throw new Error("API returned empty or too-short text");
  }

  if (text.toLowerCase() === userAnswer.toLowerCase().trim()) {
    throw new Error("AI echoed input verbatim");
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ────────────────────────────────────────────
   AI Story Opener (title + first paragraph)
   ──────────────────────────────────────────── */

async function generateStoryOpener(meta, lang = "en") {
  const genreObj = GENRES.find((g) => g.id === meta.genre);
  const voiceObj = ALL_VOICES.find((v) => v.id === meta.writingStyle);
  if (!genreObj || !voiceObj) return null;

  const styleSettings = getStyleForStory(meta.genre, meta.writingStyle);
  const styleInstructions = getStyleInstructions(styleSettings);

  let extraContext = "";
  if (meta.themes && meta.themes.length > 0) {
    const themeDescs = meta.themes.map((id) => ALL_THEMES.find((t) => t.id === id)).filter(Boolean);
    if (themeDescs.length > 0) extraContext += `\nThematic focus: ${themeDescs.map((t) => `${t.label} (${t.prompt})`).join(", ")}`;
  }
  if (meta.protagonist) {
    const p = ALL_PROTAGONISTS.find((x) => x.id === meta.protagonist);
    if (p) extraContext += `\nProtagonist type: ${p.label} — ${p.prompt}`;
  }
  if (meta.tension) {
    const t = ALL_TENSIONS.find((x) => x.id === meta.tension);
    if (t) extraContext += `\nCentral tension: ${t.label} — ${t.prompt}`;
  }

  try {
    const text = await callClaude(
      `You are a novelist. Given a genre and writing voice, generate the title and opening paragraph of an original story.

Genre: ${genreObj.label} — themes: ${genreObj.prompt}
Voice: ${voiceObj.label} — ${voiceObj.description.toLowerCase()}${extraContext}

Style constraints:
${styleInstructions}

Respond in EXACTLY this format (no extra text):
TITLE: <a short evocative title, 2-5 words>
PARAGRAPH: <the opening paragraph>

The opening paragraph must read like page one of a published novel — establish a character, setting, or atmosphere. Ground the reader in a specific scene. Follow the style constraints literally.${lang === "es" ? "\n\nIMPORTANT: Write both the title and paragraph in Spanish." : ""}`,
      "Write the title and opening paragraph.",
      600
    );

    const titleMatch = text.match(/TITLE:\s*(.+)/i);
    const paraMatch = text.match(/PARAGRAPH:\s*([\s\S]+)/i);
    if (!titleMatch || !paraMatch) return null;

    return {
      title: titleMatch[1].trim().replace(/^["']|["']$/g, ""),
      paragraph: paraMatch[1].trim().charAt(0).toUpperCase() + paraMatch[1].trim().slice(1),
    };
  } catch (err) {
    console.warn("Story opener generation failed:", err.message);
    return null;
  }
}

/* ────────────────────────────────────────────
   Local fallback story expansion (no API)
   ──────────────────────────────────────────── */

const SCENE_OPENERS = [
  "It was the kind of moment that made the air feel heavier.",
  "The town had seen many strange things, but nothing quite like this.",
  "No one could say exactly when it started, only that it did.",
  "The evening light shifted, casting long shadows across the cobblestones.",
  "A hush fell over the square, thick as morning fog.",
  "Time seemed to slow, the way it does before something changes forever.",
  "The wind carried with it a scent no one could name.",
  "Something stirred at the edge of perception, just beyond understanding.",
];

const CONTINUATIONS = [
  "The townsfolk exchanged uneasy glances, sensing that the world had tilted slightly on its axis.",
  "It lingered in the air like a half-remembered dream, impossible to shake.",
  "No one spoke of it aloud, but everyone felt the shift in their bones.",
  "The silence that followed was louder than any sound the town had ever known.",
  "Even the stray cats paused in the alleyways, ears pricked toward something unseen.",
  "It was as if the town itself had drawn a breath and was holding it still.",
  "Those who witnessed it would carry the memory like a stone in their pocket, smooth and heavy.",
  "By the time anyone thought to question it, the moment had already slipped into the fabric of the town's long history.",
];

function expandLocally(existingStory, userAnswer) {
  const seed =
    userAnswer.split("").reduce((a, c) => a + c.charCodeAt(0), 0) +
    existingStory.length;

  const answer = userAnswer.trim();
  const polished = answer.charAt(0).toUpperCase() + answer.slice(1);
  const withPunctuation = /[.!?]$/.test(polished) ? polished : polished + ".";

  if (existingStory.length === 0) {
    const opener = SCENE_OPENERS[seed % SCENE_OPENERS.length];
    const continuation = CONTINUATIONS[(seed + 3) % CONTINUATIONS.length];
    return `${opener} ${withPunctuation} ${continuation}`;
  } else {
    const continuation = CONTINUATIONS[seed % CONTINUATIONS.length];
    return `${withPunctuation} ${continuation}`;
  }
}

/* ────────────────────────────────────────────
   Main generation function with fallback
   ──────────────────────────────────────────── */

async function fetchLocation() {
  // Use browser geolocation if enabled
  if (localStorage.getItem("falcor_geo_enabled") === "true") {
    const loc = await requestBrowserLocation();
    if (loc) return loc;
  }

  // Fall back to IP-based geolocation
  try {
    const resp = await fetch("https://ipapi.co/json/");
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.region && data.country_name) return data.region + ", " + data.country_name;
    if (data.country_name) return data.country_name;
    return null;
  } catch {
    return null;
  }
}

function requestBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`);
          if (!resp.ok) { resolve(null); return; }
          const data = await resp.json();
          const addr = data.address || {};
          const place = addr.borough || addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || addr.municipality || "";
          const country = addr.country || "";
          const location = place && country ? `${place}, ${country}` : country || null;
          resolve(location);
        } catch { resolve(null); }
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
    );
  });
}

async function generateStoryPassage(existingStory, prompt, userAnswer, styleSettings, chapter = 1, genreVoiceCtx = "", lang = "en") {
  try {
    const aiText = await callClaudeAPI(existingStory, prompt, userAnswer, styleSettings, chapter, genreVoiceCtx, lang);
    return { text: aiText, source: "ai" };
  } catch (err) {
    console.warn("AI generation failed, using local expansion:", err.message);
  }
  const localText = expandLocally(existingStory, userAnswer);
  return { text: localText, source: "local" };
}

/* ────────────────────────────────────────────
   Paragraph Splitting
   ──────────────────────────────────────────── */

function splitIntoParagraphs(text) {
  if (!text) return [text];
  // If the text already has double newlines, split on those
  if (text.includes("\n\n")) {
    return text.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  }
  // For long single-block text, split at sentence boundaries roughly every 3-4 sentences
  const sentences = text.match(/[^.!?]+[.!?]+[\s"]*/g);
  if (!sentences || sentences.length <= 3) return [text];
  const paragraphs = [];
  let current = "";
  let count = 0;
  const target = Math.ceil(sentences.length / Math.ceil(sentences.length / 3));
  for (const s of sentences) {
    current += s;
    count++;
    if (count >= target) {
      paragraphs.push(current.trim());
      current = "";
      count = 0;
    }
  }
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs.length > 0 ? paragraphs : [text];
}

/* ────────────────────────────────────────────
   Typewriter Reveal
   ──────────────────────────────────────────── */

function TypewriterReveal({ text, narrow, onComplete }) {
  const [charCount, setCharCount] = useState(0);
  const idx = useRef(0);
  const paragraphs = useRef([]);

  // Compute paragraph breaks once from the full text
  useEffect(() => {
    paragraphs.current = splitIntoParagraphs(text);
    idx.current = 0;
    setCharCount(0);
    const interval = setInterval(() => {
      idx.current++;
      if (idx.current <= text.length) {
        setCharCount(idx.current);
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text, onComplete]);

  // Map charCount to pre-computed paragraphs
  const fullParagraphs = paragraphs.current;
  const visibleParagraphs = [];
  let remaining = charCount;
  for (const para of fullParagraphs) {
    if (remaining <= 0) break;
    const shown = para.slice(0, remaining);
    visibleParagraphs.push(shown);
    remaining -= para.length;
  }
  const isTyping = charCount < text.length;

  return (
    <div style={{
      fontFamily: "'Courier New', 'Courier', monospace", fontSize: "16px", fontWeight: 400,
      lineHeight: 1.7, color: "#e8ddd0", fontStyle: "normal", margin: 0,
      textRendering: "optimizeLegibility", fontOpticalSizing: "auto",
      fontFeatureSettings: '"kern", "liga", "calt"',
      hangingPunctuation: "first last",
      textWrap: narrow ? "auto" : "pretty",
      hyphens: narrow ? "auto" : "manual",
      overflowWrap: "break-word", maxWidth: "65ch",
      display: "flex", flexDirection: "column", gap: "12px",
    }}>
      {visibleParagraphs.map((para, i) => (
        <p key={i} style={{ margin: 0 }}>
          {para}
          {isTyping && i === visibleParagraphs.length - 1 && (
            <span style={{
              display: "inline-block", width: "2px", height: "18px",
              background: "#999", marginLeft: "2px",
              verticalAlign: "text-bottom", animation: "pulse 1s infinite",
            }} />
          )}
        </p>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Story Entry (minimal)
   ──────────────────────────────────────────── */

function StoryLine({ entry, onHover, onLeave, narrow, onShowDialog, onPinPopover, hideIcon, isChapterStart }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        setHovered(true);
        if (!narrow) onHover(entry);
      }}
      onMouseLeave={() => {
        setHovered(false);
        if (!narrow) onLeave();
      }}
      style={{
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1fr 16px",
        gap: "12px",
        marginRight: narrow ? 0 : "-36px",
      }}
    >
      <div style={{
        fontFamily: "'Faustina', serif", fontSize: "19px", fontWeight: 300, lineHeight: 1.8,
        color: "#e8ddd0", margin: 0,
        textRendering: "optimizeLegibility", fontOpticalSizing: "auto",
        fontFeatureSettings: '"kern", "liga", "calt"',
        hangingPunctuation: "first last",
        textWrap: narrow ? "auto" : "pretty",
        hyphens: narrow ? "auto" : "manual",
        overflowWrap: "break-word", maxWidth: "65ch",
        display: "flex", flexDirection: "column", gap: "12px",
      }}>
        {splitIntoParagraphs(entry.text).map((para, i) => (
          <p key={i} className={isChapterStart && i === 0 ? "drop-cap" : undefined} style={{ margin: 0 }}>{para.charAt(0).toUpperCase() + para.slice(1)}</p>
        ))}
      </div>
      {!narrow && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "8px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinPopover(entry);
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "2px",
              color: "rgba(255,255,255,0.45)",
              transition: "opacity 0.15s, color 0.15s",
              opacity: hideIcon ? 0 : (hovered ? 1 : 0),
              pointerEvents: hideIcon ? "none" : (hovered ? "auto" : "none"),
              position: "sticky", top: "24px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
          >
            <GoInfo size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function StoryPopover({ entry, onClose, t }) {
  if (!entry) return null;
  return (
    <div style={{
      zIndex: 10,
      background: "#1a1917",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "6px",
      padding: "14px 16px",
      fontFamily: MONO,
      fontSize: "12px", color: "rgba(255,255,255,0.5)",
      lineHeight: 1.6,
      width: "280px",
      display: "flex", flexDirection: "column", gap: "8px",
      position: "relative",
    }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "8px", right: "8px",
            background: "none", border: "none",
            cursor: "pointer", color: "rgba(255,255,255,0.45)",
            fontSize: "14px", lineHeight: 1, padding: "2px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
        >
          &times;
        </button>
      )}
      {entry.location && (
        <div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t ? t("popover_location") : "Location"}</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.location}</div>
        </div>
      )}
      {entry.time && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t ? t("popover_date") : "Date"}</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.time}</div>
        </div>
      )}
      {entry.prompt && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t ? t("popover_prompt") : "Prompt"}</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.prompt}</div>
        </div>
      )}
      {entry.originalAnswer && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t ? t("popover_answer") : "Answer"}</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.originalAnswer}</div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   BookTitle — auto-shrinks until text no longer wraps
   ──────────────────────────────────────────── */

function BookTitle({ children, style, ...rest }) {
  const ref = useRef(null);
  const [fontSize, setFontSize] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const base = parseFloat(style.fontSize);
    const minSize = Math.round(base * 0.55);
    let size = base;
    // Disable word-break so long words cause horizontal overflow instead of breaking
    el.style.overflowWrap = "normal";
    el.style.wordBreak = "normal";
    el.style.fontSize = `${size}px`;
    // Shrink until no word overflows the container width
    while (el.scrollWidth > el.clientWidth + 1 && size > minSize) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    // Restore word-break as fallback for extremely long words
    el.style.overflowWrap = "";
    el.style.wordBreak = "";
    setFontSize(size);
  }, [children, style.fontSize, style.fontFamily]);

  return (
    <div ref={ref} style={{ ...style, fontSize: fontSize != null ? `${fontSize}px` : style.fontSize }} {...rest}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────
   Home Screen — Grid of Books
   ──────────────────────────────────────────── */

function StoryRow({ title, stories, onSelectStory, isTouch, genreId, fontIndexMap, t, lang }) {
  const scrollRef = useRef(null);

  return (
    <div style={{ marginBottom: isTouch ? "32px" : "40px" }}>
      <h2 style={{
        fontFamily: MONO, fontSize: "12px", fontWeight: 400,
        color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
        textTransform: "uppercase", margin: 0,
        padding: isTouch ? "0 20px" : "0 32px",
      }}>
        {title}
      </h2>
      <div style={{ position: "relative", overflow: "clip visible" }}>
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
          pointerEvents: "none", zIndex: 1,
          background: isTouch
            ? "linear-gradient(to right, #0e0d0b 0%, transparent 20px, transparent calc(100% - 20px), #0e0d0b 100%)"
            : "linear-gradient(to right, #0e0d0b 0%, transparent 32px, transparent calc(100% - 32px), #0e0d0b 100%)",
        }} />
        <div
          ref={scrollRef}
          className="story-hscroll"
          style={{
            display: "flex", gap: "20px",
            overflowX: "auto", WebkitOverflowScrolling: "touch",
            padding: isTouch ? "30px 20px" : "30px 32px",
            scrollbarWidth: "none", msOverflowStyle: "none",
            perspective: isTouch ? "none" : "800px",
          }}
        >
          {stories.map((s, si) => (
            <div
              key={s.id}
              onClick={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35)";
                setTimeout(() => onSelectStory(s.id), 150);
              }}
              style={{
                background: bookColor(s.genre || genreId, s.id).bg,
                border: `1px solid ${bookColor(s.genre || genreId, s.id).border}`,
                borderRadius: "4px",
                padding: "16px 14px",
                cursor: "pointer",
                width: "150px", minWidth: "150px",
                aspectRatio: "2 / 3",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                transition: "transform 0.2s ease-out, border-color 0.15s, box-shadow 0.15s",
                transformStyle: isTouch ? "flat" : "preserve-3d",
              }}
              {...(!isTouch ? {
                onMouseMove: (e) => {
                  if (e.buttons) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width - 0.5;
                  const y = (e.clientY - rect.top) / rect.height - 0.5;
                  e.currentTarget.style.transform = `scale(1.08) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
                  e.currentTarget.style.boxShadow = `${-x * 14}px ${y * 14}px 25px rgba(0,0,0,0.35)`;
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                },
                onMouseDown: (e) => {
                  e.currentTarget.style.transform = "scale(0.95)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
                },
                onMouseUp: (e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.transform = "scale(1) rotateY(0deg) rotateX(0deg)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = bookColor(s.genre || genreId, s.id).border;
                },
              } : {})}
            >
              <div style={{
                fontFamily: MONO, fontSize: "8px", color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center",
              }}>
                {title}
              </div>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%", minWidth: 0,
              }}>
                <BookTitle style={{
                  fontFamily: storyFontForId(genreId, s.id, fontIndexMap).family, fontSize: `${Math.round(20 * (storyFontForId(genreId, s.id, fontIndexMap).scale || 1))}px`, fontWeight: storyFontForId(genreId, s.id, fontIndexMap).weight || 600,
                  color: "#fff", lineHeight: 1.3, padding: "0 2px", maxWidth: "100%",
                }}>
                  {s.title || t("untitled")}
                </BookTitle>
              </div>
              <span style={{
                fontFamily: MONO, fontSize: "10px",
                color: "rgba(255,255,255,0.45)",
                textAlign: "center",
              }}>
                {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ stories, onSelectStory, onNewStory, onAbout, homeLayout, setHomeLayout, fontIndexMap, lang, setLang, t }) {
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const carouselRef = useRef(null);
  const [carouselFilter, setCarouselFilter] = useState("all");
  const [wideEnough, setWideEnough] = useState(() => typeof window !== "undefined" && window.innerWidth >= 900);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const handler = (e) => setWideEnough(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const sorted = [...stories].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  // Load activity feed when switching to activity tab
  useEffect(() => {
    if (homeLayout !== "activity" || stories.length === 0) return;
    let cancelled = false;
    setActivityLoading(true);
    (async () => {
      const entries = [];
      for (const s of stories) {
        try {
          const result = await window.storage.get(storyKey(s.id, "data-v1"), true);
          if (result) {
            const data = JSON.parse(result.value);
            data.forEach((entry, idx) => {
              if (idx === 0) return; // skip story creation
              entries.push({
                ...entry,
                storyId: s.id,
                storyTitle: s.title || t("untitled"),
                storyGenre: s.genre,
                passageIndex: idx,
              });
            });
          }
        } catch { /* skip */ }
      }
      entries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      if (!cancelled) {
        setActivityFeed(entries);
        setActivityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [homeLayout, stories]);

  // Carousel: center on load + infinite scroll loop for "all" filter
  useEffect(() => {
    if (homeLayout !== "carousel" || carouselFilter !== "all") return;
    const el = carouselRef.current;
    if (!el) return;
    const needsLoop = sorted.length > 2;
    if (!needsLoop) return;
    // Center on the first card of the middle copy
    requestAnimationFrame(() => {
      const firstCard = el.children[sorted.length];
      if (firstCard) {
        el.scrollLeft = firstCard.offsetLeft - (el.clientWidth - firstCard.offsetWidth) / 2;
      } else {
        el.scrollLeft = el.scrollWidth / 3;
      }
    });
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const oneSetWidth = el.scrollWidth / 3;
        if (el.scrollLeft >= oneSetWidth * 2 - 1) {
          el.scrollLeft -= oneSetWidth;
        } else if (el.scrollLeft <= 1) {
          el.scrollLeft += oneSetWidth;
        }
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [homeLayout, carouselFilter, sorted.length]);

  // Carousel: mobile center-scale effect
  const updateCenterScale = useCallback(() => {
    const el = carouselRef.current;
    if (!el || !isTouch) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    for (const child of el.children) {
      const cardCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      const maxDist = el.clientWidth / 2;
      const t = Math.min(dist / maxDist, 1);
      const scale = 1.12 - t * 0.12;
      const opacity = 1 - t * 0.4;
      child.style.transform = `scale(${scale})`;
      child.style.opacity = opacity;
    }
  }, [isTouch]);

  useEffect(() => {
    if (homeLayout !== "carousel" || !isTouch) return;
    const el = carouselRef.current;
    if (!el) return;
    requestAnimationFrame(updateCenterScale);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateCenterScale();
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [homeLayout, isTouch, carouselFilter, updateCenterScale]);

  // Group stories by genre, only show genres that have stories
  const genreRows = GENRES
    .map((g) => ({ genre: g, stories: sorted.filter((s) => s.genre === g.id) }))
    .filter((r) => r.stories.length > 0);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: isTouch ? "100dvh" : "100vh", padding: isTouch ? "60px 0 24px" : "80px 0 40px",
      maxWidth: "1200px", margin: "0 auto", width: "100%",
    }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: isTouch ? "16px 20px" : "20px 32px",
        maxWidth: "1200px", margin: "0 auto",
        background: "linear-gradient(to bottom, #0e0d0b 60%, transparent)",
        paddingBottom: isTouch ? "32px" : "40px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
          <h1 style={{
            fontFamily: TYPEWRITER, fontSize: isTouch ? "18px" : "20px", fontWeight: 400,
            color: "#e8ddd0", margin: 0, flexShrink: 0,
          }}>
            {t("app_name")}
          </h1>
          {homeLayout === "carousel" && wideEnough && (
            <div className="story-hscroll" style={{ display: "flex", gap: "6px", marginLeft: "12px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {[{ id: "all", label: t("all") }, ...GENRES].map((g) => {
                const active = carouselFilter === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setCarouselFilter(g.id)}
                    style={{
                      fontFamily: MONO, fontSize: "10px", textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "4px 12px", borderRadius: "20px",
                      border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                      background: active ? "rgba(255,255,255,0.08)" : "transparent",
                      color: active ? "#e8ddd0" : "rgba(255,255,255,0.3)",
                      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {g.id === "all" ? g.label : t("genre_" + g.id)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "2px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", padding: "2px" }}>
            {[{ id: "rows", icon: TbLayoutListFilled, iconOff: TbLayoutList }, { id: "carousel", icon: MdOutlineViewCarousel, iconOff: MdOutlineViewCarousel }, { id: "activity", icon: GoPulse, iconOff: GoPulse }].map((tab) => {
              const active = homeLayout === tab.id;
              const Icon = active ? tab.icon : tab.iconOff;
              return (
              <button
                key={tab.id}
                onClick={() => setHomeLayout(tab.id)}
                style={{
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  border: "none", borderRadius: "18px",
                  padding: "6px 10px",
                  color: active ? "#e8ddd0" : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <Icon size={14} />
              </button>
              );
            })}
          </div>
          <button
            onClick={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)";
              setTimeout(() => onNewStory(), 150);
            }}
            style={{
              padding: isTouch ? "6px 16px" : "8px 20px", borderRadius: "28px",
              background: "#e8ddd0", border: "none", color: "#0e0d0b",
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", gap: "8px",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.4)"; }}
          >
            <span style={{ fontSize: isTouch ? "14px" : "16px", lineHeight: 1 }}>+</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: homeLayout === "rows" ? (isTouch ? "16px" : "24px") : 0 }}>
        {homeLayout === "rows" && genreRows.map((r) => (
          <StoryRow
            key={r.genre.id}
            title={t("genre_" + r.genre.id)}
            stories={r.stories}
            onSelectStory={onSelectStory}
            isTouch={isTouch}
            genreId={r.genre.id}
            fontIndexMap={fontIndexMap}
            t={t}
            lang={lang}
          />
        ))}

        {homeLayout === "carousel" && (() => {
          const carouselBase = carouselFilter === "all"
            ? sorted
            : sorted.filter((s) => s.genre === carouselFilter);
          const needsLoop = carouselFilter === "all" && carouselBase.length > 2;
          const carouselStories = needsLoop
            ? [...carouselBase, ...carouselBase, ...carouselBase]
            : carouselBase;
          return (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {!wideEnough && (
              <div style={{ position: "relative", marginBottom: "16px", marginTop: isTouch ? "16px" : 0 }}>
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
                  pointerEvents: "none", zIndex: 1,
                  background: "linear-gradient(to right, #0e0d0b 0%, transparent 24px, transparent calc(100% - 24px), #0e0d0b 100%)",
                }} />
              <div className="story-hscroll" style={{
                display: "flex", gap: "8px",
                overflowX: "auto", WebkitOverflowScrolling: "touch",
                padding: "0 24px",
                scrollbarWidth: "none", msOverflowStyle: "none",
              }}>
                {[{ id: "all", label: t("all") }, ...GENRES].map((g) => {
                  const active = carouselFilter === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setCarouselFilter(g.id)}
                      style={{
                        fontFamily: MONO, fontSize: "11px", textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "6px 14px", borderRadius: "20px",
                        border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                        background: active ? "rgba(255,255,255,0.08)" : "transparent",
                        color: active ? "#e8ddd0" : "rgba(255,255,255,0.3)",
                        cursor: "pointer", flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      {g.id === "all" ? g.label : t("genre_" + g.id)}
                    </button>
                  );
                })}
              </div>
              </div>
              )}
              <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
                  pointerEvents: "none", zIndex: 1,
                  background: "linear-gradient(to right, #0e0d0b 0%, transparent 48px, transparent calc(100% - 48px), #0e0d0b 100%)",
                }} />
                <div
                  ref={carouselRef}
                  className="story-hscroll"
                  style={{
                    display: "flex", gap: isTouch ? "24px" : "20px",
                    overflowX: "auto", WebkitOverflowScrolling: "touch",
                    padding: isTouch ? "20px calc(50% - 100px)" : "30px 32px",
                    scrollbarWidth: "none", msOverflowStyle: "none",
                    perspective: isTouch ? "none" : "800px",
                    width: "100%",
                    ...(!needsLoop && !isTouch ? { justifyContent: "center" } : {}),
                    ...(isTouch ? { scrollSnapType: "x mandatory" } : {}),
                  }}
                >
                  {carouselStories.map((s, i) => {
                    const genre = GENRES.find((g) => g.id === s.genre);
                    return (
                      <div
                        key={`${s.id}-${i}`}
                        onClick={(e) => {
                          e.currentTarget.style.transform = "scale(1.08)";
                          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35)";
                          setTimeout(() => onSelectStory(s.id), 150);
                        }}
                        style={{
                          background: bookColor(s.genre || genreId, s.id).bg,
                          border: `1px solid ${bookColor(s.genre || genreId, s.id).border}`,
                          borderRadius: "4px",
                          padding: "20px 16px",
                          cursor: "pointer",
                          width: "200px", minWidth: "200px",
                          aspectRatio: "2 / 3",
                          display: "flex", flexDirection: "column", justifyContent: "space-between",
                          transition: "transform 0.2s ease-out, opacity 0.2s ease-out, border-color 0.15s, box-shadow 0.15s",
                          transformStyle: isTouch ? "flat" : "preserve-3d",
                          willChange: isTouch ? "transform" : "auto",
                          ...(isTouch ? { scrollSnapAlign: "center" } : {}),
                        }}
                        {...(!isTouch ? {
                          onMouseMove: (e) => {
                            if (e.buttons) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = (e.clientX - rect.left) / rect.width - 0.5;
                            const y = (e.clientY - rect.top) / rect.height - 0.5;
                            e.currentTarget.style.transform = `scale(1.08) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
                            e.currentTarget.style.boxShadow = `${-x * 14}px ${y * 14}px 25px rgba(0,0,0,0.35)`;
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                          },
                          onMouseDown: (e) => {
                            e.currentTarget.style.transform = "scale(0.95)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
                          },
                          onMouseUp: (e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                          },
                          onMouseLeave: (e) => {
                            e.currentTarget.style.transform = "scale(1) rotateY(0deg) rotateX(0deg)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = bookColor(s.genre || genreId, s.id).border;
                          },
                        } : {})}
                      >
                        <div style={{
                          fontFamily: MONO, fontSize: "9px", color: "rgba(255,255,255,0.5)",
                          textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center",
                        }}>
                          {genre ? t("genre_" + genre.id) : ""}
                        </div>
                        <div style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%", minWidth: 0,
                        }}>
                          <BookTitle style={{
                            fontFamily: storyFontForId(s.genre, s.id, fontIndexMap).family, fontSize: `${Math.round(24 * (storyFontForId(s.genre, s.id, fontIndexMap).scale || 1))}px`, fontWeight: storyFontForId(s.genre, s.id, fontIndexMap).weight || 600,
                            color: "#fff", lineHeight: 1.3, padding: "0 2px", maxWidth: "100%",
                          }}>
                            {s.title || t("untitled")}
                          </BookTitle>
                        </div>
                        <span style={{
                          fontFamily: MONO, fontSize: "11px",
                          color: "rgba(255,255,255,0.45)",
                          textAlign: "center",
                        }}>
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {homeLayout === "activity" && (
          <div style={{ maxWidth: "600px", margin: "0 auto", padding: isTouch ? "0" : "0 24px", width: "100%" }}>
            {activityLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "60vh" }}>
                <p style={{ fontFamily: MONO, fontSize: "12px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                  {t("loading_activity")}
                </p>
              </div>
            ) : activityFeed.length === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: "12px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                {t("no_activity")}
              </p>
            ) : (
              (() => {
                // Group consecutive entries by story
                const groups = [];
                for (const entry of activityFeed) {
                  const last = groups[groups.length - 1];
                  if (last && last.storyId === entry.storyId) {
                    last.entries.push(entry);
                  } else {
                    groups.push({ storyId: entry.storyId, storyTitle: entry.storyTitle, storyGenre: entry.storyGenre, entries: [entry] });
                  }
                }
                return groups.map((group, gi) => {
                  const genre = GENRES.find((g) => g.id === group.storyGenre);
                  return (
                  <div
                    key={`${group.storyId}-${gi}`}
                    onClick={() => onSelectStory(group.storyId)}
                    style={{
                      padding: "20px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      display: "flex", gap: "20px",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Book card */}
                    <div style={{
                      background: bookColor(group.storyGenre, group.storyId).bg,
                      border: `1px solid ${bookColor(group.storyGenre, group.storyId).border}`,
                      borderRadius: "4px",
                      padding: "12px 10px",
                      width: "100px", minWidth: "100px",
                      height: "150px",
                      display: "flex", flexDirection: "column", justifyContent: "space-between",
                      flexShrink: 0, alignSelf: "flex-start",
                      position: "sticky", top: isTouch ? "70px" : "90px",
                    }}>
                      <div style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%", minWidth: 0,
                      }}>
                        <BookTitle style={{
                          fontFamily: storyFontForId(group.storyGenre, group.storyId, fontIndexMap).family, fontSize: `${Math.round(12 * (storyFontForId(group.storyGenre, group.storyId, fontIndexMap).scale || 1))}px`, fontWeight: storyFontForId(group.storyGenre, group.storyId, fontIndexMap).weight || 600,
                          color: "#fff", lineHeight: 1.3, padding: "0 2px", maxWidth: "100%",
                        }}>
                          {group.storyTitle}
                        </BookTitle>
                      </div>
                    </div>
                    {/* Entries */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {group.entries.map((entry, ei) => (
                        <div key={`${entry.passageIndex}-${ei}`} style={{ marginBottom: ei < group.entries.length - 1 ? "20px" : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontFamily: MONO, fontSize: "11px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
                              {entry.ts ? new Date(entry.ts).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : entry.time || ""}
                            </span>
                            </div>
                          {entry.prompt && (
                            <p style={{
                              fontFamily: MONO, fontSize: "13px", lineHeight: 1.5,
                              color: "rgba(255,255,255,0.5)", margin: "0 0 4px",
                            }}>
                              {entry.prompt}
                            </p>
                          )}
                          {entry.originalAnswer && (
                            <p style={{
                              fontFamily: MONO, fontSize: "14px", lineHeight: 1.6,
                              color: "rgba(255,255,255,0.7)", margin: 0,
                            }}>
                              {entry.originalAnswer}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                });
              })()
            )}
          </div>
        )}
      </div>

      <footer style={{
        padding: isTouch ? "12px 24px 24px" : "24px 24px 0",
        display: "flex", flexDirection: isTouch ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isTouch ? "8px" : "16px",
        fontFamily: MONO, fontSize: "11px",
        color: "rgba(255,255,255,0.45)",
      }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span>
            {t("built_by")}{" "}
            <a
              href="https://gabrielvaldivia.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            >
              Gabriel Valdivia
            </a>
          </span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onAbout(); }}
            style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            {t("about")}
          </a>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span style={{ display: "flex", gap: "4px" }}>
            <span
              onClick={() => setLang("en")}
              style={{ cursor: "pointer", color: lang === "en" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", fontWeight: lang === "en" ? 600 : 400 }}
            >EN</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span
              onClick={() => setLang("es")}
              style={{ cursor: "pointer", color: lang === "es" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", fontWeight: lang === "es" ? 600 : 400 }}
            >ES</span>
          </span>
        </div>
        {!isTouch && <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>}
        <span>&copy; {t("copyright")} {new Date().getFullYear()}</span>
      </footer>

    </div>
  );
}

/* ────────────────────────────────────────────
   About Screen
   ──────────────────────────────────────────── */

function AboutScreen({ onBack, narrow, t }) {
  return (
    <>
      {narrow ? (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 10,
          background: "linear-gradient(to bottom, #181714 60%, transparent)",
          padding: "16px 24px",
          display: "flex", alignItems: "center",
        }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              padding: 0, display: "flex", alignItems: "center",
            }}
          >
            <GoArrowLeft size={16} />
          </button>
          <span style={{
            fontFamily: MONO, fontSize: "12px",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.5px", textTransform: "uppercase",
            flex: 1, textAlign: "center",
            marginRight: "16px",
          }}>
            {t("about")}
          </span>
        </div>
      ) : (
        <div style={{
          position: "fixed", left: "24px", top: "24px",
          zIndex: 5,
        }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none",
              fontFamily: MONO, fontSize: "12px",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              padding: 0, textAlign: "left",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            <GoArrowLeft size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />{t("back")}
          </button>
        </div>
      )}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: narrow ? "56px 24px 40px" : "60px 24px 40px" }}>
        <pre className="about-ascii" style={{
          fontFamily: "'Courier New', monospace", fontSize: "9px", lineHeight: 1.0,
          color: "rgba(255,255,255,0.6)", marginBottom: "32px",
          overflow: "hidden", whiteSpace: "pre", letterSpacing: "0px",
        }}>{`@:--:---------------------------------------------------------------------------------------------:@
@::::::::::::::%@@+::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::::::++*=:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::*-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::::@=-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::%*#-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::=-++:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::::%@=:::-====+-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::::-@@-:-+--=:.:%@-:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::-%@+:.....=@@@=:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::-::...-:+%@@+::::::::::-----------::::::::::::::::::-=-----*@%=:::::::::::::::::::::@
@::::::::::::.::+-..::--*=*-:-::::---=%@@@@@@@%=-------------::::----%@@@@@@@@%-:::::::::::::::::::@
@:::::::::::==*#%#@@=---**-------=%@@@@@@@@@@@@@@@*=---------=*=-+%@@@@@@@@@@@@=-::::::::::::::::::@
@::::::::::-@=*%#@@@@@=+@*=#@@@@@@@@@@@@@@@@@@@@@@@@@@#+---=@@@@@@@@@@@@@@@@@@@@@#-::::::::::::::::@
@::::::::::%*%-+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#@#=#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=-::::::::::::::@
@:::::::::-+=:*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%@@*::::::::::::::@
@:::::::::=@-*#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%*+==:::::=:-+%#::::::::::::::@
@:::::::==**@#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#%*:....=-..::::-:=+::::::::::::::@
@::::::-*++@#*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%*+-+-..:..=#=::::::--:::::::::::::::@
@::::-%-=@@@###@@@%%@%#*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=..:=+#@@@@@@@@#=:+%-::::::::::::::::@
@::::-%#@@@@@%-=+%##%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*=:.:::+@@@@@@@@@@@@@*-:::::::::::::::::@
@:=++*=..:+@@+@@@@*@@@@@@@@@@@@@@@%##*%@@@@@@@@@@@@@@@@@%=:....#@##@@###*#%%%@@@@@+-:::::::::::::::@
@%@@@@#==##@@@@@@@%@%@@@@@@@@@@@*=-=++++-=%@@@@@@@@@@@@*....:-=++=++---::--=+++*#%%-:::::::::::::::@
@@@@@@@*=-+++*@@%%@@@@@#+%@@####+--*++*++=-----::::--::...::----::-:::..:::::::====::::::::::::::::@
@@@@@@@@--+++=#@@@%@@@#+++=@@@@@%%=:::::---=-::.......:::::::::::::......:.::::---:::::::::::::::::@
@@@@@@@#=::..:@@@***###%%**@@@%*-..-=-===-:...::....::::::.:...::.::::::::::--:::::::::::::::::::::@
@@@@#+:......#@@@@@@@@*-....-+-::::::::::...::.....:......:::::::::::::::::::::::::::::::::::::::::@
@##+:......:@@@@@%@@@#:.....:::.........::::-.............:::::::----::::::::::::::::::::::::::::::@
@+-:......=@@@@@@@@@@%:.......::==:..:-:..::.......:...:::::---::::::::::::::::::::::::::::::::::::@
@=:......#@@@@@@@%#%*:.......-++---:........::::::::::::---::::::::::::::::::::::::::::::::::::::::@
@:.....:@@@@@#==+=:.........---::........::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:...:#@@@@:..:-:..........:--:..........:::::::...:-::::::::::::::::::::::::::::::::::::::::::::::@
@-..:#@@@@%...............:---::..................:::::::::::::::::::::::::::::::::::::::::::::::::@
@:..-@@@@@:...............-++=+=:................:-::::::::::::::::::::::::::::::::::::::::::::::::@
@..:@@@=.................:====-:...............::+-::::::::::::::::::::::::::::::::::::::::::::::::@
@.:#@=..................:==-:::::.............::-::::::::::::::::::::::::::::::::::::::::::::::::::@
@.:#*:.............:::::-++-:::::::.......:--::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@.=@@:........::::::::::=-==::::::::::::-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@#%*-::::::::::-::::::::-+=-:::::-:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@==::::::::::::::::::::::-:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@--------------------------------------------------------------------------------------------------@`}</pre>
        <h1 style={{
          fontFamily: SERIF, fontSize: "28px", fontWeight: 600,
          color: "#e8ddd0", marginBottom: "32px",
        }}>
          {t("about_title")}
        </h1>

        <div style={{
          fontFamily: "'Faustina', serif", fontSize: "17px", fontWeight: 300,
          lineHeight: 1.8, color: "rgba(255,255,255,0.6)",
          display: "flex", flexDirection: "column", gap: "20px",
        }}>
          <p>
            {t("about_p1")}
          </p>
          <h2 style={{
            fontFamily: MONO, fontSize: "12px", fontWeight: 400,
            color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
            textTransform: "uppercase", marginTop: "8px",
          }}>
            {t("about_why")}
          </h2>
          <p>
            {t("about_p2")}
          </p>

          <p>
            {t("about_p3")}
          </p>
          <h2 style={{
            fontFamily: MONO, fontSize: "12px", fontWeight: 400,
            color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
            textTransform: "uppercase", marginTop: "8px",
          }}>
            {t("about_how")}
          </h2>
          <p>
            {t("about_p4")}
          </p>
          <p>
            {t("about_p5")}
          </p>
          <p>
            {t("about_p6")}
          </p>
          <h2 style={{
            fontFamily: MONO, fontSize: "12px", fontWeight: 400,
            color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
            textTransform: "uppercase", marginTop: "8px",
          }}>
            {t("about_credits")}
          </h2>
          <p>
            {t("about_built_by")}{" "}
            <a
              href="https://gabrielvaldivia.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#e8ddd0", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
              onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.4)"}
              onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.15)"}
            >
              Gabriel Valdivia
            </a>
            {". "}{t("about_powered_by")}{" "}
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#e8ddd0", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
              onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.4)"}
              onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.15)"}
            >
              Claude
            </a>.
          </p>
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────
   New Story Screen — Genre + Voice Selection
   ──────────────────────────────────────────── */

function NewStoryScreen({ onCancel, onCreate, narrow, t, lang }) {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedProtagonist, setSelectedProtagonist] = useState(null);
  const [selectedTension, setSelectedTension] = useState(null);
  const [activeStep, setActiveStep] = useState("genre");
  const [creating, setCreating] = useState(false);

  const toggleTheme = (id) => {
    setSelectedThemes((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 2) return prev;
      const next = [...prev, id];
      setTimeout(() => advanceFrom("themes"), 150);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!selectedGenre || !selectedVoice || creating) return;
    setCreating(true);
    const id = Date.now();
    const meta = {
      id,
      title: "",
      genre: selectedGenre,
      writingStyle: selectedVoice,
      themes: selectedThemes.length > 0 ? selectedThemes : [],
      protagonist: selectedProtagonist || null,
      tension: selectedTension || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passageCount: 0,
    };
    await onCreate(meta);
  };

  const steps = [
    { key: "genre", label: t("step_genre"), optional: false },
    { key: "voice", label: t("step_voice"), optional: false },
    { key: "themes", label: t("step_themes"), optional: true },
    { key: "protagonist", label: t("step_protagonist"), optional: true },
    { key: "tension", label: t("step_tension"), optional: true },
  ];

  const getStepAnswer = (key) => {
    switch (key) {
      case "genre": {
        const g = GENRES.find((x) => x.id === selectedGenre);
        return g ? t("genre_" + g.id) : null;
      }
      case "voice": {
        const v = ALL_VOICES.find((x) => x.id === selectedVoice);
        return v ? (t("voice_" + selectedGenre + "_" + v.id) || v.label) : null;
      }
      case "themes": {
        if (selectedThemes.length === 0) return null;
        return selectedThemes.map((id) => {
          const th = ALL_THEMES.find((x) => x.id === id);
          if (!th) return null;
          const k = th.id.replace(/-/g, "_");
          return TRANSLATIONS[lang]?.["theme_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["theme_" + k] || th.label;
        }).filter(Boolean).join(", ");
      }
      case "protagonist": {
        const p = ALL_PROTAGONISTS.find((x) => x.id === selectedProtagonist);
        if (!p) return null;
        const k = p.id.replace(/-/g, "_");
        return TRANSLATIONS[lang]?.["protag_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["protag_" + k] || p.label;
      }
      case "tension": {
        const tn = ALL_TENSIONS.find((x) => x.id === selectedTension);
        if (!tn) return null;
        const k = tn.id.replace(/-/g, "_");
        return TRANSLATIONS[lang]?.["conflict_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["conflict_" + k] || tn.label;
      }
      default: return null;
    }
  };

  const isStepVisible = (key) => {
    const order = steps.map((s) => s.key);
    const idx = order.indexOf(key);
    if (idx === 0) return true;
    // Show step if all previous required steps are answered
    for (let i = 0; i < idx; i++) {
      const prev = steps[i];
      if (!prev.optional && !getStepAnswer(prev.key)) return false;
    }
    // Also show if previous step was answered or skipped (activeStep moved past it)
    const activeIdx = order.indexOf(activeStep);
    return activeIdx >= idx || getStepAnswer(order[idx - 1]) !== null || steps[idx - 1].optional;
  };

  const advanceFrom = (key) => {
    const order = steps.map((s) => s.key);
    const idx = order.indexOf(key);
    if (idx < order.length - 1) {
      setActiveStep(order[idx + 1]);
    }
  };

  const handleSelectGenre = (id) => {
    setSelectedGenre(id);
    setSelectedVoice(null);
    setSelectedThemes([]);
    setSelectedProtagonist(null);
    setSelectedTension(null);
    setTimeout(() => advanceFrom("genre"), 150);
  };

  const handleSelectVoice = (id) => {
    setSelectedVoice(id);
    setTimeout(() => advanceFrom("voice"), 150);
  };

  const canCreate = selectedGenre && selectedVoice;

  const renderCollapsedRow = (step, disabled = false) => {
    const answer = getStepAnswer(step.key);
    return (
      <button
        onClick={disabled ? undefined : () => setActiveStep(step.key)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          width: "100%", background: "none", border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 0",
          lineHeight: "normal",
          font: "inherit",
          cursor: disabled ? "default" : "pointer",
          transition: "all 0.15s",
          opacity: disabled ? 0.3 : 1,
        }}
        onMouseEnter={disabled ? undefined : (e) => e.currentTarget.querySelector("[data-answer]").style.color = "#e8ddd0"}
        onMouseLeave={disabled ? undefined : (e) => e.currentTarget.querySelector("[data-answer]").style.color = "rgba(255,255,255,0.5)"}
      >
        <span style={{
          fontFamily: MONO, fontSize: "12px", fontWeight: 400,
          color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}>
          {step.label}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span data-answer="" style={{
            fontFamily: SERIF, fontSize: "15px", fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            transition: "color 0.15s",
          }}>
            {answer || ""}
          </span>
          <GoPlus size={16} style={{ color: "rgba(255,255,255,0.45)", flexShrink: 0 }} />
        </span>
      </button>
    );
  };

  const renderOptionGrid = (items, selectedId, onSelect, multi = false, labelFn = null) => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
      gap: "10px",
    }}>
      {items.map((item) => {
        const isSelected = multi ? selectedId.includes(item.id) : selectedId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              background: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
              border: isSelected ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px",
              padding: "14px 16px",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.querySelector("[data-label]").style.color = "#e8ddd0";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.querySelector("[data-label]").style.color = "rgba(255,255,255,0.5)";
              }
            }}
          >
            <div data-label="" style={{
              fontFamily: TYPEWRITER, fontSize: "15px", fontWeight: 400,
              color: isSelected ? "#e8ddd0" : "rgba(255,255,255,0.5)",
              transition: "color 0.15s",
            }}>
              {labelFn ? labelFn(item) : item.label}
            </div>
          </button>
        );
      })}
    </div>
  );

  const collapseStep = (stepKey) => {
    const order = steps.map((s) => s.key);
    const idx = order.indexOf(stepKey);
    // Find the next step that doesn't have an answer yet
    for (let i = idx + 1; i < order.length; i++) {
      if (!getStepAnswer(order[i])) { setActiveStep(order[i]); return; }
    }
    setActiveStep(null);
  };

  const renderExpandedStep = (step) => {
    const isOptional = step.optional;
    return (
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", marginBottom: "0" }}>
          <h2 style={{
            fontFamily: MONO, fontSize: "12px", fontWeight: 400,
            color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
            textTransform: "uppercase", margin: 0,
          }}>
            {step.label}{isOptional && <span style={{ textTransform: "none", color: "rgba(255,255,255,0.45)" }}> {t("optional")}{step.key === "themes" ? t("up_to_2") : ""}</span>}
          </h2>
          <button
            onClick={() => collapseStep(step.key)}
            style={{
              background: "none", border: "none",
              cursor: "pointer", padding: "2px",
              color: "rgba(255,255,255,0.45)",
              transition: "color 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
          >
            <GoDash size={16} />
          </button>
        </div>
        {step.key === "genre" && renderOptionGrid(GENRES, selectedGenre, handleSelectGenre, false, (g) => t("genre_" + g.id))}
        {step.key === "voice" && renderOptionGrid(getVoicesForGenre(selectedGenre), selectedVoice, handleSelectVoice, false, (v) => t("voice_" + selectedGenre + "_" + v.id) || v.label)}
        {step.key === "themes" && renderOptionGrid(getThemesForGenre(selectedGenre), selectedThemes, toggleTheme, true, (item) => {
          const k = item.id.replace(/-/g, "_");
          const genreKey = "theme_" + selectedGenre + "_" + k;
          const baseKey = "theme_" + k;
          return TRANSLATIONS[lang]?.[genreKey] || TRANSLATIONS[lang]?.[baseKey] || item.label;
        })}
        {step.key === "protagonist" && (
          <>
            {renderOptionGrid(getProtagonistsForGenre(selectedGenre), selectedProtagonist, (id) => {
              setSelectedProtagonist(selectedProtagonist === id ? null : id);
              if (selectedProtagonist !== id) setTimeout(() => advanceFrom("protagonist"), 150);
            }, false, (item) => {
              const k = item.id.replace(/-/g, "_");
              return TRANSLATIONS[lang]?.["protag_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["protag_" + k] || item.label;
            })}
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => advanceFrom("protagonist")}
                style={{
                  background: "none", border: "none",
                  fontFamily: MONO, fontSize: "12px",
                  color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >
                {selectedProtagonist ? t("continue_btn") : t("skip")}
              </button>
            </div>
          </>
        )}
        {step.key === "tension" && renderOptionGrid(getTensionsForGenre(selectedGenre), selectedTension, (id) => {
          setSelectedTension(selectedTension === id ? null : id);
          if (selectedTension !== id) setTimeout(() => setActiveStep(null), 150);
        }, false, (item) => {
          const k = item.id.replace(/-/g, "_");
          return TRANSLATIONS[lang]?.["conflict_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["conflict_" + k] || item.label;
        })}
      </div>
    );
  };

  return (
    <>
      {narrow ? (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 10,
          background: "linear-gradient(to bottom, #181714 60%, transparent)",
          padding: "16px 24px",
          display: "flex", alignItems: "center",
        }}>
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              padding: 0, display: "flex", alignItems: "center",
            }}
          >
            <GoArrowLeft size={16} />
          </button>
          <span style={{
            fontFamily: MONO, fontSize: "12px",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.5px", textTransform: "uppercase",
            flex: 1, textAlign: "center",
            marginRight: "16px",
          }}>
            {t("new_story")}
          </span>
        </div>
      ) : (
        <div style={{
          position: "fixed", left: "24px", top: "24px",
          zIndex: 5,
        }}>
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "none",
              fontFamily: MONO, fontSize: "12px",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              padding: 0, textAlign: "left",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            <GoArrowLeft size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />{t("back")}
          </button>
        </div>
      )}
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: narrow ? "56px 24px 40px" : "60px 24px 40px" }}>

      {!narrow && (
        <h1 style={{
          fontFamily: SERIF, fontSize: "28px", fontWeight: 600,
          color: "#e8ddd0", textAlign: "center",
          marginBottom: "48px",
        }}>
          {t("new_story")}
        </h1>
      )}

      {steps.map((step) => {
        const answer = getStepAnswer(step.key);
        const isActive = activeStep === step.key;
        const reachable = isStepVisible(step.key);
        const isCollapsed = !isActive && reachable;
        const isFuture = !isActive && !reachable && answer === null;

        if (isActive && reachable) {
          return <div key={step.key}>{renderExpandedStep(step)}</div>;
        }
        if (isCollapsed) {
          return <div key={step.key}>{renderCollapsedRow(step)}</div>;
        }
        if (isFuture) {
          return <div key={step.key}>{renderCollapsedRow(step, true)}</div>;
        }
        return null;
      })}

      {/* Start Story Button */}
      <button
        onClick={handleCreate}
        disabled={!canCreate || creating}
        style={{
          width: "100%",
          background: creating ? "rgba(255,255,255,0.04)" : canCreate ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
          border: "none",
          borderRadius: "6px",
          padding: "14px 16px",
          fontFamily: MONO, fontSize: "13px",
          color: creating ? "#999" : canCreate ? "#e8ddd0" : "rgba(255,255,255,0.15)",
          cursor: canCreate && !creating ? "pointer" : "default",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          transition: "all 0.15s",
          marginTop: "24px",
          animation: creating ? "pulse 1.5s ease-in-out infinite" : "none",
        }}
      >
        {creating ? t("creating") : t("start_story")}
      </button>
    </div>
    </>
  );
}

/* ────────────────────────────────────────────
   Main App
   ──────────────────────────────────────────── */

const MONO = "'SF Pro Mono', 'SF Mono', 'Menlo', 'Courier New', monospace";
const TYPEWRITER = "'Courier New', 'Courier', monospace";
const SERIF = "'Faustina', serif";
const GENRE_FONTS = {
  drama: [
    { family: "'Playfair Display', serif" },
    { family: "'Libre Baskerville', serif" },
    { family: "'Cormorant Garamond', serif" },
  ],
  scifi: [
    { family: "'Tektur', sans-serif" },
    { family: "'Bruno Ace SC', sans-serif" },
    { family: "'Syne Mono', monospace" },
    { family: "'Space Mono', monospace" },
    { family: "'Jersey 20', sans-serif", scale: 1.2 },
  ],
  mystery: [
    { family: "'Gloock', serif" },
    { family: "'Anton', sans-serif" },
    { family: "'Archivo Black', sans-serif" },
    { family: "'Castoro Titling', serif", scale: 0.8 },
  ],
  bedtime: [
    { family: "'Borel', cursive" },
    { family: "'Walter Turncoat', cursive" },
    { family: "'Galindo', cursive" },
    { family: "'Ranchers', cursive" },
  ],
  horror: [
    { family: "'UnifrakturMaguntia', cursive" },
    { family: "'Amarante', serif" },
    { family: "'Faculty Glyphic', serif" },
    { family: "'New Rocker', cursive" },
  ],
  fantasy: [
    { family: "'Cormorant Unicase', serif", weight: 600 },
    { family: "'Alegreya SC', serif" },
    { family: "'Romanesco', cursive" },
    { family: "'Cinzel Decorative', cursive" },
    { family: "'Uncial Antiqua', serif" },
  ],
};
function hashStr(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return h;
}
function genreFont(genreId, index = 0) {
  const fonts = GENRE_FONTS[genreId];
  if (!fonts) return { family: SERIF, weight: 600 };
  return fonts[((index % fonts.length) + fonts.length) % fonts.length];
}
function storyFontForId(genreId, storyId, fontIndexMap) {
  const idx = fontIndexMap ? (fontIndexMap[storyId] ?? 0) : 0;
  return genreFont(genreId, idx);
}
function buildFontIndexMap(stories) {
  const byGenre = {};
  // Sort by ID for stable creation order
  const sorted = [...stories].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const map = {};
  for (const s of sorted) {
    byGenre[s.genre] = (byGenre[s.genre] || 0);
    map[s.id] = byGenre[s.genre];
    byGenre[s.genre]++;
  }
  return map;
}
const GENRE_HUE_RANGE = {
  fantasy:  [240, 320],
  drama:    [20, 50],
  mystery:  [40, 70],
  scifi:    [140, 220],
  bedtime:  [290, 340],
  horror:   [70, 110],
};
function bookColor(genreId, storyId) {
  const rangeOrObj = GENRE_HUE_RANGE[genreId];
  if (!rangeOrObj) return { bg: "rgba(255,255,255,0.03)", text: "#e8ddd0", border: "rgba(255,255,255,0.06)" };
  const hash = hashStr(storyId);
  const t = (((hash % 1000) + 1000) % 1000) / 1000;
  const range = Array.isArray(rangeOrObj) ? rangeOrObj : rangeOrObj.hue;
  const chroma = Array.isArray(rangeOrObj) ? 0.04 : (rangeOrObj.chroma ?? 0.04);
  const hue = range[0] + t * (range[1] - range[0]);
  const lRange = (!Array.isArray(rangeOrObj) && rangeOrObj.lightness) || null;
  const bgL = lRange ? (lRange[0] + t * (lRange[1] - lRange[0])).toFixed(3) : "0.25";
  const textL = lRange ? (parseFloat(bgL) + 0.6).toFixed(3) : "0.85";
  const borderL = lRange ? (parseFloat(bgL) + 0.1).toFixed(3) : "0.35";
  return {
    bg: `oklch(${bgL} ${chroma} ${hue.toFixed(1)})`,
    text: `oklch(${textL} ${chroma} ${hue.toFixed(1)})`,
    border: `oklch(${borderL} ${chroma} ${hue.toFixed(1)})`,
  };
}

export default function CollaborativeStoryApp() {
  // Navigation state
  const HASH_TO_LAYOUT = { "#rows": "rows", "#slideshow": "carousel", "#activity": "activity" };
  const LAYOUT_TO_HASH = { rows: "#rows", carousel: "#slideshow", activity: "#activity" };
  const [view, setView] = useState(() => {
    if (window.location.hash === "#about") return "about";
    if (window.location.hash.match(/^#story\//) || window.location.pathname.match(/^\/api\/story\//)) return "story";
    return "home";
  }); // "home" | "new" | "story" | "about"
  const [homeLayout, setHomeLayout] = useState(() => {
    return HASH_TO_LAYOUT[window.location.hash] || "rows";
  }); // "rows" | "carousel" | "activity"
  const updateHomeLayout = useCallback((layout) => {
    setHomeLayout(layout);
    history.replaceState(null, "", "/" + (LAYOUT_TO_HASH[layout] || "#rows"));
  }, []);
  const [lang, setLang] = useState(() => localStorage.getItem("falcor_lang") || "en");
  const t = useCallback((key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key, [lang]);
  useEffect(() => { localStorage.setItem("falcor_lang", lang); }, [lang]);
  const dateLocale = lang === "es" ? "es-ES" : "en-US";

  const [activeStoryId, setActiveStoryId] = useState(null);
  const [storiesIndex, setStoriesIndex] = useState([]);

  // Story state
  const [story, setStory] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState("input");
  const [generatedText, setGeneratedText] = useState("");
  const [generationSource, setGenerationSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [contributorCount, setContributorCount] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterTitles, setChapterTitles] = useState({});
  const [error, setError] = useState(null);
  const [hoveredEntry, setHoveredEntry] = useState(null);

  const [narrowViewport, setNarrowViewport] = useState(false);
  const [visibleChapter, setVisibleChapter] = useState(1);
  const [dialogEntry, setDialogEntry] = useState(null);
  const [pinnedEntry, setPinnedEntry] = useState(null);
  const [showStoryMenu, setShowStoryMenu] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [topBarScrolled, setTopBarScrolled] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmDeleteMenu, setConfirmDeleteMenu] = useState(false);
  const [showSliders, setShowSliders] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const prevPlotRef = useRef(5);
  const [sliderPlot, setSliderPlot] = useState(5);
  const [sliderDialogue, setSliderDialogue] = useState(2);
  const [sliderSurprise, setSliderSurprise] = useState(3);
  const [sliderEmotion, setSliderEmotion] = useState(4);
  const [geoEnabled, setGeoEnabled] = useState(() => localStorage.getItem("falcor_geo_enabled") === "true");
  const [geoLabel, setGeoLabel] = useState("");
  const storyEndRef = useRef(null);
  const contentRef = useRef(null);
  const pollRef = useRef(null);

  // Active story metadata
  const fontIndexMap = useMemo(() => buildFontIndexMap(storiesIndex), [storiesIndex]);
  const activeStoryMeta = storiesIndex.find((s) => s.id === activeStoryId);
  const activeStoryFont = activeStoryMeta ? storyFontForId(activeStoryMeta.genre, activeStoryMeta.id, fontIndexMap) : { family: SERIF, weight: 600 };
  const activeStoryColor = activeStoryMeta ? bookColor(activeStoryMeta.genre, activeStoryMeta.id) : null;

  const getGenreVoiceCtx = useCallback(() => {
    if (!activeStoryMeta) return "";
    return getStoryContext(activeStoryMeta);
  }, [activeStoryMeta]);

  const getActiveStyleSettings = useCallback(() => {
    const base = activeStoryMeta
      ? getStyleForStory(activeStoryMeta.genre, activeStoryMeta.writingStyle)
      : { tone: 5, length: 4, mood: 5, dialogue: 2 };
    return { ...base, plot: sliderPlot, dialogue: sliderDialogue, surprise: sliderSurprise, emotion: sliderEmotion };
  }, [activeStoryMeta, sliderPlot, sliderDialogue, sliderSurprise, sliderEmotion]);

  // Regenerate prompt when plot slider changes (debounced)
  useEffect(() => {
    if (prevPlotRef.current === sliderPlot) return;
    prevPlotRef.current = sliderPlot;
    if (!showSliders || phase !== "input" || story.length === 0) return;
    const timer = setTimeout(async () => {
      setPromptLoading(true);
      try {
        const ctx = getGenreVoiceCtx();
        const newPrompt = await generatePrompt(story, currentChapter, false, ctx, sliderPlot, lang);
        setCurrentPrompt(newPrompt);
      } catch (err) {
        console.warn("Plot slider prompt regeneration failed:", err.message);
      } finally {
        setPromptLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [sliderPlot]);

  // Resolve geo label on mount if enabled
  useEffect(() => {
    if (geoEnabled) {
      requestBrowserLocation().then((loc) => { if (loc) setGeoLabel(loc); });
    }
  }, []);

  // Load stories index on mount + check hash for deep link
  useEffect(() => {
    (async () => {
      const idx = await loadStoriesIndex();
      setStoriesIndex(idx);
      setLoading(false);

      const hash = window.location.hash;
      const slugMatch = hash.match(/^#story\/(.+)$/) || window.location.pathname.match(/^\/api\/story\/(.+)$/);
      if (slugMatch) {
        const slug = slugMatch[1];
        // Support legacy numeric IDs
        const numId = parseInt(slug, 10);
        const found = !isNaN(numId) && idx.some((s) => s.id === numId)
          ? idx.find((s) => s.id === numId)
          : findStoryBySlug(idx, slug);
        if (found) {
          openStory(found.id);
        }
      } else if (!hash || hash === "#") {
        history.replaceState(null, "", "/#rows");
      }
    })();
  }, []);

  // Load a specific story's data
  const loadStoryData = useCallback(async (id, isInitial) => {
    try {
      const storyResult = await window.storage.get(storyKey(id, "data-v1"), true);
      const countResult = await window.storage.get(storyKey(id, "count-v1"), true);
      const chapterResult = await window.storage.get(storyKey(id, "chapter-v1"), true);
      const titlesResult = await window.storage.get(storyKey(id, "titles-v1"), true);
      const loadedStory = storyResult ? JSON.parse(storyResult.value) : [];
      const loadedChapter = chapterResult ? parseInt(chapterResult.value, 10) : 1;
      const loadedTitles = titlesResult ? JSON.parse(titlesResult.value) : {};
      if (storyResult) setStory(loadedStory);
      if (countResult) setContributorCount(parseInt(countResult.value, 10));
      setCurrentChapter(loadedChapter);
      setChapterTitles(loadedTitles);

      if (isInitial) {
        // Load the active story meta for genre/voice context
        const idx = await loadStoriesIndex();
        const meta = idx.find((s) => s.id === id);
        const ctx = meta ? getStoryContext(meta) : "";

        // Backfill titles for completed chapters that don't have one
        const allChapters = [...new Set(loadedStory.map((e) => e.chapter || 1))];
        const completedWithoutTitle = allChapters.filter(
          (ch) => ch < loadedChapter && !loadedTitles[ch]
        );
        if (completedWithoutTitle.length > 0) {
          const backfilled = { ...loadedTitles };
          await Promise.all(completedWithoutTitle.map(async (ch) => {
            const title = await generateChapterTitle(loadedStory, ch, lang);
            if (title) backfilled[ch] = title;
          }));
          setChapterTitles(backfilled);
          await window.storage.set(storyKey(id, "titles-v1"), JSON.stringify(backfilled), true);
        }
        const prompt = await generatePrompt(loadedStory, loadedChapter, false, ctx, sliderPlot, lang);
        setCurrentPrompt(prompt);
        await window.storage.set(storyKey(id, "prompt-v1"), prompt, true);
      }
    } catch (e) { /* first run */ }
  }, []);

  // Navigate to a story
  const openStory = useCallback(async (id) => {
    setActiveStoryId(id);
    setStory([]);
    prevStoryLenRef.current = 0;
    setCurrentPrompt("");
    setAnswer("");
    setPhase("input");
    setGeneratedText("");
    setGenerationSource("");
    setContributorCount(0);
    setCurrentChapter(1);
    setChapterTitles({});
    setError(null);
    setShowStoryMenu(false);
    setLinkCopied(false);
    setConfirmDeleteMenu(false);
    setShowSliders(false);
    const meta = storiesIndex.find((s) => s.id === id);
    const defaults = meta
      ? getStyleForStory(meta.genre, meta.writingStyle)
      : { length: 4, dialogue: 2, surprise: 3, emotion: 4 };
    setSliderPlot(5);
    setSliderDialogue(defaults.dialogue);
    setSliderSurprise(defaults.surprise ?? 3);
    setSliderEmotion(defaults.emotion ?? 4);
    // Clear any existing polling before starting new story
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setView("story");
    const storySlug = meta?.slug || id;
    history.pushState({ story: storySlug }, "", "/api/story/" + storySlug);

    await loadStoryData(id, true);

    // Only start polling if we're still on this story
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadStoryData(id, false), 5000);
  }, [loadStoryData, storiesIndex]);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = async () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === "#about") { setView("about"); return; }
      const slugMatch = hash.match(/^#story\/(.+)$/) || path.match(/^\/api\/story\/(.+)$/);
      if (slugMatch) {
        const slug = slugMatch[1];
        const numId = parseInt(slug, 10);
        // Use storiesIndex if available, otherwise load fresh
        const idx = storiesIndex.length > 0 ? storiesIndex : await loadStoriesIndex();
        const found = !isNaN(numId) && idx.some((s) => s.id === numId)
          ? idx.find((s) => s.id === numId)
          : findStoryBySlug(idx, slug);
        if (found) { openStory(found.id); return; }
      }
      if (pollRef.current) clearInterval(pollRef.current);
      window.scrollTo(0, 0);
      setView("home");
      setActiveStoryId(null);
      setShowStoryMenu(false);
      const layoutFromHash = HASH_TO_LAYOUT[hash];
      if (layoutFromHash) setHomeLayout(layoutFromHash);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [openStory, storiesIndex]);

  // Clean up polling when leaving story view
  useEffect(() => {
    if (view !== "story" && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [view]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Track which chapter is currently visible on scroll
  useEffect(() => {
    if (view !== "story") return;
    const onScroll = () => {
      const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
      let current = 0;
      for (const ch of chapters) {
        const el = document.getElementById(`chapter-${ch}`);
        if (el && el.getBoundingClientRect().top <= 80) current = ch;
      }
      setVisibleChapter(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [view, story]);

  // Check if popover fits to the right of content
  useEffect(() => {
    const check = () => {
      if (contentRef.current) {
        const right = contentRef.current.getBoundingClientRect().right;
        setNarrowViewport(right + 304 > window.innerWidth);
      } else {
        setNarrowViewport(window.innerWidth < 960);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [view]);

  useEffect(() => {
    if (view !== "story") { setTopBarScrolled(false); return; }
    const onScroll = () => setTopBarScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

  const prevStoryLenRef = useRef(0);
  useEffect(() => {
    if (view === "story" && story.length > prevStoryLenRef.current && prevStoryLenRef.current > 0 && storyEndRef.current) {
      storyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevStoryLenRef.current = story.length;
  }, [story, view]);

  const handleSubmit = async () => {
    if (!answer.trim() || phase !== "input") return;
    setPhase("generating");
    setError(null);

    const userAnswer = answer.trim();

    try {
      const result = await generateStoryPassage(
        story, currentPrompt, userAnswer,
        getActiveStyleSettings(), currentChapter, getGenreVoiceCtx(), lang
      );
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("reveal");
    } catch (e) {
      console.error("All generation failed:", e);
      setError(t("error_generation"));
      setPhase("input");
    }
  };

  const quickAddAnswerRef = useRef(null);

  const handleQuickAdd = async () => {
    if (!answer.trim() || phase !== "input") return;
    setPhase("generating");
    setError(null);
    const userAnswer = answer.trim();
    quickAddAnswerRef.current = userAnswer;
    try {
      const result = await generateStoryPassage(
        story, currentPrompt, userAnswer,
        getActiveStyleSettings(), currentChapter, getGenreVoiceCtx()
      );
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("streaming");
      // Scroll to bottom after a tick so the streaming entry is rendered
      setTimeout(() => storyEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      console.error("All generation failed:", e);
      setError(t("error_generation"));
      setPhase("input");
    }
  };

  const handleStreamingComplete = useCallback(async () => {
    if (phase !== "streaming") return;
    setPhase("adding");
    await handleConfirmWith(generatedText, quickAddAnswerRef.current || answer.trim());
  }, [phase, generatedText, answer]);

  const handleConfirm = async () => {
    setPhase("adding");
    await handleConfirmWith(generatedText, answer.trim());
  };

  const handleConfirmWith = async (text, originalAnswer) => {
    const newCount = contributorCount + 1;
    const now = new Date();
    const timeStr = now.toLocaleString(dateLocale, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    const location = await fetchLocation();

    const newEntry = {
      text: text,
      originalAnswer: originalAnswer,
      prompt: currentPrompt,
      author: newCount,
      location: location,
      time: timeStr,
      ts: Date.now(),
      chapter: currentChapter,
    };

    try {
      // Re-read fresh from storage to avoid overwriting concurrent contributions
      const freshResult = await window.storage.get(storyKey(activeStoryId, "data-v1"), true);
      const freshStory = freshResult ? JSON.parse(freshResult.value) : story;
      const updatedStory = [...freshStory, newEntry];
      let nextChapter = currentChapter;
      let isNewChapter = false;
      let updatedTitles = chapterTitles;
      const chapterEnded = await shouldEndChapter(updatedStory, currentChapter);
      if (chapterEnded) {
        nextChapter = currentChapter + 1;
        isNewChapter = true;
        const title = await generateChapterTitle(updatedStory, currentChapter, lang);
        if (title) {
          updatedTitles = { ...chapterTitles, [currentChapter]: title };
          await window.storage.set(storyKey(activeStoryId, "titles-v1"), JSON.stringify(updatedTitles), true);
        }
      }

      const nextPrompt = await generatePrompt(updatedStory, nextChapter, isNewChapter, getGenreVoiceCtx(), sliderPlot, lang);
      await window.storage.set(storyKey(activeStoryId, "data-v1"), JSON.stringify(updatedStory), true);
      await window.storage.set(storyKey(activeStoryId, "prompt-v1"), nextPrompt, true);
      await window.storage.set(storyKey(activeStoryId, "count-v1"), String(newCount), true);
      await window.storage.set(storyKey(activeStoryId, "chapter-v1"), String(nextChapter), true);

      // Update stories index metadata
      const existingMeta = storiesIndex.find((s) => s.id === activeStoryId);
      const derivedTitle = existingMeta?.title || updatedTitles[1] || (updatedStory[0] ? updatedStory[0].text.split(/[.!?]/)[0].slice(0, 50) : "");
      const updatedIndex = storiesIndex.map((s) =>
        s.id === activeStoryId
          ? { ...s, title: derivedTitle, passageCount: updatedStory.length, updatedAt: new Date().toISOString() }
          : s
      );
      await saveStoriesIndex(updatedIndex);
      setStoriesIndex(updatedIndex);

      setStory(updatedStory);
      setCurrentPrompt(nextPrompt);
      setContributorCount(newCount);
      setCurrentChapter(nextChapter);
      setChapterTitles(updatedTitles);
      setAnswer("");
      setGeneratedText("");
      setGenerationSource("");
      // Reset sliders to story defaults
      const defaults = activeStoryMeta
        ? getStyleForStory(activeStoryMeta.genre, activeStoryMeta.writingStyle)
        : { length: 4, dialogue: 2, surprise: 3, emotion: 4 };
      setSliderPlot(5);
      setSliderDialogue(defaults.dialogue);
      setSliderSurprise(defaults.surprise ?? 3);
      setSliderEmotion(defaults.emotion ?? 4);
      setShowSliders(false);
      setPhase("input");
    } catch (e) {
      console.error("Storage error:", e);
      setError(t("error_save"));
      setPhase("reveal");
    }
  };

  const handleRewrite = async () => {
    setPhase("generating");
    setError(null);
    try {
      const result = await generateStoryPassage(
        story, currentPrompt, answer.trim(),
        getActiveStyleSettings(), currentChapter, getGenreVoiceCtx(), lang
      );
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("reveal");
    } catch (e) {
      setError(t("error_rewrite"));
      setPhase("reveal");
    }
  };

  const handleReset = async () => {
    if (!activeStoryId) return;
    await deleteStoryData(activeStoryId);

    // Remove from index
    const updatedIndex = storiesIndex.filter((s) => s.id !== activeStoryId);
    await saveStoriesIndex(updatedIndex);
    setStoriesIndex(updatedIndex);

    // Go home
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setView("home");
    setActiveStoryId(null);
  };

  const handleDeleteStory = async (id) => {
    await deleteStoryData(id);

    const updatedIndex = storiesIndex.filter((s) => s.id !== id);
    await saveStoriesIndex(updatedIndex);
    setStoriesIndex(updatedIndex);
  };

  const handleCreateStory = async (meta) => {
    // Generate opener BEFORE saving to index — prevents zombie entries on failure
    const opener = await generateStoryOpener(meta, lang);

    // Reset local state
    setActiveStoryId(meta.id);
    setStory([]);
    setCurrentPrompt("");
    setAnswer("");
    setGeneratedText("");
    setGenerationSource("");
    setContributorCount(0);
    setCurrentChapter(1);
    setChapterTitles({});
    setError(null);

    if (opener) {
      const now = new Date();
      const timeStr = now.toLocaleString(dateLocale, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      });
      const location = await fetchLocation();
      const firstEntry = {
        text: opener.paragraph,
        originalAnswer: "",
        prompt: "",
        author: 1,
        location,
        time: timeStr,
        ts: Date.now(),
        chapter: 1,
      };
      const newStory = [firstEntry];
      const slug = slugify(opener.title) || String(meta.id);
      const savedMeta = { ...meta, title: opener.title, slug, passageCount: 1, updatedAt: new Date().toISOString() };

      // Save everything at once — index + story data
      const updatedIndex = [...storiesIndex, savedMeta];
      await saveStoriesIndex(updatedIndex);
      setStoriesIndex(updatedIndex);
      await window.storage.set(storyKey(meta.id, "data-v1"), JSON.stringify(newStory), true);
      await window.storage.set(storyKey(meta.id, "count-v1"), "1", true);
      await window.storage.set(storyKey(meta.id, "chapter-v1"), "1", true);

      setStory(newStory);
      setContributorCount(1);

      // Generate the first prompt for user input
      const ctx = getStoryContext(meta);
      const prompt = await generatePrompt(newStory, 1, false, ctx, 5, lang);
      setCurrentPrompt(prompt);
      await window.storage.set(storyKey(meta.id, "prompt-v1"), prompt, true);

      history.replaceState(null, "", "#story/" + slug);
    } else {
      // Opener failed — still save to index so user isn't stuck, but with no story data
      const updatedIndex = [...storiesIndex, meta];
      await saveStoriesIndex(updatedIndex);
      setStoriesIndex(updatedIndex);

      const ctx = getStoryContext(meta);
      const prompt = await generatePrompt([], 1, false, ctx, 5, lang);
      setCurrentPrompt(prompt);
      await window.storage.set(storyKey(meta.id, "prompt-v1"), prompt, true);
      history.replaceState(null, "", "#story/" + meta.id);
    }

    // Everything is ready — navigate directly to the story
    setPhase("input");
    setView("story");

    // Start polling
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadStoryData(meta.id, false), 5000);
  };

  const goHome = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    window.scrollTo(0, 0);
    setView("home");
    setActiveStoryId(null);
    setShowStoryMenu(false);
    history.pushState(null, "", "/" + (LAYOUT_TO_HASH[homeLayout] || "#rows"));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Faustina:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0f0e0c; overflow-x: hidden; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        textarea:focus { outline: none; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        .story-scroll::-webkit-scrollbar { width: 4px; }
        .story-scroll::-webkit-scrollbar-track { background: transparent; }
        .story-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .passage-slider { -webkit-appearance: none; appearance: none; height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; outline: none; }
        .passage-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #e8ddd0; cursor: pointer; }
        .passage-slider::-moz-range-track { height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; border: none; }
        .passage-slider::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: #e8ddd0; cursor: pointer; border: none; }
        .drop-cap::first-letter { float: left; font-size: 3.7em; line-height: 0.75; padding-right: 6px; padding-top: 4px; font-weight: 400; }
        .story-hscroll::-webkit-scrollbar { display: none; }
        @media (max-width: 600px) {
          .about-ascii { font-size: 7px !important; }
        }
      `}</style>

      {/* Mobile: fixed top bar with back, chapter title, menu */}
      {view === "story" && narrowViewport && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 10,
          background: topBarScrolled ? "rgba(14,13,11,0.85)" : "transparent",
          backdropFilter: topBarScrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: topBarScrolled ? "blur(12px)" : "none",
          borderBottom: topBarScrolled ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
          transition: "background 0.3s, border-color 0.3s, backdrop-filter 0.3s",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
          height: "48px",
        }}>
                <button
                  onClick={goHome}
                  style={{
                    background: "none", border: "none",
                    fontFamily: MONO, fontSize: "12px",
                    color: "rgba(255,255,255,0.5)", cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  <GoArrowLeft size={16} />
                </button>
                <div style={{ flex: 1, padding: "0 12px", position: "relative" }}>
                  {(() => {
                    const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
                    const hasMultiple = chapters.length > 1;
                    return (
                      <>
                        <button
                          onClick={() => hasMultiple && setShowChapterDropdown(!showChapterDropdown)}
                          style={{
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "11px",
                            color: "rgba(255,255,255,0.5)",
                            letterSpacing: "0.3px",
                            textAlign: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            width: "100%",
                            cursor: hasMultiple ? "pointer" : "default",
                            padding: 0,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                          }}
                        >
                          <span>
                            {visibleChapter === 0
                              ? (hasMultiple ? t("select_chapter") : "")
                              : chapterTitles[visibleChapter]
                              ? `${t("ch")} ${visibleChapter} — ${chapterTitles[visibleChapter]}`
                              : `${t("chapter")} ${visibleChapter}`}
                          </span>
                          {hasMultiple && <GoChevronDown size={12} />}
                        </button>
                        {showChapterDropdown && (
                          <>
                            <div
                              onClick={() => setShowChapterDropdown(false)}
                              style={{ position: "fixed", inset: 0, zIndex: -1 }}
                            />
                            <div style={{
                              position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                              marginTop: "8px",
                              background: "#1a1917",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "6px",
                              padding: "4px 0",
                              minWidth: "200px",
                              maxHeight: "60vh",
                              overflowY: "auto",
                              zIndex: 20,
                            }}>
                              {chapters.map((ch) => {
                                const isActive = ch === visibleChapter;
                                return (
                                  <button
                                    key={ch}
                                    onClick={() => {
                                      setShowChapterDropdown(false);
                                      document.getElementById(`chapter-${ch}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    style={{
                                      display: "block", width: "100%",
                                      background: isActive ? "rgba(255,255,255,0.06)" : "none",
                                      border: "none", padding: "10px 16px",
                                      fontFamily: MONO, fontSize: "12px",
                                      color: isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                                      cursor: "pointer", textAlign: "left",
                                      letterSpacing: "0.3px",
                                    }}
                                  >
                                    <span style={{ marginRight: "8px" }}>{ch}.</span>
                                    {ch === currentChapter ? t("in_progress") : (chapterTitles[ch] || `${t("chapter")} ${ch}`)}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => { setShowStoryMenu(!showStoryMenu); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.5)", cursor: "pointer",
                      padding: "8px 0",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <GoKebabHorizontal size={16} />
                  </button>
                  {showStoryMenu && (
                    <>
                      <div
                        onClick={() => { setShowStoryMenu(false); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                        style={{ position: "fixed", inset: 0, zIndex: -1 }}
                      />
                      <div style={{
                        position: "absolute", top: "100%", right: 0,
                        marginTop: "4px",
                        background: "#1a1917",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        padding: "4px 0",
                        minWidth: "160px",
                      }}>
                        <button
                          onClick={() => {
                            const activeMeta = storiesIndex.find((s) => s.id === activeStoryId);
                            const url = window.location.origin + "/api/story/" + (activeMeta?.slug || activeStoryId);
                            navigator.clipboard.writeText(url);
                            setLinkCopied(true);
                            setTimeout(() => { setLinkCopied(false); setShowStoryMenu(false); }, 2000);
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: linkCopied ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                        >
                          {linkCopied ? t("copied") : t("copy_link")}
                        </button>
                        <button
                          onClick={() => {
                            if (confirmDeleteMenu) {
                              setShowStoryMenu(false);
                              setConfirmDeleteMenu(false);
                              handleReset();
                            } else {
                              setConfirmDeleteMenu(true);
                            }
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: confirmDeleteMenu ? "#c97a7a" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                        >
                          {confirmDeleteMenu ? t("confirm_delete") : t("delete_btn")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

      <div style={{
        minHeight: "100vh",
        background: "#0f0e0c",
        position: "relative",
      }}>
        {/* ── Home View ── */}
        {view === "home" && (
          <HomeScreen
            stories={storiesIndex}
            onSelectStory={openStory}
            onNewStory={() => { window.scrollTo(0, 0); setView("new"); }}
            onAbout={() => { window.scrollTo(0, 0); history.pushState(null, "", "/#about"); setView("about"); }}
            homeLayout={homeLayout}
            setHomeLayout={updateHomeLayout}
            fontIndexMap={fontIndexMap}
            lang={lang}
            setLang={setLang}
            t={t}
          />
        )}

        {/* ── New Story View ── */}
        {view === "new" && (
          <NewStoryScreen
            onCancel={() => { history.pushState(null, "", "/" + (LAYOUT_TO_HASH[homeLayout] || "#rows")); setView("home"); }}
            onCreate={handleCreateStory}
            narrow={narrowViewport}
            t={t}
            lang={lang}
          />
        )}

        {/* ── About View ── */}
        {view === "about" && (
          <AboutScreen onBack={() => { history.pushState(null, "", "/" + (LAYOUT_TO_HASH[homeLayout] || "#rows")); setView("home"); }} narrow={narrowViewport} t={t} />
        )}

        {/* ── Story View ── */}
        {view === "story" && (
          <>
            {/* Desktop: fixed left sidebar with back button + chapter nav */}
            {!narrowViewport && (
              <>
                <div style={{
                  position: "fixed", left: "24px", top: "24px",
                  zIndex: 5,
                  display: "flex", flexDirection: "column", gap: "20px",
                }}>
                  <button
                    onClick={goHome}
                    style={{
                      background: "none", border: "none",
                      fontFamily: MONO, fontSize: "12px",
                      color: visibleChapter === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      padding: 0, textAlign: "left",
                      display: "flex", alignItems: "center", gap: "8px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = visibleChapter === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}
                  >
                    <GoArrowLeft size={14} style={{ flexShrink: 0, width: "16px" }} />
                    <span>{activeStoryMeta?.title || t("home")}</span>
                  </button>
                  {(() => {
                    const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
                    if (chapters.length <= 1) return null;
                    return (
                      <nav style={{
                        fontFamily: MONO, fontSize: "12px",
                        display: "flex", flexDirection: "column", gap: "8px",
                      }}>
                        {chapters.map((ch) => {
                          const isActive = ch === visibleChapter;
                          return (
                            <button
                              key={ch}
                              onClick={() => document.getElementById(`chapter-${ch}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                              style={{
                                background: "none", border: "none", padding: 0,
                                fontFamily: MONO, fontSize: "12px",
                                color: isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                                cursor: "pointer", textAlign: "left",
                                letterSpacing: "0.5px",
                                display: "flex", alignItems: "baseline", gap: "8px",
                                transition: "color 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                              onMouseLeave={(e) => e.currentTarget.style.color = isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)"}
                            >
                              <span style={{ width: "16px", textAlign: "center", flexShrink: 0 }}>{ch}</span>
                              <span>{ch === currentChapter ? t("in_progress") : (chapterTitles[ch] || "")}</span>
                            </button>
                          );
                        })}
                      </nav>
                    );
                  })()}
                </div>

                {/* Desktop: fixed top-right three-dot menu */}
                <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 5 }}>
                  <button
                    onClick={() => { setShowStoryMenu(!showStoryMenu); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.5)", cursor: "pointer",
                      padding: "4px 8px",
                      display: "flex", alignItems: "center",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                  >
                    <GoKebabHorizontal size={16} />
                  </button>
                  {showStoryMenu && (
                    <>
                      <div
                        onClick={() => { setShowStoryMenu(false); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                        style={{ position: "fixed", inset: 0, zIndex: -1 }}
                      />
                      <div style={{
                        position: "absolute", top: "100%", right: 0,
                        marginTop: "4px",
                        background: "#1a1917",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        padding: "4px 0",
                        minWidth: "160px",
                      }}>
                        <button
                          onClick={() => {
                            const activeMeta = storiesIndex.find((s) => s.id === activeStoryId);
                            const url = window.location.origin + "/api/story/" + (activeMeta?.slug || activeStoryId);
                            navigator.clipboard.writeText(url);
                            setLinkCopied(true);
                            setTimeout(() => { setLinkCopied(false); setShowStoryMenu(false); }, 2000);
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: linkCopied ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          {linkCopied ? t("copied") : t("copy_link")}
                        </button>
                        <button
                          onClick={() => {
                            if (confirmDeleteMenu) {
                              setShowStoryMenu(false);
                              setConfirmDeleteMenu(false);
                              handleReset();
                            } else {
                              setConfirmDeleteMenu(true);
                            }
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: confirmDeleteMenu ? "#c97a7a" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          {confirmDeleteMenu ? t("confirm_delete") : t("delete_btn")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {activeStoryColor && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "80vh",
                background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${activeStoryColor.bg} 0%, transparent 100%)`,
                pointerEvents: "none", zIndex: 0,
              }} />
            )}
            <div ref={contentRef} style={{ maxWidth: "600px", margin: "0 auto", padding: narrowViewport ? "48px 24px 40px" : "60px 24px 40px", overflow: "visible", position: "relative", zIndex: 1 }}>

              {/* ── Spacer ── */}
              <div style={{ marginBottom: narrowViewport ? "24px" : "48px" }} />

              {/* ── Story Title ── */}
              {activeStoryMeta?.title && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  ...(narrowViewport ? {
                    height: "90vh",
                    marginTop: "-48px",
                  } : {
                    minHeight: "80vh",
                  }),
                }}>
                  <h1 style={{
                    fontFamily: activeStoryFont.family, fontSize: narrowViewport ? "42px" : "64px", fontWeight: activeStoryFont.weight || 700,
                    color: "#e8ddd0", lineHeight: 1.2,
                    padding: "40px 0",
                    marginBottom: 0,
                    textAlign: "center",
                    textWrap: "balance",
                  }}>
                    {activeStoryMeta.title}
                  </h1>
                  <p style={{
                    fontFamily: SERIF, fontSize: "15px", fontStyle: "italic",
                    color: "rgba(255,255,255,0.45)",
                    textAlign: "center", marginTop: narrowViewport ? "0px" : "12px",
                  }}>
                    {story.length === 0 ? t("loading") : (
                      <>
                        {story.length} {story.length !== 1 ? t("contributions") : t("contribution")}
                        {activeStoryMeta.updatedAt && (
                          <> · {t("last_updated")}: {new Date(activeStoryMeta.updatedAt).toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" })}</>
                        )}
                      </>
                    )}
                  </p>
                </div>
              )}


              {/* ── Story ── */}
              {story.length > 0 && (
                <div style={{ marginBottom: "48px", position: "relative" }}>
                  <div
                    className="story-scroll"
                    style={{
                      display: "flex", flexDirection: "column", gap: "24px",
                    }}
                  >
                    {story.map((entry, i) => {
                      const showChapterHeading = i === 0 || entry.chapter !== story[i - 1].chapter;
                      const showPopover = pinnedEntry && (pinnedEntry.ts === entry.ts) && !narrowViewport;
                      return (
                        <div key={entry.ts || i}>
                          {showChapterHeading && (
                            <div id={`chapter-${entry.chapter || 1}`} style={{
                              textAlign: "center",
                              marginTop: i === 0 ? 0 : "72px",
                              marginBottom: chapterTitles[entry.chapter || 1] ? "72px" : "16px",
                              scrollMarginTop: "64px",
                            }}>
                              <div style={{
                                fontFamily: MONO, fontSize: "12px",
                                color: "rgba(255,255,255,0.45)",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                              }}>
                                {t("chapter")} {entry.chapter || 1}
                              </div>
                              {chapterTitles[entry.chapter || 1] && (
                                <div style={{
                                  fontFamily: activeStoryFont.family, fontSize: "28px",
                                  color: "#e8ddd0",
                                  fontWeight: activeStoryFont.weight || 700,
                                  marginTop: "8px",
                                }}>
                                  {chapterTitles[entry.chapter || 1]}
                                </div>
                              )}
                            </div>
                          )}
                          <div style={{
                            position: "relative",
                            opacity: pinnedEntry && pinnedEntry.ts !== entry.ts ? 0.5 : 1,
                            transition: "opacity 0.2s",
                          }}>
                            <StoryLine
                              entry={entry}
                              narrow={narrowViewport}
                              isChapterStart={showChapterHeading}
                              onHover={(e) => {
                                if (pinnedEntry) setPinnedEntry(e);
                                setHoveredEntry(e);
                              }}
                              onLeave={() => {
                                if (!pinnedEntry) setHoveredEntry(null);
                              }}
                              onShowDialog={setDialogEntry}
                              onPinPopover={(e) => setPinnedEntry(e)}
                              hideIcon={!!pinnedEntry && !narrowViewport}
                            />
                            {showPopover && (
                              <div style={{
                                position: "absolute",
                                left: "100%",
                                top: 0,
                                paddingLeft: "24px",
                                width: "304px",
                              }}>
                                <div style={{
                                  position: "sticky",
                                  top: "24px",
                                }}>
                                  <StoryPopover entry={pinnedEntry} onClose={() => setPinnedEntry(null)} t={t} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {phase === "streaming" && generatedText && (
                      <div style={{ position: "relative" }}>
                        <TypewriterReveal
                          text={generatedText}
                          narrow={narrowViewport}
                          onComplete={handleStreamingComplete}
                        />
                      </div>
                    )}
                    <div ref={storyEndRef} />
                  </div>
                </div>
              )}

              {/* ── Prompt + Interaction Container ── */}
              {phase !== "streaming" && <div style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                padding: "24px",
              }}>
                {(phase === "input" || phase === "generating") && (
                  <div>
                    <p style={{
                      fontFamily: TYPEWRITER, fontSize: "16px",
                      color: "rgba(255,255,255,0.5)", lineHeight: 1.7,
                      marginBottom: "16px",
                      transition: "opacity 0.3s ease",
                      ...(promptLoading ? { animation: "pulse 1.5s ease-in-out infinite" } : {}),
                    }}>
                      {currentPrompt}
                    </p>
                    <textarea
                      value={answer}
                      onChange={(e) => { setAnswer(e.target.value); setError(null); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
                      }}
                      placeholder={t("write_answer")}
                      rows={3}
                      disabled={phase === "generating"}
                      style={{
                        width: "100%", background: "transparent",
                        border: "none",
                        padding: "0 0 12px", fontFamily: TYPEWRITER,
                        fontSize: "16px", lineHeight: 1.7,
                        color: phase === "generating" ? "rgba(255,255,255,0.3)" : "#e8ddd0",
                        resize: "none", minHeight: "80px",
                      }}
                    />
                    {error && (
                      <p style={{
                        marginTop: "8px", fontFamily: MONO,
                        fontSize: "12px", color: "#c97a7a",
                      }}>{error}</p>
                    )}
                    {showSliders && phase === "input" && (
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px",
                        padding: "12px 0 0",
                      }}>
                        {[
                          { label: t("slider_plot"), value: sliderPlot, set: setSliderPlot, labels: t("plot_labels") },
                          { label: t("slider_dialogue"), value: sliderDialogue, set: setSliderDialogue, labels: t("dialogue_labels") },
                          { label: t("slider_surprise"), value: sliderSurprise, set: setSliderSurprise, labels: t("surprise_labels") },
                          { label: t("slider_emotion"), value: sliderEmotion, set: setSliderEmotion, labels: t("emotion_labels") },
                        ].map(({ label, value, set, labels }) => (
                          <div key={label}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                              <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {label}
                              </span>
                              <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>
                                {labels[value]}
                              </span>
                            </div>
                            <input
                              type="range" min={0} max={9} step={1} value={value}
                              onChange={(e) => set(Number(e.target.value))}
                              className="passage-slider"
                              style={{
                                width: "100%", cursor: "pointer",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "20px 0 0",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {phase !== "generating" && (
                          <button
                            onClick={() => setShowSliders((v) => !v)}
                            style={{
                              background: "none", border: "none",
                              color: showSliders ? "#e8ddd0" : "rgba(255,255,255,0.25)",
                              cursor: "pointer", padding: 0,
                              display: "flex", alignItems: "center",
                            }}
                            title={t("slider_tooltip")}
                          >
                            <BsSliders2Vertical size={14} />
                          </button>
                        )}
                        {phase !== "generating" && (
                          <button
                            onClick={async () => {
                              if (geoEnabled) {
                                localStorage.removeItem("falcor_geo_enabled");
                                setGeoEnabled(false);
                                setGeoLabel("");
                              } else {
                                const loc = await requestBrowserLocation();
                                if (loc) {
                                  localStorage.setItem("falcor_geo_enabled", "true");
                                  setGeoEnabled(true);
                                  setGeoLabel(loc);
                                } else {
                                  setGeoEnabled(false);
                                  setGeoLabel("");
                                }
                              }
                            }}
                            style={{
                              background: "none", border: "none",
                              color: geoEnabled ? "#ffffff" : "rgba(255,255,255,0.25)",
                              cursor: "pointer", padding: 0,
                              display: "flex", alignItems: "center",
                            }}
                            title={geoEnabled ? t("geo_on") : t("geo_off")}
                          >
                            <GoLocation size={14} />
                            {geoEnabled && geoLabel && (
                              <span style={{ fontFamily: MONO, fontSize: "10px", marginLeft: "5px", color: "rgba(255,255,255,0.5)" }}>
                                {geoLabel}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                      {phase === "generating" ? (
                        <span style={{
                          fontFamily: MONO, fontSize: "13px",
                          color: "#999",
                        }}>
                          {t("writing")}
                        </span>
                      ) : (
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                          <button
                            onClick={handleSubmit}
                            disabled={!answer.trim()}
                            style={{
                              background: "none", border: "none",
                              fontFamily: MONO, fontSize: "13px",
                              color: answer.trim() ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
                              cursor: answer.trim() ? "pointer" : "default",
                              padding: 0,
                            }}
                          >
                            {t("preview")}
                          </button>
                          <button
                            onClick={handleQuickAdd}
                            disabled={!answer.trim()}
                            style={{
                              background: answer.trim() ? "#e8ddd0" : "rgba(255,255,255,0.08)",
                              border: "none",
                              borderRadius: "20px",
                              fontFamily: MONO, fontSize: "12px",
                              color: answer.trim() ? "#0e0d0b" : "rgba(255,255,255,0.2)",
                              cursor: answer.trim() ? "pointer" : "default",
                              padding: "6px 16px",
                              transition: "all 0.15s",
                            }}
                          >
                            {t("add")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(phase === "reveal" || phase === "adding") && (
                  <div style={{ minHeight: "180px", display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <button
                        onClick={() => { setPhase("input"); setGeneratedText(""); }}
                        style={{
                          background: "none", border: "none",
                          fontFamily: MONO, fontSize: "13px",
                          color: "#999", cursor: "pointer", padding: 0,
                        }}
                      >
                        <GoArrowLeft size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />{t("back_btn")}
                      </button>
                    </div>
                    <div style={{ marginBottom: "24px", flex: 1 }}>
                      <TypewriterReveal text={generatedText} narrow={narrowViewport} />
                    </div>
                    {generationSource === "local" && (
                      <p style={{
                        fontFamily: MONO, fontSize: "11px",
                        color: "rgba(255,255,255,0.45)", marginBottom: "16px",
                      }}>
                        {t("local_fallback")}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "20px", justifyContent: "flex-end" }}>
                      {phase === "adding" ? (
                        <span style={{
                          fontFamily: MONO, fontSize: "13px",
                          color: "#999",
                        }}>
                          {t("adding")}
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={handleRewrite}
                            style={{
                              background: "none", border: "none",
                              fontFamily: MONO, fontSize: "13px",
                              color: "#999", cursor: "pointer", padding: 0,
                            }}
                          >
                            {t("rewrite")}
                          </button>
                          <button
                            onClick={handleConfirm}
                            style={{
                              background: "none", border: "none",
                              fontFamily: MONO, fontSize: "13px",
                              color: "#e8ddd0", cursor: "pointer", padding: 0,
                            }}
                          >
                            {t("add")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

              </div>}

            </div>
            {/* ── Popover Dialog (narrow viewport) ── */}
            {dialogEntry && (
              <div
                onClick={() => setDialogEntry(null)}
                style={{
                  position: "fixed", inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 100,
                }}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <StoryPopover entry={dialogEntry} onClose={() => setDialogEntry(null)} t={t} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
