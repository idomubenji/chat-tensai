import axios, { AxiosError } from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.production
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const execAsync = promisify(exec);
const EC2_IP = '44.200.83.77';
const SSH_KEY_PATH = '~/.ssh/chat-genius-ec2.pem';
const EC2_USER = 'ec2-user';

describe('Deployment Configuration', () => {
  test('SSH key file exists', async () => {
    const expandedPath = SSH_KEY_PATH.replace('~', process.env.HOME || '');
    expect(fs.existsSync(expandedPath)).toBe(true);
  });

  test('Required environment variables are set', () => {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_BUCKET_NAME'
    ];

    requiredEnvVars.forEach(envVar => {
      expect(process.env[envVar]).toBeDefined();
    });
  });

  test('Can connect to EC2 instance', async () => {
    const { stdout, stderr } = await execAsync(
      `ssh -i ${SSH_KEY_PATH} -o ConnectTimeout=5 ${EC2_USER}@${EC2_IP} echo "Connection successful"`
    );
    expect(stderr).toBe('');
    expect(stdout.trim()).toBe('Connection successful');
  });

  test('Node.js is installed on EC2', async () => {
    const { stdout } = await execAsync(
      `ssh -i ${SSH_KEY_PATH} ${EC2_USER}@${EC2_IP} "node --version"`
    );
    expect(stdout.trim()).toMatch(/v\d+\.\d+\.\d+/);
  });

  test('PM2 is installed on EC2', async () => {
    const { stdout } = await execAsync(
      `ssh -i ${SSH_KEY_PATH} ${EC2_USER}@${EC2_IP} "pm2 --version"`
    );
    expect(stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
  });
});

// Skip these tests in CI environment
(process.env.CI ? describe.skip : describe)('Server Health Checks', () => {
  const SERVER_URL = `http://${EC2_IP}:3000`;

  test('Server responds to health check', async () => {
    try {
      const response = await axios.get(SERVER_URL);
      expect(response.status).toBe(200);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to connect to server: ${error.message}`);
      }
      throw error;
    }
  });

  test('Supabase connection is working', async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/health/supabase`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('connected');
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to verify Supabase connection: ${error.message}`);
      }
      throw error;
    }
  });
}); 