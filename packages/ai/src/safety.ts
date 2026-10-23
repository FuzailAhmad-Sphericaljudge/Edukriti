/**
 * Safety and prompt injection defenses for Edukriti / Ask Aarohi
 */

export type PromptSanitizationResult = {
  sanitized: string;
  hasInjectionRisk: boolean;
  flags: string[];
};

export type HarmDetectionResult = {
  isHarmful: boolean;
  category?: 'violence' | 'self_harm' | 'weapons' | 'hate' | 'illegal' | 'sexual';
  refusalMessage?: {
    english: string;
    hindi: string;
    hinglish: string;
  };
};

export type EducationalClassificationResult = {
  isEducational: boolean;
  redirectMessage?: {
    english: string;
    hindi: string;
    hinglish: string;
  };
  suggestedTopics: string[];
};

const INJECTION_PATTERNS = [
  { pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i, flag: 'ignore_instructions' },
  { pattern: /disregard\s+(all\s+)?(previous|prior|above|system)/i, flag: 'disregard_system' },
  { pattern: /you\s+are\s+now\s+(unrestricted|dan|jailbreak|chaos)/i, flag: 'jailbreak_persona' },
  { pattern: /system\s*:\s*override/i, flag: 'system_override' },
  { pattern: /<\s*system\s*>/i, flag: 'system_tag' },
  { pattern: /\[\s*(system|developer|admin)\s*\]/i, flag: 'system_bracket' },
  { pattern: /reveal\s+(your\s+)?(system\s+prompt|developer\s+instructions)/i, flag: 'leak_system_prompt' },
  { pattern: /bypass\s+(safety|content\s+filter|guardrails)/i, flag: 'bypass_filter' },
];

const HARMFUL_PATTERNS = [
  { pattern: /\b(how\s+to\s+make|build|synthesize)\s+(a\s+)?(bomb|explosive|weapon|poison|cyanide)\b/i, category: 'weapons' as const },
  { pattern: /\b(how\s+to\s+commit\s+suicide|kill\s+myself|end\s+my\s+life|self[- ]harm)\b/i, category: 'self_harm' as const },
  { pattern: /\b(child\s+porn|csam|exploit\s+minors)\b/i, category: 'sexual' as const },
  { pattern: /\b(hack\s+into|ddos|ransomware\s+code|steal\s+credit\s+card)\b/i, category: 'illegal' as const },
  { pattern: /\b(how\s+to\s+(murder|assassinate|strangle)\s+someone)\b/i, category: 'violence' as const },
];

const NON_EDUCATIONAL_PATTERNS = [
  /^(hi|hello|hey|sup|yo|good\s+morning|good\s+evening|namaste|salaam)[\s,!.]*(how\s+are\s+you|how\s+r\s+u|who\s+are\s+you)?[\s?!.]*$/i,
  /^(how\s+are\s+you|who\s+are\s+you|what\s+is\s+your\s+name|aap\s+kaun\s+ho)[\s?!.]*$/i,
  /^(tell\s+me\s+a\s+joke|make\s+me\s+laugh|sing\s+a\s+song|write\s+a\s+rap)[\s?!.]*$/i,
  /^(what\s+is\s+the\s+weather|weather\s+today|cricket\s+score|ipl\s+score|movie\s+recommendation)[\s?!.]*$/i,
  /^(are\s+you\s+real|do\s+you\s+have\s+feelings|will\s+you\s+marry\s+me)[\s?!.]*$/i,
];

const SUBSTANTIVE_ACADEMIC_KEYWORDS = new Set([
  'explain', 'calculate', 'solve', 'derive', 'define', 'proof',
  'theorem', 'formula', 'law', 'reaction', 'equation', 'circuit', 'current', 'voltage',
  'force', 'energy', 'velocity', 'mass', 'gravity', 'photosynthesis', 'cell', 'dna',
  'molecule', 'atom', 'acid', 'base', 'integral', 'derivative', 'matrix', 'vector',
  'history', 'constitution', 'war', 'empire', 'economy', 'gdp', 'inflation', 'algorithm',
  'function', 'variable', 'class', 'python', 'java', 'exam', 'neet', 'jee', 'cbse',
  'ncert', 'numericals', 'experiment', 'lab', 'hypothesis', 'step',
  'samjhao', 'antar', 'paribhasha', 'sutr', 'udaharan'
]);

export function sanitizePromptInput(text: string): PromptSanitizationResult {
  const flags: string[] = [];
  let sanitized = text;

  for (const { pattern, flag } of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      flags.push(flag);
      sanitized = sanitized.replace(pattern, '[Content Removed: Policy]');
    }
  }

  // Remove potential markdown or HTML injection vectors
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');

  return {
    sanitized: sanitized.trim(),
    hasInjectionRisk: flags.length > 0,
    flags,
  };
}

export function detectHarmfulContent(text: string): HarmDetectionResult {
  for (const { pattern, category } of HARMFUL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isHarmful: true,
        category,
        refusalMessage: {
          english: "I cannot fulfill this request. Edukriti and Aarohi are dedicated to safe, ethical, and productive educational exploration. If you or someone you know is in crisis, please reach out to trusted support services.",
          hindi: "मैं इस अनुरोध को पूरा नहीं कर सकती। एडुकृति और आरोही सुरक्षित, नैतिक और रचनात्मक शैक्षणिक अध्ययन के लिए समर्पित हैं।",
          hinglish: "Main yeh request fulfill nahi kar sakti. Edukriti aur Aarohi safe, ethical aur constructive education ke liye hain. Please study-related questions poochein.",
        },
      };
    }
  }

  return { isHarmful: false };
}

export function classifyEducationalIntent(query: string): EducationalClassificationResult {
  const normalized = query.trim().toLowerCase();

  // Check known non-academic patterns
  const matchesNonAcademic = NON_EDUCATIONAL_PATTERNS.some((pattern) => pattern.test(normalized));

  // Count academic keywords
  const tokens = normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
  const educationalTokenCount = tokens.filter((t) => SUBSTANTIVE_ACADEMIC_KEYWORDS.has(t)).length;

  if (matchesNonAcademic && educationalTokenCount === 0) {
    return {
      isEducational: false,
      redirectMessage: {
        english: "Namaste! I'm Aarohi, your Edukriti AI study teacher. While I enjoy a warm greeting, my superpower is making complex science, maths, humanities, and coding concepts easy and exciting. What topic are you studying today?",
        hindi: "नमस्ते! मैं आरोही हूँ, आपकी एडुकृति AI शिक्षिका। विज्ञान, गणित, कोडिंग या इतिहास में आप आज क्या समझना चाहते हैं?",
        hinglish: "Namaste! Main Aarohi hoon, aapki Edukriti AI study partner. Complex science, maths, ya coding topics ko aasan banana mera goal hai. Aaj kaun sa concept padhein?",
      },
      suggestedTopics: [
        'How does photosynthesis work?',
        "Explain Ohm's Law with a water pipe analogy",
        'Solve a quadratic equation step by step',
        'Key causes of the 1857 Indian Independence movement',
      ],
    };
  }

  return {
    isEducational: true,
    suggestedTopics: [],
  };
}
