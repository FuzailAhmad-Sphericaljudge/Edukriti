import type {
  AdaptationStrategy,
  CheckpointRubric,
  SpacedRevisionPrompt,
  TeachingLanguage,
} from '@edukriti/contracts';
import { suggestVisualForTopic } from '@edukriti/contracts';

export type ConceptNode = {
  id: string;
  conceptName: string;
  subject: 'physics' | 'chemistry' | 'mathematics' | 'biology' | 'computer_science' | 'history_polity' | 'general';
  prerequisites: string[];
  realWorldExample: {
    english: string;
    hindi: string;
    hinglish: string;
  };
  analogy: {
    english: string;
    hindi: string;
    hinglish: string;
  };
  commonMisconceptions: Array<{
    misconception: string;
    triggerPatterns: string[];
    explanationCorrection: string;
    recommendedStrategy: AdaptationStrategy;
  }>;
  applicationCheckpoint: {
    prompt: {
      english: string;
      hindi: string;
      hinglish: string;
    };
    type: 'application' | 'explain_in_own_words' | 'short_answer';
    keyIdeas: string[];
    passingCriteria: string;
  };
  spacedRevision: SpacedRevisionPrompt[];
  suggestedVisualId?: string;
};

export const CONCEPT_KNOWLEDGE_GRAPH: Record<string, ConceptNode> = {
  // ==========================================
  // PHYSICS: ELECTRICITY & CIRCUITS
  // ==========================================
  electric_charge: {
    id: 'electric_charge',
    conceptName: 'Electric Charge & Current',
    subject: 'physics',
    prerequisites: [],
    realWorldExample: {
      english: 'Static cling when pulling clothes from a dryer or rubbing a balloon against hair.',
      hindi: 'सूखे बालों में कंघी फेरने पर कागज के छोटे टुकड़ों का आकर्षित होना।',
      hinglish: 'Balloon ko sweater par rub karne se electrons transfer hona aur wall par stick ho jana.',
    },
    analogy: {
      english: 'Electric current is like a water pipe: coulombs per second through a wire is like gallons per minute through a pipe.',
      hindi: 'विद्युत धारा एक पाइप में पानी के बहने की दर जैसी है: प्रति सेकंड बहने वाला आवेश।',
      hinglish: 'Current bilkul pipe mein paani ke flow rate jaisa hai: per second kitna charge pass ho raha hai (I = Q / t).',
    },
    commonMisconceptions: [
      {
        misconception: 'Current is consumed or disappears as it moves through a circuit.',
        triggerPatterns: ['current gets used up', 'electrons are consumed', 'less current returns to battery'],
        explanationCorrection: 'Charge is strictly conserved. The same number of electrons entering a resistor exits it; only electrical potential energy is converted.',
        recommendedStrategy: 'new_analogy',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'If a light bulb draws 2 amperes of current for 10 seconds, what happens to the electrons after passing through the bulb filament?',
        hindi: 'यदि एक बल्ब 10 सेकंड के लिए 2 एम्पीयर धारा लेता है, तो फिलामेंट से गुजरने के बाद इलेक्ट्रॉनों का क्या होता है?',
        hinglish: 'Agar ek bulb 10 seconds tak 2A current draw karta hai, toh bulb filament se nikalne ke baad electrons ka kya hota hai?',
      },
      type: 'application',
      keyIdeas: [
        'Electrons are not consumed or destroyed.',
        'Current is conserved before and after the filament.',
        'Only electric potential energy is converted into light and heat.',
      ],
      passingCriteria: 'Student must state that charge/electrons continue flowing back to the battery and only energy is transformed.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Electric Charge & Current',
        prompt: 'State the formula relating charge, current, and time, and explain why current is conserved in a closed circuit.',
        format: 'concept_check',
      },
      {
        intervalDays: 3,
        concept: 'Electric Charge & Current',
        prompt: 'Calculate the total charge that passes through a wire in 2 minutes when current is 0.5 A.',
        format: 'quick_problem',
      },
    ],
    suggestedVisualId: 'circuit-builder-dc',
  },

  voltage_potential: {
    id: 'voltage_potential',
    conceptName: 'Voltage & Electric Potential Difference',
    subject: 'physics',
    prerequisites: ['electric_charge'],
    realWorldExample: {
      english: 'A water tower on a rooftop creating high pressure so tap water flows quickly downstairs.',
      hindi: 'छत पर रखी पानी की टंकी जो ऊंचाई के कारण नीचे नलों में तेज दबाव पैदा करती है।',
      hinglish: 'Rooftop water tank ki height jo tap mein strong pressure banati hai, waise hi battery voltage charge ko push karta hai.',
    },
    analogy: {
      english: 'Voltage is electrical pressure: the pump that gives energy to electrons to move between two terminals.',
      hindi: 'वोल्टेज विद्युत दबाव (इलेक्ट्रिकल प्रेशर) है जो इलेक्ट्रॉनों को परिपथ में धक्का देता है।',
      hinglish: 'Voltage ek electrical pump hai jo charges ko circuit mein aage push karne ke liye potential energy deta hai.',
    },
    commonMisconceptions: [
      {
        misconception: 'Voltage and current are the same thing.',
        triggerPatterns: ['voltage is current', 'volts flow through wires', 'high voltage means high flow always'],
        explanationCorrection: 'Voltage is the push (potential difference between two points), while current is the actual flow rate of charges driven by that push.',
        recommendedStrategy: 'worked_example',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'A disconnected 9V battery sits on a table. Does it possess voltage? Does it possess current? Explain why.',
        hindi: 'एक 9V की बैटरी मेज पर अलग रखी है। क्या इसमें वोल्टेज है? क्या इसमें करंट है? कारण बताइए।',
        hinglish: 'Ek disconnected 9V battery table par rakhi hai. Kya isme voltage hai? Kya isme current hai? Why?',
      },
      type: 'application',
      keyIdeas: [
        'The battery has 9V potential difference between terminals.',
        'No current flows because the circuit is open (infinite resistance).',
        'Voltage exists without current, but current requires voltage and a closed loop.',
      ],
      passingCriteria: 'Student must identify that voltage is present across terminals but current is zero without a closed circuit.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Voltage & Electric Potential Difference',
        prompt: 'Distinguish between voltage (potential difference) and current in a circuit.',
        format: 'flashcard',
      },
      {
        intervalDays: 7,
        concept: 'Voltage & Electric Potential Difference',
        prompt: 'Explain what happens to voltage across a dead battery compared to a fresh battery.',
        format: 'concept_check',
      },
    ],
    suggestedVisualId: 'circuit-builder-dc',
  },

  ohms_law: {
    id: 'ohms_law',
    conceptName: 'Ohm’s Law & Electrical Resistance',
    subject: 'physics',
    prerequisites: ['electric_charge', 'voltage_potential'],
    realWorldExample: {
      english: 'Electric toaster wires glowing red because high resistance converts electrical work into thermal heat.',
      hindi: 'इलेक्ट्रिक हीटर या टोस्टर के तार का लाल गर्म होना क्योंकि उच्च प्रतिरोध विद्युत ऊर्जा को ऊष्मा में बदलता है।',
      hinglish: 'Electric room heater ki coils jo high resistance ki wajah se glowing red hot ho jaati hain.',
    },
    analogy: {
      english: 'Imagine a water pipe with rocks inside: higher pressure (V) pushes more water, but dense rocks (R) impede the flow rate (I).',
      hindi: 'एक संकरी नली जिसमें कंकड़ भरे हों: जितना अधिक दबाव (V) उतना अधिक प्रवाह, परंतु कंकड़ (R) प्रवाह को धीमा करते हैं।',
      hinglish: 'Water pipe mein constriction: voltage water pressure hai aur resistance pipe ki narrowness hai jo current ko limit karti hai.',
    },
    commonMisconceptions: [
      {
        misconception: 'Increasing voltage will increase resistance according to R = V / I.',
        triggerPatterns: ['increasing voltage increases resistance', 'resistance depends on voltage', 'r changes with v'],
        explanationCorrection: 'For ohmic conductors at constant temperature, resistance R is an intrinsic physical property determined by material resistivity, length, and cross-sectional area (R = rho * L / A), not by applied voltage.',
        recommendedStrategy: 'visual_walkthrough',
      },
      {
        misconception: 'Resistors use up electrons.',
        triggerPatterns: ['resistor destroys electrons', 'less current after resistor'],
        explanationCorrection: 'Resistors impede charge velocity, creating potential drop, but current entering equals current exiting.',
        recommendedStrategy: 'simpler_prerequisite',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'If a 12V automotive battery is connected to a 3Ω lamp, calculate the current. If the battery is upgraded to 24V, what happens to the resistance and the current?',
        hindi: 'यदि 12V की बैटरी 3Ω के लैंप से जुड़ी है, तो धारा की गणना करें। यदि बैटरी को 24V कर दिया जाए, तो प्रतिरोध और धारा पर क्या प्रभाव पड़ेगा?',
        hinglish: 'Agar 12V battery 3 ohm lamp se judi hai, toh current calculate karo. Agar voltage badha kar 24V kar dein, toh resistance aur current par kya farak padega?',
      },
      type: 'application',
      keyIdeas: [
        'Initial current: I = 12 / 3 = 4 A.',
        'Resistance remains 3Ω because physical properties of the lamp did not change.',
        'New current at 24V: I = 24 / 3 = 8 A (doubles with voltage).',
      ],
      passingCriteria: 'Student must calculate 4A, identify that resistance remains constant at 3Ω, and calculate the new current as 8A.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Ohm’s Law & Electrical Resistance',
        prompt: 'State Ohm’s law formula and define what physical properties determine resistance.',
        format: 'concept_check',
      },
      {
        intervalDays: 3,
        concept: 'Ohm’s Law & Electrical Resistance',
        prompt: 'Calculate the resistance of a heating element that draws 5A from a 230V household supply.',
        format: 'quick_problem',
      },
      {
        intervalDays: 7,
        concept: 'Ohm’s Law & Electrical Resistance',
        prompt: 'Explain why doubling wire length doubles resistance, but doubling wire diameter cuts resistance by four.',
        format: 'concept_check',
      },
    ],
    suggestedVisualId: 'circuit-builder-dc',
  },

  // ==========================================
  // PHYSICS: NEWTON'S LAWS & MECHANICS
  // ==========================================
  newtons_first_law: {
    id: 'newtons_first_law',
    conceptName: 'Newton’s First Law & Inertia',
    subject: 'physics',
    prerequisites: [],
    realWorldExample: {
      english: 'Passengers lurching forward when a fast-moving bus suddenly slams on the brakes.',
      hindi: 'चलती बस के अचानक रुकने पर यात्रियों का आगे की ओर झुक जाना।',
      hinglish: 'Car mein sudden brake lagane par passengers ka aage jerk khana aur seatbelt ka engage hona.',
    },
    analogy: {
      english: 'Inertia is mechanical laziness: matter stubbornly resists any change to its current state of motion unless kicked by an outside net force.',
      hindi: 'जड़त्व (Inertia) वस्तु का वह स्वभाव है जिससे वह अपनी विराम या गति की अवस्था में परिवर्तन का विरोध करती है।',
      hinglish: 'Inertia object ka natural nature hai: rest par hai toh rest par hi rahegi, motion mein hai toh constant speed par chalti rahegi.',
    },
    commonMisconceptions: [
      {
        misconception: 'A continuous force is required to keep an object moving at constant speed.',
        triggerPatterns: ['force needed to keep moving', 'without force motion stops', 'objects naturally come to rest'],
        explanationCorrection: 'In the absence of net external forces like friction or air drag, an object in motion continues at constant velocity forever without any applied force.',
        recommendedStrategy: 'new_analogy',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'A deep-space exploration probe turns off its propulsion engines after clearing planetary gravity. Describe its motion over the next thousand years.',
        hindi: 'एक अंतरिक्ष यान गुरुत्वाकर्षण क्षेत्र से बाहर निकलने के बाद अपने इंजन बंद कर देता है। अगले हजार वर्षों में उसकी गति कैसी होगी?',
        hinglish: 'Deep space probe planets se door jaane ke baad apne engines shut down kar deta hai. Agle 1000 saal tak uski motion kaisi rahegi?',
      },
      type: 'application',
      keyIdeas: [
        'Net external force is zero in deep space.',
        'The probe continues in a straight line at constant velocity indefinitely.',
        'No fuel or force is required to sustain steady motion.',
      ],
      passingCriteria: 'Student must state that the probe continues moving with constant velocity in a straight line because net force is zero.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Newton’s First Law & Inertia',
        prompt: 'State Newton’s First Law and explain why seatbelts are mandatory in vehicles.',
        format: 'concept_check',
      },
      {
        intervalDays: 7,
        concept: 'Newton’s First Law & Inertia',
        prompt: 'Why does an ice hockey puck glide much farther than a rubber ball on grass?',
        format: 'flashcard',
      },
    ],
    suggestedVisualId: 'projectile-motion-lab',
  },

  newtons_second_law: {
    id: 'newtons_second_law',
    conceptName: 'Newton’s Second Law: F = m * a',
    subject: 'physics',
    prerequisites: ['newtons_first_law'],
    realWorldExample: {
      english: 'Pushing an empty shopping cart accelerates easily, while pushing a cart loaded with 50 kg of groceries requires massive effort.',
      hindi: 'खाली ठेले को धक्का देना आसान होता है, परंतु भारी सामान से लदे ठेले को त्वरित करने के लिए बहुत अधिक बल लगाना पड़ता है।',
      hinglish: 'Khali shopping cart ko push karna aasan hai, par heavy cart ko accelerate karne ke liye zyada force lagana padta hai.',
    },
    analogy: {
      english: 'Mass is resistance to acceleration: for the same engine horse-power, a lightweight sports car accelerates dramatically faster than an 18-wheeler truck.',
      hindi: 'द्रव्यमान त्वरण का विरोध है: समान बल लगाने पर हल्की कार भारी ट्रक की तुलना में तेजी से गति पकड़ती है।',
      hinglish: 'Same force par light object fast accelerate karega aur heavy object slow (a = F / m).',
    },
    commonMisconceptions: [
      {
        misconception: 'Heavier objects accelerate faster in free-fall.',
        triggerPatterns: ['heavy objects fall faster', 'gravity pulls heavy things faster', 'more mass means higher g'],
        explanationCorrection: 'Free fall acceleration g is independent of mass: although gravitational force is larger (F = m * g), the mass resisting acceleration is equally larger (a = F / m = g).',
        recommendedStrategy: 'worked_example',
      },
      {
        misconception: 'Force is an internal property stored in moving bodies that runs out over time.',
        triggerPatterns: ['force stored in', 'runs out over time', 'force is an internal property', 'moving bodies store force'],
        explanationCorrection: 'Force is an external interaction exerted on an object that produces acceleration (F = ma), not a consumable substance stored inside it.',
        recommendedStrategy: 'new_analogy',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'A 1000 kg car accelerates from rest at 2.5 m/s². Calculate the net forward force. If the car is loaded with 500 kg cargo, what new force is required to maintain the same acceleration?',
        hindi: '1000 kg की कार 2.5 m/s² से त्वरित होती है। नेट बल की गणना करें। यदि 500 kg भार जोड़ दिया जाए, तो वही त्वरण बनाए रखने के लिए कितने बल की आवश्यकता होगी?',
        hinglish: 'Ek 1000 kg car 2.5 m/s² se accelerate hoti hai. Net force calculate karo. Agar 500 kg cargo add kar dein, toh same acceleration ke liye kitna force chahiye?',
      },
      type: 'application',
      keyIdeas: [
        'Initial force: F = 1000 * 2.5 = 2500 N.',
        'Total mass with cargo: m = 1500 kg.',
        'New force: F = 1500 * 2.5 = 3750 N.',
      ],
      passingCriteria: 'Student must calculate 2500 N for empty car and 3750 N for loaded car using F = ma.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Newton’s Second Law: F = m * a',
        prompt: 'State Newton’s Second Law formula and units of force, mass, and acceleration.',
        format: 'flashcard',
      },
      {
        intervalDays: 3,
        concept: 'Newton’s Second Law: F = m * a',
        prompt: 'Calculate the acceleration produced when a 30N force acts on a 6kg mass.',
        format: 'quick_problem',
      },
    ],
    suggestedVisualId: 'projectile-motion-lab',
  },

  pendulum_harmonic_motion: {
    id: 'pendulum_harmonic_motion',
    conceptName: 'Simple Harmonic Motion & The Pendulum',
    subject: 'physics',
    prerequisites: ['newtons_second_law'],
    realWorldExample: {
      english: 'The rhythmic tick-tock pacing of grandfather clocks and playground swings.',
      hindi: 'दीवार घड़ी के लोलक (पेंडुलम) की नियमित टिक-टिक गति और झूले का दोलन।',
      hinglish: 'Grandfather clock ka pendulum jo regular timekeeping ke liye periodic oscillations execute karta hai.',
    },
    analogy: {
      english: 'A pendulum is an energy currency exchange: gravity converts maximum potential energy at the peak into maximum kinetic speed at the bottom, repeating forever without friction.',
      hindi: 'लोलक ऊर्जा के निरंतर आदान-प्रदान जैसा है: उच्चतम बिंदु पर स्थितिज ऊर्जा और मध्य बिंदु पर गतिज ऊर्जा।',
      hinglish: 'Pendulum energy conversion cycle execute karta hai: peak par potential energy, bottom par maximum kinetic energy.',
    },
    commonMisconceptions: [
      {
        misconception: 'Heavier pendulum bobs oscillate with a shorter time period.',
        triggerPatterns: ['heavier pendulum swings faster', 'mass changes pendulum period', 'heavy bob shorter period'],
        explanationCorrection: 'For small amplitudes, pendulum period depends solely on length and gravitational acceleration: T = 2π√(L/g). Mass cancels out completely.',
        recommendedStrategy: 'interactive',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'A grandfather clock pendulum has its string length quadrupled (multiplied by 4). How does the period of swing T change?',
        hindi: 'एक सरल लोलक की लंबाई 4 गुना कर दी जाती है। उसके आवर्तकाल (Period T) में क्या परिवर्तन होगा?',
        hinglish: 'Ek simple pendulum ki length 4 guna badha di jaaye, toh uske oscillation time period T par kya asar padega?',
      },
      type: 'application',
      keyIdeas: [
        'Time period is governed by T = 2π√(L/g).',
        'Length L is quadrupled: √(4) = 2.',
        'The period doubles: T becomes 2 times larger.',
      ],
      passingCriteria: 'Student must state that the period doubles because period is proportional to the square root of length.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Simple Harmonic Motion & The Pendulum',
        prompt: 'State the formula for pendulum period T and explain why mass does not affect the swing time.',
        format: 'concept_check',
      },
      {
        intervalDays: 7,
        concept: 'Simple Harmonic Motion & The Pendulum',
        prompt: 'What happens to a pendulum’s period if taken to the Moon where g is 1/6th of Earth’s gravity?',
        format: 'quick_problem',
      },
    ],
    suggestedVisualId: 'pendulum-harmonic-lab',
  },

  // ==========================================
  // CHEMISTRY: BONDING & STRUCTURE
  // ==========================================
  octet_rule_bonding: {
    id: 'octet_rule_bonding',
    conceptName: 'Octet Rule & Chemical Stability',
    subject: 'chemistry',
    prerequisites: [],
    realWorldExample: {
      english: 'Noble gases like Helium and Neon never tarnish or corrode because their valence electron shells are completely filled.',
      hindi: 'उत्कृष्ट गैसें (हीलियम, नियॉन) अक्रिय होती हैं क्योंकि उनकी बाहरी कक्षा इलेक्ट्रॉनों से पूर्णतः भरी होती है।',
      hinglish: 'Neon aur Argon gases chemical reactions mein participate nahi karti kyunki unka valence shell already stable octet (8 electrons) rakhta hai.',
    },
    analogy: {
      english: 'The octet rule is like a complete 8-passenger van: atoms are chemically restless and reactive until every seat in their valence shell is stably occupied.',
      hindi: 'अष्टक नियम स्थिर बैठने की व्यवस्था जैसा है: परमाणु 8 संयोजी इलेक्ट्रॉन प्राप्त करके उत्कृष्ट गैस जैसी स्थिरता चाहते हैं।',
      hinglish: 'Octet rule stability target hai: atoms electrons transfer ya share karke 8 valence electrons achieve karna chahte hain.',
    },
    commonMisconceptions: [
      {
        misconception: 'All elements without exception must obey the octet rule.',
        triggerPatterns: ['all atoms need 8', 'octet rule has no exceptions', 'hydrogen needs 8 electrons'],
        explanationCorrection: 'Hydrogen and Helium obey the duplet rule (2 electrons). Expanded octets occur in period 3+ non-metals (e.g. SF6, PCl5) utilizing d-orbitals.',
        recommendedStrategy: 'worked_example',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'Explain why Sodium (Na, atomic number 11) readily gives up an electron while Chlorine (Cl, atomic number 17) eagerly accepts one.',
        hindi: 'समझाइए कि सोडियम (Na, परमाणु क्रमांक 11) आसानी से एक इलेक्ट्रॉन क्यों त्यागता है जबकि क्लोरीन (Cl, 17) एक इलेक्ट्रॉन ग्रहण करता है?',
        hinglish: 'Explain karo ki Sodium (Na) easily ek electron kyu loose karta hai aur Chlorine (Cl) ek electron kyu gain karta hai?',
      },
      type: 'explain_in_own_words',
      keyIdeas: [
        'Sodium has electronic configuration 2,8,1; losing 1 electron yields stable noble gas configuration (2,8).',
        'Chlorine has configuration 2,8,7; gaining 1 electron completes octet (2,8,8).',
        'Both atoms attain lower energy and chemical stability matching noble gases.',
      ],
      passingCriteria: 'Student must mention valence electron configurations (1 for Na, 7 for Cl) and achieving 8 valence electrons.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Octet Rule & Chemical Stability',
        prompt: 'State the octet rule and name two elements that form stable molecules with only 2 valence electrons.',
        format: 'flashcard',
      },
      {
        intervalDays: 7,
        concept: 'Octet Rule & Chemical Stability',
        prompt: 'Compare electronic stability of Magnesium ion (Mg²⁺) and Oxide ion (O²⁻).',
        format: 'concept_check',
      },
    ],
    suggestedVisualId: 'molecule-viewer-3d',
  },

  ionic_vs_covalent: {
    id: 'ionic_vs_covalent',
    conceptName: 'Ionic vs Covalent Bonding',
    subject: 'chemistry',
    prerequisites: ['octet_rule_bonding'],
    realWorldExample: {
      english: 'Table salt (NaCl) forms rigid high-melting crystals, while cooking oil and water are liquids held by covalent bonds.',
      hindi: 'साधारण नमक (NaCl) कठोर क्रिस्टल बनाता है, जबकि पानी (H2O) और तेल सहसंयोजक बंधों द्वारा बने होते हैं।',
      hinglish: 'Table salt (NaCl) high melting point ionic crystal hai, jabki water (H2O) covalent bond se banta hai.',
    },
    analogy: {
      english: 'Ionic bonding is a custody transfer (one atom takes the electron, creating opposite charges that attract); covalent bonding is a shared custody agreement (both atoms share electron pairs).',
      hindi: 'आयनिक बंध इलेक्ट्रॉन का पूर्ण दान है; सहसंयोजक बंध इलेक्ट्रॉनों की आपसी साझेदारी है।',
      hinglish: 'Ionic bond mein electron complete transfer hota hai (like lending money); covalent bond mein electron pairs share hote hain (like a joint account).',
    },
    commonMisconceptions: [
      {
        misconception: 'Covalent bonds conduct electricity in water just like ionic salts.',
        triggerPatterns: ['covalent solutions conduct', 'sugar conducts electricity', 'all dissolved chemicals conduct'],
        explanationCorrection: 'Ionic compounds dissociate into mobile solvated ions (cations and anions) that carry electric charge; neutral molecular covalent substances (like glucose) do not form ions and cannot conduct.',
        recommendedStrategy: 'visual_walkthrough',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'Why does solid table salt (NaCl) not conduct electricity, but dissolving it in water makes the solution an excellent electrical conductor?',
        hindi: 'ठोस नमक (NaCl) विद्युत का सुचालक क्यों नहीं होता, परंतु पानी में घोलने पर वह उत्कृष्ट चालक क्यों बन जाता है?',
        hinglish: 'Solid NaCl electricity conduct kyu nahi karta, lekin paani mein dissolve karne par strong conductor kyu ban jaata hai?',
      },
      type: 'application',
      keyIdeas: [
        'Solid NaCl has ions locked firmly in rigid crystal lattice with zero mobility.',
        'Water breaks electrostatic lattice, allowing Na⁺ and Cl⁻ ions to move freely.',
        'Electrical conduction in liquids requires mobile charged ions.',
      ],
      passingCriteria: 'Student must mention that ions are immobilized in solid crystal but free to move when dissolved in water.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Ionic vs Covalent Bonding',
        prompt: 'Contrast ionic and covalent bonds in terms of electron transfer vs sharing, and their typical melting points.',
        format: 'concept_check',
      },
      {
        intervalDays: 3,
        concept: 'Ionic vs Covalent Bonding',
        prompt: 'Classify each as ionic or covalent: KCl, CH4, MgO, CO2.',
        format: 'quick_problem',
      },
    ],
    suggestedVisualId: 'molecule-viewer-3d',
  },

  acid_base_titration: {
    id: 'acid_base_titration',
    conceptName: 'Acid-Base Titration & Neutralization',
    subject: 'chemistry',
    prerequisites: ['ionic_vs_covalent'],
    realWorldExample: {
      english: 'Taking Milk of Magnesia (Mg(OH)2) to neutralize excess stomach hydrochloric acid.',
      hindi: 'पेट में अम्लता (Acidity) होने पर एंटासिड (Mg(OH)₂) द्वारा अतिरिक्त हाइड्रोक्लोरिक अम्ल का उदासीनीकरण।',
      hinglish: 'Stomach acidity neutralize karne ke liye antacid tablets lena jisme hydroxide ions acid ke H+ ions ko neutralize karte hain.',
    },
    analogy: {
      english: 'Titration is an exact chemical currency exchange: one mole of H⁺ ions from the acid pairs with exactly one mole of OH⁻ ions from the base to produce neutral water (H₂O) and salt.',
      hindi: 'उदासीनीकरण रासायनिक बराबरी का विनिमय है: अम्ल का प्रत्येक H⁺ आयन क्षार के OH⁻ आयन से मिलकर जल बनाता है।',
      hinglish: 'Titration stoichiometric balancing hai: 1 mole H+ acid exactly 1 mole OH- base ke sath combine hokar pure water banata hai.',
    },
    commonMisconceptions: [
      {
        misconception: 'The equivalence point of every acid-base titration is always at exactly pH 7.',
        triggerPatterns: ['equivalence point always 7', 'titration always ends at pH 7', 'neutral means pH 7'],
        explanationCorrection: 'The equivalence point is pH 7 only for strong acid-strong base titrations; weak acid-strong base equivalence points are basic (pH > 7) due to conjugate base hydrolysis.',
        recommendedStrategy: 'worked_example',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'A student titrates 25.0 mL of 0.20 M HCl using 0.10 M NaOH. What volume of NaOH solution in mL is required to reach the equivalence point?',
        hindi: 'एक छात्र 25.0 mL 0.20 M HCl को 0.10 M NaOH से अनुमापित करता है। तुल्यता बिंदु तक पहुँचने के लिए कितने mL NaOH की आवश्यकता होगी?',
        hinglish: '25.0 mL of 0.20 M HCl ko neutralize karne ke liye 0.10 M NaOH ka kitna volume (mL) lagega?',
      },
      type: 'application',
      keyIdeas: [
        'Monoprotic neutralization formula: M_acid * V_acid = M_base * V_base.',
        'Moles of HCl = 0.20 M * 25.0 mL = 5.0 millimoles.',
        'Volume of NaOH needed = 5.0 mmol / 0.10 M = 50.0 mL.',
      ],
      passingCriteria: 'Student must calculate 50 mL (or 50.0 mL) using molarity and volume stoichiometry.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Acid-Base Titration & Neutralization',
        prompt: 'State the difference between the equivalence point and the endpoint of a titration.',
        format: 'concept_check',
      },
      {
        intervalDays: 7,
        concept: 'Acid-Base Titration & Neutralization',
        prompt: 'Why does phenolphthalein turn pink during a base titration, and what is its pH transition range?',
        format: 'flashcard',
      },
    ],
    suggestedVisualId: 'acid-base-titration-lab',
  },

  // ==========================================
  // MATHEMATICS: QUADRATICS & DISCRIMINANT
  // ==========================================
  quadratic_discriminant: {
    id: 'quadratic_discriminant',
    conceptName: 'Quadratic Equations & The Discriminant',
    subject: 'mathematics',
    prerequisites: [],
    realWorldExample: {
      english: 'Calculating whether a launched basketball will reach a 10-foot hoop height (real roots) or fall short (no real roots).',
      hindi: 'फुटबॉल की प्रक्षेप्य गति में यह जांचना कि क्या गेंद गोल पोस्ट की ऊंचाई को पार करेगी या नहीं।',
      hinglish: 'Basketball throw ka trajectory model: kya ball 10ft rim height reach karegi (real solution) ya reach nahi kar sakti.',
    },
    analogy: {
      english: 'The discriminant D = b^2 - 4ac is a traffic signal under the square root: green (D > 0) means two real roots, yellow (D = 0) means one boundary root, red (D < 0) means roots cross into imaginary territory.',
      hindi: 'विविक्तकर D = b² - 4ac वर्गमूल के भीतर ट्रैफिक सिग्नल जैसा है: D > 0 पर दो वास्तविक मूल, D = 0 पर एक दोहरा मूल, D < 0 पर कोई वास्तविक मूल नहीं।',
      hinglish: 'Discriminant D = b² - 4ac decide karta hai parabola x-axis ko 2 points par cut karega (D>0), touch karega (D=0), ya float karega (D<0).',
    },
    commonMisconceptions: [
      {
        misconception: 'When D < 0, the equation has no solutions whatsoever.',
        triggerPatterns: ['no solution when negative', 'cannot solve D < 0', 'impossible equation'],
        explanationCorrection: 'When D < 0, the equation has no REAL roots, but possesses exactly two complex conjugate roots involving imaginary unit i = sqrt(-1).',
        recommendedStrategy: 'worked_example',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'Examine the quadratic equation 2x² - 4x + 5 = 0. Compute the discriminant D and state the geometric nature of the corresponding parabola relative to the x-axis.',
        hindi: 'समीकरण 2x² - 4x + 5 = 0 की जांच करें। विविक्तकर D का मान ज्ञात करें और बताएं कि परवलय x-अक्ष को काटेगा या नहीं।',
        hinglish: 'Quadratic equation 2x² - 4x + 5 = 0 ka discriminant D compute karo aur batao parabola x-axis ko intersect karega ya nahi.',
      },
      type: 'application',
      keyIdeas: [
        'Compute D = b² - 4ac = (-4)² - 4(2)(5) = 16 - 40 = -24.',
        'Since D < 0, there are no real roots (two complex conjugate roots).',
        'Geometrically, the parabola opens upward (a > 0) and stays entirely above the x-axis without touching or crossing it.',
      ],
      passingCriteria: 'Student must calculate D = -24, state no real roots, and conclude the parabola does not touch or intersect the x-axis.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Quadratic Equations & The Discriminant',
        prompt: 'State the quadratic formula and what D > 0, D = 0, D < 0 signify for roots.',
        format: 'flashcard',
      },
      {
        intervalDays: 3,
        concept: 'Quadratic Equations & The Discriminant',
        prompt: 'Find the value of k for which x² + kx + 9 = 0 has equal real roots.',
        format: 'quick_problem',
      },
    ],
    suggestedVisualId: 'quadratic-parabola-explorer',
  },

  // ==========================================
  // BIOLOGY: PHOTOSYNTHESIS & CELLS
  // ==========================================
  photosynthesis_light_reactions: {
    id: 'photosynthesis_light_reactions',
    conceptName: 'Photosynthesis & Chloroplast Reactions',
    subject: 'biology',
    prerequisites: [],
    realWorldExample: {
      english: 'Solar panels converting photons into electrical charge stored in lithium batteries, just like thylakoids store photon energy in ATP and NADPH.',
      hindi: 'सोलर पैनल का सूर्य के प्रकाश को बिजली में बदलना, जैसे पत्तियां प्रकाश ऊर्जा को ATP में संचित करती हैं।',
      hinglish: 'Solar panels jaise sunlight se battery charge karte hain, waise hi plants light photons se ATP aur NADPH energy carriers banate hain.',
    },
    analogy: {
      english: 'Chloroplasts are microscopic solar power kitchens: water molecules are split by light (photolysis), releasing oxygen as an exhaust while charging chemical energy batteries.',
      hindi: 'हरितलवक (क्लोरोप्लास्ट) सौर ऊर्जा की रसोई हैं: पानी के अणु टूटते हैं, ऑक्सीजन निकलती है और ऊर्जा बनती है।',
      hinglish: 'Chloroplast plant ki solar powered kitchen hai: chlorophyll light absorb karke water split karti hai aur oxygen release karti hai.',
    },
    commonMisconceptions: [
      {
        misconception: 'Plants photosynthesize during the day and stop cellular respiration entirely.',
        triggerPatterns: ['plants do not respire', 'plants only respire at night', 'plants only photosynthesize'],
        explanationCorrection: 'Plants perform cellular respiration continuously (24/7) in mitochondria to generate ATP for cellular maintenance; photosynthesis occurs concurrently whenever light is present.',
        recommendedStrategy: 'new_analogy',
      },
      {
        misconception: 'The oxygen released during photosynthesis comes from carbon dioxide (CO2).',
        triggerPatterns: ['oxygen comes from co2', 'plants split co2 to make oxygen'],
        explanationCorrection: 'Isotope tracing proves that O2 gas is released from the photolysis of water (H2O) in Photosystem II, not from carbon dioxide.',
        recommendedStrategy: 'worked_example',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'If a plant is supplied with water containing heavy oxygen isotope ¹⁸O (H2¹⁸O) but normal CO2, will the released oxygen gas contain ¹⁸O? Explain why.',
        hindi: 'यदि एक पौधे को भारी ऑक्सीजन ¹⁸O युक्त पानी (H2¹⁸O) दिया जाए परंतु सामान्य CO2 दी जाए, तो क्या उत्सर्जित ऑक्सीजन में ¹⁸O होगा? कारण स्पष्ट करें।',
        hinglish: 'Agar ek plant ko heavy isotope water H2¹⁸O diya jaye aur normal CO2, toh kya release hone wali O2 gas mein ¹⁸O hoga? Why?',
      },
      type: 'application',
      keyIdeas: [
        'Yes, the released O2 will contain ¹⁸O.',
        'During the light-dependent reactions, water is split (photolysis) in Photosystem II: 2H2O -> 4H⁺ + 4e⁻ + O2.',
        'The oxygen atoms in O2 originate exclusively from water, while carbon dioxide is fixed into glucose in the Calvin cycle.',
      ],
      passingCriteria: 'Student must confirm yes and state that released oxygen comes directly from the splitting of water (photolysis).',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Photosynthesis & Chloroplast Reactions',
        prompt: 'Write the overall chemical equation for photosynthesis and identify which molecule provides the released oxygen.',
        format: 'concept_check',
      },
      {
        intervalDays: 7,
        concept: 'Photosynthesis & Chloroplast Reactions',
        prompt: 'Distinguish between the light-dependent reactions in thylakoids and the Calvin cycle in stroma.',
        format: 'flashcard',
      },
    ],
    suggestedVisualId: 'photosynthesis-chloroplast-diagram',
  },

  // ==========================================
  // BIOLOGY: MITOSIS & DNA
  // ==========================================
  cell_division_mitosis: {
    id: 'cell_division_mitosis',
    conceptName: 'Cell Division & Mitosis Phases',
    subject: 'biology',
    prerequisites: [],
    realWorldExample: {
      english: 'Skin healing after a paper cut: basal epidermal cells dividing rapidly to replace damaged tissue.',
      hindi: 'त्वचा पर खरोंच आने पर नई कोशिकाओं का तेजी से विभाजन होकर घाव का भरना।',
      hinglish: 'Skin cut lagne ke baad new cells divide hokar tissue ko seamlessly heal kar deti hain.',
    },
    analogy: {
      english: 'Mitosis is an ultra-precise biological copying machine that produces two genetically identical daughter cells with exact duplicate chromosomes.',
      hindi: 'माइटोसिस एक सटीक फोटोकॉपी मशीन की तरह है जो एक कोशिका से दो हूबहू समान संतति कोशिकाएँ बनाती है।',
      hinglish: 'Mitosis ek biological xerox machine ki tarah hai jo exact duplicate chromosomes ke sath identical daughter cells banati hai.',
    },
    commonMisconceptions: [
      {
        misconception: 'Mitosis halves chromosome number like meiosis does.',
        triggerPatterns: ['mitosis reduces chromosomes to half', 'daughter cells have 23 chromosomes in mitosis', 'mitosis creates gametes'],
        explanationCorrection: 'Mitosis maintains exact diploid chromosome count (2n -> 2n); chromosome reduction to haploid (n) only occurs in meiosis for sexual reproduction.',
        recommendedStrategy: 'worked_example',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'A human somatic cell with 46 chromosomes undergoes mitosis. How many daughter cells are produced, and how many chromosomes does each daughter cell contain?',
        hindi: 'एक मानव कायिक कोशिका (46 गुणसूत्र) में समसूत्री विभाजन (Mitosis) होता है। कितनी संतति कोशिकाएँ बनेंगी और प्रत्येक में कितने गुणसूत्र होंगे?',
        hinglish: 'Human somatic cell (46 chromosomes) mein mitosis division hota hai. Kitni daughter cells banengi aur har cell mein kitne chromosomes honge?',
      },
      type: 'application',
      keyIdeas: [
        'Mitosis produces exactly 2 daughter cells.',
        'Each daughter cell retains the full diploid chromosome count of 46.',
        'Daughter cells are genetically identical clones of the parent cell.',
      ],
      passingCriteria: 'Student must state 2 daughter cells with 46 chromosomes each (identical diploid number).',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Cell Division & Mitosis Phases',
        prompt: 'Name the four stages of mitosis in order (PMAT) and explain what happens during metaphase.',
        format: 'flashcard',
      },
      {
        intervalDays: 7,
        concept: 'Cell Division & Mitosis Phases',
        prompt: 'Why must chromosomes condense and align along the metaphase plate before chromatids separate?',
        format: 'concept_check',
      },
    ],
    suggestedVisualId: 'cell-mitosis-interactive',
  },

  dna_double_helix: {
    id: 'dna_double_helix',
    conceptName: 'DNA Double Helix & Complementary Base Pairing',
    subject: 'biology',
    prerequisites: ['cell_division_mitosis'],
    realWorldExample: {
      english: 'Forensic DNA fingerprinting identifying individuals from a single hair root through genetic code matches.',
      hindi: 'फोरेंसिक जांच में डीएनए फिंगरप्रिंटिंग द्वारा किसी व्यक्ति की सटीक पहचान करना।',
      hinglish: 'Forensic science mein DNA sample match karke crime scene par suspect ki accurate identification karna.',
    },
    analogy: {
      english: 'DNA is a twisted spiral ladder: sugar-phosphate backbones form the sturdy outer rails, while hydrogen-bonded nitrogenous base pairs (A-T and G-C) form the specific interior steps.',
      hindi: 'डीएनए एक घुमावदार सर्पिल सीढ़ी है: शर्करा-फॉस्फेट बाहरी रेलिंग बनाते हैं और हाइड्रोजन बंधित बेस जोड़े (A-T और G-C) सीढ़ी के डंडे बनाते हैं।',
      hinglish: 'DNA ek twisted spiral ladder hai: sugar-phosphate backbone outer rails hai, aur A-T, G-C base pairs inner steps banate hain.',
    },
    commonMisconceptions: [
      {
        misconception: 'Adenine pairs with Guanine or Cytosine arbitrarily.',
        triggerPatterns: ['adenine pairs with cytosine', 'bases pair randomly', 'a pairs with g'],
        explanationCorrection: 'Base pairing is strictly dictated by hydrogen bonding: Adenine forms 2 hydrogen bonds only with Thymine (A=T), and Guanine forms 3 hydrogen bonds only with Cytosine (G≡C).',
        recommendedStrategy: 'visual_walkthrough',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'In a double-stranded DNA sample, 28% of the nitrogenous bases are Cytosine. Determine the percentage of Guanine, Adenine, and Thymine.',
        hindi: 'एक द्विरज्जुकीय डीएनए नमूने में 28% साइटोसिन (C) है। ग्वानिन (G), एडेनिन (A) और थायमिन (T) का प्रतिशत ज्ञात कीजिए।',
        hinglish: 'Double-stranded DNA sample mein 28% Cytosine (C) hai. Chargaff rule apply karke Guanine, Adenine, aur Thymine ka percentage calculate karo.',
      },
      type: 'application',
      keyIdeas: [
        'By Chargaff’s rule, %Guanine = %Cytosine = 28%.',
        'Total G + C = 56%, leaving 44% for A + T.',
        '%Adenine = %Thymine = 44% / 2 = 22%.',
      ],
      passingCriteria: 'Student must calculate G = 28%, A = 22%, T = 22% using Chargaff’s complementary base pairing rules.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'DNA Double Helix & Complementary Base Pairing',
        prompt: 'State Chargaff’s rules and explain how hydrogen bonding enforces base pair complementarity.',
        format: 'concept_check',
      },
      {
        intervalDays: 3,
        concept: 'DNA Double Helix & Complementary Base Pairing',
        prompt: 'If one strand reads 5’-A-T-G-C-C-A-3’, write the complementary antiparallel 3’-5’ sequence.',
        format: 'quick_problem',
      },
    ],
    suggestedVisualId: 'dna-double-helix-3d',
  },

  // ==========================================
  // COMPUTER SCIENCE: ALGORITHMS & COMPLEXITY
  // ==========================================
  binary_search_complexity: {
    id: 'binary_search_complexity',
    conceptName: 'Binary Search & Algorithmic Complexity (Big-O)',
    subject: 'computer_science',
    prerequisites: [],
    realWorldExample: {
      english: 'Looking up a word in a printed dictionary: opening at the middle, immediately eliminating half the alphabet, and repeating.',
      hindi: 'शब्दकोश (डिक्शनरी) में शब्द खोजना: बीच का पृष्ठ खोलकर आधे पन्नों को एक ही बार में छोड़ देना।',
      hinglish: 'Dictionary mein word dhoondna: page ko middle se open karke har step par half book discard kar dena.',
    },
    analogy: {
      english: 'Binary search is like the higher/lower number guessing game: for a range of 1000 numbers, you only need at most 10 guesses because 2^10 = 1024.',
      hindi: 'नंबर गेसिंग गेम: 1 से 1000 के बीच की संख्या को मात्र 10 प्रयासों में खोज लेना क्योंकि हर बार दायरा आधा हो जाता है।',
      hinglish: 'Number guessing game jisme har guess ke baad possible search space 50% reduce ho jata hai (O(log n)).',
    },
    commonMisconceptions: [
      {
        misconception: 'Binary search can be applied to any arbitrary unsorted array.',
        triggerPatterns: ['binary search on unsorted', 'no need to sort before binary search', 'works on random arrays'],
        explanationCorrection: 'Binary search strictly requires a sorted sequence (or monotonic function); if elements are disordered, dividing at midpoint gives no clue whether target lies left or right.',
        recommendedStrategy: 'worked_example',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'A database has 1,000,000 sorted customer IDs. Compare the maximum number of comparisons required to find an ID using Linear Search versus Binary Search.',
        hindi: 'एक डेटाबेस में 10 लाख (1,000,000) सॉर्टेड आईडी हैं। लीनियर सर्च और बाइनरी सर्च में अधिकतम कितने प्रयास लगेंगे?',
        hinglish: 'Ek sorted database mein 1,000,000 customer IDs hain. Linear search aur Binary search mein maximum comparisons compare karo.',
      },
      type: 'application',
      keyIdeas: [
        'Linear search checks sequentially: worst case is 1,000,000 comparisons (O(n)).',
        'Binary search halves each step: ceil(log2(1,000,000)) ≈ 20 comparisons (O(log n)).',
        'Binary search reduces comparisons by roughly 50,000x for 1 million records.',
      ],
      passingCriteria: 'Student must calculate 1,000,000 for linear search and approximately 20 comparisons for binary search.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Binary Search & Algorithmic Complexity (Big-O)',
        prompt: 'Why does binary search require a sorted array, and what is its Big-O time complexity?',
        format: 'flashcard',
      },
      {
        intervalDays: 3,
        concept: 'Binary Search & Algorithmic Complexity (Big-O)',
        prompt: 'Calculate how many steps binary search takes in the worst case for 4,000,000,000 elements.',
        format: 'quick_problem',
      },
    ],
    suggestedVisualId: 'sorting-visualizer-sim',
  },

  sorting_algorithms_complexity: {
    id: 'sorting_algorithms_complexity',
    conceptName: 'Sorting Algorithms & Comparison Complexity',
    subject: 'computer_science',
    prerequisites: ['binary_search_complexity'],
    realWorldExample: {
      english: 'Sorting 10 million transactions in a banking database using QuickSort vs BubbleSort.',
      hindi: 'लाखों बैंक लेन-देन को तिथि या राशि के अनुसार त्वरित सॉर्ट (QuickSort) करना।',
      hinglish: 'E-commerce platform par 10 million products ko price low-to-high sort karna O(n log n) efficiency se.',
    },
    analogy: {
      english: 'Comparing every pair of books on a shelf is quadratic O(n²); dividing the shelf into two piles, sorting each recursively, and merging them is logarithmic O(n log n).',
      hindi: 'हर किताब की दूसरी किताब से तुलना करना O(n²) है; आधी-आधी किताबें बाँटकर मिलाना O(n log n) है।',
      hinglish: 'Har element ko compare karna O(n²) hai; divide-and-conquer se sort karna O(n log n) efficient hai.',
    },
    commonMisconceptions: [
      {
        misconception: 'Bubble Sort is fast enough for large arrays because modern computers are so fast.',
        triggerPatterns: ['bubble sort fast on big data', 'modern computers make bubble sort fast', 'n squared is good enough'],
        explanationCorrection: 'For 1 million items, O(n²) requires 1,000,000,000,000 operations (hours), whereas O(n log n) takes only ~20 million operations (fraction of a second). Hardware speed cannot compensate for quadratic asymptotic growth.',
        recommendedStrategy: 'worked_example',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'An algorithm has quadratic time complexity O(n²). If the input size n increases by a factor of 10, by what factor does the number of operations increase?',
        hindi: 'एक एल्गोरिदम की समय जटिलता O(n²) है। यदि इनपुट आकार n 10 गुना बढ़ जाए, तो संक्रियाओं की संख्या कितने गुना बढ़ेगी?',
        hinglish: 'Ek O(n²) sorting algorithm mein input size 10 times badha diya jaaye, toh total operations kitne factor se increase honge?',
      },
      type: 'application',
      keyIdeas: [
        'Quadratic complexity means operations grow with the square of input size n.',
        'Factor increase = 10² = 100.',
        'The operations increase by a factor of 100.',
      ],
      passingCriteria: 'Student must state that operations increase by 100 times (10 squared).',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Sorting Algorithms & Comparison Complexity',
        prompt: 'Contrast the worst-case and average-case time complexities of Bubble Sort, Merge Sort, and Quick Sort.',
        format: 'concept_check',
      },
      {
        intervalDays: 7,
        concept: 'Sorting Algorithms & Comparison Complexity',
        prompt: 'Why is comparison-based sorting bounded by Ω(n log n) in the worst case?',
        format: 'flashcard',
      },
    ],
    suggestedVisualId: 'sorting-visualizer-sim',
  },

  // ==========================================
  // EARTH SCIENCE & GEOPHYSICS
  // ==========================================
  tectonic_plates_boundaries: {
    id: 'tectonic_plates_boundaries',
    conceptName: 'Plate Tectonics & Continental Drift',
    subject: 'physics',
    prerequisites: ['newtons_first_law'],
    realWorldExample: {
      english: 'The Himalayas rising by approximately 5 millimeters each year as the Indian tectonic plate collides with the Eurasian plate.',
      hindi: 'हिमालय पर्वतमाला की ऊंचाई प्रतिवर्ष 5 मिमी बढ़ना क्योंकि भारतीय प्लेट यूरेशियन प्लेट से टकरा रही है।',
      hinglish: 'Indian plate ka Eurasian plate se collide hona jisse Himalayas ki height har saal measureable amount se grow hoti hai.',
    },
    analogy: {
      english: 'Tectonic plates are like giant fractured cracked eggshells floating on a slowly convecting pot of thick boiling soup (the semi-molten asthenosphere mantle).',
      hindi: 'टेक्टोनिक प्लेटें उबलते सूप पर तैरते हुए टूटे हुए अंडे के छिलकों जैसी हैं जो नीचे के संवहन धाराओं द्वारा गति करती हैं।',
      hinglish: 'Tectonic plates boiling mantle par float karte huge rigid crust pieces hain jo convection currents ki wajah se drift karte hain.',
    },
    commonMisconceptions: [
      {
        misconception: 'Earthquakes and volcanic eruptions occur uniformly and randomly across the Earth.',
        triggerPatterns: ['earthquakes happen anywhere randomly', 'no pattern to volcanoes', 'continents float on water'],
        explanationCorrection: 'Earthquakes and volcanoes occur overwhelmingly along narrow tectonic plate boundaries (convergent, divergent, transform) due to friction and magma upwelling; plate interiors are largely seismically stable.',
        recommendedStrategy: 'visual_walkthrough',
      },
    ],
    applicationCheckpoint: {
      prompt: {
        english: 'Explain why the Pacific "Ring of Fire" accounts for over 75% of the world’s active volcanoes and 90% of all earthquakes.',
        hindi: 'प्रशांत महासागर का "अग्नि वलय" (Ring of Fire) विश्व के 75% से अधिक ज्वालामुखियों और 90% भूकंपों के लिए क्यों जिम्मेदार है?',
        hinglish: 'Pacific "Ring of Fire" mein duniya ke 75% active volcanoes aur 90% earthquakes kyu cluster hote hain?',
      },
      type: 'application',
      keyIdeas: [
        'The Pacific plate is surrounded by subduction zones at convergent boundaries.',
        'Dense oceanic crust slides under lighter continental crust, melting into magma.',
        'Frictional lock and sudden slip along boundaries release massive seismic shockwaves.',
      ],
      passingCriteria: 'Student must mention convergent plate boundaries, subduction zones, or tectonic plate collisions surrounding the Pacific basin.',
    },
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Plate Tectonics & Continental Drift',
        prompt: 'Describe the three types of plate boundaries: convergent, divergent, and transform.',
        format: 'concept_check',
      },
      {
        intervalDays: 7,
        concept: 'Plate Tectonics & Continental Drift',
        prompt: 'How does mantle convection act as the driving engine for continental drift?',
        format: 'flashcard',
      },
    ],
    suggestedVisualId: 'tectonic-plates-globe-3d',
  },
};

/**
 * Resolves concept graph nodes for a given topic in topological prerequisite order.
 */
export function resolveConceptGraph(
  topic: string,
  requestedCount = 4,
): ConceptNode[] {
  const normalized = topic.toLowerCase().trim();
  const topicWords = normalized.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);
  const matchedNodes: ConceptNode[] = [];

  const addNode = (node: ConceptNode | undefined) => {
    if (node && !matchedNodes.some((n) => n.id === node.id)) {
      matchedNodes.push(node);
    }
  };

  // Specific domain keyword mappings for robust curriculum discovery
  if (normalized.includes('circuit') || normalized.includes('ohm') || normalized.includes('electric') || normalized.includes('voltage') || normalized.includes('resistance')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.electric_charge);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.voltage_potential);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.ohms_law);
  }

  if (normalized.includes('force') || normalized.includes('newton') || normalized.includes('motion') || normalized.includes('inertia') || normalized.includes('acceleration')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.newtons_first_law);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.newtons_second_law);
  }

  if (normalized.includes('pendulum') || normalized.includes('harmonic') || normalized.includes('shm') || normalized.includes('oscillation')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.newtons_first_law);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.newtons_second_law);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.pendulum_harmonic_motion);
  }

  if (normalized.includes('bond') || normalized.includes('octet') || normalized.includes('ionic') || normalized.includes('covalent') || normalized.includes('valence')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.octet_rule_bonding);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.ionic_vs_covalent);
  }

  if (
    normalized.includes('titrat') ||
    normalized.includes('neutraliz') ||
    normalized.includes('acid-base') ||
    normalized.includes('acid base') ||
    (/\b(acid|acids|alkali|alkaline|ph)\b/.test(normalized) && !normalized.includes('amino acid') && !normalized.includes('nucleic acid')) ||
    (/\b(base|bases)\b/.test(normalized) && !normalized.includes('base pair') && !normalized.includes('data') && !normalized.includes('dna'))
  ) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.octet_rule_bonding);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.ionic_vs_covalent);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.acid_base_titration);
  }

  if (normalized.includes('quadratic') || normalized.includes('discriminant') || normalized.includes('parabola') || normalized.includes('root')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.quadratic_discriminant);
  }

  if (normalized.includes('photosynthesis') || normalized.includes('chloroplast') || normalized.includes('light reaction') || normalized.includes('plant')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.photosynthesis_light_reactions);
  }

  if (normalized.includes('mitosis') || normalized.includes('cell division') || normalized.includes('meiosis') || normalized.includes('chromosome')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.cell_division_mitosis);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.dna_double_helix);
  }

  if (normalized.includes('dna') || normalized.includes('double helix') || normalized.includes('base pair') || normalized.includes('chargaff')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.cell_division_mitosis);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.dna_double_helix);
  }

  if (normalized.includes('binary search') || normalized.includes('algorithm') || normalized.includes('big-o') || normalized.includes('complexity') || normalized.includes('search')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.binary_search_complexity);
  }

  if (normalized.includes('sort') || normalized.includes('quicksort') || normalized.includes('mergesort') || normalized.includes('bubblesort')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.binary_search_complexity);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.sorting_algorithms_complexity);
  }

  if (normalized.includes('tectonic') || normalized.includes('earthquake') || normalized.includes('volcano') || normalized.includes('plate') || normalized.includes('drift')) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.newtons_first_law);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.tectonic_plates_boundaries);
  }

  // General keyword matching against node text
  for (const node of Object.values(CONCEPT_KNOWLEDGE_GRAPH)) {
    const cleanNodeText = `${node.conceptName} ${node.subject} ${node.id}`.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    if (
      normalized.includes(node.subject) ||
      normalized.includes(node.id.replace(/_/g, ' ')) ||
      topicWords.some((word) => cleanNodeText.includes(word))
    ) {
      addNode(node);
    }
  }

  // Fallback to electricity foundation if no match
  if (matchedNodes.length === 0) {
    addNode(CONCEPT_KNOWLEDGE_GRAPH.electric_charge);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.voltage_potential);
    addNode(CONCEPT_KNOWLEDGE_GRAPH.ohms_law);
  }

  // Topological sorting: ensure all prerequisites precede dependent nodes
  const ordered: ConceptNode[] = [];
  const visited = new Set<string>();

  const visit = (node: ConceptNode) => {
    if (visited.has(node.id)) return;
    for (const prereqId of node.prerequisites) {
      const prereqNode = CONCEPT_KNOWLEDGE_GRAPH[prereqId];
      if (prereqNode && !visited.has(prereqId)) {
        visit(prereqNode);
      }
    }
    visited.add(node.id);
    ordered.push(node);
  };

  for (const node of matchedNodes) {
    visit(node);
  }

  return ordered.slice(0, Math.max(1, requestedCount));
}

/**
 * Builds localized natural spoken-style teaching narration incorporating
 * real-world examples, analogies, and common misconceptions.
 */
export function buildSpokenStyleNarration(
  node: ConceptNode,
  language: TeachingLanguage,
  variantMode: 'standard' | 'exam_focused' | 'practical' = 'standard',
): string {
  const langKey = language === 'hindi' ? 'hindi' : language === 'hinglish' ? 'hinglish' : 'english';
  const example = node.realWorldExample[langKey];
  const analogy = node.analogy[langKey];
  const topMisconception = node.commonMisconceptions[0];

  if (language === 'hindi') {
    if (variantMode === 'exam_focused') {
      return `नमस्ते! आइए “${node.conceptName}” को परीक्षा की दृष्टि से समझें।\n\n` +
        `मुख्य सिद्धांत: ${analogy}\n\n` +
        `व्यावहारिक उदाहरण: ${example}\n\n` +
        `सावधानी (सामान्य त्रुटि): कई छात्र यह मान बैठते हैं कि “${topMisconception?.misconception || ''}”। ` +
        `परंतु सच यह है: ${topMisconception?.explanationCorrection || ''}\n\n` +
        `परीक्षा टिप: सूत्र, सही मानक SI इकाइयाँ और परिभाषा के मुख्य शब्दों को स्पष्ट रूप से लिखें।`;
    }

    if (variantMode === 'practical') {
      return `नमस्ते! आज हम “${node.conceptName}” को एक व्यावहारिक प्रयोग की तरह देखेंगे।\n\n` +
        `वास्तविक जीवन में अवलोकन: ${example}\n\n` +
        `आंतरिक कार्यप्रणाली: ${analogy}\n\n` +
        `प्रयोग करते समय ध्यान दें: ${topMisconception?.explanationCorrection || ''}। अब आइए इसका परिणाम स्वयं मापें!`;
    }

    return `नमस्ते! आज हम समझेंगे “${node.conceptName}”।\n\n` +
      `पहले दैनिक जीवन का एक उदाहरण देखिए: ${example}।\n\n` +
      `इसे आसानी से समझने के लिए एक सादृश्य देखिए: ${analogy}।\n\n` +
      `यहाँ एक बात बहुत ध्यान देने योग्य है: अक्सर विद्यार्थी यह सोचते हैं कि “${topMisconception?.misconception || ''}”। ` +
      `लेकिन वास्तव में: ${topMisconception?.explanationCorrection || ''}।`;
  }

  if (language === 'hinglish') {
    if (variantMode === 'exam_focused') {
      return `Hello! Aaj hum “${node.conceptName}” ko direct exam perspective se master karenge.\n\n` +
        `Core Principle: ${analogy}\n\n` +
        `Real-life Example: ${example}\n\n` +
        `Common Mistake to Avoid: Aksar students yeh assume karte hain ki “${topMisconception?.misconception || ''}”. ` +
        `Lekin reality yeh hai: ${topMisconception?.explanationCorrection || ''}\n\n` +
        `Board Exam Tip: Formula aur proper SI units mention karna kabhi mat bhoolna!`;
    }

    if (variantMode === 'practical') {
      return `Hello! Aaj hum “${node.conceptName}” ko hands-on practical lab format mein samjhenge.\n\n` +
        `Everyday Observation: ${example}\n\n` +
        `How it Works: ${analogy}\n\n` +
        `Lab Insight: Remember that ${topMisconception?.explanationCorrection || ''}. Let's test this in action!`;
    }

    return `Hello! Aaj hum step-by-step samjhenge “${node.conceptName}”.\n\n` +
      `Pehle real world se relate karte hain: ${example}.\n\n` +
      `Isko simple analogy se visualize karo: ${analogy}.\n\n` +
      `Ek important misconception clear karna zaroori hai: Bohot log sochte hain ki “${topMisconception?.misconception || ''}”. ` +
      `Par reality yeh hai ki ${topMisconception?.explanationCorrection || ''}.`;
  }

  // English
  if (variantMode === 'exam_focused') {
    return `Welcome! Today we are mastering “${node.conceptName}” with sharp focus on exam accuracy.\n\n` +
      `Core Principle: ${analogy}\n\n` +
      `Real-world Example: ${example}\n\n` +
      `High-Yield Warning (Common Misconception): Students often mistakenly believe that “${topMisconception?.misconception || ''}”. ` +
      `In fact: ${topMisconception?.explanationCorrection || ''}\n\n` +
      `Scoring Strategy: Always state the fundamental governing law, show substitutions clearly, and label standard SI units.`;
  }

  if (variantMode === 'practical') {
    return `Welcome! Let’s explore “${node.conceptName}” through a hands-on experimental lens.\n\n` +
      `Physical Observation: ${example}\n\n` +
      `Underlying Mechanism: ${analogy}\n\n` +
      `Practical Rule: Keep in mind that ${topMisconception?.explanationCorrection || ''}. Let’s inspect the interactive visual and observe the measurements!`;
  }

  return `Welcome! Today we are exploring “${node.conceptName}” step by step.\n\n` +
    `Let’s start with an everyday occurrence: ${example}.\n\n` +
    `To clearly understand the mechanism, consider this analogy: ${analogy}.\n\n` +
    `A crucial insight to keep in mind: many learners initially assume that “${topMisconception?.misconception || ''}”. ` +
    `However, the underlying truth is: ${topMisconception?.explanationCorrection || ''}.`;
}

/**
 * Builds a comprehensive grading rubric for a concept checkpoint.
 */
export function buildCheckpointRubric(
  node: ConceptNode,
  checkpointId: string,
): CheckpointRubric {
  return {
    checkpointId,
    targetConcept: node.conceptName,
    keyIdeas: node.applicationCheckpoint.keyIdeas,
    commonMisconceptions: node.commonMisconceptions,
    passingCriteria: node.applicationCheckpoint.passingCriteria,
  };
}
