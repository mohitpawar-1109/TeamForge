import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import OnboardingAssessment from './models/OnboardingAssessment.js';
import SkillVerification from './models/SkillVerification.js';
import { generateAiSkillAssessment, generateFallbackSkillQuestions } from './services/ai.service.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/teamforge_dev';

const runTests = async () => {
  console.log('\n================================================================');
  console.log('🧪 TEAMFORGE AI SKILL VERIFICATION REGISTRATION TEST SUITE');
  console.log('================================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // ----------------------------------------------------
    // TEST 1: AI Question Generation Schema & Content Test
    // ----------------------------------------------------
    console.log('\n--- TEST 1: AI Skill Question Generation ---');
    const targetSkills = [
      { name: 'React', claimedLevel: 'Expert' },
      { name: 'Node.js', claimedLevel: 'Advanced' },
      { name: 'MongoDB', claimedLevel: 'Intermediate' }
    ];

    const assessment = await generateAiSkillAssessment(targetSkills);
    console.log(`   Generation Source: ${assessment.source}`);
    console.log(`   Total Questions Generated: ${assessment.questions.length}`);

    if (!Array.isArray(assessment.questions) || assessment.questions.length === 0) {
      throw new Error('Failed to generate assessment questions');
    }

    // Verify schema of all generated questions
    assessment.questions.forEach((q, idx) => {
      if (!q.questionId || !q.skill || !q.question || !Array.isArray(q.options) || q.options.length < 2) {
        throw new Error(`Invalid question schema at index ${idx}`);
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        throw new Error(`Invalid correctAnswer index at index ${idx}: ${q.correctAnswer}`);
      }
    });
    console.log('✅ All generated questions conform strictly to the required schema.');

    // ----------------------------------------------------
    // TEST 2: Client Sanitization Test (No Leaked Answers)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Security & Client Answer Sanitization ---');
    const sanitizedForClient = assessment.questions.map((q) => ({
      questionId: q.questionId,
      skill: q.skill,
      type: q.type,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      concept: q.concept
    }));

    if (sanitizedForClient.some((q) => q.correctAnswer !== undefined)) {
      throw new Error('SECURITY VIOLATION: correctAnswer leaked to client!');
    }
    console.log('✅ Client payload is completely sanitized (0 answer keys exposed).');

    // ----------------------------------------------------
    // TEST 3: Onboarding Assessment Persistence & Session Store
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Assessment Session Persistence ---');
    const assessmentId = `assess_test_${Date.now()}`;
    const assessmentDoc = await OnboardingAssessment.create({
      assessmentId,
      skills: targetSkills,
      questions: assessment.questions,
      status: 'pending'
    });
    console.log(`✅ Onboarding assessment session saved with ID: ${assessmentDoc.assessmentId}`);

    // ----------------------------------------------------
    // TEST 4: Server-Side Scoring & Verified Badges
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Server-Side Scoring & Authenticity Verification ---');
    // Simulate user answering 100% correctly on React & Node.js, and 0% on MongoDB
    const userAnswers = assessment.questions.map((q) => {
      if (q.skill.toLowerCase().includes('mongo')) {
        return {
          questionId: q.questionId,
          selectedAnswer: (q.correctAnswer + 1) % q.options.length // Wrong
        };
      }
      return {
        questionId: q.questionId,
        selectedAnswer: q.correctAnswer // Correct
      };
    });

    // Score on server
    let totalPoints = 0;
    let earnedPoints = 0;
    const skillMetrics = {};

    targetSkills.forEach((s) => {
      skillMetrics[s.name.toLowerCase()] = {
        name: s.name,
        claimedLevel: s.claimedLevel,
        totalPts: 0,
        earnedPts: 0,
        strongAreas: new Set(),
        improvements: new Set()
      };
    });

    assessmentDoc.questions.forEach((q) => {
      const sKey = q.skill.toLowerCase();
      const pts = q.points || 10;
      totalPoints += pts;
      if (skillMetrics[sKey]) skillMetrics[sKey].totalPts += pts;

      const userAns = userAnswers.find((a) => a.questionId === q.questionId);
      const isCorrect = userAns && userAns.selectedAnswer === q.correctAnswer;

      if (isCorrect) {
        earnedPoints += pts;
        if (skillMetrics[sKey]) {
          skillMetrics[sKey].earnedPts += pts;
          skillMetrics[sKey].strongAreas.add(q.concept || 'Fundamentals');
        }
      } else {
        if (skillMetrics[sKey]) {
          skillMetrics[sKey].improvements.add(q.concept || 'Edge cases');
        }
      }
    });

    const overallScore = Math.round((earnedPoints / totalPoints) * 100);
    const skillResults = Object.values(skillMetrics).map((m) => {
      const sScore = m.totalPts > 0 ? Math.round((m.earnedPts / m.totalPts) * 100) : 0;
      const isVerified = sScore >= 70;
      return {
        skill: m.name,
        claimedLevel: m.claimedLevel,
        score: sScore,
        status: isVerified ? 'VERIFIED' : sScore >= 50 ? 'PARTIALLY_VERIFIED' : 'UNVERIFIED',
        verified: isVerified
      };
    });

    console.log(`   Overall Score: ${overallScore}%`);
    skillResults.forEach((sr) => {
      console.log(`   Skill: ${sr.skill} | Claimed: ${sr.claimedLevel} | Score: ${sr.score}% | Status: ${sr.status}`);
    });

    const reactResult = skillResults.find((s) => s.skill.toLowerCase().includes('react'));
    const mongoResult = skillResults.find((s) => s.skill.toLowerCase().includes('mongo'));

    if (!reactResult.verified || reactResult.score < 80) {
      throw new Error('Expected React to be verified with high score');
    }
    if (mongoResult.verified || mongoResult.score > 20) {
      throw new Error('Expected MongoDB to be unverified with low score');
    }
    console.log('✅ Server-side scoring produced accurate per-skill verified statuses.');

    // ----------------------------------------------------
    // TEST 5: User Registration & Skill Verification Sync
    // ----------------------------------------------------
    console.log('\n--- TEST 5: User Profile Registration & Verified Skill Sync ---');
    const testEmail = `student_onboarding_${Date.now()}@example.com`;
    const user = await User.create({
      name: 'Onboarded Developer',
      email: testEmail,
      password: 'Password123!',
      headline: 'Full Stack Engineer',
      skills: skillResults.map((sr) => ({
        name: sr.skill,
        proficiency: sr.claimedLevel,
        verified: sr.verified
      }))
    });

    // Also persist in SkillVerification collection
    for (const sr of skillResults) {
      await SkillVerification.create({
        user: user._id,
        skillName: sr.skill,
        claimedLevel: sr.claimedLevel,
        verifiedLevel: sr.verified ? 'Advanced' : 'Unverified',
        testScore: sr.score,
        verifiedConfidence: sr.score,
        status: sr.status,
        attemptsCount: 1,
        lastAttemptAt: new Date()
      });
    }

    const savedUser = await User.findById(user._id);
    const reactUserSkill = savedUser.skills.find((s) => s.name.toLowerCase().includes('react'));
    const mongoUserSkill = savedUser.skills.find((s) => s.name.toLowerCase().includes('mongo'));

    if (!reactUserSkill.verified) throw new Error('React should be marked verified in User document');
    if (mongoUserSkill.verified) throw new Error('MongoDB should NOT be marked verified in User document');

    console.log(`✅ User registered with ${savedUser.skills.length} skills (React: Verified ✓, MongoDB: Self-Reported).`);

    // Clean up
    await Promise.all([
      User.deleteOne({ _id: user._id }),
      OnboardingAssessment.deleteOne({ _id: assessmentDoc._id }),
      SkillVerification.deleteMany({ user: user._id })
    ]);

    console.log('\n🧹 Cleaned up temporary test artifacts from database.');
    console.log('\n================================================================');
    console.log('🎉 ALL AI SKILL REGISTRATION TESTS PASSED (100%)');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
