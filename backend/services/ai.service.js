/**
 * TeamForge AI Service
 * Isolated AI module with Google Gemini support and robust deterministic keyword fallback.
 */

export const analyzeProjectDescription = async (description, existingCategory = '') => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const prompt = `You are an expert software architect and technical project advisor for university hackathons and student teams.
Analyze the following project description and return ONLY a valid JSON object without markdown formatting.

Project Description: "${description}"

JSON schema required:
{
  "requiredSkills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "recommendedTeamSize": 4,
  "difficulty": "Medium", // One of: "Beginner", "Medium", "Advanced", "Hard"
  "projectCategories": ["Category1", "Category2"],
  "skillImportance": {
    "Skill1": "High",
    "Skill2": "High",
    "Skill3": "Medium",
    "Skill4": "Medium",
    "Skill5": "Low"
  },
  "suggestedRoles": ["Role 1", "Role 2", "Role 3", "Role 4"],
  "potentialChallenges": ["Challenge 1", "Challenge 2", "Challenge 3"]
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            source: 'gemini-1.5-flash',
            ...parsed
          };
        }
      }
    } catch (err) {
      console.warn('[AI Service] Gemini API call failed, using deterministic fallback:', err.message);
    }
  }

  // Deterministic Keyword-Based Fallback Engine
  return generateDeterministicAnalysis(description, existingCategory);
};

export const generateDeterministicAnalysis = (description = '', existingCategory = '') => {
  const lower = (description + ' ' + existingCategory).toLowerCase();
  
  let requiredSkills = [];
  let suggestedRoles = [];
  let potentialChallenges = [];
  let difficulty = 'Medium';
  let recommendedTeamSize = 4;
  let projectCategories = [];
  let skillImportance = {};

  // Keyword rules
  const hasAI = lower.includes('ai') || lower.includes('machine learning') || lower.includes('ml') || lower.includes('nlp') || lower.includes('resume') || lower.includes('llm') || lower.includes('gpt') || lower.includes('vision');
  const hasWeb = lower.includes('web') || lower.includes('platform') || lower.includes('portal') || lower.includes('dashboard') || lower.includes('saas') || lower.includes('tracker');
  const hasMobile = lower.includes('app') || lower.includes('mobile') || lower.includes('android') || lower.includes('ios') || lower.includes('react native') || lower.includes('flutter');
  const hasCloud = lower.includes('cloud') || lower.includes('docker') || lower.includes('aws') || lower.includes('kubernetes') || lower.includes('scale') || lower.includes('api');
  const hasData = lower.includes('data') || lower.includes('analytics') || lower.includes('database') || lower.includes('sql') || lower.includes('finance') || lower.includes('waste');
  const hasDesign = lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('figma') || lower.includes('user');

  if (hasAI || lower.includes('resume')) {
    requiredSkills.push('Python', 'Machine Learning', 'NLP', 'React', 'FastAPI / Node.js', 'UI/UX');
    suggestedRoles.push('ML / NLP Engineer', 'Full Stack Developer', 'UI/UX Designer', 'Backend API Specialist');
    potentialChallenges.push('Dataset quality and token parsing variability', 'Model latency on high volume uploads', 'Prompt drift and structured output consistency');
    difficulty = 'Medium';
    recommendedTeamSize = 4;
    projectCategories.push('AI / Machine Learning', 'Productivity');
    skillImportance = {
      'Python': 'High',
      'Machine Learning': 'High',
      'NLP': 'High',
      'React': 'Medium',
      'FastAPI / Node.js': 'Medium',
      'UI/UX': 'Medium'
    };
  } else if (hasMobile || lower.includes('campus') || lower.includes('safety') || lower.includes('navigation')) {
    requiredSkills.push('React Native / Flutter', 'Node.js', 'Firebase / MongoDB', 'Geolocation APIs', 'UI/UX Design');
    suggestedRoles.push('Mobile App Developer', 'Backend Engineer', 'UI/UX Designer', 'Cloud / Auth Specialist');
    potentialChallenges.push('Background location battery consumption', 'Cross-platform native hardware parity', 'Offline-first state synchronization');
    difficulty = 'Medium';
    recommendedTeamSize = 4;
    projectCategories.push('Mobile Development', 'Campus Life');
    skillImportance = {
      'React Native / Flutter': 'High',
      'Geolocation APIs': 'High',
      'Node.js': 'Medium',
      'UI/UX Design': 'Medium',
      'Firebase / MongoDB': 'Medium'
    };
  } else if (hasData || lower.includes('finance') || lower.includes('waste') || lower.includes('eco')) {
    requiredSkills.push('React', 'Node.js', 'PostgreSQL / MongoDB', 'Data Visualization (Chart.js/D3)', 'Tailwind CSS');
    suggestedRoles.push('Frontend Developer', 'Data / Backend Architect', 'UI/UX Designer', 'Product Manager');
    potentialChallenges.push('Real-time query performance over historical aggregations', 'Data cleanliness and ingestion validation', 'Role-based access security');
    difficulty = 'Medium';
    recommendedTeamSize = 3;
    projectCategories.push('Web Development', 'FinTech / Sustainability');
    skillImportance = {
      'React': 'High',
      'Node.js': 'High',
      'Data Visualization (Chart.js/D3)': 'Medium',
      'PostgreSQL / MongoDB': 'Medium',
      'Tailwind CSS': 'Medium'
    };
  } else {
    requiredSkills.push('React', 'Node.js', 'MongoDB', 'REST APIs', 'UI/UX');
    suggestedRoles.push('Full Stack Developer', 'Frontend Engineer', 'Backend Specialist', 'Product Designer');
    potentialChallenges.push('Scope management within hackathon timelines', 'Cohesive component styling system', 'End-to-end user state testing');
    difficulty = 'Beginner';
    recommendedTeamSize = 3;
    projectCategories.push('Full Stack Web', 'Student Utility');
    skillImportance = {
      'React': 'High',
      'Node.js': 'High',
      'MongoDB': 'Medium',
      'REST APIs': 'Medium',
      'UI/UX': 'Medium'
    };
  }

  return {
    source: 'deterministic-ai-engine',
    requiredSkills: Array.from(new Set(requiredSkills)),
    recommendedTeamSize,
    difficulty,
    projectCategories,
    skillImportance,
    suggestedRoles,
    potentialChallenges
  };
};
