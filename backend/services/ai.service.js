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

/**
 * AI-Generated Skill Assessment Engine
 * Generates structured questions for candidate skills with strict schema validation
 */
export const generateAiSkillAssessment = async (skillsWithLevels = []) => {
  if (!Array.isArray(skillsWithLevels) || skillsWithLevels.length === 0) {
    return {
      source: 'empty',
      questions: []
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const numSkills = skillsWithLevels.length;
  // Dynamic question count per skill (2 to 4 questions per skill, max 10 total)
  const qPerSkill = numSkills === 1 ? 5 : numSkills === 2 ? 4 : numSkills === 3 ? 3 : 2;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const skillsDescription = skillsWithLevels
        .map((s) => `${s.name} (Claimed Proficiency: ${s.claimedLevel || 'Intermediate'})`)
        .join(', ');

      const prompt = `You are a senior technical interviewer and assessment designer for top software engineering teams.
Generate a technical assessment for a developer claiming the following skills and levels:
${skillsDescription}

Create exactly ${qPerSkill} high-quality questions for each listed skill (total around ${Math.min(12, numSkills * qPerSkill)} questions).
For higher claimed levels (Advanced/Expert), make questions significantly more challenging with practical code scenarios, debugging, edge cases, lifecycle/concurrency, and architectural trade-offs.

Return ONLY a valid JSON object matching this exact schema:
{
  "questions": [
    {
      "questionId": "skill_001",
      "skill": "React",
      "type": "multiple_choice", // One of: "multiple_choice", "code_output", "debugging", "practical_coding", "scenario_architecture"
      "difficulty": "Advanced", // One of: "Beginner", "Intermediate", "Advanced", "Expert"
      "question": "Question text here",
      "codeSnippet": "Optional code snippet (or empty string)",
      "options": [
        "Option A description",
        "Option B description",
        "Option C description",
        "Option D description"
      ],
      "correctAnswer": 0, // Zero-based index (0..3) pointing to correct option
      "concept": "Core concept being tested (e.g. State batching, Event Loop, Indexing)"
    }
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          // Strict validation on AI output
          if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
            const validatedQuestions = parsed.questions
              .map((q, idx) => {
                if (
                  !q.question ||
                  !Array.isArray(q.options) ||
                  q.options.length < 2 ||
                  typeof q.correctAnswer !== 'number' ||
                  q.correctAnswer < 0 ||
                  q.correctAnswer >= q.options.length
                ) {
                  return null; // Invalid item
                }
                return {
                  questionId: q.questionId || `q_${idx}_${Date.now()}`,
                  skill: q.skill || skillsWithLevels[0]?.name || 'General',
                  type: q.type || 'multiple_choice',
                  difficulty: q.difficulty || 'Intermediate',
                  question: q.question,
                  codeSnippet: q.codeSnippet || '',
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  concept: q.concept || 'General',
                  points: 10
                };
              })
              .filter(Boolean);

            if (validatedQuestions.length >= Math.max(2, numSkills)) {
              return {
                source: 'gemini-1.5-flash',
                questions: validatedQuestions
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn('[AI Service] Gemini question generation failed, using server fallback:', err.message);
    }
  }

  // Robust Server-Side Fallback Question Generator
  return generateFallbackSkillQuestions(skillsWithLevels, qPerSkill);
};

/**
 * Deterministic Server-Side Fallback Question Bank
 */
export const generateFallbackSkillQuestions = (skillsWithLevels = [], qPerSkill = 3) => {
  const questions = [];
  let qCounter = 1;

  skillsWithLevels.forEach((skillObj) => {
    const sName = skillObj.name || 'General';
    const sLevel = skillObj.claimedLevel || 'Intermediate';
    const sLower = sName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (sLower.includes('react')) {
      questions.push(
        {
          questionId: `react_${qCounter++}`,
          skill: sName,
          type: 'code_output',
          difficulty: sLevel === 'Expert' ? 'Advanced' : sLevel,
          question: 'What happens when you call setCount(count + 1) twice consecutively in a click event in React 18+?',
          codeSnippet: `const [count, setCount] = useState(0);\nconst handleClick = () => {\n  setCount(count + 1);\n  setCount(count + 1);\n};`,
          options: [
            'count increases by 1 due to automatic batching closing over initial count value',
            'count increases by 2 immediately on each line',
            'Throws a state mutation error',
            'Component unmounts'
          ],
          correctAnswer: 0,
          concept: 'State Batching & Closures',
          points: 10
        },
        {
          questionId: `react_${qCounter++}`,
          skill: sName,
          type: 'debugging',
          difficulty: 'Intermediate',
          question: 'Which Hook dependency array configuration prevents an infinite render loop when fetching data on mount?',
          codeSnippet: `useEffect(() => {\n  fetchData().then(data => setData(data));\n}, []);`,
          options: [
            'Passing an empty array [] to run effect only once on mount',
            'Omitting the dependency array entirely',
            'Passing [data] as the dependency',
            'Wrapping the effect in useMemo'
          ],
          correctAnswer: 0,
          concept: 'Lifecycle & Hooks',
          points: 10
        },
        {
          questionId: `react_${qCounter++}`,
          skill: sName,
          type: 'scenario_architecture',
          difficulty: sLevel === 'Expert' ? 'Expert' : 'Advanced',
          question: 'In a high-scale React application, which strategy isolates expensive tree renders from urgent input keystrokes?',
          codeSnippet: '',
          options: [
            'useTransition or useDeferredValue to mark non-urgent updates as interruptible',
            'Replacing all component state with global window properties',
            'Calling flushSync on every keypress',
            'Deeply nesting Context providers inside every list item'
          ],
          correctAnswer: 0,
          concept: 'Concurrent Rendering',
          points: 10
        }
      );
    } else if (sLower.includes('node') || sLower.includes('express')) {
      questions.push(
        {
          questionId: `node_${qCounter++}`,
          skill: sName,
          type: 'code_output',
          difficulty: 'Intermediate',
          question: 'In Node.js event loop, which microtask phase executes before Promise.then() callbacks?',
          codeSnippet: `process.nextTick(() => console.log('A'));\nPromise.resolve().then(() => console.log('B'));`,
          options: [
            'process.nextTick queue (logs A first, then B)',
            'Promise queue (logs B first, then A)',
            'Both execute concurrently on separate OS threads',
            'Random order depending on CPU tick'
          ],
          correctAnswer: 0,
          concept: 'Event Loop & Microtasks',
          points: 10
        },
        {
          questionId: `node_${qCounter++}`,
          skill: sName,
          type: 'debugging',
          difficulty: 'Advanced',
          question: 'Why does an Express middleware sequence hang without error if res is not returned?',
          codeSnippet: `app.use((req, res, next) => {\n  if (req.user) authenticate(req.user);\n});`,
          options: [
            'next() is never called to hand off control to the next handler',
            'Express requires synchronous functions only',
            'app.use cannot inspect req headers',
            'Missing return res.json() on every line'
          ],
          correctAnswer: 0,
          concept: 'Middleware Execution Flow',
          points: 10
        },
        {
          questionId: `node_${qCounter++}`,
          skill: sName,
          type: 'scenario_architecture',
          difficulty: sLevel === 'Expert' ? 'Expert' : 'Advanced',
          question: 'Which approach safely streams 5GB files over HTTP without exceeding Node.js memory limits?',
          codeSnippet: '',
          options: [
            'stream.pipeline(readStream, res, callback) with backpressure handling',
            'fs.readFileSync() into a single Buffer',
            'Converting the entire file to a Base64 string in memory',
            'Using an unbounded while(true) loop with res.write()'
          ],
          correctAnswer: 0,
          concept: 'Streams & Backpressure',
          points: 10
        }
      );
    } else if (sLower.includes('mongo') || sLower.includes('database')) {
      questions.push(
        {
          questionId: `mongo_${qCounter++}`,
          skill: sName,
          type: 'multiple_choice',
          difficulty: 'Beginner',
          question: 'Which aggregation pipeline operator in MongoDB performs a left outer join with another collection?',
          codeSnippet: '',
          options: ['$lookup', '$match', '$project', '$group'],
          correctAnswer: 0,
          concept: 'Aggregation Pipeline',
          points: 10
        },
        {
          questionId: `mongo_${qCounter++}`,
          skill: sName,
          type: 'scenario_architecture',
          difficulty: sLevel === 'Expert' ? 'Expert' : 'Advanced',
          question: 'According to the ESR (Equality, Sort, Range) rule, how should an index be defined for query { status: "active", age: { $gte: 21 } } sorted by createdAt: -1?',
          codeSnippet: '',
          options: [
            '{ status: 1, createdAt: -1, age: 1 }',
            '{ age: 1, status: 1, createdAt: -1 }',
            '{ createdAt: -1, status: 1, age: 1 }',
            '{ _id: 1, status: 1 }'
          ],
          correctAnswer: 0,
          concept: 'Compound Indexing & ESR Rule',
          points: 10
        },
        {
          questionId: `mongo_${qCounter++}`,
          skill: sName,
          type: 'practical_coding',
          difficulty: 'Advanced',
          question: 'How do you guarantee atomicity across multiple document updates in MongoDB?',
          codeSnippet: '',
          options: [
            'Using multi-document transactions with mongoose.startSession() and session.withTransaction()',
            'Calling Model.updateMany() without a session',
            'Executing parallel Promise.all([docA.save(), docB.save()])',
            'Setting writeConcern: 0'
          ],
          correctAnswer: 0,
          concept: 'ACID Transactions',
          points: 10
        }
      );
    } else {
      // Dynamic questions tailored to any custom or additional skill
      questions.push(
        {
          questionId: `${sLower}_${qCounter++}`,
          skill: sName,
          type: 'multiple_choice',
          difficulty: 'Intermediate',
          question: `What is a core architectural pattern and best practice when building production systems in ${sName}?`,
          codeSnippet: '',
          options: [
            `Modular decoupled components, clear state boundaries, and robust error handling in ${sName}`,
            'Writing monolithic single-file scripts without tests',
            'Hardcoding credentials and database connections directly in frontend markup',
            'Disabling exception handlers and error logging'
          ],
          correctAnswer: 0,
          concept: `${sName} Architecture`,
          points: 10
        },
        {
          questionId: `${sLower}_${qCounter++}`,
          skill: sName,
          type: 'debugging',
          difficulty: sLevel === 'Expert' ? 'Expert' : 'Advanced',
          question: `How should memory allocation and resource leakage be prevented when scaling ${sName} workloads?`,
          codeSnippet: '',
          options: [
            'Properly closing open sockets/handlers, using connection pools, and monitoring garbage collection',
            'Allocating infinite unbounded memory buffers on every request',
            'Restarting the server machine manually every 5 minutes',
            'Ignoring memory profiling diagnostics'
          ],
          correctAnswer: 0,
          concept: 'Resource Management',
          points: 10
        }
      );
    }
  });

  return {
    source: 'fallback-question-engine',
    questions
  };
};
