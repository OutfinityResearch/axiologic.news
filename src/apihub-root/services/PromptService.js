/**
 * PromptService - Centralized service for generating AI prompts and meme script structures
 * Reduces duplication across wizards by providing common templates and structures
 */
class PromptService {
    constructor() {
        this.version = "1.0";
    }

    /**
     * Get the base meme script structure
     */
    getBaseScriptStructure(type, title, description, theme = "default") {
        return {
            id: `${type}-script-${Date.now()}`,
            version: this.version,
            createdAt: new Date().toISOString(),
            format: "mobile",
            infoPostText: this.getInfoPostTextTemplate(title, description, type),
            infoPostCSS: this.getInfoPostCSS(theme),
            backgroundAnimation: null, // Will be set by wizard
            scenes: []
        };
    }
    
    /**
     * Get comprehensive info post text template with hashtags
     */
    getInfoPostTextTemplate(title, description, type = "general", sourceUrl = null) {
        const hashtags = this.getHashtags(type);
        const sourceLink = sourceUrl ? `<p><strong>Source:</strong> <a href="${sourceUrl}" target="_blank">${sourceUrl}</a></p>\n` : '';

        return `<h1>${title}</h1>
<p>${description}</p>
${sourceLink}<p>${hashtags}</p>`;
    }
    
    /**
     * Get relevant hashtags based on content type
     */
    getHashtags(type) {
        const hashtagSets = {
            quiz: "#Quiz #Trivia #BrainTeaser #Knowledge #Education #Learning #Fun #Challenge #TestYourself #Interactive #SmartContent #QuizTime #TriviaChallenge #LearnSomethingNew #EducationalContent",
            rss: "#News #CurrentEvents #Trending #BreakingNews #WorldNews #TechNews #Updates #Informed #StayUpdated #NewsOfTheDay #Headlines #MediaLiteracy #Journalism #FactCheck #TrendingNow",
            educative: "#Education #Learning #Knowledge #EdTech #StudyTips #Educational #LearnOnline #StudyMotivation #AcademicSuccess #OnlineLearning #EducationMatters #StudyHard #KnowledgeIsPower #LifelongLearning #EduContent",
            trivia: "#Trivia #FunFacts #DidYouKnow #InterestingFacts #AmazingFacts #FactOfTheDay #Curiosity #LearnSomethingNew #MindBlowing #ScienceFacts #HistoryFacts #RandomFacts #DailyTrivia #FactCheck #Fascinating",
            philosophy: "#Philosophy #DeepThoughts #Wisdom #Ethics #Morality #ThinkDeep #PhilosophicalThoughts #LifeQuestions #Existentialism #Mindfulness #Consciousness #WisdomQuotes #ThoughtProvoking #PhilosophyOfLife #DeepThinking",
            questions: "#Questions #CriticalThinking #Curiosity #ThoughtProvoking #AskQuestions #DeepQuestions #Reflection #Mindful #SelfReflection #QuestionEverything #ThinkAboutIt #FoodForThought #Contemplation #Inquiry #Wonder",
            general: "#Viral #Trending #MustWatch #Amazing #Content #SocialMedia #Share #Entertainment #Creative #Digital #ContentCreation #ViralVideo #TrendingNow #MustSee #ShareThis"
        };
        
        return hashtagSets[type] || hashtagSets.general;
    }

    /**
     * Get standard info post CSS
     */
    getInfoPostCSS(theme = "default") {
        const themes = {
            default: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            quiz: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
            educative: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
            trivia: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            philosophy: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
            questions: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
            rss: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)"
        };
        
        return `body {
            background: ${themes[theme] || themes.default};
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 0.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2em;
            line-height: 1.6;
            opacity: 0.95;
        }`;
    }

    /**
     * Get standard text positioning specifications
     */
    getTextPositioningSpecs() {
        return {
            title: {
                className: "text-slot text-slot-title"
            },
            content: {
                className: "text-slot text-slot-content"
            },
            answer1: {
                className: "text-slot text-slot-answer-1"
            },
            answer2: {
                className: "text-slot text-slot-answer-2"
            },
            answer3: {
                className: "text-slot text-slot-answer-3"
            },
            answer4: {
                className: "text-slot text-slot-answer-4"
            }
        };
    }

    /**
     * Get standard animation effects library
     */
    getAnimationEffects() {
        return {
            entrance: {
                bounceIn: "bounceIn",
                fadeIn: "fadeIn",
                slideInLeft: "slideInLeft",
                slideInRight: "slideInRight",
                slideInUp: "slideInUp",
                zoomIn: "zoomIn",
                rotateIn: "rotateIn"
            },
            emphasis: {
                pulse: "pulse",
                shake: "shake",
                swing: "swing",
                tada: "tada"
            },
            delayed: {
                fadeInDelayed: "fadeIn delayed",
                slideInDelayed: "slideInLeft delayed",
                bounceInDelayed: "bounceIn delayed"
            }
        };
    }

    /**
     * Get background animation instructions
     */
    getBackgroundAnimationInstructions() {
        return `
BACKGROUND ANIMATION REQUIREMENTS (MANDATORY):
- The root of the JSON script MUST have a "backgroundAnimation" property.
- This property's value is an object specifying the animation to use for the entire video.
- Example of this property within the main JSON structure:
  {
    "id": "...",
    "version": "...",
    ...
    "backgroundAnimation": {
      "category": "category-id",
      "type": "animation-type"
    },
    "scenes": [...]
  }
- DO NOT include any JavaScript code.
- Animation MUST cover the ENTIRE background area (full viewport).

AVAILABLE ANIMATIONS BY CATEGORY:

1. energetic-dynamic (High energy, dynamic movement):
   - particles: Energetic particle effects
   - lightning: Electric lightning bolts
   - plasma: Flowing plasma energy
   - vortex: Swirling vortex effect
   - neon: Neon light pulses
   - earthquake-waves: Seismic wave patterns
   - binary-stream: Digital binary streams
   - connected-nodes: Network node connections
   - matrix-rain: Matrix-style digital rain
   - pulse-waves: Pulsating wave effects
   - triangle-mesh: Geometric triangle mesh

2. peaceful-calming (Gentle, soothing):
   - waves: Gentle wave patterns
   - stars: Twinkling starfield
   - ocean-waves: Calming ocean waves
   - falling-snow: Peaceful snowfall
   - gentle-rain: Soft rain effect
   - floating-clouds: Drifting clouds
   - serenity: Serene gradient flows
   - contentment: Peaceful color transitions
   - zen-garden: Zen-inspired patterns
   - morning-mist: Soft morning mist

3. spiritual-mystic (Mystical, transcendent):
   - aurora-borealis: Northern lights effect
   - cosmic-mandala: Sacred geometric mandala
   - third-eye: Mystical third eye patterns
   - soul-journey: Spiritual journey visuals
   - astral-projection: Astral plane effects
   - sacred-geometry: Sacred geometric patterns
   - crystal-meditation: Crystal energy flows
   - kundalini-awakening: Kundalini energy spiral
   - root-chakra: Root chakra energy
   - heart-chakra: Heart chakra patterns
   - crown-chakra: Crown chakra illumination

4. playful-creative (Fun, imaginative):
   - bouncing-bubbles: Playful bubble effects
   - confetti-party: Celebration confetti
   - rainbow-drops: Colorful rainbow drops
   - dancing-flames: Animated fire dance
   - butterfly-dance: Butterfly movements
   - fractal-bloom: Fractal flower blooming
   - geometric: Playful geometric shapes
   - matrix: Creative matrix patterns
   - rainbow-prisms: Rainbow prism effects

5. melancholic-reflective (Thoughtful, introspective):
   - rainy-window: Rain on window effect
   - autumn-leaves: Falling autumn leaves
   - misty-fog: Dense fog atmosphere
   - fading-memories: Memory fade effect
   - nostalgia: Nostalgic color shifts
   - lonely-rain: Solitary rain drops
   - wilted-flower: Wilting flower petals
   - winter-solitude: Winter snow solitude
   - old-diary: Vintage diary pages
   - silent-clock: Time passing effect
   - broken-glass: Shattered glass pieces
   - empty-chair: Loneliness visualization
   - abandoned-swing: Abandoned playground

SELECTION GUIDELINES:
- Quiz/Trivia: Use energetic-dynamic (particles, connected-nodes) or playful-creative (bouncing-bubbles, confetti-party)
- Educational: Use peaceful-calming (floating-clouds, morning-mist) or spiritual-mystic (cosmic-mandala)
- Philosophy: Use spiritual-mystic (soul-journey, sacred-geometry) or melancholic-reflective (nostalgia)
- RSS/News: Use energetic-dynamic (binary-stream, matrix-rain) or peaceful-calming (waves)
- Emotional content: Match the emotion (melancholic for sad, playful for happy, etc.)

- NO JavaScript code should be included in the script`;
    }

    /**
     * Get animation category descriptions for prompts
     */
    getAnimationCategoryDescriptions() {
        return {
            particles: "Floating elements like bubbles, stars, snow, or abstract particles",
            waves: "Flowing wave patterns including sine waves, ocean waves, or pulsing effects",
            geometric: "Mathematical patterns with shapes like hexagons, triangles, circles, or spirals",
            network: "Connected node patterns, constellations, or web-like structures",
            gradient: "Color gradients that shift, flow, or create aurora-like effects",
            matrix: "Digital rain effects with falling characters or binary streams"
        };
    }

    /**
     * Get standard CTA (Call-to-Action) templates
     */
    getCTATemplates(category = "general") {
        const templates = {
            quiz: [
                "🎯 How many did you get right? Comment below!",
                "🧠 Test your knowledge! Share your score!",
                "💡 Challenge your friends with this quiz!"
            ],
            educative: [
                "📚 Learn something new? Share with others!",
                "🎓 Knowledge is power! Save for later!",
                "💭 What did you learn today? Comment below!"
            ],
            trivia: [
                "🤔 Did you know these facts? Share your thoughts!",
                "🌟 Mind = Blown! Which fact surprised you most?",
                "📖 Save this for your next trivia night!"
            ],
            philosophy: [
                "🤔 What's YOUR perspective? Share below!",
                "💭 Deep thoughts? Join the discussion!",
                "🌟 Which viewpoint resonates with you?"
            ],
            questions: [
                "💬 Share your answers in the comments!",
                "🤔 Which question made you think the most?",
                "📝 Save these thought-provoking questions!"
            ],
            general: [
                "👍 LIKE if you enjoyed this!",
                "🔔 SUBSCRIBE for more content!",
                "💬 SHARE your thoughts below!",
                "📱 FOLLOW for daily updates!"
            ]
        };
        
        return templates[category] || templates.general;
    }

    /**
     * Get the consolidated core rules for generation.
     * This combines design principles, structure, and styling to reduce prompt complexity.
     */
    getCoreGenerationRules() {
        return `
--- CORE GENERATION RULES ---

**1. SCENE & SLOT STRUCTURE (CRITICAL OVERRIDE)**
- **IGNORE ALL PREVIOUS RULES** about splitting quiz questions (e.g., "Scene 1a, 1b, 1c").
- **General Scenes**: Max 2 textSlots: an optional title (\`text-slot-title\`) and main content (\`text-slot-content\`).
- **Quiz Question Scenes**: A SINGLE scene MUST contain the question (\`text-slot-title\`) and ALL of its answers (\`text-slot-answer-1\`, \`text-slot-answer-2\`, etc.).
- **Quiz Answer/Result Scenes**: Use a single content slot (\`text-slot-content\`) for the explanation.

**2. STYLING & ANIMATION (CSS CLASSES)**
- Every text slot MUST have a \`className\` and \`animationClass\` property.
- **Positioning Classes**: \`text-slot-title\`, \`text-slot-content\`, \`text-slot-answer-1\`, \`text-slot-answer-2\`, etc.
- **Theme Classes**: Apply ONE theme consistently (e.g., \`theme-cool-blue\`).
- **Font Size Classes**: Apply based on text length (\`font-size-xl\`, \`font-size-lg\`, etc.).
- **Animation Classes**: Use animations like \`fadeIn\`, \`slideInUp\`. Use \`delayed\` for staggered effects (e.g., \`fadeIn delayed\`).
- **Example \`className\`**: "text-slot text-slot-answer-1 theme-cool-blue font-size-lg"

**3. TEXT SLOT OBJECT FORMAT (CRITICAL SYNTAX)**
- Each object in the \`textSlots\` array MUST be a flat JSON object.
- It MUST have these keys: \`slotId\` (string), \`text\` (string), \`className\` (string), \`animationClass\` (string), and \`useTTS\` (boolean).
- **CRITICAL**: DO NOT nest properties. The value for each key must be a primitive (string, boolean).
- **CORRECT**: \`{ "slotId": "id1", "text": "hello", ... }\`
- **INCORRECT (will be rejected)**: \`{ "slotId": { "text": "hello" } }\` or \`{ "slotId": "id1": { ... } }\`

**4. METADATA FIELD ("scriptDescription")**
- The root JSON object MUST include a "scriptDescription" field.
- This field MUST be a single string containing a human-readable description of the video, suitable for social media posts, followed by relevant hashtags for platforms like YouTube and Instagram.
- Example: "Test your knowledge with this funny quiz about military history, from ancient chariots to modern tech! #MilitaryHistory #HistoryQuiz #FunnyQuiz #TriviaChallenge #YouTube"
`;
    }

    /**
     * Get verification checklist template
     */
    getVerificationChecklist() {
        return `
FINAL VERIFICATION CHECKLIST - The entire response MUST be a single JSON object that passes these checks:

1.  **Root Object Structure**:
    ✓ The JSON root MUST contain all required properties: \`id\`, \`version\`, \`createdAt\`, \`format\`, \`infoPostText\`, \`infoPostCSS\`, \`scriptDescription\`, \`backgroundAnimation\`, and \`scenes\`.
    ✓ \`id\`, \`version\`, \`createdAt\`, \`format\` are all non-empty strings.
    ✓ \`scenes\` is an array of scene objects.

2.  **Scene Content**:
    ✓ Every object in a \`textSlots\` array is a FLAT object with keys like "slotId", "text", etc. There are NO nested objects.
    ✓ \`className\` and \`animationClass\` properties are used correctly for all styling and animations.
    ✓ A consistent theme class (e.g., "theme-cool-blue") is used across all content slots.
    ✓ Font-size classes ("font-size-xl", etc.) are applied correctly based on text length.
    ✓ Scene durations are appropriate for the content (e.g., 4-8 seconds).

3.  **Metadata**:
    ✓ \`scriptDescription\` is a human-readable string with a description and hashtags.

4.  **Overall Integrity**:
    ✓ A CTA scene is included at the end with relevant call-to-action text.
    ✓ The final output is a single, complete, and valid JSON object with no truncated content or comments.`;
    }

    /**
     * Build a complete scene structure
     */
    buildScene(sceneId, duration, textSlots, backgroundCSS = null) {
        const scene = {
            sceneId: sceneId,
            duration: duration * 1000, // Convert to milliseconds
            textSlots: textSlots
        };

        if (backgroundCSS) {
            scene.backgroundCSS = backgroundCSS;
        }

        return scene;
    }

    /**
     * Build a text slot with standard styling
     */
    buildTextSlot(slotId, text, position = "content", effect = "fadeIn", useTTS = false, additionalClasses = []) {
        const positions = this.getTextPositioningSpecs();
        const effects = this.getAnimationEffects();

        // Base classes from position
        let classList = (positions[position]?.className || positions.content.className).split(' ');

        // Add any additional classes passed in
        if (additionalClasses.length > 0) {
            classList.push(...additionalClasses);
        }

        // Combine all effects categories for easier lookup
        const allEffects = { ...effects.entrance, ...effects.emphasis, ...effects.delayed };
        let animationClass = allEffects[effect] || effect || "fadeIn";

        return {
            slotId: slotId,
            text: text,
            className: classList.join(' '),
            animationClass: animationClass,
            useTTS: useTTS
        };
    }

    /**
     * Generate a complete prompt structure
     */
    generatePromptStructure(config) {
        const {
            systemContext = "",
            taskDescription = "",
            outputFormat = {},
            specificRequirements = "",
            examples = [],
            wizardType = "general"
        } = config;

        let prompt = `**CRITICAL INSTRUCTION**: You are an AI assistant that generates JSON. Your ONLY output must be a single, valid JSON object that strictly adheres to the schema provided in the "CRITICAL OUTPUT FORMAT" section. Do not add any text, explanations, or markdown before or after the JSON. All root-level properties listed in the verification checklist are MANDATORY.\n\n`;

        // Add system context
        if (systemContext) {
            prompt += systemContext + "\n\n";
        }
        // Add task description
        if (taskDescription) {
            prompt += taskDescription + "\n\n";
        }

        // Add consolidated core rules
        prompt += this.getCoreGenerationRules() + "\n\n";

        // Add background animation instructions
        prompt += this.getBackgroundAnimationInstructions() + "\n\n";

        // Add specific requirements
        if (specificRequirements) {
            prompt += "SPECIFIC REQUIREMENTS:\n" + specificRequirements + "\n\n";
        }

        // Add output format
        if (outputFormat && Object.keys(outputFormat).length > 0) {
            prompt += "CRITICAL OUTPUT FORMAT - YOU MUST FOLLOW THIS EXACT JSON STRUCTURE:\n" + JSON.stringify(outputFormat, null, 2) + "\n\n";
        }

        // Add examples if provided
        if (examples.length > 0) {
            prompt += "EXAMPLES:\n";
            examples.forEach((example, index) => {
                prompt += `Example ${index + 1}:\n${JSON.stringify(example, null, 2)}\n\n`;
            });
        }

        // Add verification checklist
        prompt += "FINAL VERIFICATION - DOUBLE-CHECK YOUR RESPONSE AGAINST THE CRITICAL OUTPUT FORMAT AND THIS CHECKLIST:\n" + this.getVerificationChecklist() + "\n";

        return prompt;
    }

    /**
     * Get scene duration recommendations
     */
    getSceneDurationRecommendations() {
        return {
            intro: 4000,        // 4 seconds
            content: 6000,      // 6 seconds
            question: 8000,     // 8 seconds for reading
            answer: 5000,       // 5 seconds
            transition: 3000,   // 3 seconds
            cta: 4000          // 4 seconds
        };
    }

    /**
     * Get standard output format structure
     * Wizards should use this as a template and customize as needed
     */
/*    getOutputFormatTemplate() {
        return {
            "id": "quiz-military-history-1678886400000",
            "version": "1.0",
            "createdAt": "2025-08-21T12:00:00.000Z",
            "format": "mobile",
            "infoPostText": "<h1>Military Might Quiz</h1><p>A funny quiz about military history.</p><p>#MilitaryHistory #Quiz</p>",
            "infoPostCSS": "body { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #fff; }",
            "scriptDescription": "A funny quiz comparing and contrasting military might throughout history. #MilitaryHistory #Quiz #HistoryFacts #YouTube",
            "backgroundAnimation": {
                "category": "playful-creative",
                "type": "confetti-party"
            },
            "scenes": [
                {
                    "sceneId": "question-1",
                    "duration": 8000,
                    "backgroundCSS": null,
                    "textSlots": [
                        {
                            "slotId": "title-1",
                            "text": "Which ancient civilization had the most badass chariots?",
                            "className": "text-slot text-slot-title font-size-md",
                            "animationClass": "fadeIn",
                            "useTTS": true
                        },
                        {
                            "slotId": "answer-1-1",
                            "text": "A) Egyptians",
                            "className": "text-slot text-slot-answer-1 theme-cool-blue font-size-lg",
                            "animationClass": "slideInUp",
                            "useTTS": true
                        }
                    ]
                }
            ]
        };
    }*/
}

// Make PromptService globally available
window.PromptService = new PromptService();
export default window.PromptService;
