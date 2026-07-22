// this is to tell jest to user env.test in all the .test files also import this in jest.config.js
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });