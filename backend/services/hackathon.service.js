import Hackathon from '../models/Hackathon.js';
import User from '../models/User.js';

/**
 * TeamForge Hackathon Discovery Service
 * Provides extensible hackathon ingestion, filtering, and personalized student skill matching.
 */

// Helper to extract clean array of lowercase skills from user
export const extractUserSkills = (user) => {
  if (!user || !user.skills) return [];
  return (user.skills || []).map((s) => {
    if (typeof s === 'string') return s.trim().toLowerCase();
    return (s.name || '').trim().toLowerCase();
  }).filter(Boolean);
};

// Calculate skill match score and gap for a hackathon
export const calculateHackathonSkillMatch = (hackathonSkills = [], userSkills = []) => {
  if (!hackathonSkills || hackathonSkills.length === 0) {
    return {
      matchPercentage: 100,
      matchedSkills: [],
      missingSkills: []
    };
  }

  const userSkillSet = new Set(userSkills.map((s) => s.toLowerCase()));
  const matched = [];
  const missing = [];

  hackathonSkills.forEach((reqSkill) => {
    const cleanReq = reqSkill.trim();
    const lowerReq = cleanReq.toLowerCase();

    // Check direct match or substring match (e.g. 'react' matches 'react.js' or 'react native')
    let isMatched = false;
    for (const uSkill of userSkillSet) {
      if (uSkill === lowerReq || uSkill.includes(lowerReq) || lowerReq.includes(uSkill)) {
        isMatched = true;
        break;
      }
    }

    if (isMatched) {
      matched.push(cleanReq);
    } else {
      missing.push(cleanReq);
    }
  });

  const matchPercentage = Math.round((matched.length / hackathonSkills.length) * 100);

  return {
    matchPercentage,
    matchedSkills: matched,
    missingSkills: missing
  };
};

// Seed diverse curated hackathons if collection is empty
export const seedHackathonsIfEmpty = async () => {
  const count = await Hackathon.countDocuments();
  if (count > 0) return;

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const mockHackathons = [
    {
      title: 'Global AI Hackathon 2026',
      tagline: 'Build next-generation autonomous agents and multimodal generative tools',
      description: `### Welcome to the Global AI Hackathon!
Join over 5,000 developers, data scientists, and designers worldwide to construct cutting-edge AI products.
Whether you are building conversational agents, vision systems, or intelligent developer tooling, this is your stage.

#### Tracks:
- **Autonomous Agents & Tool Use**: Build collaborative multi-agent workflows.
- **Multimodal AI Solutions**: Image, voice, and streaming video apps.
- **AI for Social Good**: Sustainability, accessible healthcare, and civic intelligence.`,
      bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      organizer: {
        name: 'Google Developer Student Clubs & TechForge',
        logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=120&q=80',
        website: 'https://ai-hackathon-2026.dev'
      },
      mode: 'Online',
      location: 'Global Virtual (Discord + Live Stream)',
      difficulty: 'All Levels',
      teamSize: { min: 2, max: 4 },
      requiredSkills: ['React', 'Python', 'Machine Learning', 'FastAPI', 'Node.js'],
      themes: ['AI / ML', 'Developer Tools', 'Open Source'],
      prizePool: '$45,000',
      prizes: [
        { title: 'Grand Champion', amount: '$20,000', description: 'First place overall across all tracks' },
        { title: 'Best Agentic Architecture', amount: '$10,000', description: 'Most innovative autonomous multi-agent tool' },
        { title: 'Community Favorite', amount: '$5,000', description: 'Voted top project by peers and participants' }
      ],
      startDate: new Date(now.getTime() + 2 * day),
      deadline: new Date(now.getTime() + 14 * day),
      websiteUrl: 'https://ai-hackathon-2026.dev',
      rules: [
        'All code must be written during the hackathon period.',
        'Teams may consist of 2 to 4 students.',
        'Open-source frameworks and pre-trained foundation models are permitted.'
      ],
      featured: true
    },
    {
      title: 'EduTech Revolution Hackathon',
      tagline: 'Reinvent modern education with interactive and gamified learning platforms',
      description: `### Empower Students Worldwide
Help universities and K-12 students learn faster through interactive tools, adaptive quiz systems, and smart revision platforms.`,
      bannerImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
      organizer: {
        name: 'Open Education Foundation',
        website: 'https://edutech-hack.org'
      },
      mode: 'Online',
      location: 'Virtual',
      difficulty: 'Beginner',
      teamSize: { min: 1, max: 4 },
      requiredSkills: ['React', 'JavaScript', 'TailwindCSS', 'Node.js', 'UI/UX'],
      themes: ['EdTech', 'Productivity', 'Gamification'],
      prizePool: '$15,000',
      prizes: [
        { title: 'Best Classroom Tool', amount: '$8,000', description: 'Top tool for educators' },
        { title: 'Best Student Dashboard', amount: '$4,000', description: 'Most engaging learner experience' }
      ],
      startDate: new Date(now.getTime() + 5 * day),
      deadline: new Date(now.getTime() + 20 * day),
      websiteUrl: 'https://edutech-hack.org',
      featured: false
    },
    {
      title: 'FinTech Nexus Hackathon 2026',
      tagline: 'Build algorithmic trading tools, micro-investing apps, and budgeting platforms',
      description: `### Build the Future of Finance
Design secure, real-time financial tracking, automated portfolio rebalancing, and fraud detection algorithms.`,
      bannerImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
      organizer: {
        name: 'Nexus FinTech Labs',
        website: 'https://nexusfintech.io'
      },
      mode: 'Hybrid',
      location: 'San Francisco, CA & Virtual',
      difficulty: 'Intermediate',
      teamSize: { min: 2, max: 4 },
      requiredSkills: ['Python', 'React', 'PostgreSQL', 'Data Visualization', 'REST APIs'],
      themes: ['FinTech', 'Data Analytics', 'Security'],
      prizePool: '$30,000',
      prizes: [
        { title: 'First Place Winner', amount: '$15,000', description: 'Overall winner' },
        { title: 'Best Analytics Dashboard', amount: '$7,500', description: 'Best chart and real-time telemetry design' }
      ],
      startDate: new Date(now.getTime() + 7 * day),
      deadline: new Date(now.getTime() + 25 * day),
      websiteUrl: 'https://nexusfintech.io',
      featured: true
    },
    {
      title: 'Campus Sustainability & Eco-Forge',
      tagline: 'Combat food waste, track carbon footprints, and optimize campus energy usage',
      description: `### Hack for our Planet
Create mobile and IoT-connected applications that encourage sustainable student habits and reduce campus emissions.`,
      bannerImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
      organizer: {
        name: 'GreenTech University Alliance',
        website: 'https://greentech-alliance.org'
      },
      mode: 'Offline',
      location: 'Tech University Campus Hub, Hall B',
      difficulty: 'Beginner',
      teamSize: { min: 2, max: 5 },
      requiredSkills: ['React Native / Flutter', 'Node.js', 'MongoDB', 'UI/UX Design', 'Geolocation APIs'],
      themes: ['Sustainability', 'Mobile Development', 'IoT'],
      prizePool: '$20,000',
      prizes: [
        { title: 'Best Eco Solution', amount: '$10,000', description: 'Most impactful campus initiative' },
        { title: 'Best Mobile App', amount: '$5,000', description: 'Top mobile implementation' }
      ],
      startDate: new Date(now.getTime() + 10 * day),
      deadline: new Date(now.getTime() + 18 * day),
      websiteUrl: 'https://greentech-alliance.org',
      featured: false
    },
    {
      title: 'HealthTech & BioForge 2026',
      tagline: 'Healthcare telemetry, mental wellness apps, and medical document summarizers',
      description: `### Advance Digital Healthcare
Transform patient record access, telemedicine matching, and wellness tracking with HIPAA-compliant design.`,
      bannerImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
      organizer: {
        name: 'MedTech Innovation Society',
        website: 'https://healthtech-bioforge.io'
      },
      mode: 'Online',
      location: 'Virtual',
      difficulty: 'Advanced',
      teamSize: { min: 2, max: 4 },
      requiredSkills: ['Python', 'React', 'Machine Learning', 'NLP', 'Docker'],
      themes: ['HealthTech', 'AI / ML', 'Cloud'],
      prizePool: '$35,000',
      prizes: [
        { title: 'Grand Medical Prize', amount: '$18,000', description: 'Best clinical workflow innovation' },
        { title: 'Best Wellness App', amount: '$8,000', description: 'Top preventative health application' }
      ],
      startDate: new Date(now.getTime() + 12 * day),
      deadline: new Date(now.getTime() + 30 * day),
      websiteUrl: 'https://healthtech-bioforge.io',
      featured: true
    },
    {
      title: 'Open Source Dev Tools Sprint',
      tagline: 'Build CLI utilities, VS Code extensions, and developer productivity tools',
      description: `### Tools for Builders by Builders
Improve developer workflows with linters, code generators, documentation assistants, and debuggers.`,
      bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      organizer: {
        name: 'DevTooling Foundation',
        website: 'https://devtools-sprint.dev'
      },
      mode: 'Online',
      location: 'Global Virtual',
      difficulty: 'All Levels',
      teamSize: { min: 1, max: 3 },
      requiredSkills: ['TypeScript', 'Node.js', 'React', 'Rust', 'REST APIs'],
      themes: ['Developer Tools', 'Open Source', 'CLI'],
      prizePool: '$25,000',
      prizes: [
        { title: 'Top DevTool', amount: '$12,000', description: 'Most useful developer extension or CLI' },
        { title: 'Best DX Design', amount: '$6,000', description: 'Cleanest developer experience and docs' }
      ],
      startDate: new Date(now.getTime() + 15 * day),
      deadline: new Date(now.getTime() + 28 * day),
      websiteUrl: 'https://devtools-sprint.dev',
      featured: false
    }
  ];

  await Hackathon.insertMany(mockHackathons);
  console.log('[Hackathon Service] Auto-seeded curated hackathons successfully.');
};

// Fetch and filter hackathons with personalized user match calculation
export const getFilteredHackathons = async ({
  search = '',
  mode = '',
  technology = '',
  difficulty = '',
  theme = '',
  savedOnly = false,
  interestedOnly = false,
  userId = null
}) => {
  await seedHackathonsIfEmpty();

  const query = {};

  if (mode && mode !== 'All') {
    query.mode = mode;
  }

  if (difficulty && difficulty !== 'All') {
    query.difficulty = difficulty;
  }

  if (theme && theme !== 'All') {
    query.themes = { $in: [new RegExp(theme, 'i')] };
  }

  if (technology && technology !== 'All') {
    query.requiredSkills = { $in: [new RegExp(technology, 'i')] };
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { title: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
      { tagline: { $regex: s, $options: 'i' } },
      { requiredSkills: { $in: [new RegExp(s, 'i')] } },
      { themes: { $in: [new RegExp(s, 'i')] } }
    ];
  }

  if (savedOnly && userId) {
    query.savedBy = userId;
  }

  if (interestedOnly && userId) {
    query.interestedUsers = userId;
  }

  const hackathons = await Hackathon.find(query).sort({ deadline: 1, featured: -1 });

  // Get user skills if logged in
  let userSkills = [];
  if (userId) {
    const userDoc = await User.findById(userId).select('skills');
    if (userDoc) {
      userSkills = extractUserSkills(userDoc);
    }
  }

  // Attach match scores and metadata
  const enriched = hackathons.map((h) => {
    const matchAnalysis = calculateHackathonSkillMatch(h.requiredSkills, userSkills);
    const userIdStr = userId ? userId.toString() : '';

    const isSaved = (h.savedBy || []).some((id) => id.toString() === userIdStr);
    const isInterested = (h.interestedUsers || []).some((id) => id.toString() === userIdStr);

    const now = new Date();
    const deadlineDate = new Date(h.deadline);
    const diffDays = Math.max(0, Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24)));

    return {
      _id: h._id,
      title: h.title,
      tagline: h.tagline,
      description: h.description,
      bannerImage: h.bannerImage,
      organizer: h.organizer,
      mode: h.mode,
      location: h.location,
      difficulty: h.difficulty,
      teamSize: h.teamSize,
      requiredSkills: h.requiredSkills,
      themes: h.themes,
      prizePool: h.prizePool,
      prizes: h.prizes,
      startDate: h.startDate,
      deadline: h.deadline,
      daysLeft: diffDays,
      websiteUrl: h.websiteUrl,
      rules: h.rules,
      featured: h.featured,
      savedCount: (h.savedBy || []).length,
      interestedCount: (h.interestedUsers || []).length,
      isSaved,
      isInterested,
      skillMatch: matchAnalysis
    };
  });

  return enriched;
};
