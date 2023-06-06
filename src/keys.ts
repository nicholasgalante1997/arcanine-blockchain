import { randomBytes } from 'crypto';

const SECURITY_KEY = randomBytes(32);
const INITIALIZATON_VECTOR = randomBytes(16);

export { SECURITY_KEY, INITIALIZATON_VECTOR };