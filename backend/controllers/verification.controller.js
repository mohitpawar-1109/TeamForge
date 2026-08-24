import User from '../models/User.js';
import Project from '../models/Project.js';
import SkillVerification from '../models/SkillVerification.js';
import UserFeedback from '../models/UserFeedback.js';
import ProjectFeedback from '../models/ProjectFeedback.js';
import OnboardingAssessment from '../models/OnboardingAssessment.js';
import {
  getAssessmentQuestionsForSkill,
  evaluateSkillAuthenticity,
  calculateUserTrustProfile,
  calculateProjectCredibility
} from '../services/trust.service.js';
import { generateAiSkillAssessment } from '../services/ai.service.js';

// Cooldown map in memory to prevent rapid retry abuse
const userCooldowns = new Map();

/**
 * POST /api/skills/:skillName/start-test
 * Start an adaptive skill assessment
 */
export const startSkillTest = async (req, res, next) => {
  try {
    const { skillName } = req.params;
    const { claimedLevel = 'Intermediate' } = req.body;
    const userId = req.user._id;

    if (!skillName || typeof skillName !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid skill name is required.' });
    }

    // Rate limiting check
    const cooldownKey = `${userId}_${skillName.toLowerCase()}`;
    const lastAttempt = userCooldowns.get(cooldownKey);
    const now = Date.now();

    if (lastAttempt && (now - lastAttempt < 15000)) { // 15 second minimum throttle
      const waitSeconds = Math.ceil((15000 - (now - lastAttempt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds}s before generating a new assessment session.`
      });
    }

    userCooldowns.set(cooldownKey, now);

    const { clientQuestions } = await getAssessmentQuestionsForSkill(skillName, claimedLevel);

    res.json({
      success: true,
      data: {
        skillName,
        claimedLevel,
        totalQuestions: clientQuestions.length,
        timeLimitSeconds: clientQuestions.length * 90, // 90s per question
        questions: clientQuestions,
        startedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/skills/:skillName/submit-test
 * Submit assessment answers for verification
 */
export const submitSkillTest = async (req, res, next) => {
  try {
    const { skillName } = req.params;
    const { userAnswers = [], claimedLevel = 'Intermediate', durationSeconds = 30 } = req.body;
    const userId = req.user._id;

    if (!skillName) {
      return res.status(400).json({ success: false, message: 'Skill name is required.' });
    }

    if (!Array.isArray(userAnswers) || userAnswers.length === 0) {
      return res.status(400).json({ success: false, message: 'No test answers submitted.' });
    }

    // Anti-cheat heuristic: detect suspiciously fast completion
    if (durationSeconds < 2 && userAnswers.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Assessment completed too rapidly to evaluate. Please retake the test thoughtfully.'
      });
    }

    // Run Authenticity Engine evaluation
    const evaluation = await evaluateSkillAuthenticity({
      userId,
      skillName,
      claimedLevel,
      userAnswers,
      durationSeconds
    });

    // Update or create SkillVerification record
    let record = await SkillVerification.findOne({
      user: userId,
      skillName: { $regex: new RegExp(`^${skillName}$`, 'i') }
    });

    const isVerified = evaluation.status === 'VERIFIED';
    const attemptRecord = {
      attemptNumber: record ? record.attemptsCount + 1 : 1,
      timestamp: new Date(),
      durationSeconds,
      claimedLevel,
      testScore: evaluation.testScore,
      practicalScore: evaluation.practicalScore,
      consistencyScore: evaluation.consistencyScore,
      verifiedConfidence: evaluation.verifiedConfidence,
      verifiedLevel: evaluation.verifiedLevel,
      status: evaluation.status
    };

    if (!record) {
      record = new SkillVerification({
        user: userId,
        skillName,
        claimedLevel,
        verifiedLevel: evaluation.verifiedLevel,
        testScore: evaluation.testScore,
        practicalScore: evaluation.practicalScore,
        consistencyScore: evaluation.consistencyScore,
        verifiedConfidence: evaluation.verifiedConfidence,
        status: evaluation.status,
        strongAreas: evaluation.strongAreas,
        improvements: evaluation.improvements,
        projectEvidence: evaluation.projectEvidence,
        attemptsCount: 1,
        history: [attemptRecord],
        lastAttemptAt: new Date()
      });
    } else {
      record.claimedLevel = claimedLevel;
      record.verifiedLevel = evaluation.verifiedLevel;
      record.testScore = evaluation.testScore;
      record.practicalScore = evaluation.practicalScore;
      record.consistencyScore = evaluation.consistencyScore;
      record.verifiedConfidence = evaluation.verifiedConfidence;
      record.status = evaluation.status;
      record.strongAreas = evaluation.strongAreas;
      record.improvements = evaluation.improvements;
      record.projectEvidence = evaluation.projectEvidence;
      record.attemptsCount += 1;
      record.history.push(attemptRecord);
      record.lastAttemptAt = new Date();
      record.updatedAt = new Date();
    }

    await record.save();

    // Update User model skill verified status
    const userDoc = await User.findById(userId);
    if (userDoc && Array.isArray(userDoc.skills)) {
      const existingSkill = userDoc.skills.find(
        (s) => (s.name || '').toLowerCase() === skillName.toLowerCase()
      );

      if (existingSkill) {
        existingSkill.verified = isVerified;
        if (isVerified) {
          existingSkill.proficiency = evaluation.verifiedLevel;
        }
      } else {
        userDoc.skills.push({
          name: skillName,
          proficiency: evaluation.verifiedLevel !== 'Unverified' ? evaluation.verifiedLevel : claimedLevel,
          verified: isVerified
        });
      }
      await userDoc.save();
    }

    res.json({
      success: true,
      message: isVerified
        ? `Congratulations! ${skillName} has been verified.`
        : `Assessment complete. Current evidence supports ${evaluation.verifiedLevel} level.`,
      data: {
        skillName,
        claimedLevel,
        verifiedLevel: evaluation.verifiedLevel,
        testScore: evaluation.testScore,
        practicalScore: evaluation.practicalScore,
        consistencyScore: evaluation.consistencyScore,
        verifiedConfidence: evaluation.verifiedConfidence,
        status: evaluation.status,
        strongAreas: evaluation.strongAreas,
        improvements: evaluation.improvements,
        projectEvidence: evaluation.projectEvidence,
        attemptsCount: record.attemptsCount,
        verified: isVerified
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/skills/:skillName/results
 * Get user's latest verification report for a skill
 */
export const getSkillResults = async (req, res, next) => {
  try {
    const { skillName } = req.params;
    const userId = req.user._id;

    const verification = await SkillVerification.findOne({
      user: userId,
      skillName: { $regex: new RegExp(`^${skillName}$`, 'i') }
    }).lean();

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'No verification record found for this skill.'
      });
    }

    res.json({
      success: true,
      data: verification
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:userId/skill-verifications
 * Get all skill verifications for a specific user
 */
export const getUserSkillVerifications = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const verifications = await SkillVerification.find({ user: userId })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: verifications
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/projects/:projectId/feedback
 * Submit structured project feedback (restricted to verified teammates)
 */
export const submitProjectFeedback = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      technicalQuality = 5,
      communication = 5,
      reliability = 5,
      contribution = 5,
      documentation = 5,
      problemSolving = 5,
      writtenFeedback = ''
    } = req.body;
    const authorId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check that author is owner or member
    const isOwner = project.owner?.toString() === authorId.toString();
    const isMember = (project.members || []).some((m) => m.user?.toString() === authorId.toString());

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'You can only leave feedback for projects you actively collaborated on.'
      });
    }

    let feedback = await ProjectFeedback.findOne({ author: authorId, project: projectId });
    if (!feedback) {
      feedback = new ProjectFeedback({
        author: authorId,
        project: projectId,
        technicalQuality: Math.min(5, Math.max(1, Number(technicalQuality))),
        communication: Math.min(5, Math.max(1, Number(communication))),
        reliability: Math.min(5, Math.max(1, Number(reliability))),
        contribution: Math.min(5, Math.max(1, Number(contribution))),
        documentation: Math.min(5, Math.max(1, Number(documentation))),
        problemSolving: Math.min(5, Math.max(1, Number(problemSolving))),
        writtenFeedback
      });
    } else {
      feedback.technicalQuality = Math.min(5, Math.max(1, Number(technicalQuality)));
      feedback.communication = Math.min(5, Math.max(1, Number(communication)));
      feedback.reliability = Math.min(5, Math.max(1, Number(reliability)));
      feedback.contribution = Math.min(5, Math.max(1, Number(contribution)));
      feedback.documentation = Math.min(5, Math.max(1, Number(documentation)));
      feedback.problemSolving = Math.min(5, Math.max(1, Number(problemSolving)));
      feedback.writtenFeedback = writtenFeedback;
    }

    await feedback.save();

    const credibility = await calculateProjectCredibility(projectId);

    res.json({
      success: true,
      message: 'Project feedback submitted successfully.',
      data: feedback,
      credibility
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/projects/:projectId/feedback
 * Get all project feedback and credibility rating
 */
export const getProjectFeedback = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const feedbacks = await ProjectFeedback.find({ project: projectId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    const credibility = await calculateProjectCredibility(projectId);

    res.json({
      success: true,
      data: {
        feedbacks,
        credibility
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/:userId/feedback
 * Submit peer feedback for a teammate (restricted to shared project collaborators)
 */
export const submitUserFeedback = async (req, res, next) => {
  try {
    const { userId: recipientId } = req.params;
    const {
      projectId,
      technicalSkills = 5,
      communication = 5,
      reliability = 5,
      contribution = 5,
      wouldWorkAgain = true,
      writtenFeedback = ''
    } = req.body;
    const authorId = req.user._id;

    if (authorId.toString() === recipientId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit feedback for yourself.'
      });
    }

    // Verify shared project collaboration
    const sharedProject = await Project.findOne({
      $or: [
        { _id: projectId, owner: authorId, 'members.user': recipientId },
        { _id: projectId, owner: recipientId, 'members.user': authorId },
        { _id: projectId, 'members.user': { $all: [authorId, recipientId] } }
      ]
    });

    if (!sharedProject) {
      return res.status(403).json({
        success: false,
        message: 'Peer feedback is only permitted between confirmed teammates on a shared project.'
      });
    }

    let feedback = await UserFeedback.findOne({
      author: authorId,
      recipient: recipientId,
      project: sharedProject._id
    });

    if (!feedback) {
      feedback = new UserFeedback({
        author: authorId,
        recipient: recipientId,
        project: sharedProject._id,
        technicalSkills: Math.min(5, Math.max(1, Number(technicalSkills))),
        communication: Math.min(5, Math.max(1, Number(communication))),
        reliability: Math.min(5, Math.max(1, Number(reliability))),
        contribution: Math.min(5, Math.max(1, Number(contribution))),
        wouldWorkAgain: Boolean(wouldWorkAgain),
        writtenFeedback
      });
    } else {
      feedback.technicalSkills = Math.min(5, Math.max(1, Number(technicalSkills)));
      feedback.communication = Math.min(5, Math.max(1, Number(communication)));
      feedback.reliability = Math.min(5, Math.max(1, Number(reliability)));
      feedback.contribution = Math.min(5, Math.max(1, Number(contribution)));
      feedback.wouldWorkAgain = Boolean(wouldWorkAgain);
      feedback.writtenFeedback = writtenFeedback;
    }

    await feedback.save();

    res.json({
      success: true,
      message: 'Peer feedback recorded successfully.',
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:userId/feedback
 * Get peer reviews for a user
 */
export const getUserFeedback = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const feedbacks = await UserFeedback.find({ recipient: userId })
      .populate('author', 'name avatar college headline')
      .populate('project', 'title category')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:userId/trust-score
 * Get user trust & reputation score profile
 */
export const getUserTrustScore = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const trustProfile = await calculateUserTrustProfile(userId);

    res.json({
      success: true,
      data: trustProfile
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/projects/:projectId/credibility
 * Get project credibility score
 */
export const getProjectCredibilityReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const credibility = await calculateProjectCredibility(projectId);

    res.json({
      success: true,
      data: credibility
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/skill-assessment/generate
 * Generate an AI-powered onboarding assessment session for chosen skills
 */
export const generateOnboardingAssessment = async (req, res, next) => {
  try {
    const { skills = [] } = req.body;
    const userId = req.user?._id || req.body.userId;

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one skill to generate an assessment.'
      });
    }

    const normalizedSkills = skills.map((s) => {
      if (typeof s === 'string') {
        return { name: s.trim(), claimedLevel: 'Intermediate' };
      }
      return {
        name: (s.name || s.skill || '').trim(),
        claimedLevel: s.claimedLevel || s.proficiency || 'Intermediate'
      };
    }).filter((s) => s.name.length > 0);

    // Call AI Generation Engine
    const { questions, source } = await generateAiSkillAssessment(normalizedSkills);

    const assessmentId = `assess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Save full assessment with secure answers on backend
    const assessmentDoc = new OnboardingAssessment({
      assessmentId,
      userId,
      skills: normalizedSkills,
      questions,
      status: 'pending'
    });

    await assessmentDoc.save();

    // CRUCIAL SECURITY REQUIREMENT:
    // Sanitize questions payload to the client so correctAnswer is NEVER leaked
    const sanitizedQuestions = questions.map((q, idx) => ({
      questionId: q.questionId,
      index: idx,
      skill: q.skill,
      type: q.type,
      difficulty: q.difficulty,
      question: q.question,
      codeSnippet: q.codeSnippet || '',
      options: q.options,
      concept: q.concept,
      points: q.points || 10
    }));

    res.json({
      success: true,
      data: {
        assessmentId,
        source,
        totalQuestions: sanitizedQuestions.length,
        timeLimitSeconds: sanitizedQuestions.length * 75,
        skills: normalizedSkills,
        questions: sanitizedQuestions
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/skill-assessment/:assessmentId/submit
 * Evaluate submitted answers against stored answer key and compute verified skill badges
 */
export const submitOnboardingAssessment = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { userAnswers = [], durationSeconds = 30, userId: clientUserId } = req.body;
    const userId = req.user?._id || clientUserId;

    const assessmentDoc = await OnboardingAssessment.findOne({ assessmentId });
    if (!assessmentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Assessment session not found or has expired.'
      });
    }

    const storedQuestions = assessmentDoc.questions || [];
    let totalPoints = 0;
    let earnedPoints = 0;

    // Per-skill scoring tracking
    const skillMetrics = {};
    assessmentDoc.skills.forEach((s) => {
      skillMetrics[s.name.toLowerCase()] = {
        name: s.name,
        claimedLevel: s.claimedLevel,
        totalPts: 0,
        earnedPts: 0,
        correctCount: 0,
        totalCount: 0,
        strongAreas: new Set(),
        improvements: new Set()
      };
    });

    storedQuestions.forEach((q) => {
      const sKey = (q.skill || '').toLowerCase();
      if (!skillMetrics[sKey]) {
        skillMetrics[sKey] = {
          name: q.skill,
          claimedLevel: 'Intermediate',
          totalPts: 0,
          earnedPts: 0,
          correctCount: 0,
          totalCount: 0,
          strongAreas: new Set(),
          improvements: new Set()
        };
      }

      const pts = q.points || 10;
      totalPoints += pts;
      skillMetrics[sKey].totalPts += pts;
      skillMetrics[sKey].totalCount += 1;

      const userAns = userAnswers.find((a) => a.questionId === q.questionId);
      const isCorrect = userAns && Number(userAns.selectedAnswer ?? userAns.selectedOptionIndex) === q.correctAnswer;

      if (isCorrect) {
        earnedPoints += pts;
        skillMetrics[sKey].earnedPts += pts;
        skillMetrics[sKey].correctCount += 1;
        if (q.concept) skillMetrics[sKey].strongAreas.add(q.concept);
      } else {
        if (q.concept) skillMetrics[sKey].improvements.add(q.concept);
      }
    });

    const overallScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const verifiedConfidence = Math.min(99, Math.max(20, Math.round(overallScore * 0.85 + 10)));

    // Process per-skill outcomes
    const skillResults = Object.values(skillMetrics).map((m) => {
      const sScore = m.totalPts > 0 ? Math.round((m.earnedPts / m.totalPts) * 100) : overallScore;
      
      let verifiedLevel = 'Beginner';
      if (sScore >= 85) verifiedLevel = 'Expert';
      else if (sScore >= 70) verifiedLevel = 'Advanced';
      else if (sScore >= 55) verifiedLevel = 'Intermediate';
      else if (sScore >= 35) verifiedLevel = 'Beginner';
      else verifiedLevel = 'Unverified';

      let status = 'UNVERIFIED';
      if (sScore >= 70) {
        status = 'VERIFIED';
      } else if (sScore >= 50) {
        status = 'PARTIALLY_VERIFIED';
      } else if (m.claimedLevel === 'Expert' || m.claimedLevel === 'Advanced') {
        status = 'NEEDS_MORE_EVIDENCE';
      } else {
        status = 'UNVERIFIED';
      }

      const strongArr = Array.from(m.strongAreas);
      if (strongArr.length === 0) strongArr.push('Core Fundamentals');

      const impArr = Array.from(m.improvements);
      if (impArr.length === 0) impArr.push('Advanced optimization & edge cases');

      return {
        skill: m.name,
        claimedLevel: m.claimedLevel,
        verifiedLevel,
        score: sScore,
        status,
        verified: status === 'VERIFIED',
        strongAreas: strongArr,
        improvements: impArr
      };
    });

    // Save assessment results
    assessmentDoc.status = 'completed';
    assessmentDoc.results = {
      overallScore,
      verifiedConfidence,
      skillResults
    };
    if (userId) assessmentDoc.userId = userId;
    await assessmentDoc.save();

    // If a user account exists, persist skill verifications in User and SkillVerification models
    if (userId) {
      try {
        const userDoc = await User.findById(userId);
        if (userDoc) {
          skillResults.forEach((sr) => {
            const existingSkill = (userDoc.skills || []).find(
              (s) => s.name?.toLowerCase() === sr.skill.toLowerCase()
            );

            if (existingSkill) {
              existingSkill.verified = sr.verified;
              if (sr.verified) {
                existingSkill.proficiency = sr.verifiedLevel;
              }
            } else {
              userDoc.skills.push({
                name: sr.skill,
                proficiency: sr.verified ? sr.verifiedLevel : sr.claimedLevel,
                verified: sr.verified
              });
            }
          });
          await userDoc.save();

          // Also save in SkillVerification collection
          for (const sr of skillResults) {
            await SkillVerification.findOneAndUpdate(
              { user: userId, skillName: { $regex: new RegExp(`^${sr.skill}$`, 'i') } },
              {
                user: userId,
                skillName: sr.skill,
                claimedLevel: sr.claimedLevel,
                verifiedLevel: sr.verifiedLevel,
                testScore: sr.score,
                practicalScore: sr.score,
                consistencyScore: sr.score >= 60 ? 90 : 65,
                verifiedConfidence: sr.score,
                status: sr.status,
                strongAreas: sr.strongAreas,
                improvements: sr.improvements,
                lastAttemptAt: new Date(),
                $inc: { attemptsCount: 1 }
              },
              { upsert: true, new: true }
            );
          }
        }
      } catch (saveErr) {
        console.error('Failed to auto-update User with assessment results:', saveErr);
      }
    }

    res.json({
      success: true,
      message: 'Assessment evaluated successfully.',
      data: {
        assessmentId,
        overallScore,
        verifiedConfidence,
        skillResults
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/skill-assessment/:assessmentId/result
 * Fetch the outcome of an onboarding assessment
 */
export const getOnboardingAssessmentResult = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessmentDoc = await OnboardingAssessment.findOne({ assessmentId }).lean();

    if (!assessmentDoc || !assessmentDoc.results) {
      return res.status(404).json({
        success: false,
        message: 'Assessment results not found.'
      });
    }

    res.json({
      success: true,
      data: {
        assessmentId,
        status: assessmentDoc.status,
        results: assessmentDoc.results
      }
    });
  } catch (err) {
    next(err);
  }
};

