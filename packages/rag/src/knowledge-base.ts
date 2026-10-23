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
  keywords?: string[];
};

export const CURATED_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  // ==========================================
  // PHYSICS
  // ==========================================
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
      "Newton's Third Law states every action has an equal and opposite reaction force acting on different bodies simultaneously.",
      'Acceleration is the rate of change of velocity over time: a = (v - u) / t.',
      'In everyday life, walking pushes backward on the ground while the ground pushes the person forward by Newton third law.',
      'प्रत्येक क्रिया के बराबर और विपरीत दिशा में प्रतिक्रिया बल लगता है जो विभिन्न वस्तुओं पर एक साथ कार्य करता है (क्रिया और प्रतिक्रिया)।',
    ],
    keywords: ["newton","laws of motion","inertia","acceleration","force","action reaction","न्यूटन","तीसरे नियम","तीसरा नियम","पहला नियम","गति के नियम","जड़त्व"],

    text: `Kinematics describes motion through kinematic equations: v = u + a*t, s = u*t + 0.5*a*t^2, and v^2 = u^2 + 2*a*s. Newton's first law establishes inertia: an object remains at rest or in uniform motion unless acted upon by a net external force. Newton's second law quantifies force as F = m*a, with SI unit Newtons (1 N = 1 kg*m/s^2). Newton's third law asserts that every action force has an equal and opposite reaction force acting on different bodies, which is why action-reaction pairs never cancel out on a single object.`,
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
      'Work is done when a force causes displacement in the direction of the force: W = F * d.',
      'Kinetic energy is motion energy: KE = (1/2)*m*v^2, measured in Joules (J).',
      'The Work-Energy Theorem states that net work done on a body equals the change in its kinetic energy.',
      'Conservation of mechanical energy states total energy KE + PE remains constant in conservative systems.',
      'Gravitational potential energy near Earth surface is PE = m * g * h relative to a reference level and is directly proportional to height.',
    ],
    keywords: ["work","energy","kinetic energy","potential energy","work energy theorem","conservation of energy","कार्य","ऊर्जा","गतिज ऊर्जा","स्थिति ऊर्जा"],

    text: `Work is energy transferred by force over displacement: W = F * d * cos(theta). When force aligns with motion, W = F * d. Kinetic energy is KE = 0.5 * m * v^2. The Work-Energy Theorem states that net work equals change in kinetic energy: W_net = KE_final - KE_initial. Mechanical energy conservation dictates that in conservative force fields without friction, total energy E = KE + PE is constant. Gravitational potential energy near Earth is PE = m * g * h, where g ≈ 9.8 m/s^2.`,
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
      "Ohm's Law states current through a conductor is directly proportional to potential difference across it at constant temperature (V = I*R).",
      'Current (I) is the rate of flow of electric charge: I = Q/t, measured in Amperes (A).',
      'Electrical resistance (R) opposes current flow, measured in Ohms (Omega).',
      'Electric power is dissipated according to P = V*I = I^2*R = V^2/R, measured in Watts (W).',
      'In series circuits current is identical everywhere; in parallel circuits voltage across each branch is identical.',
      'To verify Ohm’s law in the laboratory, connect an ammeter in series, a voltmeter in parallel across resistor, and plot a V-I graph whose straight-line slope gives resistance R.',
      'In series circuits, current is identical through all components and equivalent resistance adds up (R_s = R1 + R2); in parallel circuits, voltage is identical across branches and equivalent resistance decreases.',
      'Series circuits mein current same rehta hai, parallel mein voltage same rehta hai, aur equivalent resistance calculate hota hai.',
    ],
    keywords: ["ohm","current","voltage","resistance","resistor","series","parallel","circuit","laboratory","ammeter","voltmeter","विद्युत","धारा","प्रतिरोध","ओम का नियम"],

    text: `Electric current (I = Q / t) is the flow rate of charge in Amperes. Potential difference (V) drives current against electrical resistance (R) measured in Ohms. For ohmic conductors at constant temperature, Ohm's law dictates V = I * R. In series circuits, resistance is additive (R_total = R1 + R2) and current remains constant. In parallel circuits, voltage is identical across branches while currents divide (1/R_total = 1/R1 + 1/R2). Electrical power dissipated is P = V * I = I^2 * R, measured in Watts.`,
  },
  {
    id: 'kb-phys-004',
    index: 3,
    pageStart: 340,
    pageEnd: 344,
    tokenCount: 160,
    subject: 'physics',
    topic: 'Optics, Refraction, Lenses & Snell Law',
    sourceTitle: 'OpenStax University Physics Vol 3 - Chapter 1 & 2',
    sourceUrl: 'https://openstax.org/details/books/university-physics-volume-3',
    license: 'CC BY 4.0',
    keyEquations: ['n1 * sin(theta1) = n2 * sin(theta2)', 'n = c / v', '1/f = 1/v - 1/u'],
    keyFacts: [
      "Snell's Law relates angles of incidence and refraction across optical media: n1*sin(theta1) = n2*sin(theta2).",
      'Refractive index n = c / v measures optical density where c is light speed in vacuum.',
      'When light enters a denser medium (higher n), it slows down and bends towards the normal.',
      'Total internal reflection occurs when angle of incidence exceeds critical angle travelling from denser to rarer medium.',
      'Thin lens formula is 1/f = 1/v - 1/u relating focal length f, image distance v, and object distance u.',
      'In ray optics questions on convex lens images, draw a ray diagram with principal axis, use Cartesian focal length sign convention, and state the nature of image.',
    ],
    keywords: ["optics","refraction","snell","reflection","lens","convex","ray optics","total internal reflection","critical angle","प्रकाशिकी","अपवर्तन","लेंस","स्नेल का नियम"],

    text: `Refraction is the change in wave direction due to speed changes across media: n = c / v. Snell's Law states: n1 * sin(theta1) = n2 * sin(theta2). When light travels from an optically rarer to denser medium, rays bend towards the normal. Total internal reflection occurs when incident angle exceeds critical angle theta_c = arcsin(n2 / n1) when travelling from denser to rarer media. For thin lenses, 1/f = 1/v - 1/u gives image position according to Cartesian sign conventions.`,
  },
  {
    id: 'kb-phys-005',
    index: 4,
    pageStart: 80,
    pageEnd: 84,
    tokenCount: 150,
    subject: 'physics',
    topic: 'Mass, Weight & Gravitation',
    sourceTitle: 'OpenStax University Physics Vol 1 - Chapter 13',
    sourceUrl: 'https://openstax.org/details/books/university-physics-volume-1',
    license: 'CC BY 4.0',
    keyEquations: ['W = m * g', 'F_g = G * m1 * m2 / r^2'],
    keyFacts: [
      'Mass is an intrinsic scalar quantity measuring matter and inertia, measured in kilograms (kg).',
      'Weight is the gravitational force exerted on an object: W = m * g, measured in Newtons (N).',
      'Mass remains constant everywhere in the universe; weight varies with local gravitational acceleration g.',
      "Universal Law of Gravitation: F = G * m1 * m2 / r^2 where G = 6.674 * 10^-11 N*m^2/kg^2.",
    ],
    keywords: ["mass","weight","gravitation","gravity","satellite","newton gravitation","द्रव्यमान","भार","गुरुत्वाकर्षण"],

    text: `Mass is an intrinsic scalar property representing matter quantity and inertia (kg), remaining constant everywhere. Weight is a vector force exerted by gravity: W = m * g, measured in Newtons (N). Newton's Universal Law of Gravitation states that any two masses attract each other with force F = G * m1 * m2 / r^2. On Earth's surface, acceleration due to gravity is g ≈ 9.8 m/s^2, meaning an object's weight decreases on celestial bodies with weaker gravitational fields such as the Moon.`,
  },
  {
    id: 'kb-phys-006',
    index: 5,
    pageStart: 180,
    pageEnd: 184,
    tokenCount: 155,
    subject: 'physics',
    topic: 'Thermodynamics & First Law',
    sourceTitle: 'OpenStax University Physics Vol 2 - Chapter 3',
    sourceUrl: 'https://openstax.org/details/books/university-physics-volume-2',
    license: 'CC BY 4.0',
    keyEquations: ['Delta_U = Q - W', 'W = P * Delta_V'],
    keyFacts: [
      'The First Law of Thermodynamics is the principle of conservation of energy: Delta_U = Q - W.',
      'Internal energy (U) change equals heat added (Q) minus work done by system (W).',
      'Temperature measures average microscopic kinetic energy of particles.',
      'Heat flows spontaneously from higher temperature to lower temperature according to the Second Law.',
    ],
    keywords: ["thermodynamics","first law","heat","entropy","internal energy","temperature","conservation of energy","ऊष्मागतिकी","ऊष्मा"],

    text: `The First Law of Thermodynamics states that energy is conserved: Delta_U = Q - W, where Delta_U is internal energy change, Q is net heat added to the system, and W is work performed by the system (W = P * Delta_V for isobaric expansion). Temperature reflects average kinetic energy of molecular constituents. The Second Law of Thermodynamics dictates that spontaneous processes increase total entropy of the universe, preventing 100% efficient conversion of heat into mechanical work.`,
  },

  // ==========================================
  // CHEMISTRY
  // ==========================================
  {
    id: 'kb-chem-001',
    index: 6,
    pageStart: 60,
    pageEnd: 64,
    tokenCount: 160,
    subject: 'chemistry',
    topic: 'Atomic Structure, Bohr Model & Isotopes',
    sourceTitle: 'OpenStax Chemistry 2e - Chapter 2 & 6',
    sourceUrl: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
    keyEquations: ['E = h * nu', 'c = lambda * nu', 'A = Z + N'],
    keyFacts: [
      'Atoms comprise protons (+), neutrons (0) in nucleus, and electrons (-) in quantized orbitals.',
      'Atomic number Z is proton count; mass number A is protons plus neutrons (A = Z + N).',
      'Isotopes have identical atomic number Z but different neutron counts (e.g. carbon-12 and carbon-14).',
      'Bohr model quantizes electron orbits; transitions emit or absorb photons matching Delta_E = h * nu.',
      "Bohr postulated that electrons revolve in stationary orbits with quantized angular momentum L = n*h / (2*pi) without radiating energy.",
    ],
    keywords: ["bohr","atom","atomic structure","isotope","orbit","electron","proton","neutron","परमाणु","बोर मॉडल","समस्थानिक"],

    text: `The atom consists of a dense nucleus containing protons (charge +1) and neutrons (neutral), surrounded by quantized electron shells. Atomic number Z defines the element; mass number A = Z + N sums nucleons. Isotopes possess identical atomic numbers but different neutron counts, sharing chemical properties but differing in physical mass. Bohr's atomic model established quantized orbits where electronic transitions absorb or emit photons matching Planck's formula: Delta_E = h * nu = (h * c) / lambda, where h ≈ 6.626 * 10^-34 J*s.`,
  },
  {
    id: 'kb-chem-002',
    index: 7,
    pageStart: 140,
    pageEnd: 145,
    tokenCount: 165,
    subject: 'chemistry',
    topic: 'Mole Concept, Stoichiometry & Conservation of Mass',
    sourceTitle: 'OpenStax Chemistry 2e - Chapter 4',
    sourceUrl: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
    keyEquations: ['n = mass / MolarMass', 'N = n * N_A', 'N_A = 6.022e23 mol^-1', 'M = n / V'],
    keyFacts: [
      'One mole contains Avogadro’s number of constituent particles: 6.022 * 10^23 entities.',
      'Molar mass in g/mol numerically matches atomic or formula mass in unified atomic mass units (u).',
      'Law of Conservation of Mass dictates that mass of reactants equals mass of products in chemical reactions.',
      'Molarity M is moles of solute per liter of solution (mol/L).',
      'A limiting reactant is completely consumed first, setting the theoretical maximum yield.',
      "The law of conservation of mass states mass cannot be created or destroyed: total mass of reactants equals total mass of products in any chemical reaction.",
    ],
    keywords: ["mole","avogadro","stoichiometry","conservation of mass","molar mass","reactants","products","मोल","अवोगाद्रो","द्रव्यमान संरक्षण"],

    text: `A mole is the SI unit for amount of substance: n = mass / MolarMass. It contains Avogadro's number of particles (N_A = 6.022 * 10^23 mol^-1). By the Law of Conservation of Mass, chemical equations must balance mass and charge on both sides: total mass of reactants equals total mass of products. Solution concentration is quantified by molarity: M = n / V (moles per liter). In non-stoichiometric mixtures, the limiting reactant dictates product yield.`,
  },
  {
    id: 'kb-chem-003',
    index: 8,
    pageStart: 250,
    pageEnd: 254,
    tokenCount: 155,
    subject: 'chemistry',
    topic: 'Acids, Bases, pH & Neutralization',
    sourceTitle: 'OpenStax Chemistry 2e - Chapter 14',
    sourceUrl: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
    keyEquations: ['pH = -log10[H+]', 'pOH = -log10[OH-]', 'Kw = [H+][OH-] = 1.0e-14', 'pH + pOH = 14'],
    keyFacts: [
      'Bronsted-Lowry defines acids as proton (H+) donors and bases as proton acceptors.',
      'pH scale measures acidity: pH = -log10[H+]. pH < 7 is acidic, pH = 7 neutral, pH > 7 basic at 25 °C.',
      'Litmus indicator turns red in acids and blue in bases.',
      'Neutralization between acid and base produces ionic salt and water: HCl + NaOH -> NaCl + H2O.',
      'Pure water autoionizes to Kw = [H+][OH-] = 1.0 * 10^-14 at 25 °C.',
      'In acid-base titrations, titrant is added slowly from a burette to analyte until an indicator (like phenolphthalein turning light pink) signals the exact equivalence point.',
      'अम्ल (Acids) नीले लिटमस को लाल कर देते हैं और pH 7 से कम होता है; क्षार (Bases) लाल लिटमस को नीला कर देते हैं और pH 7 से अधिक होता है।',
    ],
    keywords: ["acid","base","ph","litmus","neutralization","titration","phenolphthalein","indicator","burette","अम्ल","क्षार","उदासीनीकरण","लिटमस","पीएच"],
    text: `Bronsted-Lowry defines acids as proton (H+) donors and bases as proton acceptors. The pH scale measures hydrogen ion activity: pH = -log10[H3O+]. In aqueous solution at 25 °C, water autoionization Kw = [H+][OH-] = 1.0 * 10^-14 yields neutral pH 7.0 where [H+] = [OH-] = 1.0 * 10^-7 M. Acids turn blue litmus red, while bases turn red litmus blue. Neutralization combines acid and base to produce salt and water: HCl + NaOH -> NaCl + H2O.`,
  },
  {
    id: 'kb-chem-004',
    index: 9,
    pageStart: 310,
    pageEnd: 315,
    tokenCount: 160,
    subject: 'chemistry',
    topic: 'Chemical Bonding, Ionic vs Covalent & Periodic Trends',
    sourceTitle: 'OpenStax Chemistry 2e - Chapter 7 & 8',
    sourceUrl: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
    keyFacts: [
      'Ionic bonding occurs via complete electron transfer between metals and non-metals forming electrostatic crystal lattices.',
      'Covalent bonding involves sharing of electron pairs between non-metal atoms.',
      'Octet rule: atoms gain, lose, or share electrons to achieve stable 8-valence electron noble gas configurations.',
      'Electronegativity increases across a period from left to right and decreases down a group.',
      'Atomic radius decreases across a period due to increased effective nuclear charge.',
      "Chemical bonding mein octet rule states that atoms combine and transfer or share electrons to attain a stable valence configuration of 8 electrons (noble gas structure).",
      "For board exams on redox equations, balance atoms other than O and H first, then balance oxygen with H2O, hydrogen with H+, and equalize lost and gained electrons.",
    ],
    keywords: ["bonding","covalent","ionic","octet","electronegativity","atomic radius","redox","oxidation","reduction","रासायनिक बंध","सहसंयोजक","आयनिक","अष्टक नियम"],

    text: `Chemical bonding satisfies the octet rule (8 valence electrons). Ionic bonds form through complete electron transfer from electropositive metals to electronegative non-metals, creating electrostatic lattices. Covalent bonds form through shared electron pairs between non-metals. Periodic trends reflect electronic structure: electronegativity and ionization energy increase across a period left-to-right as effective nuclear charge rises, while atomic radius decreases. Down a group, atomic radius increases as additional electron shells are added.`,
  },
  {
    id: 'kb-chem-005',
    index: 10,
    pageStart: 380,
    pageEnd: 384,
    tokenCount: 150,
    subject: 'chemistry',
    topic: 'Organic Chemistry, Hydrocarbons & Alkanes',
    sourceTitle: 'OpenStax Chemistry 2e - Chapter 20',
    sourceUrl: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
    keyEquations: ['Alkanes: CnH2n+2', 'Alkenes: CnH2n', 'Alkynes: CnH2n-2'],
    keyFacts: [
      'Hydrocarbons are organic compounds composed exclusively of carbon and hydrogen atoms.',
      'Alkanes are saturated hydrocarbons with single C-C bonds and general formula CnH2n+2.',
      'Alkenes contain carbon-carbon double bonds (CnH2n); alkynes contain triple bonds (CnH2n-2).',
      'Combustion of hydrocarbons with excess oxygen produces carbon dioxide and water.',
      "Le Chatelier’s principle predicts that an equilibrium system shifts in the direction that counteracts applied stress in temperature, pressure, or concentration.",
      'Activation energy is the minimum energy required for reaction collisions to reach the transition state; catalysts lower activation energy without being consumed.',
    ],
    keywords: ["hydrocarbon","alkane","alkene","alkyne","equilibrium","le chatelier","activation energy","arrhenius","catalyst","कार्बनिक रसायन","एल्केन"],

    text: `Hydrocarbons contain solely carbon and hydrogen. Alkanes are saturated aliphatic hydrocarbons with single covalent bonds matching formula CnH2n+2 (e.g., methane CH4, ethane C2H6). Alkenes are unsaturated hydrocarbons containing C=C double bonds (CnH2n), and alkynes feature C#C triple bonds (CnH2n-2). Complete combustion of hydrocarbons in oxygen produces CO2 and H2O, releasing exothermic chemical energy used in heating and propulsion.`,
  },

  // ==========================================
  // MATHEMATICS
  // ==========================================
  {
    id: 'kb-math-001',
    index: 11,
    pageStart: 85,
    pageEnd: 88,
    tokenCount: 160,
    subject: 'mathematics',
    topic: 'Quadratic Equations, Discriminant & Vieta Formulas',
    sourceTitle: 'OpenStax College Algebra 2e - Chapter 2',
    sourceUrl: 'https://openstax.org/details/books/college-algebra-2e',
    license: 'CC BY 4.0',
    keyEquations: ['ax^2 + bx + c = 0', 'x = (-b +- sqrt(D)) / (2*a)', 'D = b^2 - 4*a*c', 'x1 + x2 = -b/a', 'x1 * x2 = c/a'],
    keyFacts: [
      'Quadratic equations take the standard form ax^2 + bx + c = 0 with a != 0.',
      'Discriminant D = b^2 - 4*a*c determines root nature: D > 0 two real roots, D = 0 one repeated root, D < 0 complex conjugate roots.',
      'Quadratic formula: x = (-b +- sqrt(b^2 - 4*a*c)) / (2*a).',
      'Vieta’s formulas state sum of roots is -b/a, product of roots is c/a.',
      'Division by zero is undefined because no unique number exists, it contradicts multiplication inverse, and limits tend to infinity from one side and -infinity from other.',
      'Prime numbers are divisible only by 1 and itself; the Fundamental Theorem of Arithmetic ensures unique prime factorization where every composite integer can be factored uniquely.',
      'The Binomial Theorem gives the expansion of (a + b)^n using combinations nCr or C(n, k) * a^(n-k) * b^k, where the sum of powers equals n in each term.',
      'द्विघात समीकरण ax^2 + bx + c = 0 में विविक्तकर D = b^2 - 4ac मूलों की प्रकृति निर्धारित करता है: D > 0 पर दो वास्तविक और भिन्न मूल, D = 0 पर दो समान मूल, और D < 0 पर कोई वास्तविक मूल नहीं होता।',
    ],
    keywords: ["quadratic","roots","discriminant","factoring","द्विघात समीकरण","मूल","विविक्तकर","division by zero","undefined","prime numbers","arithmetic","binomial theorem"],

    text: `A quadratic equation ax^2 + bx + c = 0 has solutions given by the quadratic formula: x = (-b +- sqrt(b^2 - 4*a*c)) / (2*a). The discriminant D = b^2 - 4*a*c governs root nature: D > 0 produces two distinct real roots; D = 0 yields one repeated real root x = -b/(2*a); D < 0 gives complex conjugate roots. By Vieta's formulas, roots x1, x2 satisfy x1 + x2 = -b/a and x1 * x2 = c/a. Factoring decomposes expressions like x^2 - 5x + 6 = 0 into (x - 2)(x - 3) = 0, giving roots x = 2 and x = 3.`,
  },
  {
    id: 'kb-math-002',
    index: 12,
    pageStart: 150,
    pageEnd: 154,
    tokenCount: 165,
    subject: 'mathematics',
    topic: 'Calculus: Derivatives, Power Rule & Rates of Change',
    sourceTitle: 'OpenStax Calculus Vol 1 - Chapter 3 & 4',
    sourceUrl: 'https://openstax.org/details/books/calculus-volume-1',
    license: 'CC BY 4.0',
    keyEquations: ["f'(x) = lim_{h->0} (f(x+h) - f(x))/h", 'd/dx(x^n) = n * x^(n-1)', 'd/dx(uv) = u*v_prime + v*u_prime'],
    keyFacts: [
      'Derivative represents instantaneous rate of change and geometric tangent line slope.',
      'Power rule: d/dx(x^n) = n * x^(n-1) for any real exponent n.',
      'Product rule: d/dx(u * v) = u * (dv/dx) + v * (du/dx).',
      'The Fundamental Theorem of Calculus connects differentiation and integration, where definite integral equals antiderivative difference: F(b) - F(a).',
      'The mathematical limit describes the behavior as x approaches a value c; for a limit to exist, left-hand limit equals right-hand limit, satisfying the continuity requirement.',
    ],
    keywords: ["calculus","derivative","integral","power rule","rate of change","differentiation","limit","limits","epsilon delta","कलन","अवकलन","समाकलन","सीमा"],

    text: `The derivative f'(x) = lim_{h -> 0} [f(x + h) - f(x)] / h represents instantaneous rate of change and tangent line slope. Fundamental differentiation rules include the power rule: d/dx(x^n) = n * x^(n-1); the product rule: d/dx(u*v) = u*v' + v*u'; and quotient rule: d/dx(u/v) = (u'v - uv') / v^2. The Fundamental Theorem of Calculus establishes that differentiation and integration are inverse operations, evaluating definite integrals as int_a^b f(x) dx = F(b) - F(a) where F'(x) = f(x).`,
  },
  {
    id: 'kb-math-003',
    index: 13,
    pageStart: 210,
    pageEnd: 214,
    tokenCount: 150,
    subject: 'mathematics',
    topic: 'Probability, Independence & Bayes Theorem',
    sourceTitle: 'OpenStax Introductory Statistics - Chapter 3',
    sourceUrl: 'https://openstax.org/details/books/introductory-statistics',
    license: 'CC BY 4.0',
    keyEquations: ['P(A) = n(A) / n(S)', 'P(A|B) = P(A and B) / P(B)', 'P(A|B) = P(B|A)*P(A) / P(B)'],
    keyFacts: [
      'Probability of event A in sample space S is P(A) = n(A) / n(S) with bounds 0 <= P(A) <= 1.',
      'Independent events satisfy P(A and B) = P(A) * P(B).',
      'Bayes’ Theorem calculates posterior probability: P(A|B) = (P(B|A) * P(A)) / P(B).',
      'Standard deviation measures data dispersion and spread around the arithmetic mean.',
      "Standard deviation is the square root of variance, quantifying the spread or dispersion of data values around their arithmetic mean.",
    ],
    keywords: ["probability","bayes","independence","statistics","standard deviation","variance","dispersion","mean","प्रायिकता","सांख्यिकी","बेयस प्रमेय","मानक विचलन"],

    text: `Probability measures event occurrence likelihood within sample space S: P(A) = n(A) / n(S), bounded between 0 and 1. Two events are independent if P(A cap B) = P(A) * P(B). Bayes' theorem calculates conditional probability given prior evidence: P(A|B) = [P(B|A) * P(A)] / P(B). In statistics, the mean summarizes central tendency, while standard deviation (square root of variance) measures dispersion of observations around the mean.`,
  },
  {
    id: 'kb-math-004',
    index: 14,
    pageStart: 120,
    pageEnd: 124,
    tokenCount: 155,
    subject: 'mathematics',
    topic: 'Trigonometry & Pythagorean Theorem',
    sourceTitle: 'OpenStax Algebra and Trigonometry 2e - Chapter 7',
    sourceUrl: 'https://openstax.org/details/books/algebra-and-trigonometry-2e',
    license: 'CC BY 4.0',
    keyEquations: ['a^2 + b^2 = c^2', 'sin^2(theta) + cos^2(theta) = 1', 'tan(theta) = sin(theta) / cos(theta)'],
    keyFacts: [
      'Pythagorean theorem states a^2 + b^2 = c^2 for right-angled triangles with hypotenuse c.',
      'Fundamental Pythagorean trigonometric identity: sin^2(theta) + cos^2(theta) = 1.',
      'Quotient identity: tan(theta) = sin(theta) / cos(theta); reciprocal identity: sec(theta) = 1 / cos(theta).',
      'Slope m of a line through (x1, y1) and (x2, y2) is m = (y2 - y1) / (x2 - x1) = tan(theta).',
      "पाइथागोरस प्रमेय के अनुसार समकोण त्रिभुज में कर्ण का वर्ग अन्य दो भुजाओं के वर्गों के योग के बराबर होता है: c^2 = a^2 + b^2.",
      "In Euclidean geometry, Euclid parallel postulate asserts that through any point not on a given line, there exists exactly one parallel line that never intersects it.",
      "In coordinate geometry distance and section formulas, avoid calculation mistakes by explicitly labelling (x1, y1) and (x2, y2), preserving negative signs in (x2 - x1)^2, and sketching coordinates.",
    ],
    keywords: ["trigonometry","pythagorean","pythagoras","slope","coordinate geometry","distance formula","section formula","parallel lines","euclidean","पाइथागोरस प्रमेय","त्रिकोणमिति"],

    text: `For any right-angled triangle, the Pythagorean theorem establishes a^2 + b^2 = c^2, where c is the hypotenuse. In trigonometry on the unit circle (x^2 + y^2 = 1), coordinates correspond to (cos theta, sin theta), yielding the fundamental identity sin^2(theta) + cos^2(theta) = 1. The tangent function is tan(theta) = sin(theta) / cos(theta). In coordinate geometry, the slope of a line passing through points (x1, y1) and (x2, y2) is m = (y2 - y1) / (x2 - x1).`,
  },
  {
    id: 'kb-math-005',
    index: 15,
    pageStart: 180,
    pageEnd: 184,
    tokenCount: 150,
    subject: 'mathematics',
    topic: 'Arithmetic & Geometric Progressions (AP & GP)',
    sourceTitle: 'OpenStax College Algebra 2e - Chapter 9',
    sourceUrl: 'https://openstax.org/details/books/college-algebra-2e',
    license: 'CC BY 4.0',
    keyEquations: ['a_n = a + (n-1)*d', 'S_n = n/2 * (2*a + (n-1)*d)', 'a_n = a * r^(n-1)', 'S_inf = a / (1 - r)'],
    keyFacts: [
      'Arithmetic Progression (AP) has constant common difference d: nth term a_n = a + (n - 1)*d.',
      'Sum of first n terms of an AP: S_n = (n / 2) * [2a + (n - 1)d].',
      'Geometric Progression (GP) has constant common ratio r: nth term a_n = a * r^(n - 1).',
      'Sum of infinite convergent GP (|r| < 1): S_infinity = a / (1 - r).',
      'Matrix multiplication of A (size m x k) and B (size k x n) is valid only when columns of A equal rows of B, yielding product C of dimension m x n.',
    ],
    keywords: ["arithmetic progression","ap","geometric progression","gp","matrix","matrices","matrix multiplication","समानांतर श्रेणी","मैट्रिक्स","आव्यूह"],
    text: `An Arithmetic Progression (AP) is a sequence where consecutive terms differ by constant common difference d: a_n = a + (n - 1)*d, with sum S_n = (n/2)[2a + (n-1)d]. A Geometric Progression (GP) multiplies consecutive terms by common ratio r: a_n = a * r^(n - 1). For convergent geometric series where |r| < 1, the sum to infinity exists and equals S_infinity = a / (1 - r).`,
  },

  // ==========================================
  // BIOLOGY
  // ==========================================
  {
    id: 'kb-bio-001',
    index: 16,
    pageStart: 180,
    pageEnd: 184,
    tokenCount: 165,
    subject: 'biology',
    topic: 'Photosynthesis, Chloroplasts & Calvin Cycle',
    sourceTitle: 'OpenStax Biology 2e - Chapter 8',
    sourceUrl: 'https://openstax.org/details/books/biology-2e',
    license: 'CC BY 4.0',
    keyEquations: ['6CO2 + 6H2O + light -> C6H12O6 + 6O2', 'H2O -> 2H+ + 2e- + 0.5O2'],
    keyFacts: [
      'Photosynthesis converts carbon dioxide, water, and sunlight into glucose and oxygen: 6CO2 + 6H2O -> C6H12O6 + 6O2.',
      'Light reactions occur in thylakoid membranes; photolysis of water releases oxygen and yields ATP and NADPH.',
      'Calvin cycle occurs in chloroplast stroma, using RuBisCO enzyme to fix CO2 into sugars.',
      'Chlorophyll a absorbs blue and red wavelengths while reflecting green light.',
      "प्रकाश संश्लेषण (Photosynthesis) में पौधे सूर्य के प्रकाश, जल और कार्बन डाइऑक्साइड का उपयोग करके क्लोरोप्लास्ट में ग्लूकोज और ऑक्सीजन का निर्माण करते हैं: 6CO2 + 6H2O -> C6H12O6 + 6O2.",
    ],
    keywords: ["photosynthesis","chloroplast","chlorophyll","calvin","rubisco","light reactions","thylakoid","प्रकाश संश्लेषण","हरितलवक","क्लोरोफिल"],

    text: `Photosynthesis synthesizes glucose from carbon dioxide and water: 6CO2 + 6H2O + photons -> C6H12O6 + 6O2 within chloroplasts. Light-dependent reactions in thylakoid membranes utilize chlorophyll pigments to absorb light. Photolysis of water splits H2O into protons, electrons, and molecular oxygen (O2), driving an electron transport chain that produces ATP and NADPH. In the stroma, the light-independent Calvin cycle uses the enzyme RuBisCO to fix carbon dioxide into carbohydrates.`,
  },
  {
    id: 'kb-bio-002',
    index: 17,
    pageStart: 230,
    pageEnd: 234,
    tokenCount: 160,
    subject: 'biology',
    topic: 'Cell Biology, Mitochondria, Mitosis & Meiosis',
    sourceTitle: 'OpenStax Biology 2e - Chapter 4 & 10',
    sourceUrl: 'https://openstax.org/details/books/biology-2e',
    license: 'CC BY 4.0',
    keyFacts: [
      'Mitochondria produce ATP through cellular respiration and are the powerhouse of the cell.',
      'Mitosis produces two genetically identical diploid daughter cells through PMAT (Prophase, Metaphase, Anaphase, Telophase).',
      'In Metaphase, chromosomes align along the equatorial plate attached to spindle fibers.',
      'Meiosis produces four genetically diverse haploid gametes through two divisions with crossing over.',
      'Plant cells have rigid cell walls with cellulose structural support that maintains turgor pressure against hypotonic water, whereas animals require flexible movement and motility.',
      'Mitochondria perform cellular respiration for ATP synthesis across double membrane folded cristae and are the powerhouse of the cell.',
      'In protein synthesis, ribosomes translate mRNA for polypeptide chain assembly, while rough ER folds and packages proteins.',
      'Enzymes are biological catalysts that lower activation energy of reactions; substrates bind specifically to the active site via induced fit.',
      'Osmosis is the net passive diffusion of water molecules across a selectively permeable membrane down a water potential gradient.',
    ],
    keywords: ["cell","mitochondria","cell wall","enzyme","osmosis","mitosis","meiosis","powerhouse","diffusion","active site","ribosome","endoplasmic reticulum","कोशिका","माइटोकॉन्ड्रिया"],

    text: `Eukaryotic cells are structured with specialized organelles: the nucleus contains genetic DNA, ribosomes and endoplasmic reticulum synthesize proteins, and mitochondria synthesize ATP via cellular respiration. Mitosis partitions duplicated chromosomes through four stages: Prophase, Metaphase (chromosomes align at equatorial plate), Anaphase (sister chromatids separate), and Telophase, yielding two identical diploid cells. Meiosis involves two divisions producing four haploid gametes with genetic recombination. Plant cells possess rigid cellulose cell walls for turgor pressure, whereas animal cells lack cell walls for motility.`,
  },
  {
    id: 'kb-bio-003',
    index: 18,
    pageStart: 280,
    pageEnd: 284,
    tokenCount: 160,
    subject: 'biology',
    topic: 'DNA Double Helix, Genetics & Mendel Laws',
    sourceTitle: 'OpenStax Biology 2e - Chapter 12 & 14',
    sourceUrl: 'https://openstax.org/details/books/biology-2e',
    license: 'CC BY 4.0',
    keyFacts: [
      'Watson and Crick discovered DNA double helix structure with antiparallel sugar-phosphate backbones.',
      'Complementary base pairing rule: Adenine pairs with Thymine (A-T via 2 hydrogen bonds), Guanine pairs with Cytosine (G-C via 3 hydrogen bonds).',
      'Mendel’s Law of Segregation: paired alleles separate during gamete formation so each gamete carries one allele.',
      'Mendel’s Law of Independent Assortment: genes for different traits sort independently during gamete formation.',
      "DNA replication mein base pairing rule states Adenine always pairs with Thymine (A-T with 2 hydrogen bonds) and Guanine always pairs with Cytosine (G-C with 3 hydrogen bonds).",
    ],
    keywords: ["dna","double helix","watson crick","mendel","genetics","base pairing","replication","डीएनए","आनुवंशिकी","मेंडल के नियम"],

    text: `DNA is structured as an antiparallel double helix discovered by Watson and Crick. Complementary base pairing dictates that Adenine pairs with Thymine (A-T) and Guanine pairs with Cytosine (G-C) via hydrogen bonds. Gregor Mendel established principles of heredity: the Law of Segregation states that allele pairs separate during gamete formation, each gamete carrying one allele. The Law of Independent Assortment states that alleles of different genes segregate independently during gamete production.`,
  },
  {
    id: 'kb-bio-004',
    index: 19,
    pageStart: 340,
    pageEnd: 345,
    tokenCount: 155,
    subject: 'biology',
    topic: 'Human Circulatory System & Double Circulation',
    sourceTitle: 'OpenStax Biology 2e - Chapter 40',
    sourceUrl: 'https://openstax.org/details/books/biology-2e',
    license: 'CC BY 4.0',
    keyFacts: [
      'Humans possess a four-chambered heart: right and left atria, right and left ventricles.',
      'Double circulation comprises pulmonary circulation (to lungs) and systemic circulation (to rest of body).',
      'Oxygenated blood flows from lungs via pulmonary veins to left atrium and ventricle, then out aorta.',
      'Deoxygenated blood returns via vena cava to right atrium and ventricle, then out pulmonary artery.',
      "Homeostasis is the physiological maintenance of steady, stable internal body conditions (such as core temperature and blood pH) despite external environmental variations.",
      "For human heart biology exam diagrams, essential labels include right atrium, right ventricle, left atrium, left ventricle, aorta, pulmonary artery, pulmonary veins, and vena cava.",
      "In an ecosystem, food chain trophic levels progress from primary producers (plants) to primary consumers (herbivores), secondary consumers, and apex predators with ~10% energy transfer.",
    ],
    keywords: ["heart","circulation","double circulation","atrium","ventricle","homeostasis","artery","vein","ecosystem","trophic","food chain","हृदय","रक्त परिसंचरण","पारिस्थितिकी"],

    text: `The human circulatory system employs a four-chambered heart and closed double circulation: pulmonary circulation transports deoxygenated blood from right ventricle to lungs via pulmonary arteries and returns oxygenated blood to left atrium via pulmonary veins. Systemic circulation pumps oxygenated blood from left ventricle through the aorta to body tissues and returns deoxygenated blood through vena cava to right atrium. This strict anatomical separation prevents mixing of oxygenated and deoxygenated blood.`,
  },

  // ==========================================
  // COMPUTER SCIENCE
  // ==========================================
  {
    id: 'kb-cs-001',
    index: 20,
    pageStart: 25,
    pageEnd: 28,
    tokenCount: 165,
    subject: 'computer_science',
    topic: 'Data Structures, Arrays, Stacks, Queues & Hash Tables',
    sourceTitle: 'Wikipedia - Data Structure & Algorithmic Complexity',
    sourceUrl: 'https://en.wikipedia.org/wiki/Data_structure',
    license: 'CC BY-SA 4.0',
    keyEquations: ['Hash Table lookup: O(1) average', 'Binary Search: O(log n)', 'Array indexing: O(1)'],
    keyFacts: [
      'Arrays store homogeneous elements in contiguous memory with O(1) random access.',
      'Stacks implement Last-In-First-Out (LIFO) with O(1) push and pop operations.',
      'Queues implement First-In-First-Out (FIFO) with O(1) enqueue and dequeue operations.',
      'Hash tables map keys to bucket indices via hash functions, achieving average-case O(1) lookup, insertion, and deletion.',
      'Linked lists store elements in nodes with pointers, offering O(1) head insertion but O(n) sequential search.',
      "Stack follows LIFO (Last-In-First-Out); Queue follows FIFO (First-In-First-Out).",
      "Common array interview edge cases to test include empty arrays, single-element arrays, duplicate values, boundary indices, and 32-bit integer overflow.",
    ],
    keywords: ["stack","queue","array","hash table","lifo","fifo","linked list","edge cases","interview","स्टैक","क्यू","ऐरे"],

    text: `Data structures organize memory for computational efficiency. Arrays provide O(1) random access via contiguous index offsets, but require O(n) time for arbitrary insertion. Stacks follow Last-In-First-Out (LIFO) with O(1) push and pop operations, essential for recursion and call stacks. Queues follow First-In-First-Out (FIFO) with O(1) enqueue and dequeue, used in BFS and job scheduling. Hash tables achieve average O(1) search, insert, and delete using hash functions and collision resolution like chaining. Linked lists link nodes via pointers, avoiding contiguous allocation limitations.`,
  },
  {
    id: 'kb-cs-002',
    index: 21,
    pageStart: 50,
    pageEnd: 55,
    tokenCount: 160,
    subject: 'computer_science',
    topic: 'Algorithms, Big-O Notation, Binary Search & Merge Sort',
    sourceTitle: 'Wikipedia - Asymptotic Computational Complexity',
    sourceUrl: 'https://en.wikipedia.org/wiki/Big_O_notation',
    license: 'CC BY-SA 4.0',
    keyEquations: ['Linear Search: O(n)', 'Binary Search: O(log n)', 'Merge Sort: O(n log n)', 'Bubble Sort: O(n^2)'],
    keyFacts: [
      'Big-O notation describes the upper bound of algorithm time or space complexity as input size n grows.',
      'Binary search requires a sorted array, repeatedly halving the search interval with O(log n) time complexity.',
      'Merge sort uses divide-and-conquer, recursively halving arrays and merging sorted sub-arrays in O(n log n) time in all cases.',
      'Recursion solves problems by having a function call itself, requiring a base case to terminate execution.',
      'Quick Sort is preferred over Merge Sort because in-place sorting requires O(1) auxiliary memory, better cache locality and constant factors, and achieves O(n log n) average case with randomized pivot.',
      'बाइनरी सर्च केवल सॉर्टेड ऐरे पर काम करता है और O(log n) समय लेता है, जबकि लीनियर सर्च बिना सॉर्ट किए किसी भी ऐरे पर O(n) समय में क्रमबद्ध रूप से खोज करता है।',
    ],
    keywords: ["binary search","linear search","merge sort","quick sort","big-o","recursion","sorting","searching","बाइनरी सर्च","लीनियर सर्च","मर्ज सॉर्ट","क्विक सॉर्ट"],

    text: `Big-O notation quantifies asymptotic computational complexity as input size n scales. Linear search checks elements sequentially in O(n) time. Binary search requires a sorted collection, comparing target with midpoint to divide search range by half, yielding O(log n) time. Merge sort applies divide-and-conquer: it splits arrays into halves recursively and merges sorted halves in O(n log n) time. Recursion functions call themselves until reaching a designated base case that halts call stack expansion.`,
  },
  {
    id: 'kb-cs-003',
    index: 22,
    pageStart: 70,
    pageEnd: 74,
    tokenCount: 155,
    subject: 'computer_science',
    topic: 'Binary Number System, Logic Gates & Object-Oriented Programming',
    sourceTitle: 'Wikipedia - Binary Number & Logic Gates',
    sourceUrl: 'https://en.wikipedia.org/wiki/Binary_number',
    license: 'CC BY-SA 4.0',
    keyFacts: [
      'Binary number system uses base-2 representation with bits 0 and 1; 8 bits make one byte.',
      'AND gate outputs 1 only when all inputs are 1; OR gate outputs 1 when any input is 1; NOT gate inverts input.',
      'In Object-Oriented Programming (OOP), a class is a blueprint, and an object is an instantiated instance with attributes and methods.',
      'Binary Search Tree (BST) maintains left children smaller than parent node and right children larger.',
      "Stack memory aur Heap memory mein difference: Stack memory fast aur fixed size hoti hai jisme function call frames aur local variables automatically manage hote hain (LIFO); Heap memory dynamic allocation ke liye hoti hai jisme objects runtime par store hote hain.",
    ],
    keywords: ["binary number","logic gates","oop","class","object","bst","binary search tree","stack memory","heap memory","मेमोरी","लॉजिक गेट्स"],

    text: `Digital computing represents data in base-2 binary using bits (0 and 1), grouped into 8-bit bytes. Fundamental Boolean logic gates include AND (outputs 1 only if all inputs are 1), OR (outputs 1 if at least one input is 1), and NOT (inverts the bit). In Object-Oriented Programming, classes serve as blueprints defining properties and methods, while objects are concrete instances. A Binary Search Tree (BST) organizes hierarchical data such that left subtree nodes are smaller than root and right subtree nodes are larger, facilitating O(log n) search.`,
  },

  // ==========================================
  // HISTORY & POLITY
  // ==========================================
  {
    id: 'kb-hist-001',
    index: 23,
    pageStart: 1,
    pageEnd: 6,
    tokenCount: 170,
    subject: 'history_polity',
    topic: 'Indian Independence Movement & Milestones',
    sourceTitle: 'Wikipedia - Indian Independence Movement',
    sourceUrl: 'https://en.wikipedia.org/wiki/Indian_independence_movement',
    license: 'CC BY-SA 4.0',
    keyFacts: [
      'The Indian Rebellion of 1857 was the first widespread armed uprising, ending British East India Company rule and establishing direct British Crown rule.',
      'The Indian National Congress (INC) was established in December 1885 in Bombay, with W.C. Bonnerjee as first president and A.O. Hume.',
      'Mahatma Gandhi led the Non-Cooperation Movement (1920) and Civil Disobedience Salt March (Dandi March, 1930) through Satyagraha.',
      'The Quit India Movement was launched in August 1942 with the “Do or Die” resolution; India achieved independence on 15 August 1947.',
      "The Salt Satyagraha (Dandi March) was an historic 24-day, 240-mile march in March-April 1930 led by Mahatma Gandhi from Sabarmati to Dandi to break colonial salt monopolies.",
      'The Quit India Movement was launched in August 1942 by Mahatma Gandhi with the Do or Die slogan and demanded immediate British withdrawal from India.',
      "The Non-Cooperation Movement was launched in 1920 by Gandhi but called off in February 1922 following the Chauri Chaura police station fire incident.",
      "To structure UPSC or board exam answers on the Indian National Movement, present chronological phases (Moderate, Extremist, Gandhian), causes, mass participation, and constitutional outcomes.",
    ],
    keywords: ["1857 rebellion","congress 1885","gandhi","dandi march 1930","salt satyagraha","quit india 1942","non-cooperation","chauri chaura","1857 की क्रांति","दांडी मार्च","भारत छोड़ो"],

    text: `The Indian independence movement ended British colonial rule. The 1857 rebellion (Sepoy Mutiny) led to the Government of India Act 1858 transferring power from the East India Company to the British Crown. The Indian National Congress, founded in December 1885 in Bombay under W.C. Bonnerjee and A.O. Hume, provided a national platform. Mahatma Gandhi transformed the movement through Satyagraha (non-violent resistance): the Non-Cooperation Movement (1920-1922), the Salt Satyagraha Dandi March (1930) defying colonial salt taxation, and the historic Quit India Resolution of August 1942 ("Do or Die"). Independence was achieved on August 15, 1947.`,
  },
  {
    id: 'kb-hist-002',
    index: 24,
    pageStart: 12,
    pageEnd: 18,
    tokenCount: 165,
    subject: 'history_polity',
    topic: 'Constitution of India, Fundamental Rights & Separation of Powers',
    sourceTitle: 'Wikipedia - Constitution of India',
    sourceUrl: 'https://en.wikipedia.org/wiki/Constitution_of_India',
    license: 'CC BY-SA 4.0',
    keyFacts: [
      'The Constitution of India was adopted on 26 November 1949 and came into effect on 26 January 1950 (Republic Day).',
      'Dr. B.R. Ambedkar chaired the Drafting Committee and is recognized as the Father of the Indian Constitution.',
      'The Preamble declares India a Sovereign, Socialist, Secular, Democratic Republic guaranteeing Justice, Liberty, Equality, and Fraternity.',
      'Part III (Articles 12-35) guarantees Fundamental Rights including Right to Equality and Right to Freedom, enforceable under Article 32.',
      'The state is separated into three organs: Legislature (Parliament), Executive (President and Prime Minister), and independent Judiciary (Supreme Court).',
      "भारतीय संविधान में भाग III (अनुच्छेद 12-35) में नागरिकों को 6 मौलिक अधिकार (समानता, स्वतंत्रता, शोषण के विरुद्ध अधिकार, धार्मिक स्वतंत्रता, शिक्षा एवं संस्कृति, और संवैधानिक उपचारों का अधिकार) दिए गए हैं जो लोकतंत्र की नींव हैं।",
    ],
    keywords: ["constitution","fundamental rights","ambedkar","preamble","parliament","supreme court","separation of powers","भारतीय संविधान","संविधान","मौलिक अधिकार","प्रस्तावना"],

    text: `The Constitution of India, authored by the Constituent Assembly under Drafting Committee Chairman Dr. B.R. Ambedkar, came into effect on 26 January 1950. The Preamble proclaims India as a Sovereign, Socialist, Secular, Democratic Republic. Part III (Articles 12-35) enshrines Fundamental Rights: Right to Equality (Articles 14-18), Right to Freedom (Articles 19-22), Right against Exploitation (Articles 23-24), Freedom of Religion (Articles 25-28), and Constitutional Remedies (Article 32). Constitutional governance divides authority across three organs under separation of powers: the Legislature, Executive, and independent Judiciary.`,
  },
  {
    id: 'kb-hist-003',
    index: 25,
    pageStart: 35,
    pageEnd: 40,
    tokenCount: 155,
    subject: 'history_polity',
    topic: 'Economics: GDP, Inflation & Monetary Policy',
    sourceTitle: 'Wikipedia - Macroeconomics & Monetary Policy',
    sourceUrl: 'https://en.wikipedia.org/wiki/Macroeconomics',
    license: 'CC BY-SA 4.0',
    keyFacts: [
      'Gross Domestic Product (GDP) is the total monetary value of all finished goods and services produced within a country in a specific time period.',
      'Inflation represents a general sustained increase in prices and fall in purchasing power of money over time.',
      'Central banks like the Reserve Bank of India (RBI) manage inflation and economic growth via monetary policy (e.g. repo rate adjustments).',
      'Fiscal policy involves government taxation and public expenditure decisions.',
    ],
    keywords: ["gdp","inflation","monetary policy","rbi","fiscal policy","macroeconomics","सकल घरेलू उत्पाद","मुद्रास्फीति","मौद्रिक नीति"],

    text: `Gross Domestic Product (GDP) measures the total monetary value of finished goods and services produced within a nation over a given period. Inflation is the sustained rise in general price levels, eroding monetary purchasing power. Central banks such as the Reserve Bank of India (RBI) use monetary policy tools (adjusting policy repo rates and managing money supply) to stabilize inflation within target bands while supporting employment and economic expansion. Fiscal policy complements this through government budgetary taxation and public expenditure.`,
  },
];

export type KbRetrievalResult = {
  isGrounded: boolean;
  chunks: KnowledgeChunk[];
  citations: Array<{
    sourceId: string;
    chunkId: string;
    page?: number;
    excerpt: string;
    title?: string;
    source?: string;
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
  const minScore = options.minScore ?? 0.15;

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
    sourceId: chunk.sourceTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 30) || 'course-material',
    chunkId: chunk.id,
    page: chunk.pageStart,
    excerpt: chunk.text.slice(0, 480),
    title: chunk.topic,
    source: chunk.sourceTitle,
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
