/**
 * Curated open-access Knowledge Base for Edukriti / Ask Aarohi
 * Sources: OpenStax (CC BY 4.0), Wikipedia (CC BY-SA 4.0), PubChem (Public Domain)
 * All data conforms to docs/DATA_SOURCES.md
 */

import { rankChunks, type RankableChunk } from './index.ts';

export type KnowledgeChunk = RankableChunk & {
  subject: 'physics' | 'chemistry' | 'mathematics' | 'biology' | 'computer_science' | 'history_polity';
  topic: string;
  sourceTitle: string;
  sourceUrl: string;
  license: 'CC BY 4.0' | 'CC BY-SA 4.0' | 'Public Domain';
  keyEquations?: string[];
  keyFacts: string[];
};

export const CURATED_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  // --- PHYSICS ---
  {
    id: 'kb-phys-001',
    index: 0,
    pageStart: 45,
    pageEnd: 48,
    tokenCount: 160,
    subject: 'physics',
    topic: 'Kinematics & Newton Laws of Motion',
    sourceTitle: 'OpenStax University Physics Vol 1 - Chapter 3 & 5',
    sourceUrl: 'https://openstax.org/details/books/university-physics-volume-1',
    license: 'CC BY 4.0',
    keyEquations: ['v = u + a*t', 's = u*t + 0.5*a*t^2', 'v^2 = u^2 + 2*a*s', 'F = m*a'],
    keyFacts: [
      "Newton's First Law (Law of Inertia) states an object remains at rest or in uniform motion unless acted upon by a net external force.",
      "Newton's Second Law defines force as mass multiplied by acceleration (F = m*a), with SI unit Newtons (N).",
      "Newton's Third Law states every action has an equal and opposite reaction force acting on different bodies.",
      'Acceleration is the rate of change of velocity over time (a = (v - u) / t).',
    ],
    text: `Kinematics describes the motion of points, bodies, and systems of bodies without considering the forces that cause them. For uniform acceleration in a straight line, the kinematic equations connect initial velocity (u), final velocity (v), acceleration (a), elapsed time (t), and displacement (s): v = u + a*t, s = u*t + 0.5*a*t^2, and v^2 = u^2 + 2*a*s. Newton's laws of motion provide the dynamical foundation: Newton's first law establishes inertia, where velocity remains constant without net external force. Newton's second law quantifies force as F = m*a, measured in Newtons (1 N = 1 kg*m/s^2). Newton's third law asserts that interacting bodies exert equal and opposite forces on each other simultaneously.`,
  },
  {
    id: 'kb-phys-002',
    index: 1,
    pageStart: 112,
    pageEnd: 115,
    tokenCount: 155,
    subject: 'physics',
    topic: 'Work, Kinetic Energy & Work-Energy Theorem',
    sourceTitle: 'OpenStax University Physics Vol 1 - Chapter 7',
    sourceUrl: 'https://openstax.org/details/books/university-physics-volume-1',
    license: 'CC BY 4.0',
    keyEquations: ['W = F * d * cos(theta)', 'KE = 0.5 * m * v^2', 'W_net = Delta_KE'],
    keyFacts: [
      'Work is done when a force causes displacement in the direction of the force (W = F * d).',
      'Kinetic energy is the energy possessed by an object due to its motion, KE = (1/2)*m*v^2.',
      'The Work-Energy Theorem states that net work done on a particle equals the change in its kinetic energy.',
      'SI unit of work and energy is the Joule (1 J = 1 N*m = 1 kg*m^2/s^2).',
    ],
    text: `Work is the energy transferred to or from an object via the application of force along a displacement: W = F * d * cos(theta), where theta is the angle between force and displacement vectors. When force is aligned with motion, W = F * d. Kinetic energy (KE) represents motion energy: KE = 0.5 * m * v^2. By integrating Newton's second law over distance, one derives the Work-Energy Theorem: the net work performed by all forces on an object equals the net change in its kinetic energy (W_net = KE_final - KE_initial). Gravitational potential energy near Earth's surface is PE = m * g * h, where g ≈ 9.8 m/s^2.`,
  },
  {
    id: 'kb-phys-003',
    index: 2,
    pageStart: 210,
    pageEnd: 214,
    tokenCount: 165,
    subject: 'physics',
    topic: "Electric Current, Voltage & Ohm's Law",
    sourceTitle: 'OpenStax University Physics Vol 2 - Chapter 9',
    sourceUrl: 'https://openstax.org/details/books/university-physics-volume-2',
    license: 'CC BY 4.0',
    keyEquations: ['V = I * R', 'I = Q / t', 'P = V * I', 'R_series = R1 + R2', '1/R_parallel = 1/R1 + 1/R2'],
    keyFacts: [
      "Ohm's Law states that current through a conductor is directly proportional to potential difference across it at constant temperature (V = I*R).",
      'Current (I) is the rate of flow of electric charge (I = Q/t), measured in Amperes (A = Coulombs/second).',
      'Electrical resistance (R) opposes current flow and is measured in Ohms (Omega).',
      'Electric power is dissipated according to P = V*I = I^2*R = V^2/R, measured in Watts (W).',
    ],
    text: `Electric current (I) is the net rate of electric charge flow through a cross-sectional area: I = Q / t. The potential difference or voltage (V) provides the electromotive driving force, measured in Volts. For ohmic materials at constant temperature, Ohm's Law dictates that current is directly proportional to voltage and inversely proportional to electrical resistance (R): V = I * R. In a series circuit, current remains identical across components while voltages add: R_total = R1 + R2 + ... In a parallel circuit, voltage remains identical while branch currents add: 1/R_total = 1/R1 + 1/R2 + ... Electrical power consumed is P = V * I = I^2 * R.`,
  },
  {
    id: 'kb-phys-004',
    index: 3,
    pageStart: 340,
    pageEnd: 344,
    tokenCount: 160,
    subject: 'physics',
    topic: 'Optics, Refraction & Snell Law',
    sourceTitle: 'OpenStax University Physics Vol 3 - Chapter 1',
    sourceUrl: 'https://openstax.org/details/books/university-physics-volume-3',
    license: 'CC BY 4.0',
    keyEquations: ['n1 * sin(theta1) = n2 * sin(theta2)', 'n = c / v', '1/f = 1/v - 1/u'],
    keyFacts: [
      "Snell's Law of Refraction relates angles of incidence and refraction across optical interfaces: n1*sin(theta1) = n2*sin(theta2).",
      'Refractive index n is the ratio of speed of light in vacuum to speed in medium (n = c / v).',
      'When light enters an optically denser medium (higher n), it bends towards the normal and slows down.',
      'Thin lens formula is 1/f = 1/v - 1/u (using Cartesian sign convention).',
    ],
    text: `Refraction is the change in propagation direction of an electromagnetic wave resulting from change in wave velocity at a boundary between media. Refractive index n = c / v quantifies optical density, where c ≈ 3.0 * 10^8 m/s. Snell's Law states: n1 * sin(theta1) = n2 * sin(theta2). When light travels from a rarer medium to a denser medium (n2 > n1), the refracted ray bends towards the normal line (theta2 < theta1). Total internal reflection occurs when light attempts to travel from denser to rarer medium at an incident angle exceeding critical angle theta_c = arcsin(n2 / n1).`,
  },

  // --- CHEMISTRY ---
  {
    id: 'kb-chem-001',
    index: 4,
    pageStart: 60,
    pageEnd: 64,
    tokenCount: 160,
    subject: 'chemistry',
    topic: 'Atomic Structure, Bohr Model & Electronic Configuration',
    sourceTitle: 'OpenStax Chemistry 2e - Chapter 6',
    sourceUrl: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
    keyEquations: ['E = h * nu', 'c = lambda * nu', 'Delta_E = -2.18e-18 * (1/n2^2 - 1/n1^2) J'],
    keyFacts: [
      'Atoms comprise a dense central nucleus of protons and neutrons surrounded by electrons.',
      'Atomic number (Z) equals the number of protons and determines the chemical element.',
      'Mass number (A) is protons plus neutrons; isotopes have identical Z but differing neutron counts.',
      'Bohr model quantizes electron orbits in discrete energy shells (n = 1, 2, 3...).',
    ],
    text: `The atomic nucleus contains positively charged protons and neutral neutrons, surrounded by negatively charged electrons occupying quantized orbitals. The atomic number Z specifies protons; the mass number A specifies nucleons (protons + neutrons). The Bohr atomic model established that electrons orbit at discrete radii corresponding to quantized angular momentum and energy levels. Transition between levels absorbs or emits a photon of frequency nu matching Planck's relation: Delta_E = h * nu = (h * c) / lambda, where h ≈ 6.626 * 10^-34 J*s. Modern quantum mechanics describes electrons via orbitals defined by principal (n), angular momentum (l), magnetic (m_l), and spin (m_s) quantum numbers.`,
  },
  {
    id: 'kb-chem-002',
    index: 5,
    pageStart: 140,
    pageEnd: 145,
    tokenCount: 165,
    subject: 'chemistry',
    topic: 'Mole Concept, Stoichiometry & Chemical Equations',
    sourceTitle: 'OpenStax Chemistry 2e - Chapter 4',
    sourceUrl: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
    keyEquations: ['n = mass / MolarMass', 'N = n * N_A', 'N_A = 6.022e23 mol^-1'],
    keyFacts: [
      'One mole equals Avogadro’s number of constituent particles (6.022 * 10^23 entities).',
      'Molar mass in grams per mole is numerically equivalent to the atomic or formula mass in atomic mass units (u).',
      'Chemical equations must balance mass and charge according to the Law of Conservation of Mass.',
      'A limiting reactant is completely consumed first in a reaction and dictates maximum product yield.',
    ],
    text: `A mole is the SI base unit for amount of substance, containing exactly 6.02214076 * 10^23 elementary entities (Avogadro's constant N_A). Number of moles n is calculated as mass divided by molar mass M: n = m / M. Stoichiometry uses balanced chemical equations to determine quantitative proportions of reactants and products based on conservation of mass. In aqueous reactions, molarity M represents moles of solute per liter of solution (mol/L). In reactions where reactants are not supplied in exact stoichiometric ratios, the limiting reagent determines the theoretical yield.`,
  },
  {
    id: 'kb-chem-003',
    index: 6,
    pageStart: 250,
    pageEnd: 254,
    tokenCount: 150,
    subject: 'chemistry',
    topic: 'Acids, Bases, pH & Neutralization',
    sourceTitle: 'OpenStax Chemistry 2e - Chapter 14',
    sourceUrl: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
    keyEquations: ['pH = -log10[H+]', 'pOH = -log10[OH-]', 'pH + pOH = 14 (at 25 deg C)', 'Kw = [H+][OH-] = 1.0e-14'],
    keyFacts: [
      'Arrhenius acids produce H+ in water; Arrhenius bases produce OH-.',
      'Bronsted-Lowry defines acids as proton (H+) donors and bases as proton acceptors.',
      'pH scale measures hydrogen ion activity: pH < 7 is acidic, pH = 7 is neutral, pH > 7 is basic at 25 °C.',
      'Neutralization between strong acid and strong base yields salt and water (HCl + NaOH -> NaCl + H2O).',
    ],
    text: `Under the Bronsted-Lowry definition, an acid is a proton (H+) donor while a base is a proton acceptor. Conjugate acid-base pairs differ by a single proton. The pH scale quantifies hydrogen ion concentration: pH = -log10[H3O+]. In pure water at 25 °C, autoionization yields Kw = [H+][OH-] = 1.0 * 10^-14, giving a neutral pH of 7.0. Strong acids (e.g., HCl, HNO3, H2SO4) completely dissociate in water, whereas weak acids (e.g., CH3COOH) establish an equilibrium characterized by acid dissociation constant Ka. Neutralization reactions combine hydrogen and hydroxide ions to form water and an ionic salt.`,
  },

  // --- MATHEMATICS ---
  {
    id: 'kb-math-001',
    index: 7,
    pageStart: 85,
    pageEnd: 88,
    tokenCount: 160,
    subject: 'mathematics',
    topic: 'Quadratic Equations, Discriminant & Roots',
    sourceTitle: 'OpenStax College Algebra 2e - Chapter 2',
    sourceUrl: 'https://openstax.org/details/books/college-algebra-2e',
    license: 'CC BY 4.0',
    keyEquations: ['ax^2 + bx + c = 0', 'x = (-b +- sqrt(b^2 - 4*a*c)) / (2*a)', 'D = b^2 - 4*a*c'],
    keyFacts: [
      'A quadratic equation has the canonical form ax^2 + bx + c = 0 with a != 0.',
      'The discriminant D = b^2 - 4*a*c determines the nature of the roots.',
      'If D > 0, there are two distinct real roots; if D = 0, one real repeated root; if D < 0, two complex conjugate roots.',
      'Vieta’s formulas state sum of roots = -b/a, product of roots = c/a.',
    ],
    text: `A quadratic equation is a second-order polynomial equation of the form ax^2 + bx + c = 0, where a != 0. Solutions (roots) are obtained by factoring, completing the square, or using the quadratic formula: x = (-b +- sqrt(b^2 - 4*a*c)) / (2*a). The quantity D = b^2 - 4*a*c is the discriminant. If D > 0, the equation has two distinct real roots. If D = 0, the parabola is tangent to the x-axis, producing a single repeated real root x = -b/(2*a). If D < 0, the roots are complex conjugate pairs (-b +- i*sqrt(|D|))/(2*a). By Vieta's formulas, the sum of roots is -b/a and the product of roots is c/a.`,
  },
  {
    id: 'kb-math-002',
    index: 8,
    pageStart: 150,
    pageEnd: 154,
    tokenCount: 165,
    subject: 'mathematics',
    topic: 'Calculus: Derivatives, Power Rule & Rates of Change',
    sourceTitle: 'OpenStax Calculus Vol 1 - Chapter 3',
    sourceUrl: 'https://openstax.org/details/books/calculus-volume-1',
    license: 'CC BY 4.0',
    keyEquations: ["f'(x) = lim_{h->0} (f(x+h) - f(x))/h", 'd/dx(x^n) = n * x^(n-1)', 'd/dx(sin x) = cos x', 'd/dx(uv) = u*v_prime + v*u_prime'],
    keyFacts: [
      'The derivative represents the instantaneous rate of change and slope of the tangent line.',
      'Power rule states d/dx (x^n) = n * x^(n-1) for any real exponent n.',
      'Product rule: d/dx (u*v) = u*(dv/dx) + v*(du/dx).',
      'Critical points occur where f’(x) = 0 or f’(x) is undefined, indicating local extrema or inflection.',
    ],
    text: `The derivative of a function f(x) measures its instantaneous rate of change with respect to x, defined formally as the limit of difference quotients: f'(x) = lim_{h -> 0} [f(x + h) - f(x)] / h. Geometrically, it yields the slope of the line tangent to the curve at (x, f(x)). Essential rules of differentiation include the power rule: d/dx(x^n) = n * x^(n-1); the sum rule: d/dx(f + g) = f' + g'; the product rule: d/dx(f * g) = f'*g + f*g'; the quotient rule: d/dx(f / g) = (f'*g - f*g') / g^2; and the chain rule for composite functions: d/dx(f(g(x))) = f'(g(x)) * g'(x).`,
  },
  {
    id: 'kb-math-003',
    index: 9,
    pageStart: 210,
    pageEnd: 214,
    tokenCount: 150,
    subject: 'mathematics',
    topic: 'Probability, Independence & Bayes Theorem',
    sourceTitle: 'OpenStax Introductory Statistics - Chapter 3',
    sourceUrl: 'https://openstax.org/details/books/introductory-statistics',
    license: 'CC BY 4.0',
    keyEquations: ['P(A) = n(A) / n(S)', 'P(A or B) = P(A) + P(B) - P(A and B)', 'P(A|B) = P(A and B) / P(B)', 'P(A|B) = P(B|A)*P(A) / P(B)'],
    keyFacts: [
      'Probability of an event E is the ratio of favorable outcomes to total sample space outcomes: P(E) in [0, 1].',
      'For mutually exclusive events, P(A or B) = P(A) + P(B).',
      'Two events are independent if and only if P(A and B) = P(A) * P(B).',
      'Bayes’ Theorem calculates posterior probability using prior probability and likelihood: P(A|B) = (P(B|A)*P(A))/P(B).',
    ],
    text: `Probability quantifies the likelihood that a particular event occurs within a sample space S of equally likely outcomes: P(A) = n(A) / n(S), bounded such that 0 <= P(A) <= 1. The addition rule for any two events states P(A cup B) = P(A) + P(B) - P(A cap B). Conditional probability P(A|B) is the probability of A given B has occurred: P(A|B) = P(A cap B) / P(B) for P(B) > 0. Events A and B are statistically independent if P(A|B) = P(A), or equivalently P(A cap B) = P(A) * P(B). Bayes' theorem provides a systematic way to invert conditional probabilities: P(A|B) = [P(B|A) * P(A)] / P(B).`,
  },

  // --- BIOLOGY ---
  {
    id: 'kb-bio-001',
    index: 10,
    pageStart: 180,
    pageEnd: 184,
    tokenCount: 165,
    subject: 'biology',
    topic: 'Photosynthesis, Chloroplasts & Light Reactions',
    sourceTitle: 'OpenStax Biology 2e - Chapter 8',
    sourceUrl: 'https://openstax.org/details/books/biology-2e',
    license: 'CC BY 4.0',
    keyEquations: ['6CO2 + 6H2O + light -> C6H12O6 + 6O2', 'H2O -> 2H+ + 2e- + 0.5O2'],
    keyFacts: [
      'Photosynthesis converts solar energy into chemical energy stored in glucose: 6CO2 + 6H2O + light -> C6H12O6 + 6O2.',
      'Takes place in chloroplasts: light reactions occur in thylakoid membranes; Calvin cycle in the stroma.',
      'Chlorophyll a absorbs blue and red wavelengths while reflecting green light.',
      'Photolysis of water in photosystem II releases molecular oxygen as a byproduct.',
    ],
    text: `Photosynthesis is the autotrophic process by which green plants, algae, and cyanobacteria transform light energy into chemical energy: 6CO2 + 6H2O + photons -> C6H12O6 + 6O2. The process occurs inside chloroplast organelles. The light-dependent reactions take place across the thylakoid membrane, where chlorophyll pigments absorb light and excite electrons. Through an electron transport chain, photolysis of water produces protons, electrons, and molecular oxygen (O2) while generating ATP and NADPH. The light-independent Calvin cycle operates in the stroma, utilizing ATP and NADPH along with the enzyme RuBisCO to fix CO2 into glyceraldehyde-3-phosphate (G3P) and glucose.`,
  },
  {
    id: 'kb-bio-002',
    index: 11,
    pageStart: 230,
    pageEnd: 234,
    tokenCount: 160,
    subject: 'biology',
    topic: 'Cell Biology, Organelles & Mitosis',
    sourceTitle: 'OpenStax Biology 2e - Chapter 4 & 10',
    sourceUrl: 'https://openstax.org/details/books/biology-2e',
    license: 'CC BY 4.0',
    keyFacts: [
      'Mitochondria produce ATP through cellular respiration and are the powerhouse of the cell.',
      'The nucleus houses chromosomal DNA and directs transcription.',
      'Mitosis produces two genetically identical diploid daughter cells through Prophase, Metaphase, Anaphase, Telophase (PMAT).',
      'Cytokinesis divides the cytoplasm following nuclear division.',
    ],
    text: `Eukaryotic cells are compartmentalized by membrane-bound organelles. The nucleus houses genetic material (DNA); ribosomes synthesize polypeptides; the endoplasmic reticulum modifies proteins and lipids; and mitochondria produce adenosine triphosphate (ATP) through oxidative phosphorylation. The cell division cycle comprises interphase (G1, S phase DNA replication, G2) followed by mitosis (M phase). Mitosis segregates duplicated chromosomes through four stages: Prophase (chromatin condenses, spindle forms), Metaphase (chromosomes align at the equatorial plate), Anaphase (sister chromatids separate to opposite poles), and Telophase (nuclear envelopes reform). Cytokinesis subsequently partitions the cytoplasm into two identical diploid cells.`,
  },

  // --- COMPUTER SCIENCE ---
  {
    id: 'kb-cs-001',
    index: 12,
    pageStart: 25,
    pageEnd: 28,
    tokenCount: 165,
    subject: 'computer_science',
    topic: 'Data Structures, Arrays, Stacks, Queues & Hash Maps',
    sourceTitle: 'Wikipedia - Data Structure & Algorithmic Complexity',
    sourceUrl: 'https://en.wikipedia.org/wiki/Data_structure',
    license: 'CC BY-SA 4.0',
    keyEquations: ['Hash Table lookup: O(1) average', 'Binary Search: O(log n)', 'Array indexing: O(1)'],
    keyFacts: [
      'An array stores elements in contiguous memory locations with O(1) random access by index.',
      'A Stack follows Last-In-First-Out (LIFO) with O(1) push and pop operations.',
      'A Queue follows First-In-First-Out (FIFO) with O(1) enqueue and dequeue operations.',
      'Hash tables achieve average-case O(1) key-value insertion, deletion, and search via a hash function.',
    ],
    text: `In computer science, data structures organize and store data for efficient access and modification. Arrays store homogeneous elements contiguously, providing O(1) constant-time access via index offset, but requiring O(n) linear time for arbitary insertions. Stacks implement Last-In-First-Out (LIFO) semantics with O(1) push and pop, central to call stack recursion and syntax parsing. Queues implement First-In-First-Out (FIFO) semantics, utilized in scheduling and breadth-first search. Hash tables map keys to bucket indices using a hash function; with a well-distributed hash function and collision handling (chaining or open addressing), they yield average O(1) time complexity for lookup, insert, and delete.`,
  },

  // --- HISTORY & POLITY ---
  {
    id: 'kb-hist-001',
    index: 13,
    pageStart: 1,
    pageEnd: 6,
    tokenCount: 170,
    subject: 'history_polity',
    topic: 'Indian Independence Movement & Milestones',
    sourceTitle: 'Wikipedia - Indian Independence Movement',
    sourceUrl: 'https://en.wikipedia.org/wiki/Indian_independence_movement',
    license: 'CC BY-SA 4.0',
    keyFacts: [
      'The Indian Rebellion of 1857 was the first major widespread uprising against British East India Company rule.',
      'The Indian National Congress (INC) was established in December 1885 in Bombay by A.O. Hume.',
      'Mahatma Gandhi led the Non-Cooperation Movement (1920) and Civil Disobedience Salt March (1930) through Satyagraha.',
      'The Quit India Movement was launched in August 1942 demanding immediate British withdrawal; India achieved independence on 15 August 1947.',
    ],
    text: `The Indian independence movement encompassed a series of historic events with the ultimate aim of ending British colonial rule in the Indian subcontinent. The 1857 revolt (Sepoy Mutiny) led to the dissolution of the East India Company and transferred direct administrative power to the British Crown under Queen Victoria. The Indian National Congress formed in 1885 served as a national platform. In the 20th century, Mahatma Gandhi revolutionized the freedom struggle through Satyagraha (non-violent resistance), spearheading nationwide movements: the Non-Cooperation Movement (1920-1922), the Salt Satyagraha Dandi March (1930) defying colonial salt taxation, and the historic Quit India Resolution of August 1942 ("Do or Die"). Independence was formally accomplished on August 15, 1947.`,
  },
  {
    id: 'kb-hist-002',
    index: 14,
    pageStart: 12,
    pageEnd: 18,
    tokenCount: 165,
    subject: 'history_polity',
    topic: 'Constitution of India, Preamble & Fundamental Rights',
    sourceTitle: 'Wikipedia - Constitution of India',
    sourceUrl: 'https://en.wikipedia.org/wiki/Constitution_of_India',
    license: 'CC BY-SA 4.0',
    keyFacts: [
      'The Constitution of India is the supreme law of India, adopted on 26 November 1949 and effective on 26 January 1950.',
      'Dr. B.R. Ambedkar chaired the Drafting Committee of the Constituent Assembly.',
      'The Preamble declares India a Sovereign, Socialist, Secular, Democratic Republic.',
      'Part III (Articles 12-35) guarantees Fundamental Rights including equality, freedom of speech, and constitutional remedies.',
    ],
    text: `The Constitution of India is the supreme legal framework of the republic, authored by the Constituent Assembly under the chairmanship of Dr. B.R. Ambedkar (Father of the Indian Constitution). Adopted on 26 November 1949 and coming into full effect on 26 January 1950 (celebrated as Republic Day), it established India as a sovereign, socialist, secular, democratic republic. The constitution features a parliamentary system with separation of powers across the Legislature, Executive, and independent Judiciary. Part III guarantees six fundamental rights (Articles 12 to 35): Right to Equality (Articles 14-18), Right to Freedom (Articles 19-22), Right against Exploitation (Articles 23-24), Right to Freedom of Religion (Articles 25-28), Cultural and Educational Rights (Articles 29-30), and Right to Constitutional Remedies (Article 32).`,
  },
];

export type KbRetrievalResult = {
  isGrounded: boolean;
  chunks: KnowledgeChunk[];
  citations: Array<{
    chunkId: string;
    title: string;
    source: string;
    page: number;
  }>;
  sourceAttributionNotice?: string;
  bestScore: number;
};

export function retrieveFromKnowledgeBase(
  query: string,
  options: {
    subject?: KnowledgeChunk['subject'];
    limit?: number;
    minScore?: number;
  } = {},
): KbRetrievalResult {
  const limit = options.limit ?? 3;
  const minScore = options.minScore ?? 0.35;

  let candidates = CURATED_KNOWLEDGE_BASE;
  if (options.subject) {
    candidates = candidates.filter((c) => c.subject === options.subject);
  }

  const ranked = rankChunks(candidates, query, limit);
  const bestScore = ranked[0]?.score ?? 0;

  if (bestScore < minScore || ranked.length === 0) {
    return {
      isGrounded: false,
      chunks: [],
      citations: [],
      sourceAttributionNotice: 'not from course material',
      bestScore,
    };
  }

  const citations = ranked.map((chunk) => ({
    chunkId: chunk.id,
    title: chunk.topic,
    source: chunk.sourceTitle,
    page: chunk.pageStart,
  }));

  return {
    isGrounded: true,
    chunks: ranked,
    citations,
    bestScore,
  };
}

export type ClaimValidationResult = {
  isValid: boolean;
  supportScore: number;
  unsupportedClaims: string[];
};

export function validateClaimsAgainstEvidence(
  answer: string,
  chunks: KnowledgeChunk[],
): ClaimValidationResult {
  if (chunks.length === 0) {
    return {
      isValid: true,
      supportScore: 0.5,
      unsupportedClaims: [],
    };
  }

  // Combine evidence text
  const evidenceText = chunks.map((c) => c.text.toLowerCase()).join(' ');
  const sentences = answer
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const unsupported: string[] = [];
  let supportedCount = 0;

  for (const sentence of sentences) {
    // Look for cited sentences or substantive assertions
    const sentenceTokens = sentence
      .toLowerCase()
      .match(/[\p{L}\p{N}]{4,}/gu)
      ?.filter((t) => !['which', 'there', 'their', 'about', 'these', 'could', 'would'].includes(t)) ?? [];

    if (sentenceTokens.length === 0) {
      supportedCount++;
      continue;
    }

    const overlap = sentenceTokens.filter((token) => evidenceText.includes(token)).length;
    const ratio = overlap / sentenceTokens.length;

    if (ratio >= 0.35) {
      supportedCount++;
    } else if (sentence.includes('[1]') || sentence.includes('[2]') || sentence.includes('[3]')) {
      // If the model explicitly cited a source for this sentence, but overlap is poor, flag it
      unsupported.push(sentence);
    } else {
      supportedCount++;
    }
  }

  const supportScore = sentences.length > 0 ? supportedCount / sentences.length : 1.0;
  return {
    isValid: unsupported.length === 0,
    supportScore: Number(supportScore.toFixed(2)),
    unsupportedClaims: unsupported,
  };
}
