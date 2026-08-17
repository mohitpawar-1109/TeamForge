/**
 * TeamForge Advanced AI Team Recommendation Service
 * Hybrid Architecture: Deterministic Multi-Factor Scoring + Greedy Squad Optimization + Gemini AI Reasoning
 */

// Skill alias dictionary for fuzzy/synonym matching
const matchSkill = (reqSkill, userSkill) => {
  const r = reqSkill.trim().toLowerCase();
  const u = userSkill.trim().toLowerCase();

  if (r === u || u.includes(r) || r.includes(u)) return true;
  if ((r.includes('ml') || r.includes('ai')) && (u.includes('machine learning') || u.includes('python') || u.includes('pytorch') || u.includes('tensorflow') || u.includes('nlp'))) return true;
  if ((r.includes('react') || r.includes('frontend')) && (u.includes('react') || u.includes('next') || u.includes('vue') || u.includes('tailwind') || u.includes('javascript') || u.includes('typescript'))) return true;
  if ((r.includes('node') || r.includes('backend') || r.includes('api')) && (u.includes('node') || u.includes('express') || u.includes('fastapi') || u.includes('django') || u.includes('sql') || u.includes('mongo'))) return true;
  if ((r.includes('ui') || r.includes('ux') || r.includes('design')) && (u.includes('figma') || u.includes('ui') || u.includes('ux') || u.includes('tailwind') || u.includes('css'))) return true;
  if (r.includes('mobile') && (u.includes('flutter') || u.includes('react native') || u.includes('android') || u.includes('ios') || u.includes('kotlin') || u.includes('swift'))) return true;
  if (r.includes('cloud') && (u.includes('docker') || u.includes('aws') || u.includes('kubernetes') || u.includes('gcp') || u.includes('devops'))) return true;
  return false;
};

// Determine best fitting role for candidate in project
const inferBestRole = (candidate, projectRoles = [], requiredSkills = []) => {
  const skills = (candidate.skills || []).map(s => s.name.toLowerCase());
  const headline = (candidate.headline || '').toLowerCase();

  const roleScores = (projectRoles.length > 0 ? projectRoles : [
    'Full Stack Developer',
    'Backend Engineer',
    'Frontend Specialist',
    'AI / ML Engineer',
    'UI/UX Designer',
    'Mobile App Developer'
  ]).map(role => {
    const rLower = role.toLowerCase();
    let score = 0;

    if (rLower.includes('ml') || rLower.includes('ai') || rLower.includes('data')) {
      if (skills.some(s => s.includes('python') || s.includes('ml') || s.includes('pytorch') || s.includes('nlp') || s.includes('data'))) score += 4;
      if (headline.includes('ml') || headline.includes('ai') || headline.includes('data')) score += 3;
    }
    if (rLower.includes('backend') || rLower.includes('api') || rLower.includes('server')) {
      if (skills.some(s => s.includes('node') || s.includes('express') || s.includes('mongo') || s.includes('sql') || s.includes('django') || s.includes('fastapi'))) score += 4;
      if (headline.includes('backend') || headline.includes('server')) score += 3;
    }
    if (rLower.includes('frontend') || rLower.includes('ui') || rLower.includes('design') || rLower.includes('web')) {
      if (skills.some(s => s.includes('react') || s.includes('figma') || s.includes('ui') || s.includes('ux') || s.includes('tailwind') || s.includes('css'))) score += 4;
      if (headline.includes('frontend') || headline.includes('ui') || headline.includes('design')) score += 3;
    }
    if (rLower.includes('mobile') || rLower.includes('app')) {
      if (skills.some(s => s.includes('flutter') || s.includes('react native') || s.includes('android') || s.includes('ios'))) score += 4;
      if (headline.includes('mobile') || headline.includes('flutter') || headline.includes('app')) score += 3;
    }

    return { role, score };
  });

  roleScores.sort((a, b) => b.score - a.score);
  return roleScores[0]?.score > 0 ? roleScores[0].role : (projectRoles[0] || 'Core Developer');
};

/**
 * Main AI Recommendation Generator
 */
export const generateAITeamRecommendations = async (project, allCandidateUsers = []) => {
  const reqSkills = project.requiredSkills || [];
  const suggestedRoles = project.suggestedRoles || [];
  const skillImportanceMap = project.aiAnalysis?.skillImportance || {};
  const currentMembers = project.members || [];
  const targetTeamSize = project.teamSize || 4;

  // 1. Map existing team's covered skills
  const existingTeamSkills = new Set();
  currentMembers.forEach(m => {
    const userObj = m.user || {};
    (userObj.skills || []).forEach(s => {
      existingTeamSkills.add(s.name.trim().toLowerCase());
    });
  });

  // 2. Identify missing/uncovered project skills
  const missingSkills = reqSkills.filter(req => {
    return !Array.from(existingTeamSkills).some(eSkill => matchSkill(req, eSkill));
  });

  const slotsToFill = Math.max(1, Math.min(targetTeamSize - currentMembers.length, 5));

  // 3. Score every candidate
  const scoredCandidates = allCandidateUsers.map(candidate => {
    const userSkills = candidate.skills || [];
    const userInterests = (candidate.interests || []).map(i => i.toLowerCase());
    const userCategory = (project.category || '').toLowerCase();

    // A. Skill Match with importance weighting & role focus
    let matchedSkills = [];
    let coveredMissingSkills = [];
    let weightedSkillPoints = 0;
    let maxWeightedPoints = 0;

    reqSkills.forEach(req => {
      let weight = 1.0;
      const rawImportance = typeof skillImportanceMap.get === 'function'
        ? skillImportanceMap.get(req)
        : skillImportanceMap[req];

      if (rawImportance === 'High') weight = 1.5;
      else if (rawImportance === 'Low') weight = 0.7;

      maxWeightedPoints += weight;

      const userSkill = userSkills.find(us => matchSkill(req, us.name));
      if (userSkill) {
        matchedSkills.push(req);
        // Add proficiency multiplier
        let profMultiplier = 1.0;
        if (userSkill.proficiency === 'Expert') profMultiplier = 1.25;
        else if (userSkill.proficiency === 'Advanced') profMultiplier = 1.15;
        else if (userSkill.proficiency === 'Beginner') profMultiplier = 0.85;

        weightedSkillPoints += weight * profMultiplier;

        if (missingSkills.some(ms => ms.toLowerCase() === req.toLowerCase())) {
          coveredMissingSkills.push(req);
        }
      }
    });

    // In a squad, a specialist covers their designated domain/gaps
    let skillScore = 70;
    if (coveredMissingSkills.length >= 2) {
      skillScore = 94;
    } else if (coveredMissingSkills.length === 1) {
      skillScore = 88;
    } else if (matchedSkills.length >= 2) {
      skillScore = 85;
    } else if (matchedSkills.length === 1) {
      skillScore = 78;
    } else {
      skillScore = 65;
    }

    // Proficiency bonus
    const hasExpertSkills = userSkills.some(s => s.proficiency === 'Expert' && matchedSkills.some(m => matchSkill(m, s.name)));
    if (hasExpertSkills) skillScore = Math.min(98, skillScore + 4);

    // B. Interest / Domain Match
    const interestOverlap = userInterests.filter(i =>
      userCategory.includes(i) ||
      i.includes(userCategory) ||
      project.title.toLowerCase().includes(i) ||
      project.description.toLowerCase().includes(i)
    );
    const interestScore = userInterests.length > 0
      ? Math.min(100, Math.max(50, interestOverlap.length * 30 + 40))
      : 70;

    // C. Experience Score
    let expScore = 75;
    if (candidate.experienceLevel === 'Veteran' || candidate.experienceLevel === 'Experienced') expScore = 95;
    else if (candidate.experienceLevel === 'Intermediate') expScore = 85;
    if (candidate.pastProjectsCount >= 3) expScore = Math.min(100, expScore + 5);

    // D. Individual Match Score
    const rawMatch = (skillScore * 0.55) + (interestScore * 0.25) + (expScore * 0.20);
    const individualScore = Math.min(98, Math.max(60, Math.round(rawMatch)));

    const assignedRole = inferBestRole(candidate, suggestedRoles, reqSkills);

    return {
      student: candidate,
      score: individualScore,
      skillScore,
      interestScore,
      expScore,
      matchedSkills,
      coveredMissingSkills,
      assignedRole
    };
  });

  // Sort candidates by highest score & missing skills coverage
  scoredCandidates.sort((a, b) => {
    if (b.coveredMissingSkills.length !== a.coveredMissingSkills.length) {
      return b.coveredMissingSkills.length - a.coveredMissingSkills.length;
    }
    return b.score - a.score;
  });

  // 4. Greedy Selection for Optimal Complementary Squad
  const recommendedTeam = [];
  const coveredBySelected = new Set(existingTeamSkills);
  const assignedRolesSet = new Set(currentMembers.map(m => m.role?.toLowerCase()).filter(Boolean));

  for (const candidate of scoredCandidates) {
    if (recommendedTeam.length >= slotsToFill) break;

    // Check if candidate adds fresh skills or non-duplicate primary role
    const addsNewSkill = candidate.matchedSkills.some(s => !coveredBySelected.has(s.toLowerCase()));
    const roleIsUnique = !assignedRolesSet.has(candidate.assignedRole.toLowerCase());

    if (addsNewSkill || roleIsUnique || recommendedTeam.length === 0 || scoredCandidates.length <= slotsToFill) {
      recommendedTeam.push(candidate);
      candidate.matchedSkills.forEach(s => coveredBySelected.add(s.toLowerCase()));
      assignedRolesSet.add(candidate.assignedRole.toLowerCase());
    }
  }

  // Fallback: If greedy filter was too strict, top up from highest scoring candidates
  if (recommendedTeam.length < slotsToFill) {
    for (const candidate of scoredCandidates) {
      if (recommendedTeam.length >= slotsToFill) break;
      if (!recommendedTeam.some(r => r.student._id.toString() === candidate.student._id.toString())) {
        recommendedTeam.push(candidate);
      }
    }
  }

  // 5. Compute Team Compatibility Score
  const avgIndividual = recommendedTeam.length > 0
    ? recommendedTeam.reduce((acc, curr) => acc + curr.score, 0) / recommendedTeam.length
    : 75;

  const totalReq = reqSkills.length || 1;
  const totalCovered = reqSkills.filter(r => coveredBySelected.has(r.toLowerCase())).length;
  const coverageRatio = totalCovered / totalReq;

  const rawTeamScore = (avgIndividual * 0.70) + (coverageRatio * 100 * 0.30);
  const teamCompatibilityScore = Math.min(99, Math.max(60, Math.round(rawTeamScore)));

  // 6. Generate Deterministic Explanations ("Why this person is recommended")
  const deterministicRecommendations = recommendedTeam.map(item => {
    const c = item.student;
    const reasons = [];

    if (item.coveredMissingSkills.length > 0) {
      reasons.push(`Bridges critical project skill gap in ${item.coveredMissingSkills.slice(0, 2).join(' & ')}`);
    } else if (item.matchedSkills.length > 0) {
      reasons.push(`Strong core expertise in ${item.matchedSkills.slice(0, 2).join(', ')}`);
    }

    if (item.assignedRole) {
      reasons.push(`Ideal fit for the ${item.assignedRole} role`);
    }

    if (c.pastProjectsCount > 0) {
      reasons.push(`Proven execution with ${c.pastProjectsCount} completed project${c.pastProjectsCount > 1 ? 's' : ''}`);
    } else if (c.experienceLevel === 'Veteran' || c.experienceLevel === 'Experienced') {
      reasons.push(`${c.experienceLevel} level developer with high autonomy`);
    }

    return {
      student: c,
      role: item.assignedRole,
      matchScore: item.score,
      whyRecommended: reasons.join(' • '),
      reasonsList: reasons,
      matchedSkills: item.matchedSkills,
      coveredMissingSkills: item.coveredMissingSkills
    };
  });

  // 7. Gemini AI Reasoning Layer (Enhancement)
  const apiKey = process.env.GEMINI_API_KEY;
  let aiSummary = `This recommended squad achieves ${teamCompatibilityScore}% overall synergy for "${project.title}", comprehensively covering ${totalCovered}/${totalReq} required skills across architecture, implementation, and interface design.`;

  if (apiKey && apiKey.trim().length > 10 && deterministicRecommendations.length > 0) {
    try {
      const prompt = `You are an elite technical talent architect.
Analyze the following project and its recommended student team composition, and return ONLY a valid JSON object.

Project:
Title: "${project.title}"
Category: "${project.category}"
Required Skills: ${JSON.stringify(reqSkills)}
Missing Skills Before Recommendation: ${JSON.stringify(missingSkills)}

Recommended Teammates:
${deterministicRecommendations.map((r, i) => `${i + 1}. ${r.student.name} | Role: ${r.role} | Score: ${r.matchScore}% | Matched Skills: ${r.matchedSkills.join(', ')} | Covered Gaps: ${r.coveredMissingSkills.join(', ')} | Experience: ${r.student.experienceLevel || 'Intermediate'}`).join('\n')}

JSON Schema Required:
{
  "teamSynergySummary": "Brief 1-2 sentence executive summary of why this specific team composition will excel together",
  "candidateReasons": {
    "${deterministicRecommendations[0]?.student._id}": "Specific technical justification of why this student is the best pick for their role and how they complement the team"
  }
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
        const jsonRes = await response.json();
        const text = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.teamSynergySummary) {
            aiSummary = parsed.teamSynergySummary;
          }
          if (parsed.candidateReasons) {
            deterministicRecommendations.forEach(r => {
              const uId = r.student._id?.toString();
              if (parsed.candidateReasons[uId]) {
                r.whyRecommended = parsed.candidateReasons[uId];
              }
            });
          }
        }
      }
    } catch (aiErr) {
      console.warn('[AI Team Rec] Gemini reasoning skipped, using deterministic explanations:', aiErr.message);
    }
  }

  return {
    teamCompatibilityScore,
    teamSynergySummary: aiSummary,
    totalSkillsRequired: totalReq,
    totalSkillsCovered: totalCovered,
    skillCoveragePercentage: Math.round(coverageRatio * 100),
    unfilledSlots: slotsToFill,
    recommendedTeam: deterministicRecommendations,
    generatedAt: new Date().toISOString()
  };
};
