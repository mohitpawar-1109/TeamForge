import Project from '../models/Project.js';
import Task from '../models/Task.js';
import MentorMessage from '../models/MentorMessage.js';
import { calculateTeamSkillGap } from './match.service.js';

/**
 * TeamForge AI Project Mentor Service
 * Grounded in the project's real architecture, skills, tasks, and team composition.
 * Powered by Google Gemini with a context-aware deterministic reasoning engine fallback.
 */

// Suggested prompt templates customized per project
export const getSuggestedPrompts = (project, gapAnalysis) => {
  const missingCount = gapAnalysis?.missingSkills?.length || 0;
  return [
    {
      id: 'build_first',
      title: 'What should we build first?',
      subtitle: 'MVP roadmap & Sprint 1 milestones',
      icon: '🚀',
      prompt: 'What should we build first for our MVP, and what are the critical milestones?'
    },
    {
      id: 'technologies',
      title: 'What technologies should we use?',
      subtitle: 'Recommended stack & architecture',
      icon: '🛠️',
      prompt: 'What technologies and architectural patterns should we use for this project?'
    },
    {
      id: 'tasks_create',
      title: 'What tasks should we create?',
      subtitle: 'Actionable sprint backlog items',
      icon: '📋',
      prompt: 'What specific sprint tasks should we create across frontend, backend, and database?'
    },
    {
      id: 'missing_skills',
      title: missingCount > 0 ? `What skills are missing? (${missingCount})` : 'What skills are missing?',
      subtitle: 'Team gaps & recruiting priorities',
      icon: '🧩',
      prompt: 'What skills are currently missing or weak in our squad, and how should we address them?'
    },
    {
      id: 'project_structure',
      title: 'How should we structure the project?',
      subtitle: 'Clean codebase layout & design',
      icon: '🏗️',
      prompt: 'How should we structure our folder layout and module boundaries?'
    },
    {
      id: 'technical_risks',
      title: 'What are possible technical risks?',
      subtitle: 'Bottlenecks, security & rate limits',
      icon: '⚠️',
      prompt: 'What are the biggest technical risks and performance bottlenecks we should anticipate?'
    },
    {
      id: 'divide_tasks',
      title: 'How can we divide tasks among team members?',
      subtitle: 'Role & skill based allocation',
      icon: '👥',
      prompt: 'How can we divide the project tasks efficiently among our current team members?'
    }
  ];
};

/**
 * Extracts sanitized, privacy-safe context about the project.
 * Omits emails, passwords, auth tokens, and private contact info.
 */
export const buildPrivacySafeProjectContext = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('owner', 'name headline skills experienceLevel')
    .populate('members.user', 'name headline skills experienceLevel course year');

  if (!project) return null;

  const tasks = await Task.find({ project: projectId })
    .populate('assignedTo', 'name headline')
    .sort({ createdAt: -1 });

  // Calculate skill gap
  const gapAnalysis = calculateTeamSkillGap(project);

  // Sanitize team members info
  const sanitizedTeam = (project.members || []).map((m) => {
    const u = m.user || {};
    return {
      name: u.name || 'Student Member',
      assignedRole: m.role || 'Contributor',
      headline: u.headline || 'Developer',
      skills: (u.skills || []).map((s) => (typeof s === 'string' ? s : s.name)),
      experienceLevel: u.experienceLevel || 'Intermediate'
    };
  });

  // Include owner if not in members
  const ownerName = project.owner?.name || 'Project Creator';
  const ownerRole = 'Project Lead';

  // Sanitize tasks info
  const sanitizedTasks = tasks.map((t) => ({
    title: t.title,
    status: t.status,
    priority: t.priority,
    assignedTo: t.assignedTo?.name || 'Unassigned'
  }));

  const tasksStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'DONE').length,
    inProgress: tasks.filter((t) => t.status === 'IN PROGRESS').length,
    todo: tasks.filter((t) => t.status === 'TODO').length
  };

  return {
    projectId: project._id.toString(),
    title: project.title,
    description: project.description,
    category: project.category,
    difficulty: project.difficulty || 'Medium',
    duration: project.duration || '4-6 Weeks',
    status: project.status,
    progress: project.progress || 0,
    requiredSkills: project.requiredSkills || [],
    teamSizeTarget: project.teamSize,
    currentTeamCount: sanitizedTeam.length,
    owner: { name: ownerName, role: ownerRole },
    teamMembers: sanitizedTeam,
    tasksStats,
    tasks: sanitizedTasks,
    skillGap: {
      coveredSkills: gapAnalysis.coveredSkills,
      partialSkills: gapAnalysis.partialSkills,
      missingSkills: gapAnalysis.missingSkills,
      readinessScore: gapAnalysis.readinessScore
    },
    potentialChallenges: project.aiAnalysis?.potentialChallenges || []
  };
};

/**
 * Executes a question to the AI Mentor with conversation context.
 */
export const askProjectMentor = async ({ projectId, userId, prompt, history = [] }) => {
  const context = await buildPrivacySafeProjectContext(projectId);
  if (!context) {
    throw new Error('Project not found or inaccessible.');
  }

  // Save user's question to message history
  await MentorMessage.create({
    project: projectId,
    user: userId,
    role: 'user',
    content: prompt.trim()
  });

  let mentorResponseText = '';
  let responseSource = 'gemini-1.5-flash';

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const systemPrompt = `You are the TeamForge AI Project Mentor — an empathetic, pragmatic senior software architect and technical lead advising a student engineering team.

You have complete visibility into this project's real context below.

=== PROJECT CONTEXT ===
Project Title: "${context.title}"
Category: ${context.category} | Difficulty: ${context.difficulty} | Status: ${context.status} | Progress: ${context.progress}%
Description: "${context.description}"
Target Team Size: ${context.teamSizeTarget} | Current Members (${context.currentTeamCount}):
${context.teamMembers.map((m, i) => `  ${i + 1}. ${m.name} (${m.assignedRole}) - Skills: ${m.skills.join(', ') || 'General'}`).join('\n') || '  (No team members yet)'}

Required Project Skills: ${context.requiredSkills.join(', ') || 'None specified'}
Skill Gap Analysis:
  - Covered: ${context.skillGap.coveredSkills.join(', ') || 'None'}
  - Partially Covered: ${context.skillGap.partialSkills.join(', ') || 'None'}
  - Missing: ${context.skillGap.missingSkills.join(', ') || 'None'}
  - Team Readiness Score: ${context.skillGap.readinessScore}%

Current Tasks Summary (${context.tasksStats.total} total: ${context.tasksStats.completed} done, ${context.tasksStats.inProgress} in progress, ${context.tasksStats.todo} todo):
${context.tasks.slice(0, 10).map((t) => `  - [${t.status}] (${t.priority} Priority) "${t.title}" -> ${t.assignedTo}`).join('\n') || '  (No tasks created yet)'}

=== MENTOR GUIDELINES ===
1. Tailor your answer directly to "${context.title}". Reference specific team members, skills, and current tasks where appropriate.
2. Structure your response using rich Markdown: clear headings (###), bullet points, checklists (- [ ]), and code snippets when proposing architecture.
3. Be actionable, concise, and constructive. Avoid generic boilerplate.
4. Privacy: Do NOT mention or ask for private user secrets, keys, or passwords.
5. If answering "What should we build first?", provide a clear MVP Phase 1 vs Phase 2 breakdown.
6. If answering "What technologies should we use?", justify why each technology fits the project.
7. If answering "What tasks should we create?", list concrete, distinct tasks formatted as bullet points.
8. If answering "What skills are missing?", cite the exact missing skills (${context.skillGap.missingSkills.join(', ') || 'None'}) and how to handle them.
9. If answering "How can we divide tasks?", map assignments to current members: ${context.teamMembers.map((m) => m.name).join(', ') || 'the lead'}.
`;

      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt + `\n\nUser Question: "${prompt}"` }]
        }
      ];

      // Add recent conversation history if provided
      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-4);
        recentHistory.forEach((h) => {
          if (h.role && h.content) {
            contents.push({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: h.content }]
            });
          }
        });
        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          mentorResponseText = text.trim();
        }
      }
    } catch (err) {
      console.warn('[AI Mentor Service] Gemini call failed, utilizing deterministic mentor reasoning:', err.message);
    }
  }

  // Fallback to Context-Aware Deterministic Engine if Gemini didn't return text
  if (!mentorResponseText) {
    responseSource = 'deterministic-mentor-engine';
    mentorResponseText = generateDeterministicMentorAdvice(prompt, context);
  }

  // Save Assistant Response to Database
  const assistantMsg = await MentorMessage.create({
    project: projectId,
    user: userId,
    role: 'assistant',
    content: mentorResponseText,
    metadata: {
      source: responseSource,
      readinessScore: context.skillGap.readinessScore,
      timestamp: new Date()
    }
  });

  return {
    message: assistantMsg,
    source: responseSource,
    contextSummary: {
      title: context.title,
      readinessScore: context.skillGap.readinessScore,
      totalTasks: context.tasksStats.total,
      teamMembersCount: context.currentTeamCount,
      missingSkillsCount: context.skillGap.missingSkills.length
    }
  };
};

/**
 * Context-Aware Deterministic Project Mentor Engine
 * Provides rich, tailored markdown advice based directly on project data.
 */
export const generateDeterministicMentorAdvice = (prompt, context) => {
  const p = prompt.toLowerCase();
  const title = context.title;
  const reqSkills = context.requiredSkills.length > 0 ? context.requiredSkills.join(', ') : 'Standard Web Stack';
  const missing = context.skillGap.missingSkills;
  const covered = context.skillGap.coveredSkills;
  const members = context.teamMembers;

  // 1. What should we build first?
  if (p.includes('build first') || p.includes('mvp') || p.includes('start') || p.includes('priority')) {
    return `### 🚀 Recommended MVP Roadmap for **${title}**

To ensure your team stays focused and delivers a high-impact prototype, follow this phased execution plan:

#### **Phase 1: Core Foundation & Data Models (Week 1)**
- [ ] **Data Schema & Setup**: Define core collections/tables for \`${title}\` (Users, Projects, Core Entities).
- [ ] **Authentication & Security**: Implement JWT session management and role-based route guards.
- [ ] **API Contracts**: Establish clean REST/WebSocket endpoints between frontend and backend.

#### **Phase 2: The Core Hero Feature (Week 2)**
- [ ] **Primary User Flow**: Build the single most essential feature described in your project overview:
  > *"${context.description.substring(0, 140)}..."*
- [ ] **Interactive UI Mockups**: Create responsive cards, lists, and forms matching the TeamForge dark theme.
- [ ] **Real-Time Integration**: Wire up live status updates or data mutations.

#### **Phase 3: Polish & Hackathon Demo Readiness (Week 3)**
- [ ] **Edge-Case Validation**: Add error boundaries, empty states, and toast notifications.
- [ ] **Seed Demo Data**: Populate realistic showcase content for judging evaluations.
- [ ] **Performance Audit**: Ensure rapid sub-second page loads and seamless mobile adaptability.`;
  }

  // 2. What technologies should we use?
  if (p.includes('technolog') || p.includes('tech stack') || p.includes('framework') || p.includes('library') || p.includes('database')) {
    return `### 🛠️ Recommended Technology Stack for **${title}**

Based on your project category (**${context.category}**) and required skills (**${reqSkills}**), here is the optimal architectural stack:

#### **Frontend Architecture**
- **Framework**: \`React 18+\` with \`Vite\` for instant HMR and lightning-fast bundle optimization.
- **Styling & UI**: \`TailwindCSS\` with vanilla CSS tokens for a polished dark-mode palette.
- **Icons & Motion**: \`lucide-react\` for iconography and lightweight CSS micro-animations.
- **State & Networking**: Context API / Zustand + \`Axios\` with centralized interceptors.

#### **Backend & Data Layer**
- **Runtime**: \`Node.js\` with \`Express\` (or \`FastAPI / Python\` if heavy ML pipeline required).
- **Database**: \`MongoDB\` with \`Mongoose\` (flexible document schemas for rapid iterations).
- **Real-Time Layer**: \`Socket.IO\` for bi-directional presence, chatrooms, and live notifications.

#### **Why this stack fits your squad?**
- ${covered.length > 0 ? `Your team already possesses core strength in **${covered.join(', ')}**.` : 'Enables rapid end-to-end prototyping within tight university deadlines.'}
- Zero-config deployment readiness on standard cloud providers (Vercel, Render, Railway).`;
  }

  // 3. What tasks should we create?
  if (p.includes('tasks') || p.includes('backlog') || p.includes('create tasks') || p.includes('sprint')) {
    return `### 📋 Suggested Sprint Backlog for **${title}**

Here is a ready-to-use task breakdown you can add directly to your **Tasks Board**:

#### **Frontend Tasks**
1. **[High Priority]** Implement core dashboard and layout shells with navigation routing.
2. **[High Priority]** Build interactive forms for creating and managing \`${context.category}\` data.
3. **[Medium Priority]** Implement search filters and empty/loading state placeholders.

#### **Backend & Database Tasks**
1. **[High Priority]** Design Mongoose models with strict validation schemas.
2. **[High Priority]** Implement authenticated CRUD controllers with centralized error handling.
3. **[Medium Priority]** Setup WebSocket room events for instant team collaboration.

#### **Integration & QA Tasks**
1. **[Medium Priority]** Connect frontend API services with token refresh interceptors.
2. **[Low Priority]** End-to-end user journey test suite and demo data seeding.

> 💡 *Tip: Head over to the **Tasks** tab in your project to create and assign these to team members!*`;
  }

  // 4. What skills are missing?
  if (p.includes('missing') || p.includes('skill gap') || p.includes('recruit') || p.includes('weakness')) {
    if (missing.length === 0) {
      return `### 🌟 Squad Skill Readiness: **100% Fully Covered!**

Awesome news! Your current team composition comprehensively covers all project requirements:
- **Covered Skills**: ${covered.join(', ') || 'All essentials covered'}
- **Readiness Score**: **${context.skillGap.readinessScore}%**

#### **Recommendations to stay ahead:**
1. **Deepen Specialization**: Encourage members to focus on performance tuning and unit testing.
2. **Cross-Pairing**: Pair backend and frontend developers during sprint integration.`;
    }

    return `### 🧩 Skill Gap Analysis for **${title}**

Your team currently has **${missing.length} missing skill(s)** that could slow down development:

#### **Missing Critical Skills:**
${missing.map((s) => `- ❌ **${s}**: No current member possesses verified mastery in this domain.`).join('\n')}

${context.skillGap.partialSkills.length > 0 ? `#### **Partially Covered Skills:**\n${context.skillGap.partialSkills.map((s) => `- ⚠️ **${s}**: Foundational knowledge present, but would benefit from deeper reinforcement.`).join('\n')}` : ''}

#### **How to close these gaps:**
1. **Recruit from TeamForge**: Head to **Explore Matches** to invite students who specialize in **${missing.slice(0, 2).join(' & ')}**.
2. **Upskilling Path**: Utilize modular open-source libraries to abstract complex low-level implementations.
3. **API Simplification**: Use managed services or pre-trained models to bridge specialized AI/infrastructure requirements.`;
  }

  // 5. How should we structure the project?
  if (p.includes('structure') || p.includes('folder') || p.includes('architecture') || p.includes('organize')) {
    return `### 🏗️ Recommended Architecture & Directory Layout

To maintain high code quality and prevent merge conflicts across team members, organize **${title}** as a modular monorepo:

\`\`\`
${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}/
├── backend/
│   ├── config/          # Database & third-party API configs
│   ├── controllers/     # Route logic & request validators
│   ├── middleware/      # Auth (JWT), error handlers, rate limiters
│   ├── models/          # Mongoose DB schema definitions
│   ├── routes/          # Express API route declarations
│   ├── services/        # Business logic & AI/ML processing
│   ├── socket/          # Socket.IO event handlers & rooms
│   └── server.js        # Server entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components (buttons, modals, cards)
│   │   ├── context/     # Global state (AuthContext, SocketContext)
│   │   ├── layouts/     # MainLayout, Sidebar, Navbar
│   │   ├── pages/       # Route views (Dashboard, ProjectDetails)
│   │   ├── services/    # Axios API client functions
│   │   └── App.jsx      # React router setup
│   └── package.json
└── README.md
\`\`\`

#### **Architectural Principles:**
- **Separation of Concerns**: Controllers only handle HTTP status codes; core calculations belong in \`services/\`.
- **Reusable Component Atoms**: Keep buttons, inputs, and badges generic in \`components/common/\`.`;
  }

  // 6. What are possible technical risks?
  if (p.includes('risk') || p.includes('challenge') || p.includes('bottleneck') || p.includes('security') || p.includes('pitfall')) {
    return `### ⚠️ Top Technical Risks & Mitigation Strategies for **${title}**

Anticipating these hurdles early will prevent last-minute hackathon blockers:

1. **State Synchronization & Race Conditions**
   - *Risk*: Multiple team members editing shared data simultaneously leading to stale UI state.
   - *Mitigation*: Leverage optimistic UI updates with rollback handlers and server-driven WebSocket events.

2. **Database Query Latency**
   - *Risk*: Unindexed queries on large collections causing slow response times.
   - *Mitigation*: Index critical query paths (e.g. \`{ project: 1, user: 1 }\`) and use projection (\`.select('-password')\`).

3. **Authentication & Authorization Oversights**
   - *Risk*: Users modifying tasks or resources belonging to other teams.
   - *Mitigation*: Validate resource ownership at the controller level before executing mutations.

4. **Scope Creep vs Timeline**
   - *Risk*: Spending too much time on auxiliary features rather than the core value proposition.
   - *Mitigation*: Strictly enforce the Phase 1 MVP checklist before starting secondary integrations.`;
  }

  // 7. How can we divide tasks among team members?
  if (p.includes('divide') || p.includes('assign') || p.includes('member') || p.includes('team') || p.includes('allocation')) {
    if (members.length === 0) {
      return `### 👥 Task Division Strategy for **${title}**

Currently, no additional team members have joined. As the **Project Lead**, here is how to structure responsibilities as you recruit:

1. **Project Lead / Full Stack**: Focus on core database models, API design, and main screen wireframes.
2. **Frontend Specialist (To Recruit)**: UI component library, state management, responsive styling.
3. **Backend / Data Specialist (To Recruit)**: Business logic algorithms, database indexing, testing.`;
    }

    return `### 👥 Recommended Task Division for Your Squad

Here is an optimal workload distribution tailored to your current team members' declared strengths:

${members.map((m, idx) => `#### **${idx + 1}. ${m.name}** — \`${m.assignedRole}\`
- **Primary Domain**: ${m.skills.slice(0, 3).join(', ') || 'General Development'} (${m.experienceLevel})
- **Recommended Assignments**:
  - Lead development on components aligning with ${m.skills[0] || 'core modules'}.
  - Code review and integration validation for assigned sprint tasks.`).join('\n\n')}

#### **Collaboration Tips:**
- Hold a **5-minute async daily standup** in your squad group chat.
- Tag tasks with clear priorities (\`High\`, \`Medium\`, \`Low\`) so blockers are addressed immediately.`;
  }

  // Default General Project Mentor Advice
  return `### 💡 Mentor Insights for **${title}**

Thank you for reaching out! Regarding your inquiry: **"${prompt}"**

Here is my architectural assessment based on **${title}** (${context.category} • ${context.progress}% progress):

1. **Strategic Focus**: Keep your core feature set lean and deliver an intuitive end-to-end user experience.
2. **Current Squad State**: Your team currently has **${members.length} members** and **${context.tasksStats.total} defined tasks** with a readiness score of **${context.skillGap.readinessScore}%**.
3. **Next Action Item**: Check out the suggested prompt buttons below to explore sprint backlogs, risk assessments, or tech stack recommendations tailored for this project!`;
};
