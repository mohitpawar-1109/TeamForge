import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

const categorizeSkill = (skillName) => {
  const s = (skillName || '').toLowerCase().trim();
  if (/react|vue|angular|frontend|tailwind|css|html|javascript|typescript|next|svelte|flutter|redux|web/i.test(s)) return 'Frontend';
  if (/node|express|django|flask|spring|backend|api|mongo|postgres|sql|database|golang|go|java|c\+\+|redis|graphql/i.test(s)) return 'Backend';
  if (/ai|ml|machine learning|deep learning|python|nlp|vision|tensorflow|pytorch|data|pandas|gemini|llm|scikit/i.test(s)) return 'AI/ML';
  if (/figma|ui|ux|design|adobe|wireframe|prototype|product design|canva/i.test(s)) return 'Design';
  if (/docker|kubernetes|aws|cloud|devops|ci\/cd|linux|git|gcp|azure|terraform/i.test(s)) return 'DevOps';
  return 'General';
};

/**
 * Calculate Student Skill Scoring & Profile Analytics
 * Uses genuine application data: Projects, Completed Tasks, Contributions, Endorsements, Experience & Proficiency
 */
export const calculateStudentSkillScore = async (user) => {
  const userId = user._id;

  // 1. Gather genuine application data in parallel
  const [
    createdProjects,
    joinedProjects,
    completedTasks,
    totalTasks,
    postsCreated,
    commentsAuthored
  ] = await Promise.all([
    Project.find({ owner: userId }).select('title category difficulty status createdAt').lean(),
    Project.find({ 'members.user': userId, owner: { $ne: userId } }).select('title category difficulty status members createdAt').lean(),
    Task.find({ assignedTo: userId, status: 'DONE' }).select('title priority project createdAt').lean(),
    Task.countDocuments({ assignedTo: userId }),
    Post.countDocuments({ author: userId }),
    Comment.countDocuments({ author: userId })
  ]);

  const createdCount = createdProjects.length;
  const joinedCount = joinedProjects.length;
  const pastCount = user.pastProjectsCount || 0;
  const totalProjectsCount = createdCount + joinedCount + pastCount;

  const completedTasksCount = completedTasks.length;
  const totalContributionsCount = completedTasksCount + postsCreated + commentsAuthored + (user.contributionsCount || 0) + (user.teamsJoinedCount || joinedCount);

  // 2. Experience Level Evaluation
  let expBase = 75;
  if (user.experienceLevel === 'Veteran') expBase = 96;
  else if (user.experienceLevel === 'Experienced') expBase = 90;
  else if (user.experienceLevel === 'Intermediate') expBase = 80;
  else if (user.experienceLevel === 'Beginner') expBase = 65;

  // 3. Individual Skill Scoring
  const userSkills = user.skills || [];
  let totalEndorsementsCount = 0;

  const scoredSkills = userSkills.map(skill => {
    const sName = typeof skill === 'string' ? skill : skill.name;
    const sProf = (typeof skill === 'object' && skill.proficiency) ? skill.proficiency : 'Intermediate';
    const sVerified = (typeof skill === 'object' && skill.verified) ? true : false;
    const endorsements = (typeof skill === 'object' && Array.isArray(skill.endorsements)) ? skill.endorsements : [];
    
    totalEndorsementsCount += endorsements.length;

    // A. Base from self-declared proficiency
    let base = 75;
    if (sProf === 'Expert') base = 95;
    else if (sProf === 'Advanced') base = 88;
    else if (sProf === 'Intermediate') base = 78;
    else if (sProf === 'Beginner') base = 62;

    // B. Application proof multipliers (non-fabricated)
    let projectBonus = Math.min(8, totalProjectsCount * 1.5);
    let taskBonus = Math.min(6, completedTasksCount * 2);
    let endorsementBonus = Math.min(8, endorsements.length * 2);
    let verifiedBonus = sVerified ? 4 : 0;

    const rawScore = base + projectBonus + taskBonus + endorsementBonus + verifiedBonus;
    const finalSkillScore = Math.min(99, Math.max(50, Math.round(rawScore)));

    let masteryLevel = 'Competent';
    if (finalSkillScore >= 92) masteryLevel = 'Mastery';
    else if (finalSkillScore >= 84) masteryLevel = 'Advanced';
    else if (finalSkillScore >= 74) masteryLevel = 'Proficient';
    else masteryLevel = 'Developing';

    return {
      name: sName,
      proficiency: sProf,
      score: finalSkillScore,
      masteryLevel,
      verified: sVerified,
      endorsementsCount: endorsements.length,
      endorsements: endorsements,
      category: categorizeSkill(sName),
      proofPoints: {
        baseScore: base,
        projectsBonus: Math.round(projectBonus),
        tasksBonus: Math.round(taskBonus),
        endorsementsBonus: Math.round(endorsementBonus),
        verifiedBonus
      }
    };
  });

  // 4. Overall Student Score Calculation (0-100)
  const avgSkillsScore = scoredSkills.length > 0
    ? scoredSkills.reduce((sum, s) => sum + s.score, 0) / scoredSkills.length
    : 72;

  const projectScoreFactor = Math.min(100, Math.max(50, 60 + totalProjectsCount * 8));
  const contributionScoreFactor = Math.min(100, Math.max(50, 60 + totalContributionsCount * 3));

  const weightedOverall = (avgSkillsScore * 0.50) + (expBase * 0.20) + (projectScoreFactor * 0.15) + (contributionScoreFactor * 0.15);
  const overallScore = Math.min(99, Math.max(55, Math.round(weightedOverall)));

  // 5. Category Averages for radar/bar charts
  const categoryMap = {};
  scoredSkills.forEach(s => {
    if (!categoryMap[s.category]) {
      categoryMap[s.category] = { category: s.category, totalScore: 0, count: 0, skills: [] };
    }
    categoryMap[s.category].totalScore += s.score;
    categoryMap[s.category].count += 1;
    categoryMap[s.category].skills.push(s);
  });

  const categoryBreakdown = Object.values(categoryMap).map(c => ({
    category: c.category,
    averageScore: Math.round(c.totalScore / c.count),
    skillsCount: c.count,
    skills: c.skills
  }));

  // 6. Recent Project Portfolios
  const combinedProjectList = [
    ...createdProjects.map(p => ({
      _id: p._id,
      title: p.title,
      category: p.category,
      role: 'Project Creator / Lead',
      status: p.status,
      createdAt: p.createdAt
    })),
    ...joinedProjects.map(p => {
      const myMembership = (p.members || []).find(m => m.user?.toString() === userId.toString());
      return {
        _id: p._id,
        title: p.title,
        category: p.category,
        role: myMembership?.role || 'Team Member',
        status: p.status,
        createdAt: p.createdAt
      };
    })
  ];

  return {
    studentId: user._id,
    studentName: user.name,
    headline: user.headline,
    college: user.college,
    experienceLevel: user.experienceLevel,
    overallScore,
    overallTier: overallScore >= 90 ? 'Tier 1 • Elite' : overallScore >= 80 ? 'Tier 2 • Advanced' : 'Tier 3 • Emerging',
    skillScores: scoredSkills,
    categoryBreakdown,
    projects: {
      total: totalProjectsCount,
      created: createdCount,
      joined: joinedCount,
      pastReported: pastCount,
      list: combinedProjectList
    },
    contributions: {
      total: totalContributionsCount,
      completedTasks: completedTasksCount,
      totalTasksAssigned: totalTasks,
      postsCreated,
      commentsAuthored,
      teamsJoined: joinedCount + (user.teamsJoinedCount || 0)
    },
    endorsements: {
      total: totalEndorsementsCount,
      topSkills: scoredSkills.filter(s => s.endorsementsCount > 0).sort((a, b) => b.endorsementsCount - a.endorsementsCount)
    }
  };
};
