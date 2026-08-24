import { generateOnboardingAssessment } from './controllers/verification.controller.js';
import { connectDB } from './config/db.js';

await connectDB();

const req = { body: { skills: [{name: 'React', claimedProficiency: 'Expert'}] } };
const res = { status: (c) => { console.log('STATUS:', c); return res; }, json: (d) => { console.log('JSON:', JSON.stringify(d, null, 2)); process.exit(0); } };
try { await generateOnboardingAssessment(req, res); } catch(e) { console.error('ERROR:', e); process.exit(1); }
