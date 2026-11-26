import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const pdf = new URL('./JoshuaYorko-Resume.pdf', import.meta.url);
export const approvedResumeDigest = createHash('sha256').update(readFileSync(pdf)).digest('hex');
if (approvedResumeDigest !== '30e46cce1ab50c583f158f8786ad74db3e9a60554e3ac7db07882d1fcd359eda')
  throw new Error('Canonical PDF does not match approved artifact 15145118815');
