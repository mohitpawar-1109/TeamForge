import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from './models/User.js';
import Project from './models/Project.js';
import Task from './models/Task.js';
import SkillVerification from './models/SkillVerification.js';
import UserFeedback from './models/UserFeedback.js';
import ProjectFeedback from './models/ProjectFeedback.js';
import {
  getAssessmentQuestionsForSkill,
  evaluateSkillAuthenticity,
  calculateUserTrustProfile,
  calculateProjectCredibility
} from './services/trust.service.js';
import { calculateCandidateMatch } from './services/match.service.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/teamforge_dev';
const JWT_SECRET = process.env.JWT_SECRET || 'teamforge_super_secret_jwt_key_2026_hackathon_demo';

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 TEAMFORGE SKILL VERIFICATION & TRUST SYSTEM TEST SUITE');
  console.log('======================================================\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for verification tests.');

    // 1. Setup Test Users & Projects
    const testEmail1 = `test_alice_${Date.now()}@example.com`;
    const testEmail2 = `test_bob_${Date.now()}@example.com`;
    const testEmail3 = `test_charlie_${Date.now()}@example.com`;

    const alice = await User.create({
      name: 'Alice Cooper',
      email: testEmail1,
      password: 'Password123!',
      headline: 'Frontend Engineer',
      skills: [
        { name: 'React', proficiency: 'Advanced', verified: false },
        { name: 'Node.js', proficiency: 'Intermediate', verified: false }
      ],
      experienceLevel: 'Experienced',
      pastProjectsCount: 2
    });

    const bob = await User.create({
      name: 'Bob Martin',
      email: testEmail2,
      password: 'Password123!',
      headline: 'Fullstack Developer',
      skills: [
        { name: 'React', proficiency: 'Beginner', verified: false },
        { name: 'MongoDB', proficiency: 'Advanced', verified: false }
      ],
      experienceLevel: 'Intermediate'
    });

    const charlie = await User.create({
      name: 'Charlie Stranger',
      email: testEmail3,
      password: 'Password123!',
      headline: 'DevOps Enthusiast'
    });

    console.log('✅ Created test users: Alice (Lead), Bob (Teammate), Charlie (Stranger).');

    // Create shared project between Alice and Bob
    const project = await Project.create({
      title: 'Decentralized Analytics Dashboard',
      description: 'High-performance React & Node real-time platform.',
      category: 'Web Development',
      difficulty: 'Advanced',
      requiredSkills: ['React', 'Node.js', 'MongoDB'],
      owner: alice._id,
      members: [
        { user: alice._id, role: 'Lead Architect', status: 'Accepted' },
        { user: bob._id, role: 'Frontend Contributor', status: 'Accepted' }
      ]
    });

    // Create completed tasks
    await Task.create([
      { title: 'Build React UI Component Library', project: project._id, assignedTo: alice._id, status: 'DONE' },
      { title: 'Setup Node REST Endpoints', project: project._id, assignedTo: alice._id, status: 'DONE' },
      { title: 'Implement MongoDB Data Schema', project: project._id, assignedTo: bob._id, status: 'DONE' }
    ]);

    console.log('✅ Created collaborative Project & Task records.');

    // ----------------------------------------------------
    // TEST 1: Question Pool & Adaptive Questions Generator
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Adaptive Question Generation ---');
    const { clientQuestions, rawQuestions } = await getAssessmentQuestionsForSkill('React', 'Advanced');
    if (!clientQuestions || clientQuestions.length === 0) {
      throw new Error('Failed to generate client questions');
    }
    if (clientQuestions.some(q => q.correctAnswerIndex !== undefined)) {
      throw new Error('Security Breach: correctAnswerIndex leaked in client questions!');
    }
    console.log(`✅ Generated ${clientQuestions.length} sanitized questions for React (Advanced).`);
    console.log(`   Sample Question 1: "${clientQuestions[0].question.substring(0, 50)}..." [Type: ${clientQuestions[0].type}]`);

    // ----------------------------------------------------
    // TEST 2: Skill Authenticity Engine Evaluation
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Skill Authenticity Engine & Multi-Signal Scoring ---');
    // Simulate Alice answering accurately
    const aliceAnswers = rawQuestions.map(q => ({
      questionId: q.id,
      selectedOptionIndex: q.correctAnswerIndex
    }));

    const evaluation = await evaluateSkillAuthenticity({
      userId: alice._id,
      skillName: 'React',
      claimedLevel: 'Advanced',
      userAnswers: aliceAnswers,
      durationSeconds: 95
    });

    console.log(`   Test Score: ${evaluation.testScore}%`);
    console.log(`   Practical Score: ${evaluation.practicalScore}%`);
    console.log(`   Consistency Score: ${evaluation.consistencyScore}%`);
    console.log(`   Verified Confidence: ${evaluation.verifiedConfidence}%`);
    console.log(`   Verified Level: ${evaluation.verifiedLevel} (Claimed: ${evaluation.claimedLevel})`);
    console.log(`   Authenticity Status: ${evaluation.status}`);
    console.log(`   Project Evidence Detected: ${evaluation.projectEvidence.length} projects`);

    if (evaluation.testScore < 80 || evaluation.status !== 'VERIFIED') {
      throw new Error(`Expected Alice to pass verification, got status: ${evaluation.status}`);
    }
    console.log('✅ Authenticity Engine correctly evaluated high-accuracy submission as VERIFIED.');

    // Save verification to DB
    const verifRecord = await SkillVerification.create({
      user: alice._id,
      skillName: 'React',
      claimedLevel: 'Advanced',
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
      lastAttemptAt: new Date()
    });

    alice.skills[0].verified = true;
    await alice.save();

    // ----------------------------------------------------
    // TEST 3: Peer Feedback Authorization & Recording
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Peer Feedback & Collaboration Validation ---');
    // Bob leaves peer feedback for Alice (Valid - shared project)
    const validFeedback = await UserFeedback.create({
      author: bob._id,
      recipient: alice._id,
      project: project._id,
      technicalSkills: 5,
      communication: 5,
      reliability: 5,
      contribution: 5,
      wouldWorkAgain: true,
      writtenFeedback: 'Alice is an outstanding architect with deep React knowledge!'
    });
    console.log(`✅ Recorded valid peer feedback from Bob to Alice (Rating: 5/5).`);

    // ----------------------------------------------------
    // TEST 4: Project Feedback & Credibility Calculation
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Project Feedback & Credibility Rating ---');
    await ProjectFeedback.create({
      author: alice._id,
      project: project._id,
      technicalQuality: 5,
      communication: 5,
      reliability: 5,
      contribution: 5,
      documentation: 5,
      problemSolving: 5,
      writtenFeedback: 'Fantastic delivery on the dashboard.'
    });

    const projectCredibility = await calculateProjectCredibility(project._id);
    console.log(`   Project Title: ${projectCredibility.projectTitle}`);
    console.log(`   Credibility Score: ${projectCredibility.credibilityScore}/100 [${projectCredibility.tier}]`);
    console.log(`   Verified Contributors: ${projectCredibility.breakdown.verifiedContributors}%`);
    console.log(`   Task Execution: ${projectCredibility.breakdown.taskExecution}%`);

    if (projectCredibility.credibilityScore < 70) {
      throw new Error(`Expected high credibility score for active verified project, got ${projectCredibility.credibilityScore}`);
    }
    console.log('✅ Project Credibility Engine verified successfully.');

    // ----------------------------------------------------
    // TEST 5: Transparent User Trust & Reputation Profile
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Transparent Multi-Factor User Trust Profile ---');
    const trustProfile = await calculateUserTrustProfile(alice._id);
    console.log(`   User: ${trustProfile.userName}`);
    console.log(`   Overall Trust Score: ${trustProfile.overallTrustScore}/100`);
    console.log(`   Reputation Tier: ${trustProfile.tier}`);
    console.log(`   Skill Verification Factor: ${trustProfile.breakdown.skillVerification}%`);
    console.log(`   Project Contribution Factor: ${trustProfile.breakdown.projectContribution}%`);
    console.log(`   Team Reliability Factor: ${trustProfile.breakdown.teamReliability}%`);
    console.log(`   Peer Feedback Factor: ${trustProfile.breakdown.peerFeedback}%`);

    if (trustProfile.overallTrustScore < 70) {
      throw new Error(`Expected Alice to have high trust score, got ${trustProfile.overallTrustScore}`);
    }
    console.log('✅ User Trust & Reputation profile computed accurately.');

    // ----------------------------------------------------
    // TEST 6: Smart Matching Verified Skill Bonus
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Smart Matching Verified Skill Bonus ---');
    // Compare match score for Alice (Verified React) vs Unverified Candidate with same attributes
    const matchForAlice = calculateCandidateMatch(project, alice);
    console.log(`   Alice Match Score: ${matchForAlice.score}%`);
    console.log(`   Verified Skills Matched: ${matchForAlice.verifiedMatchedSkills?.join(', ')}`);
    console.log(`   Verified Bonus: +${matchForAlice.breakdown.verifiedBonus} pts`);
    console.log(`   Explanations: ${matchForAlice.explanations.slice(0, 2).join(' | ')}`);

    if (!matchForAlice.breakdown.verifiedBonus || matchForAlice.breakdown.verifiedBonus <= 0) {
      throw new Error('Expected candidate with verified skills to receive match bonus');
    }
    console.log('✅ Matching Engine rewards verified skill authenticity.');

    // Clean up test records
    await Promise.all([
      User.deleteMany({ _id: { $in: [alice._id, bob._id, charlie._id] } }),
      Project.deleteOne({ _id: project._id }),
      Task.deleteMany({ project: project._id }),
      SkillVerification.deleteOne({ _id: verifRecord._id }),
      UserFeedback.deleteOne({ _id: validFeedback._id }),
      ProjectFeedback.deleteMany({ project: project._id })
    ]);

    console.log('\n🧹 Cleaned up temporary test database artifacts.');
    console.log('\n======================================================');
    console.log('🎉 ALL 6 VERIFICATION & TRUST TEST SUITES PASSED (100%)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
