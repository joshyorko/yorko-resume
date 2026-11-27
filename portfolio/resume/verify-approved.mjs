import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const pdf = new URL('./JoshuaYorko-Resume.pdf', import.meta.url);
export const approvedResumeDigest = createHash('sha256').update(readFileSync(pdf)).digest('hex');
if (approvedResumeDigest !== '1087885d2018a46b48e0cf180707e0fe5b0a19c20fe2c7f4be46048fa150de59')
  throw new Error('Canonical PDF does not match the approved red Awesome-CV résumé');
