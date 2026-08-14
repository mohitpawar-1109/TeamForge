import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Invitation from '../models/Invitation.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

dotenv.config();

const usersData = [
  {
    name: "Mohit",
    email: "mohit@teamforge.app",
    password: "Demo@123",
    headline: "Full Stack Developer & Systems Architect",
    college: "Stanford University",
    course: "Computer Science",
    year: "3rd Year",
    location: "Palo Alto, CA",
    bio: "Building high-performance full-stack web applications and AI tools. Passionate about developer tooling and hackathons.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "React", proficiency: "Expert", category: "Frontend", verified: true },
      { name: "Node.js", proficiency: "Advanced", category: "Backend", verified: true },
      { name: "MongoDB", proficiency: "Advanced", category: "Database", verified: true },
      { name: "TypeScript", proficiency: "Intermediate", category: "Languages", verified: false },
      { name: "Tailwind CSS", proficiency: "Expert", category: "Frontend", verified: true }
    ],
    interests: ["AI / Machine Learning", "Web Development", "Cloud Architecture", "Developer Tools"],
    availability: ["Monday-Friday: 7 PM - 10 PM", "Saturday: 10 AM - 5 PM"],
    weeklyHours: 20,
    experienceLevel: "Experienced",
    pastProjectsCount: 4,
    teamsJoinedCount: 3,
    contributionsCount: 42
  },
  {
    name: "Aarav",
    email: "aarav@teamforge.app",
    password: "Demo@123",
    headline: "Machine Learning Engineer & NLP Researcher",
    college: "MIT",
    course: "Artificial Intelligence & Data Science",
    year: "4th Year",
    location: "Cambridge, MA",
    bio: "Deep learning enthusiast working on LLM fine-tuning, retrieval-augmented generation, and computer vision models.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "Python", proficiency: "Expert", category: "Languages", verified: true },
      { name: "Machine Learning", proficiency: "Expert", category: "AI / ML", verified: true },
      { name: "NLP", proficiency: "Advanced", category: "AI / ML", verified: true },
      { name: "PyTorch", proficiency: "Advanced", category: "AI / ML", verified: true },
      { name: "FastAPI", proficiency: "Intermediate", category: "Backend", verified: false }
    ],
    interests: ["AI / Machine Learning", "Deep Learning", "NLP", "Robotics", "Research"],
    availability: ["Weekdays: 6 PM - 11 PM", "Weekends: Full Day"],
    weeklyHours: 25,
    experienceLevel: "Experienced",
    pastProjectsCount: 5,
    teamsJoinedCount: 4,
    contributionsCount: 58
  },
  {
    name: "Priya",
    email: "priya@teamforge.app",
    password: "Demo@123",
    headline: "Lead UI/UX Designer & Product Strategist",
    college: "Carnegie Mellon University",
    course: "Human-Computer Interaction",
    year: "3rd Year",
    location: "Pittsburgh, PA",
    bio: "Obsessed with micro-interactions, sleek dark modes, accessibility, and high-converting SaaS user interfaces.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "UI/UX", proficiency: "Expert", category: "Design", verified: true },
      { name: "Figma", proficiency: "Expert", category: "Design", verified: true },
      { name: "Design Systems", proficiency: "Advanced", category: "Design", verified: true },
      { name: "User Research", proficiency: "Advanced", category: "Product", verified: false },
      { name: "Tailwind CSS", proficiency: "Intermediate", category: "Frontend", verified: false }
    ],
    interests: ["Product Design", "Design Systems", "FinTech", "EdTech", "Startups"],
    availability: ["Monday-Friday: 5 PM - 9 PM", "Saturday: 12 PM - 6 PM"],
    weeklyHours: 18,
    experienceLevel: "Experienced",
    pastProjectsCount: 6,
    teamsJoinedCount: 5,
    contributionsCount: 64
  },
  {
    name: "Rohan",
    email: "rohan@teamforge.app",
    password: "Demo@123",
    headline: "Backend Specialist & Distributed Systems Dev",
    college: "UC Berkeley",
    course: "Computer Science",
    year: "3rd Year",
    location: "Berkeley, CA",
    bio: "Crafting scalable microservices, relational databases, caching pipelines, and secure API gateways.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "Node.js", proficiency: "Expert", category: "Backend", verified: true },
      { name: "Express", proficiency: "Expert", category: "Backend", verified: true },
      { name: "PostgreSQL", proficiency: "Advanced", category: "Database", verified: true },
      { name: "Docker", proficiency: "Intermediate", category: "DevOps", verified: false },
      { name: "Redis", proficiency: "Intermediate", category: "Database", verified: false }
    ],
    interests: ["Backend Architecture", "FinTech", "Cloud Systems", "APIs"],
    availability: ["Weekdays: 8 PM - 11 PM", "Weekends: Flexible"],
    weeklyHours: 15,
    experienceLevel: "Intermediate",
    pastProjectsCount: 3,
    teamsJoinedCount: 2,
    contributionsCount: 31
  },
  {
    name: "Sneha",
    email: "sneha@teamforge.app",
    password: "Demo@123",
    headline: "Mobile Application Developer (React Native & Flutter)",
    college: "Georgia Tech",
    course: "Software Engineering",
    year: "2nd Year",
    location: "Atlanta, GA",
    bio: "Passionate about creating fluid, 60fps cross-platform mobile apps with offline-first architecture and push notifications.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "React Native", proficiency: "Expert", category: "Mobile", verified: true },
      { name: "Flutter", proficiency: "Intermediate", category: "Mobile", verified: false },
      { name: "TypeScript", proficiency: "Advanced", category: "Languages", verified: true },
      { name: "Firebase", proficiency: "Advanced", category: "Backend", verified: true }
    ],
    interests: ["Mobile Development", "Campus Life", "EdTech", "HealthTech"],
    availability: ["Flexible Evening Hours", "Saturday & Sunday"],
    weeklyHours: 16,
    experienceLevel: "Intermediate",
    pastProjectsCount: 2,
    teamsJoinedCount: 2,
    contributionsCount: 19
  },
  {
    name: "Vikram",
    email: "vikram@teamforge.app",
    password: "Demo@123",
    headline: "Cloud & DevOps Engineer",
    college: "UT Austin",
    course: "Computer Engineering",
    year: "4th Year",
    location: "Austin, TX",
    bio: "AWS Certified Solutions Architect. Passionate about Kubernetes, CI/CD automation, and infrastructure as code.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "Docker", proficiency: "Expert", category: "DevOps", verified: true },
      { name: "Kubernetes", proficiency: "Advanced", category: "DevOps", verified: true },
      { name: "AWS", proficiency: "Advanced", category: "Cloud", verified: true },
      { name: "Linux", proficiency: "Expert", category: "Systems", verified: true }
    ],
    interests: ["DevOps", "Cybersecurity", "Cloud Infrastructure", "Open Source"],
    availability: ["Weeknights", "Weekends"],
    weeklyHours: 15,
    experienceLevel: "Experienced",
    pastProjectsCount: 4,
    teamsJoinedCount: 3,
    contributionsCount: 37
  },
  {
    name: "Ananya",
    email: "ananya@teamforge.app",
    password: "Demo@123",
    headline: "Data Scientist & Predictive Modeler",
    college: "Columbia University",
    course: "Applied Statistics",
    year: "3rd Year",
    location: "New York, NY",
    bio: "Extracting actionable insights from complex datasets. Specializes in pandas, scikit-learn, and interactive visualizations.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "Python", proficiency: "Expert", category: "Languages", verified: true },
      { name: "Pandas", proficiency: "Expert", category: "Data Science", verified: true },
      { name: "SQL", proficiency: "Advanced", category: "Database", verified: true },
      { name: "Data Visualization", proficiency: "Advanced", category: "Data Science", verified: false }
    ],
    interests: ["Data Science", "Sustainability", "FinTech", "HealthTech"],
    availability: ["Weekdays: 4 PM - 8 PM", "Saturday: 10 AM - 4 PM"],
    weeklyHours: 14,
    experienceLevel: "Intermediate",
    pastProjectsCount: 3,
    teamsJoinedCount: 2,
    contributionsCount: 24
  },
  {
    name: "Kabir",
    email: "kabir@teamforge.app",
    password: "Demo@123",
    headline: "Full Stack & Blockchain Developer",
    college: "University of Waterloo",
    course: "Software Engineering",
    year: "3rd Year",
    location: "Waterloo, ON",
    bio: "Smart contract development and Web3 decentralized applications with React and Solidity.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "Solidity", proficiency: "Advanced", category: "Blockchain", verified: true },
      { name: "React", proficiency: "Advanced", category: "Frontend", verified: true },
      { name: "Node.js", proficiency: "Intermediate", category: "Backend", verified: false },
      { name: "Ethers.js", proficiency: "Advanced", category: "Blockchain", verified: false }
    ],
    interests: ["Web3", "Blockchain", "Cryptography", "Startups"],
    availability: ["Flexible Weekend Hours", "Weekdays after 7 PM"],
    weeklyHours: 12,
    experienceLevel: "Intermediate",
    pastProjectsCount: 2,
    teamsJoinedCount: 1,
    contributionsCount: 18
  },
  {
    name: "Neha",
    email: "neha@teamforge.app",
    password: "Demo@123",
    headline: "Frontend Engineer & Design Systems Enthusiast",
    college: "University of Washington",
    course: "Informatics",
    year: "2nd Year",
    location: "Seattle, WA",
    bio: "Specializing in accessible web components, CSS animations, Next.js, and modern state management.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "React", proficiency: "Expert", category: "Frontend", verified: true },
      { name: "Next.js", proficiency: "Advanced", category: "Frontend", verified: true },
      { name: "TypeScript", proficiency: "Intermediate", category: "Languages", verified: false },
      { name: "Tailwind CSS", proficiency: "Expert", category: "Frontend", verified: true }
    ],
    interests: ["Web Development", "UI/UX", "Open Source", "Design Systems"],
    availability: ["Weekdays: 6 PM - 10 PM", "Sundays: Full Day"],
    weeklyHours: 15,
    experienceLevel: "Intermediate",
    pastProjectsCount: 3,
    teamsJoinedCount: 2,
    contributionsCount: 28
  },
  {
    name: "Dev",
    email: "demo@teamforge.app",
    password: "Demo@123",
    headline: "TeamForge Demo Lead Student",
    college: "UC Berkeley",
    course: "EECS",
    year: "3rd Year",
    location: "Berkeley, CA",
    bio: "Official TeamForge demo account for hackathon evaluation and interactive team recruitment testing.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    skills: [
      { name: "React", proficiency: "Expert", category: "Frontend", verified: true },
      { name: "Node.js", proficiency: "Advanced", category: "Backend", verified: true },
      { name: "Python", proficiency: "Intermediate", category: "Languages", verified: true },
      { name: "MongoDB", proficiency: "Advanced", category: "Database", verified: true },
      { name: "UI/UX", proficiency: "Intermediate", category: "Design", verified: false }
    ],
    interests: ["AI / Machine Learning", "Web Development", "FinTech", "Startups"],
    availability: ["Monday-Friday: 6 PM - 10 PM", "Saturday: 10 AM - 5 PM"],
    weeklyHours: 20,
    experienceLevel: "Experienced",
    pastProjectsCount: 4,
    teamsJoinedCount: 3,
    contributionsCount: 45
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamforge';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Invitation.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed] Seeding 10 student users...');
    const createdUsers = [];
    for (const u of usersData) {
      const newUser = await User.create(u);
      createdUsers.push(newUser);
    }

    const mohit = createdUsers.find(u => u.email === 'mohit@teamforge.app');
    const aarav = createdUsers.find(u => u.email === 'aarav@teamforge.app');
    const priya = createdUsers.find(u => u.email === 'priya@teamforge.app');
    const rohan = createdUsers.find(u => u.email === 'rohan@teamforge.app');
    const sneha = createdUsers.find(u => u.email === 'sneha@teamforge.app');
    const vikram = createdUsers.find(u => u.email === 'vikram@teamforge.app');
    const ananya = createdUsers.find(u => u.email === 'ananya@teamforge.app');
    const kabir = createdUsers.find(u => u.email === 'kabir@teamforge.app');
    const neha = createdUsers.find(u => u.email === 'neha@teamforge.app');
    const demo = createdUsers.find(u => u.email === 'demo@teamforge.app');

    console.log('[Seed] Seeding 8 comprehensive projects...');
    const projectsData = [
      {
        title: "AI Resume Analyzer",
        description: "An AI-powered resume evaluator that parses candidate resumes, benchmarks against industry job descriptions, identifies skill gaps, and suggests tailored improvements.",
        category: "AI / Machine Learning",
        difficulty: "Medium",
        duration: "4 Weeks",
        teamSize: 4,
        requiredSkills: ["Python", "Machine Learning", "NLP", "React", "UI/UX"],
        suggestedRoles: ["ML / NLP Engineer", "Frontend Developer", "UI/UX Designer", "Backend Developer"],
        availabilityNeeded: ["Weekdays", "Weekends"],
        owner: mohit._id,
        members: [
          { user: mohit._id, role: "Project Lead / Full Stack Developer", joinedAt: new Date() }
        ],
        aiAnalysis: {
          analyzed: true,
          difficulty: "Medium",
          recommendedTeamSize: 4,
          requiredSkills: ["Python", "Machine Learning", "NLP", "React", "UI/UX"],
          suggestedRoles: ["ML / NLP Engineer", "Full Stack Developer", "UI/UX Designer", "Backend Developer"],
          potentialChallenges: [
            "Parsing non-standard PDF formats and nested tables",
            "Latency of multi-pass LLM prompts on high volume submissions",
            "Preventing hallucinations in ATS scoring"
          ],
          skillImportance: {
            "Python": "High",
            "Machine Learning": "High",
            "NLP": "High",
            "React": "Medium",
            "UI/UX": "Medium"
          }
        },
        status: "Recruiting",
        progress: 35
      },
      {
        title: "Campus Safety & Emergency Dispatch App",
        description: "Real-time safety companion with geolocation beaconing, verified safe walking routes, and instant campus police dispatch.",
        category: "Mobile Development",
        difficulty: "Medium",
        duration: "6 Weeks",
        teamSize: 4,
        requiredSkills: ["React Native", "Node.js", "Firebase", "Geolocation APIs", "UI/UX"],
        suggestedRoles: ["Mobile Developer", "Backend Engineer", "UI/UX Designer", "Security Architect"],
        availabilityNeeded: ["Weekdays", "Weekends"],
        owner: sneha._id,
        members: [
          { user: sneha._id, role: "Lead Mobile Developer", joinedAt: new Date() },
          { user: rohan._id, role: "Backend Architect", joinedAt: new Date() }
        ],
        status: "In Progress",
        progress: 60
      },
      {
        title: "Smart Waste Management IoT Platform",
        description: "Predictive dumpster fill-level monitoring and optimized collection truck routing using computer vision and IoT sensor telemetry.",
        category: "IoT / Sustainability",
        difficulty: "Advanced",
        duration: "8 Weeks",
        teamSize: 5,
        requiredSkills: ["Python", "Computer Vision", "Docker", "React", "PostgreSQL"],
        suggestedRoles: ["IoT Engineer", "CV Specialist", "DevOps Engineer", "Frontend Lead"],
        availabilityNeeded: ["Weekends", "Flexible"],
        owner: vikram._id,
        members: [
          { user: vikram._id, role: "DevOps & Cloud Lead", joinedAt: new Date() },
          { user: ananya._id, role: "Data Scientist", joinedAt: new Date() }
        ],
        status: "Recruiting",
        progress: 25
      },
      {
        title: "Student Finance & Split-Pay Tracker",
        description: "Modern campus expense splitter, budget forecasting, and micro-investment tracker tailored for university dorms and clubs.",
        category: "FinTech",
        difficulty: "Beginner",
        duration: "3 Weeks",
        teamSize: 3,
        requiredSkills: ["React", "Node.js", "MongoDB", "Tailwind CSS", "UI/UX"],
        suggestedRoles: ["Frontend Developer", "Backend Developer", "Product Designer"],
        availabilityNeeded: ["Weekdays"],
        owner: demo._id,
        members: [
          { user: demo._id, role: "Lead Full Stack Developer", joinedAt: new Date() },
          { user: neha._id, role: "UI/UX & Frontend Specialist", joinedAt: new Date() }
        ],
        status: "In Progress",
        progress: 75
      },
      {
        title: "Mental Wellness & Study Companion",
        description: "AI-driven emotional support check-ins, study habit tracking, and proactive burnout detection for STEM college students.",
        category: "HealthTech",
        difficulty: "Medium",
        duration: "5 Weeks",
        teamSize: 4,
        requiredSkills: ["React", "NLP", "Python", "UI/UX", "FastAPI"],
        suggestedRoles: ["NLP Researcher", "UI/UX Lead", "Full Stack Developer"],
        availabilityNeeded: ["Weekdays", "Weekends"],
        owner: priya._id,
        members: [
          { user: priya._id, role: "Product & UI/UX Lead", joinedAt: new Date() },
          { user: aarav._id, role: "ML / Sentiment Specialist", joinedAt: new Date() }
        ],
        status: "In Progress",
        progress: 50
      },
      {
        title: "Campus AR Indoor Navigation System",
        description: "Augmented reality indoor mapping for multi-story university buildings, labs, and lecture halls with step-by-step 3D markers.",
        category: "AR / VR",
        difficulty: "Hard",
        duration: "8 Weeks",
        teamSize: 4,
        requiredSkills: ["Unity / ARKit", "React Native", "C#", "UI/UX Design"],
        suggestedRoles: ["AR Developer", "Mobile Engineer", "3D Asset Designer"],
        availabilityNeeded: ["Weekends"],
        owner: rohan._id,
        members: [
          { user: rohan._id, role: "Backend & Systems", joinedAt: new Date() }
        ],
        status: "Recruiting",
        progress: 15
      },
      {
        title: "Food Waste Reduction & Dining Hall Redistribution",
        description: "Campus dining surplus redistribution network connecting dining halls with student food pantries in real time.",
        category: "Sustainability",
        difficulty: "Beginner",
        duration: "3 Weeks",
        teamSize: 3,
        requiredSkills: ["React", "Node.js", "MongoDB", "Tailwind CSS"],
        suggestedRoles: ["Frontend Lead", "Backend Lead", "Community Outreach"],
        availabilityNeeded: ["Weekdays"],
        owner: neha._id,
        members: [
          { user: neha._id, role: "Frontend & UI Lead", joinedAt: new Date() }
        ],
        status: "Recruiting",
        progress: 40
      },
      {
        title: "Decentralized Student Credential & Badge Locker",
        description: "Verifiable digital degrees and hackathon accomplishment NFTs issued on-chain with zero-knowledge cryptographic proofs.",
        category: "Blockchain / Web3",
        difficulty: "Hard",
        duration: "6 Weeks",
        teamSize: 4,
        requiredSkills: ["Solidity", "React", "TypeScript", "Ethers.js", "Cryptography"],
        suggestedRoles: ["Smart Contract Engineer", "Web3 Frontend Dev", "Security Auditor"],
        availabilityNeeded: ["Flexible"],
        owner: kabir._id,
        members: [
          { user: kabir._id, role: "Solidity & Protocol Engineer", joinedAt: new Date() }
        ],
        status: "Recruiting",
        progress: 20
      }
    ];

    const createdProjects = [];
    for (const p of projectsData) {
      const newProj = await Project.create(p);
      createdProjects.push(newProj);
    }

    const aiResumeProj = createdProjects.find(p => p.title === "AI Resume Analyzer");
    const campusSafetyProj = createdProjects.find(p => p.title === "Campus Safety & Emergency Dispatch App");
    const finTrackerProj = createdProjects.find(p => p.title === "Student Finance & Split-Pay Tracker");

    console.log('[Seed] Seeding Kanban tasks...');
    await Task.create([
      {
        project: aiResumeProj._id,
        title: "Design ATS Resume Parser Architecture",
        description: "Define the regex and LLM schema pipelines for extracting education, experience, and skills sections.",
        assignedTo: mohit._id,
        priority: "High",
        status: "DONE",
        dueDate: new Date(Date.now() + 86400000 * 2)
      },
      {
        project: aiResumeProj._id,
        title: "Implement Multi-pass NLP Scoring Engine",
        description: "Calculate semantic cosine similarity between candidate resume embeddings and target role benchmarks.",
        assignedTo: aarav._id,
        priority: "Urgent",
        status: "IN PROGRESS",
        dueDate: new Date(Date.now() + 86400000 * 4)
      },
      {
        project: aiResumeProj._id,
        title: "Figma High-Fidelity UI & Dashboard Prototype",
        description: "Create interactive component specs for candidate match breakdown, score meters, and export PDF view.",
        assignedTo: priya._id,
        priority: "Medium",
        status: "TODO",
        dueDate: new Date(Date.now() + 86400000 * 7)
      },
      {
        project: aiResumeProj._id,
        title: "Setup MongoDB Atlas & Express API Gateway",
        description: "Implement JWT auth middleware, project CRUD, and secure file upload routes.",
        assignedTo: mohit._id,
        priority: "High",
        status: "DONE",
        dueDate: new Date(Date.now() + 86400000 * 1)
      },
      {
        project: finTrackerProj._id,
        title: "Build Recurring Bill Splitter Algorithm",
        description: "Equally calculate split shares and support custom weights for roommates.",
        assignedTo: demo._id,
        priority: "High",
        status: "DONE",
        dueDate: new Date()
      },
      {
        project: finTrackerProj._id,
        title: "Dark Mode Theme & Visual Chart Component",
        description: "Integrate Lucide icon set and Tailwind micro-interactions.",
        assignedTo: neha._id,
        priority: "Medium",
        status: "DONE",
        dueDate: new Date()
      }
    ]);

    console.log('[Seed] Seeding sample Invitations...');
    await Invitation.create([
      {
        sender: mohit._id,
        receiver: aarav._id,
        project: aiResumeProj._id,
        role: "ML / NLP Engineer",
        message: "Hey Aarav! We saw your stellar Python & NLP background. We'd love to have you architect the resume scoring model on our team!",
        status: "pending"
      },
      {
        sender: mohit._id,
        receiver: priya._id,
        project: aiResumeProj._id,
        role: "Lead UI/UX Designer",
        message: "Hi Priya! Your portfolio looks fantastic. We are looking for an exceptional designer to make our AI resume dashboard look super sleek.",
        status: "pending"
      },
      {
        sender: sneha._id,
        receiver: demo._id,
        project: campusSafetyProj._id,
        role: "Frontend Contributor",
        message: "Hey Dev! Want to collaborate on our Campus Safety mobile app? We need a solid React developer.",
        status: "pending"
      }
    ]);

    console.log('[Seed] Seeding sample Notifications...');
    await Notification.create([
      {
        user: aarav._id,
        type: "invite",
        title: "New Team Invitation",
        message: "Mohit invited you to join 'AI Resume Analyzer' as ML / NLP Engineer.",
        relatedProject: aiResumeProj._id,
        read: false
      },
      {
        user: priya._id,
        type: "invite",
        title: "New Team Invitation",
        message: "Mohit invited you to join 'AI Resume Analyzer' as Lead UI/UX Designer.",
        relatedProject: aiResumeProj._id,
        read: false
      },
      {
        user: demo._id,
        type: "invite",
        title: "New Team Invitation",
        message: "Sneha invited you to join 'Campus Safety & Emergency Dispatch App'.",
        relatedProject: campusSafetyProj._id,
        read: false
      },
      {
        user: mohit._id,
        type: "match",
        title: "New Teammate Recommendation Available",
        message: "We found 2 candidates with 90%+ compatibility for 'AI Resume Analyzer'!",
        relatedProject: aiResumeProj._id,
        read: false
      }
    ]);

    console.log('\n==================================================');
    console.log('✅ TeamForge Database Seeded Successfully!');
    console.log('--------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('  Email:    demo@teamforge.app');
    console.log('  Password: Demo@123');
    console.log('');
    console.log('Alternative Demo Accounts (Password: Demo@123):');
    console.log('  - mohit@teamforge.app  (Full Stack Developer)');
    console.log('  - aarav@teamforge.app  (ML / NLP Engineer)');
    console.log('  - priya@teamforge.app  (UI/UX Designer)');
    console.log('  - rohan@teamforge.app  (Backend Developer)');
    console.log('  - sneha@teamforge.app  (Mobile Developer)');
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDB();
