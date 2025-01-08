import * as dotenv from 'dotenv';
dotenv.config();

console.log('Checking AWS environment variables...\n');

const requiredVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME'
];

let missingVars = false;

for (const varName of requiredVars) {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✓ Set' : '✗ Missing'}`);
  if (!value) missingVars = true;
}

if (missingVars) {
  console.log('\n❌ Some required environment variables are missing!');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
} 