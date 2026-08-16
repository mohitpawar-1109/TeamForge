/**
 * TeamForge Smart Matching Engine
 * Formula: matchScore = (skillMatch * 0.5) + (interestMatch * 0.2) + (availabilityMatch * 0.2) + (experienceMatch * 0.1)
 */

export const calculateCandidateMatch = (project, candidateUser) => {
  const reqSkills = (project.requiredSkills || []).map(s => s.trim().toLowerCase());
  const userSkills = (candidateUser.skills || []).map(s => s.name.trim().toLowerCase());
  const userInterests = (candidateUser.interests || []).map(i => i.trim().toLowerCase());
  const projectCategory = (project.category || '').trim().toLowerCase();
  const projectAvailability = (project.availabilityNeeded || []).map(a => a.trim().toLowerCase());
  const userAvailability = (candidateUser.availability || []).map(a => a.trim().toLowerCase());

  // 1. Skill Match (50% weight)
  const matchedSkillsList = [];
  const missingSkillsList = [];

  if (reqSkills.length === 0) {
    // If no specific skills required, default to high base
    reqSkills.push('general developer');
  }

  reqSkills.forEach(req => {
    // Fuzzy substring matching (e.g., "react" matches "react.js", "ml" matches "machine learning")
    const found = userSkills.some(uSkill => 
      uSkill === req || 
      uSkill.includes(req) || 
      req.includes(uSkill) ||
      (req.includes('ml') && uSkill.includes('machine learning')) ||
      (req.includes('machine learning') && uSkill.includes('ml')) ||
      (req.includes('ui') && uSkill.includes('ux')) ||
      (req.includes('ux') && uSkill.includes('figma')) ||
      (req.includes('node') && uSkill.includes('express'))
    );

    if (found) {
      matchedSkillsList.push(req);
    } else {
      missingSkillsList.push(req);
    }
  });

  const skillMatchRatio = reqSkills.length > 0 ? (matchedSkillsList.length / reqSkills.length) : 0.8;
  const skillMatchScore = Math.min(100, Math.round(skillMatchRatio * 100));

  // 2. Interest Match (20% weight)
  let interestMatches = 0;
  if (userInterests.length > 0) {
    interestMatches = userInterests.filter(interest => 
      projectCategory.includes(interest) || 
      interest.includes(projectCategory) ||
      project.title.toLowerCase().includes(interest) ||
      project.description.toLowerCase().includes(interest)
    ).length;
  }
  const interestMatchScore = userInterests.length > 0 
    ? Math.min(100, Math.max(30, interestMatches * 45))
    : 60;

  // 3. Availability Match (20% weight)
  let availMatchScore = 70; // baseline flexible
  if (projectAvailability.length > 0 && userAvailability.length > 0) {
    const overlapping = projectAvailability.filter(pa => 
      userAvailability.some(ua => ua.includes(pa) || pa.includes(ua) || ua === 'flexible' || pa === 'flexible')
    );
    availMatchScore = Math.min(100, Math.round((overlapping.length / projectAvailability.length) * 100));
  } else if (candidateUser.weeklyHours && candidateUser.weeklyHours >= 10) {
    availMatchScore = 85;
  }

  // 4. Experience Match (10% weight)
  let expScore = 70;
  if (candidateUser.experienceLevel === 'Veteran' || candidateUser.experienceLevel === 'Experienced') {
    expScore = 95;
  } else if (candidateUser.experienceLevel === 'Intermediate') {
    expScore = 85;
  } else if (candidateUser.pastProjectsCount >= 3) {
    expScore = 90;
  } else {
    expScore = 65;
  }

  // Final Weighted Match Score
  const rawScore = (skillMatchScore * 0.50) + (interestMatchScore * 0.20) + (availMatchScore * 0.20) + (expScore * 0.10);
  const matchScore = Math.min(99, Math.max(25, Math.round(rawScore)));

  // Generate Clear Explanations ("Why this match?")
  const explanations = [];
  if (matchedSkillsList.length > 0) {
    explanations.push(`Has ${matchedSkillsList.length} required skill${matchedSkillsList.length > 1 ? 's' : ''} (${matchedSkillsList.slice(0, 3).map(s => s.toUpperCase()).join(', ')})`);
  }
  if (interestMatchScore >= 70) {
    explanations.push(`Strong interest alignment in ${project.category || 'project domain'}`);
  }
  if (availMatchScore >= 80) {
    explanations.push('Available during target project work hours');
  }
  if (candidateUser.pastProjectsCount > 0) {
    explanations.push(`Proven track record with ${candidateUser.pastProjectsCount} completed project${candidateUser.pastProjectsCount > 1 ? 's' : ''}`);
  } else {
    explanations.push('High enthusiasm and solid foundational portfolio');
  }

  return {
    score: matchScore,
    breakdown: {
      skills: skillMatchScore,
      interests: interestMatchScore,
      availability: availMatchScore,
      experience: expScore
    },
    matchedSkills: matchedSkillsList,
    missingSkills: missingSkillsList,
    explanations
  };
};

export const calculateTeamSkillGap = (project, teamMembersUsers = []) => {
  const reqSkills = project.requiredSkills || [];
  
  // Aggregate all skills possessed by any member in the team
  const allTeamSkills = new Set();
  teamMembersUsers.forEach(member => {
    (member.skills || []).forEach(skill => {
      allTeamSkills.add(skill.name.trim().toLowerCase());
    });
  });

  const coverageDetails = reqSkills.map(req => {
    const reqLower = req.trim().toLowerCase();
    const isCovered = Array.from(allTeamSkills).some(tSkill => 
      tSkill === reqLower || 
      tSkill.includes(reqLower) || 
      reqLower.includes(tSkill) ||
      (reqLower.includes('ml') && tSkill.includes('machine learning')) ||
      (reqLower.includes('ui') && tSkill.includes('ux')) ||
      (reqLower.includes('ux') && tSkill.includes('figma'))
    );

    return {
      skill: req,
      status: isCovered ? 'Covered' : 'Missing',
      covered: isCovered
    };
  });

  const coveredCount = coverageDetails.filter(c => c.covered).length;
  const overallCoverage = reqSkills.length > 0 
    ? Math.round((coveredCount / reqSkills.length) * 100) 
    : 100;

  const missingSkills = coverageDetails.filter(c => !c.covered).map(c => c.skill);

  return {
    overallCoverage,
    totalRequired: reqSkills.length,
    coveredCount,
    missingCount: missingSkills.length,
    details: coverageDetails,
    missingSkills,
    teamHealth: Math.min(100, Math.round(overallCoverage * 0.8 + (teamMembersUsers.length >= 2 ? 20 : 10)))
  };
};

export const calculatePostMatch = (post, candidateUser) => {
  const reqSkills = (post.requiredSkills || []).map(s => s.trim().toLowerCase());
  const reqRoles = post.requiredRoles || [];
  const userSkills = (candidateUser.skills || []).map(s => s.name.trim().toLowerCase());
  const userInterests = (candidateUser.interests || []).map(i => i.trim().toLowerCase());
  const postTitle = (post.title || '').toLowerCase();
  const postContent = (post.content || '').toLowerCase();
  const postTags = (post.tags || []).map(t => t.toLowerCase());

  // 1. Skill Matching
  const matchedSkillsList = [];
  const matchedSkillsOriginal = [];

  reqSkills.forEach(req => {
    const foundSkill = (candidateUser.skills || []).find(uSkill => {
      const uLower = uSkill.name.trim().toLowerCase();
      return (
        uLower === req ||
        uLower.includes(req) ||
        req.includes(uLower) ||
        (req.includes('ml') && uLower.includes('machine learning')) ||
        (req.includes('machine learning') && uLower.includes('ml')) ||
        (req.includes('ui') && uLower.includes('ux')) ||
        (req.includes('ux') && uLower.includes('figma')) ||
        (req.includes('node') && uLower.includes('express'))
      );
    });

    if (foundSkill) {
      matchedSkillsList.push(req);
      matchedSkillsOriginal.push(foundSkill.name);
    }
  });

  // 2. Interest / Domain Matching
  const matchedInterestsList = [];
  userInterests.forEach(interest => {
    if (
      postTitle.includes(interest) ||
      postContent.includes(interest) ||
      postTags.some(t => t.includes(interest) || interest.includes(t)) ||
      (interest.includes('ai') && (postContent.includes('gemini') || postContent.includes('ai') || postContent.includes('ml'))) ||
      (interest.includes('web') && (postContent.includes('react') || postContent.includes('full stack') || postContent.includes('frontend')))
    ) {
      matchedInterestsList.push(interest);
    }
  });

  // 3. Suggested Role Inference
  let suggestedRole = reqRoles[0] || 'Team Contributor';
  let bestRoleScore = -1;

  reqRoles.forEach(role => {
    const roleLower = role.toLowerCase();
    let score = 0;
    userSkills.forEach(skill => {
      if (roleLower.includes('ml') || roleLower.includes('ai') || roleLower.includes('data')) {
        if (skill.includes('python') || skill.includes('ml') || skill.includes('tensorflow') || skill.includes('pytorch') || skill.includes('data')) score += 3;
      }
      if (roleLower.includes('ui') || roleLower.includes('ux') || roleLower.includes('design') || roleLower.includes('frontend')) {
        if (skill.includes('figma') || skill.includes('ui') || skill.includes('react') || skill.includes('css') || skill.includes('tailwind')) score += 3;
      }
      if (roleLower.includes('backend') || roleLower.includes('api') || roleLower.includes('server')) {
        if (skill.includes('node') || skill.includes('express') || skill.includes('mongo') || skill.includes('sql') || skill.includes('django')) score += 3;
      }
    });
    if (score > bestRoleScore) {
      bestRoleScore = score;
      suggestedRole = role;
    }
  });

  // 4. Score Calculation
  let baseScore = 60;
  if (matchedSkillsList.length >= 3) {
    baseScore = 92;
  } else if (matchedSkillsList.length === 2) {
    baseScore = 86;
  } else if (matchedSkillsList.length === 1) {
    baseScore = 78;
  } else if (matchedInterestsList.length > 0) {
    baseScore = 70;
  }

  // Bonus for relevant interests and experience
  let bonus = 0;
  if (matchedInterestsList.length > 0) bonus += 3;
  if (candidateUser.experienceLevel === 'Veteran' || candidateUser.experienceLevel === 'Experienced') bonus += 3;
  if (candidateUser.pastProjectsCount >= 2) bonus += 2;

  const compatibilityScore = Math.min(98, Math.max(50, baseScore + bonus));

  // 5. Explanations
  let reason = '';
  if (matchedSkillsOriginal.length > 0 && matchedInterestsList.length > 0) {
    reason = `${matchedSkillsOriginal.length} required skill${matchedSkillsOriginal.length > 1 ? 's' : ''} match and their interests overlap with your project.`;
  } else if (matchedSkillsOriginal.length > 0) {
    reason = `${matchedSkillsOriginal.length} required skill${matchedSkillsOriginal.length > 1 ? 's' : ''} match (${matchedSkillsOriginal.slice(0, 3).join(', ')}) for ${suggestedRole}.`;
  } else if (matchedInterestsList.length > 0) {
    reason = `Strong interest overlap with "${post.title || 'project'}" and proven track record.`;
  } else {
    reason = `Good general technical background matching ${suggestedRole} requirements.`;
  }

  return {
    compatibilityScore,
    score: compatibilityScore,
    matchingSkills: matchedSkillsOriginal.length > 0 ? matchedSkillsOriginal : (candidateUser.skills || []).slice(0, 3).map(s => typeof s === 'string' ? s : s?.name),
    matchingInterests: matchedInterestsList,
    suggestedRole,
    reason,
    explanation: reason
  };
};
