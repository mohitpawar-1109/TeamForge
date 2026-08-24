import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Message from '../models/Message.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import SkillAssessment from '../models/SkillAssessment.js';
import SkillVerification from '../models/SkillVerification.js';
import UserFeedback from '../models/UserFeedback.js';
import ProjectFeedback from '../models/ProjectFeedback.js';

// Predefined Curated Question Banks across multiple skills & difficulty tiers
const SEED_QUESTIONS = {
  react: [
    {
      id: 'react-1',
      type: 'multiple_choice',
      difficulty: 'Beginner',
      question: 'Which Hook should you use in React to manage local component state?',
      codeSnippet: '',
      options: ['useEffect', 'useState', 'useContext', 'useMemo'],
      correctAnswerIndex: 1,
      explanation: 'useState is the primary React Hook for declaring and updating component state variables.',
      category: 'Hooks'
    },
    {
      id: 'react-2',
      type: 'code_output',
      difficulty: 'Intermediate',
      question: 'What will be logged to the console when the button is clicked twice in rapid succession?',
      codeSnippet: `function Counter() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
  };
  return <button onClick={handleClick}>{count}</button>;
}`,
      options: ['count will increment by 2', 'count will increment by 1 due to batching with stale state closure', 'Throws an error', 'Undefined behavior'],
      correctAnswerIndex: 1,
      explanation: 'Because count is passed as value rather than updater function setCount(c => c + 1), both calls close over the same initial count value.',
      category: 'State Management'
    },
    {
      id: 'react-3',
      type: 'debugging',
      difficulty: 'Intermediate',
      question: 'Identify the bug that causes an infinite re-render loop in this component:',
      codeSnippet: `function UserList() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetchUsers().then(data => setUsers(data));
  });
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}`,
      options: [
        'Missing dependency array in useEffect',
        'setUsers should be async',
        'Missing key on li elements',
        'fetchUsers must be called inside useMemo'
      ],
      correctAnswerIndex: 0,
      explanation: 'Omitting the dependency array causes useEffect to run on every single render, triggering setUsers and an infinite loop.',
      category: 'Debugging & Lifecycle'
    },
    {
      id: 'react-4',
      type: 'practical_coding',
      difficulty: 'Advanced',
      question: 'Which implementation prevents unnecessary re-creation of an expensive computed object between renders when props change?',
      codeSnippet: `// Approach A: const val = computeHeavyData(props.list);
// Approach B: const val = useMemo(() => computeHeavyData(props.list), [props.list]);
// Approach C: const val = useCallback(() => computeHeavyData(props.list), [props.list]);
// Approach D: const val = useRef(computeHeavyData(props.list));`,
      options: ['Approach A', 'Approach B', 'Approach C', 'Approach D'],
      correctAnswerIndex: 1,
      explanation: 'useMemo caches the result of expensive calculations across renders until dependencies change.',
      category: 'Performance Optimization'
    },
    {
      id: 'react-5',
      type: 'scenario_architecture',
      difficulty: 'Expert',
      question: 'In a high-scale React application experiencing frequent tearing and UI lag during concurrent data streaming, which architecture best decouples non-urgent UI updates?',
      codeSnippet: '',
      options: [
        'Wrap updates in useTransition or useDeferredValue to prioritize urgent user interactions',
        'Move all state to global window variables',
        'Force synchronous rendering using flushSync everywhere',
        'Replace all React context providers with local prop drilling'
      ],
      correctAnswerIndex: 0,
      explanation: 'React Concurrent features like useTransition and useDeferredValue mark background transitions as interruptible, avoiding UI jank.',
      category: 'Architecture & Concurrency'
    }
  ],
  nodejs: [
    {
      id: 'node-1',
      type: 'multiple_choice',
      difficulty: 'Beginner',
      question: 'Which core module in Node.js provides asynchronous file system operations?',
      codeSnippet: '',
      options: ['path', 'fs or fs/promises', 'http', 'os'],
      correctAnswerIndex: 1,
      explanation: 'The fs module provides both callback and promise-based file system APIs in Node.js.',
      category: 'Core APIs'
    },
    {
      id: 'node-2',
      type: 'code_output',
      difficulty: 'Intermediate',
      question: 'What is the order of execution in the Node.js event loop for the following code?',
      codeSnippet: `console.log('1');
setTimeout(() => console.log('2'), 0);
process.nextTick(() => console.log('3'));
Promise.resolve().then(() => console.log('4'));
console.log('5');`,
      options: ['1, 5, 3, 4, 2', '1, 5, 2, 3, 4', '1, 2, 3, 4, 5', '1, 5, 4, 3, 2'],
      correctAnswerIndex: 0,
      explanation: 'Synchronous (1, 5) runs first, then nextTick microtasks (3), then Promise microtasks (4), then timers (2).',
      category: 'Event Loop & Concurrency'
    },
    {
      id: 'node-3',
      type: 'debugging',
      difficulty: 'Advanced',
      question: 'Why does this Express middleware sequence cause requests to hang indefinitely?',
      codeSnippet: `app.use((req, res, next) => {
  if (req.headers.authorization) {
    validateToken(req.headers.authorization);
  }
});`,
      options: [
        'next() is never called to pass control to the next handler',
        'validateToken must return a string',
        'Headers cannot be inspected in middleware',
        'app.use requires an explicit path parameter'
      ],
      correctAnswerIndex: 0,
      explanation: 'If a middleware does not send a response (e.g. res.status(...)) or invoke next(), the request stays open and hangs.',
      category: 'Express Architecture'
    },
    {
      id: 'node-4',
      type: 'practical_coding',
      difficulty: 'Advanced',
      question: 'Which method properly handles backpressure when streaming large files over HTTP in Node.js?',
      codeSnippet: `const readStream = fs.createReadStream(largeFilePath);
// How to pipe safely to response?`,
      options: [
        'readStream.pipe(res) or stream.pipeline(readStream, res, callback)',
        'fs.readFileSync and res.send',
        'readStream.on("data", chunk => res.write(chunk)) without drain listener',
        'JSON.stringify(readStream)'
      ],
      correctAnswerIndex: 0,
      explanation: 'pipeline or pipe handles stream pauses, chunk buffering, and backpressure automatically.',
      category: 'Streams & Performance'
    },
    {
      id: 'node-5',
      type: 'scenario_architecture',
      difficulty: 'Expert',
      question: 'To scale a CPU-bound image processing microservice without blocking the main event loop in a Node.js cluster, which strategy is optimal?',
      codeSnippet: '',
      options: [
        'Offload processing to Worker Threads or a distributed background job queue (e.g. BullMQ / Redis)',
        'Increase Node.js heap memory to 8GB with --max-old-space-size',
        'Execute synchronous loops inside setTimeout blocks',
        'Use sync while loops in process.nextTick'
      ],
      correctAnswerIndex: 0,
      explanation: 'Worker Threads and queue workers prevent heavy CPU tasks from starving the main I/O event loop.',
      category: 'Scalability & System Design'
    }
  ],
  mongodb: [
    {
      id: 'mongo-1',
      type: 'multiple_choice',
      difficulty: 'Beginner',
      question: 'Which method returns a single document matching a query in MongoDB/Mongoose?',
      codeSnippet: '',
      options: ['Model.find()', 'Model.findOne()', 'Model.lookup()', 'Model.getDoc()'],
      correctAnswerIndex: 1,
      explanation: 'findOne returns the first matching document as an object rather than an array.',
      category: 'Queries'
    },
    {
      id: 'mongo-2',
      type: 'practical_coding',
      difficulty: 'Intermediate',
      question: 'Which aggregation pipeline stage is used to perform a left outer join with another collection?',
      codeSnippet: '',
      options: ['$lookup', '$match', '$group', '$project'],
      correctAnswerIndex: 0,
      explanation: '$lookup performs an equality match or pipeline join with documents in another collection.',
      category: 'Aggregation Pipeline'
    },
    {
      id: 'mongo-3',
      type: 'debugging',
      difficulty: 'Advanced',
      question: 'A query { status: "active", createdAt: { $gte: date } } is slow on 1M documents. Which compound index satisfies this query with optimal ESR rule?',
      codeSnippet: '',
      options: [
        '{ status: 1, createdAt: -1 }',
        '{ createdAt: 1 } only',
        '{ description: "text" }',
        '{ _id: 1, name: 1 }'
      ],
      correctAnswerIndex: 0,
      explanation: 'ESR (Equality, Sort, Range): Equality field status comes first, followed by Range/Sort field createdAt.',
      category: 'Indexing & Performance'
    },
    {
      id: 'mongo-4',
      type: 'scenario_architecture',
      difficulty: 'Expert',
      question: 'In a multi-document financial transaction where balances across two accounts must update atomically, which Mongoose pattern is required?',
      codeSnippet: '',
      options: [
        'Use session = await mongoose.startSession(); session.withTransaction(...)',
        'Two sequential Model.updateOne() calls',
        'Save both models in Promise.all() without a session',
        'Use $push operator on both models'
      ],
      correctAnswerIndex: 0,
      explanation: 'MongoDB replica set transactions via sessions guarantee ACID properties across multiple documents.',
      category: 'Transactions & Integrity'
    }
  ],
  typescript: [
    {
      id: 'ts-1',
      type: 'multiple_choice',
      difficulty: 'Beginner',
      question: 'Which keyword creates a reusable generic type constraint in TypeScript?',
      codeSnippet: 'function identity<T extends Lengthwise>(arg: T): T',
      options: ['implements', 'extends', 'instanceof', 'typeof'],
      correctAnswerIndex: 1,
      explanation: 'extends is used in generic type parameter definitions to constrain the allowed types.',
      category: 'Generics'
    },
    {
      id: 'ts-2',
      type: 'code_output',
      difficulty: 'Intermediate',
      question: 'What is the resulting type of Partial<Pick<User, "id" | "name">>?',
      codeSnippet: 'interface User { id: string; name: string; email: string; }',
      options: [
        '{ id?: string; name?: string; }',
        '{ id: string; name: string; email?: string; }',
        'any',
        '{ email: string }'
      ],
      correctAnswerIndex: 0,
      explanation: 'Pick extracts id and name, and Partial makes both properties optional.',
      category: 'Utility Types'
    },
    {
      id: 'ts-3',
      type: 'practical_coding',
      difficulty: 'Advanced',
      question: 'Which TypeScript pattern enables discriminating unions for type-safe state handling?',
      codeSnippet: `type Result = 
  | { status: 'success'; data: string }
  | { status: 'error'; error: Error };`,
      options: [
        'Adding a common literal discriminator property (e.g. status)',
        'Casting with as any',
        'Using typeof on undefined variables',
        'Declaring ambient modules'
      ],
      correctAnswerIndex: 0,
      explanation: 'Discriminated unions use a common literal property allowing TypeScript to narrow the branch automatically.',
      category: 'Type Narrowing'
    }
  ],
  python: [
    {
      id: 'py-1',
      type: 'multiple_choice',
      difficulty: 'Beginner',
      question: 'Which data structure in Python guarantees unique, unordered elements?',
      codeSnippet: '',
      options: ['list', 'tuple', 'set', 'dict'],
      correctAnswerIndex: 2,
      explanation: 'A set is an unordered collection of distinct hashable items.',
      category: 'Data Structures'
    },
    {
      id: 'py-2',
      type: 'code_output',
      difficulty: 'Intermediate',
      question: 'What is the output of the following list comprehension?',
      codeSnippet: `nums = [1, 2, 3, 4, 5]
sq = [x * 2 for x in nums if x % 2 != 0]
print(sq)`,
      options: ['[2, 6, 10]', '[4, 8]', '[1, 3, 5]', '[2, 4, 6, 8, 10]'],
      correctAnswerIndex: 0,
      explanation: 'Odd numbers are 1, 3, 5. Doubled they produce 2, 6, 10.',
      category: 'Functional Idioms'
    },
    {
      id: 'py-3',
      type: 'debugging',
      difficulty: 'Advanced',
      question: 'What bug exists when using mutable default arguments in Python functions?',
      codeSnippet: `def add_item(item, target_list=[]):
    target_list.append(item)
    return target_list`,
      options: [
        'target_list is shared across all function calls, persisting previous items',
        'Python syntax forbids brackets in defaults',
        'append returns a new list',
        'item must be a string'
      ],
      correctAnswerIndex: 0,
      explanation: 'Default arguments are evaluated once at definition time, so the same list instance is mutated across calls.',
      category: 'Language Gotchas'
    }
  ]
};

/**
 * Generate/retrieve randomized assessment questions tailored to claimed difficulty
 */
export const getAssessmentQuestionsForSkill = async (skillName, claimedLevel = 'Intermediate') => {
  const normSkill = (skillName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  let baseList = [];
  if (normSkill.includes('react')) baseList = SEED_QUESTIONS.react;
  else if (normSkill.includes('node') || normSkill.includes('express')) baseList = SEED_QUESTIONS.nodejs;
  else if (normSkill.includes('mongo') || normSkill.includes('database')) baseList = SEED_QUESTIONS.mongodb;
  else if (normSkill.includes('type') || normSkill.includes('ts')) baseList = SEED_QUESTIONS.typescript;
  else if (normSkill.includes('pyth') || normSkill.includes('django') || normSkill.includes('flask')) baseList = SEED_QUESTIONS.python;
  else {
    // Dynamic universal software engineering assessment tailored to skill
    baseList = [
      {
        id: `${normSkill}-1`,
        type: 'multiple_choice',
        difficulty: 'Beginner',
        question: `What is the core paradigm and primary use case of ${skillName}?`,
        codeSnippet: '',
        options: [
          `Building reliable software components and scalable workflows in ${skillName}`,
          'Hardware assembly only',
          'Managing low-level CPU registers exclusively',
          'Unrelated to software development'
        ],
        correctAnswerIndex: 0,
        explanation: `${skillName} is utilized for modern software applications and system architecture.`,
        category: 'Core Concepts'
      },
      {
        id: `${normSkill}-2`,
        type: 'code_output',
        difficulty: 'Intermediate',
        question: `In standard ${skillName} architecture, how should error handling and unhandled rejections be structured?`,
        codeSnippet: `try {\n  await executeOperation();\n} catch (err) {\n  logger.error(err);\n  throw new AppError("Operation failed", 500);\n}`,
        options: [
          'Catching errors, logging with context, and re-throwing standardized operational errors',
          'Silently ignoring all exceptions',
          'Terminating the server process immediately on every minor validation fault',
          'Returning undefined without error headers'
        ],
        correctAnswerIndex: 0,
        explanation: 'Standardized operational error handling ensures resilience and clear client diagnostics.',
        category: 'Error Handling'
      },
      {
        id: `${normSkill}-3`,
        type: 'practical_coding',
        difficulty: claimedLevel === 'Expert' ? 'Expert' : 'Advanced',
        question: `When deploying production services in ${skillName}, which design pattern minimizes latency under heavy concurrent loads?`,
        codeSnippet: '',
        options: [
          'Asynchronous non-blocking I/O with caching layers and connection pooling',
          'Synchronous file read loops per user request',
          'Hardcoding single database connections without pool limits',
          'Infinite retry loops without backoff'
        ],
        correctAnswerIndex: 0,
        explanation: 'Connection pooling and caching mitigate bottleneck latency in high-concurrency architectures.',
        category: 'Production Architecture'
      }
    ];
  }

  // Adaptive difficulty filtering: If claimed 'Expert', ensure advanced & expert questions are prioritized
  let selected = [...baseList];
  if (claimedLevel === 'Expert' || claimedLevel === 'Advanced') {
    selected.sort((a, b) => (b.difficulty === 'Expert' || b.difficulty === 'Advanced' ? 1 : -1));
  }

  // Shuffle and sanitize questions (remove correctAnswerIndex from client payload)
  const sanitized = selected.map((q, idx) => {
    return {
      id: q.id,
      index: idx,
      type: q.type,
      difficulty: q.difficulty,
      question: q.question,
      codeSnippet: q.codeSnippet || '',
      options: q.options,
      category: q.category,
      points: q.points || 10
    };
  });

  return {
    rawQuestions: selected,
    clientQuestions: sanitized
  };
};

/**
 * Skill Authenticity Engine
 * Computes multi-signal confidence: Test Score + Practical Score + Project Evidence + Consistency
 */
export const evaluateSkillAuthenticity = async ({
  userId,
  skillName,
  claimedLevel = 'Intermediate',
  userAnswers = [], // [{ questionId, selectedOptionIndex }]
  durationSeconds = 0
}) => {
  const normSkill = (skillName || '').trim().toLowerCase();

  // 1. Fetch Question Set for validation
  const { rawQuestions } = await getAssessmentQuestionsForSkill(skillName, claimedLevel);

  let totalPoints = 0;
  let earnedPoints = 0;
  let practicalPointsTotal = 0;
  let practicalPointsEarned = 0;

  const strongCategories = new Set();
  const weakCategories = new Set();

  rawQuestions.forEach((q) => {
    const pts = q.points || 10;
    totalPoints += pts;

    const isPractical = q.type === 'practical_coding' || q.type === 'debugging' || q.type === 'scenario_architecture';
    if (isPractical) practicalPointsTotal += pts;

    const answer = userAnswers.find((a) => a.questionId === q.id || a.id === q.id);
    if (answer && Number(answer.selectedOptionIndex) === q.correctAnswerIndex) {
      earnedPoints += pts;
      if (isPractical) practicalPointsEarned += pts;
      if (q.category) strongCategories.add(q.category);
    } else {
      if (q.category) weakCategories.add(q.category);
    }
  });

  const testScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const practicalScore = practicalPointsTotal > 0 ? Math.round((practicalPointsEarned / practicalPointsTotal) * 100) : testScore;

  // 2. Discover Real Project Evidence in TeamForge Database
  const [createdProjects, joinedProjects, completedTasks] = await Promise.all([
    Project.find({ owner: userId }).select('title requiredSkills category members').lean(),
    Project.find({ 'members.user': userId, owner: { $ne: userId } }).select('title requiredSkills category members').lean(),
    Task.find({ assignedTo: userId, status: 'DONE' }).select('title project').lean()
  ]);

  const allProjects = [...createdProjects, ...joinedProjects];
  const projectEvidence = [];

  allProjects.forEach((proj) => {
    const hasSkill = (proj.requiredSkills || []).some(
      (s) => s.toLowerCase().includes(normSkill) || normSkill.includes(s.toLowerCase())
    );
    if (hasSkill) {
      const pTasks = completedTasks.filter((t) => t.project?.toString() === proj._id.toString()).length;
      projectEvidence.push({
        project: proj._id,
        title: proj.title,
        tasksCompleted: pTasks,
        verifiedAt: new Date()
      });
    }
  });

  const projectEvidenceBonus = Math.min(100, projectEvidence.length * 35 + completedTasks.length * 5);

  // 3. Consistency Analysis: Compare claimed vs test performance
  let claimedTarget = 75;
  if (claimedLevel === 'Expert') claimedTarget = 90;
  else if (claimedLevel === 'Advanced') claimedTarget = 80;
  else if (claimedLevel === 'Intermediate') claimedTarget = 65;
  else if (claimedLevel === 'Beginner') claimedTarget = 50;

  const scoreDiff = testScore - claimedTarget;
  let consistencyScore = 80;
  if (scoreDiff >= 0) {
    consistencyScore = 95;
  } else if (scoreDiff >= -15) {
    consistencyScore = 75;
  } else {
    consistencyScore = Math.max(30, 70 - Math.abs(scoreDiff));
  }

  // 4. Multi-Signal Verified Confidence Calculation
  const verifiedConfidence = Math.min(
    99,
    Math.max(
      15,
      Math.round(
        testScore * 0.45 +
        practicalScore * 0.25 +
        Math.min(100, projectEvidenceBonus) * 0.15 +
        consistencyScore * 0.15
      )
    )
  );

  // 5. Determine Verified Level & Verification Status
  let verifiedLevel = 'Beginner';
  if (testScore >= 88 && verifiedConfidence >= 82) verifiedLevel = 'Expert';
  else if (testScore >= 74 && verifiedConfidence >= 70) verifiedLevel = 'Advanced';
  else if (testScore >= 58 && verifiedConfidence >= 55) verifiedLevel = 'Intermediate';
  else if (testScore >= 40) verifiedLevel = 'Beginner';
  else verifiedLevel = 'Unverified';

  let status = 'UNVERIFIED';
  if (testScore >= 72 && verifiedConfidence >= 70) {
    status = 'VERIFIED';
  } else if (testScore >= 52) {
    status = 'PARTIALLY_VERIFIED';
  } else if (claimedLevel === 'Expert' || claimedLevel === 'Advanced') {
    status = 'NEEDS_MORE_EVIDENCE';
  } else {
    status = 'UNVERIFIED';
  }

  // Constructive feedback formulation
  const strongAreas = Array.from(strongCategories);
  if (strongAreas.length === 0) strongAreas.push('Core fundamental concepts');

  const improvements = Array.from(weakCategories);
  if (improvements.length === 0) improvements.push('Continuous practical application and edge-case testing');

  return {
    testScore,
    practicalScore,
    consistencyScore,
    verifiedConfidence,
    claimedLevel,
    verifiedLevel,
    status,
    strongAreas,
    improvements,
    projectEvidence,
    durationSeconds
  };
};

/**
 * Transparent Multi-Factor User Trust & Reputation Profile
 */
export const calculateUserTrustProfile = async (userId) => {
  const [
    user,
    verifications,
    createdProjects,
    joinedProjects,
    completedTasks,
    totalTasks,
    userFeedbacks,
    postsCount,
    commentsCount
  ] = await Promise.all([
    User.findById(userId).select('name email experienceLevel pastProjectsCount contributionsCount weeklyHours').lean(),
    SkillVerification.find({ user: userId }).lean(),
    Project.find({ owner: userId }).select('status createdAt').lean(),
    Project.find({ 'members.user': userId, owner: { $ne: userId } }).select('status createdAt').lean(),
    Task.find({ assignedTo: userId, status: 'DONE' }).select('_id priority').lean(),
    Task.countDocuments({ assignedTo: userId }),
    UserFeedback.find({ recipient: userId }).lean(),
    Post.countDocuments({ author: userId }),
    Comment.countDocuments({ author: userId })
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  // 1. Skill Verification Score (Average confidence of all verified skills)
  const verifiedList = verifications.filter((v) => v.status === 'VERIFIED' || v.status === 'PARTIALLY_VERIFIED');
  let skillVerificationScore = 50;
  if (verifiedList.length > 0) {
    const sum = verifiedList.reduce((acc, v) => acc + (v.verifiedConfidence || 75), 0);
    skillVerificationScore = Math.min(100, Math.round(sum / verifiedList.length));
  } else if (verifications.length > 0) {
    skillVerificationScore = Math.min(100, Math.round(verifications.reduce((a, b) => a + b.testScore, 0) / verifications.length));
  }

  // 2. Project Contribution Score
  const totalProjects = createdProjects.length + joinedProjects.length + (user.pastProjectsCount || 0);
  const completedTasksCount = completedTasks.length;
  const projectContributionScore = Math.min(100, Math.max(40, 50 + totalProjects * 10 + completedTasksCount * 5));

  // 3. Team Reliability Score (Tasks completion ratio & feedback reliability)
  let teamReliabilityScore = 80;
  if (totalTasks > 0) {
    const taskRatio = completedTasksCount / totalTasks;
    teamReliabilityScore = Math.min(100, Math.round(taskRatio * 100));
  }
  if (userFeedbacks.length > 0) {
    const avgRel = userFeedbacks.reduce((acc, f) => acc + f.reliability, 0) / userFeedbacks.length;
    teamReliabilityScore = Math.round((teamReliabilityScore + (avgRel / 5) * 100) / 2);
  }

  // 4. Peer Feedback Score
  let peerFeedbackScore = 85;
  if (userFeedbacks.length > 0) {
    const totalAvgStars = userFeedbacks.reduce((acc, f) => {
      const mean = (f.technicalSkills + f.communication + f.reliability + f.contribution) / 4;
      return acc + mean;
    }, 0) / userFeedbacks.length;
    peerFeedbackScore = Math.min(100, Math.round((totalAvgStars / 5) * 100));
  }

  // 5. Community Contribution Score
  const communityPoints = postsCount * 12 + commentsCount * 6 + (user.contributionsCount || 0) * 2;
  const communityContributionScore = Math.min(100, Math.max(35, 40 + communityPoints));

  // Overall Trust Score (0-100)
  const rawTrust =
    skillVerificationScore * 0.30 +
    projectContributionScore * 0.25 +
    teamReliabilityScore * 0.20 +
    peerFeedbackScore * 0.15 +
    communityContributionScore * 0.10;

  const overallTrustScore = Math.min(99, Math.max(30, Math.round(rawTrust)));

  let tier = 'Developing';
  if (overallTrustScore >= 90) tier = 'Highly Trusted Contributor';
  else if (overallTrustScore >= 75) tier = 'Trusted Contributor';
  else if (overallTrustScore >= 60) tier = 'Established';
  else if (overallTrustScore >= 40) tier = 'Developing';
  else tier = 'New / Insufficient Evidence';

  return {
    userId,
    userName: user.name,
    overallTrustScore,
    tier,
    breakdown: {
      skillVerification: skillVerificationScore,
      projectContribution: projectContributionScore,
      teamReliability: teamReliabilityScore,
      peerFeedback: peerFeedbackScore,
      communityContribution: communityContributionScore
    },
    metrics: {
      verifiedSkillsCount: verifiedList.length,
      totalVerifications: verifications.length,
      totalProjects,
      completedTasks: completedTasksCount,
      peerReviewsCount: userFeedbacks.length
    },
    feedbacks: userFeedbacks
  };
};

/**
 * Project Credibility Engine
 * Calculates 0-100 Credibility based on verified contributors, completed tasks, activity, and peer reviews
 */
export const calculateProjectCredibility = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email avatar skills')
    .populate('members.user', 'name email avatar skills')
    .lean();

  if (!project) {
    throw new Error('Project not found');
  }

  const allMemberIds = [
    project.owner?._id || project.owner,
    ...(project.members || []).map((m) => m.user?._id || m.user)
  ].filter(Boolean);

  const [completedTasksCount, totalTasksCount, projectFeedbacks, verifications, messageCount] = await Promise.all([
    Task.countDocuments({ project: projectId, status: 'DONE' }),
    Task.countDocuments({ project: projectId }),
    ProjectFeedback.find({ project: projectId }).populate('author', 'name avatar').lean(),
    SkillVerification.find({ user: { $in: allMemberIds }, status: 'VERIFIED' }).lean(),
    Message.countDocuments({ project: projectId })
  ]);

  // 1. Verified Contributors Score (Ratio of members with at least 1 verified skill)
  const verifiedMemberIds = new Set(verifications.map((v) => v.user.toString()));
  const verifiedMembersCount = allMemberIds.filter((id) => verifiedMemberIds.has(id.toString())).length;
  const verifiedContributorsScore = allMemberIds.length > 0
    ? Math.round((verifiedMembersCount / allMemberIds.length) * 100)
    : 70;

  // 2. Task Completion Progress
  const taskProgressScore = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 65;

  // 3. Project Feedback Score
  let feedbackScore = 85;
  if (projectFeedbacks.length > 0) {
    const avgRating = projectFeedbacks.reduce((acc, f) => {
      const avg = (f.technicalQuality + f.communication + f.reliability + f.contribution + f.documentation + f.problemSolving) / 6;
      return acc + avg;
    }, 0) / projectFeedbacks.length;
    feedbackScore = Math.min(100, Math.round((avgRating / 5) * 100));
  }

  // 4. Activity & Collaboration Factor
  const activityScore = Math.min(100, Math.max(50, 60 + messageCount * 2 + completedTasksCount * 5));

  // Overall Credibility Score (0-100)
  const rawCredibility =
    verifiedContributorsScore * 0.35 +
    taskProgressScore * 0.25 +
    feedbackScore * 0.25 +
    activityScore * 0.15;

  const credibilityScore = Math.min(99, Math.max(35, Math.round(rawCredibility)));

  return {
    projectId,
    projectTitle: project.title,
    credibilityScore,
    tier: credibilityScore >= 88 ? 'Gold Verified Project' : credibilityScore >= 75 ? 'Verified Project' : 'Emerging Project',
    breakdown: {
      verifiedContributors: verifiedContributorsScore,
      taskExecution: taskProgressScore,
      peerReviews: feedbackScore,
      collaborationActivity: activityScore
    },
    stats: {
      totalMembers: allMemberIds.length,
      verifiedMembersCount,
      completedTasks: completedTasksCount,
      totalTasks: totalTasksCount,
      reviewsCount: projectFeedbacks.length
    },
    feedbacks: projectFeedbacks
  };
};
