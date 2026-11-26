import cleanLinks from './clean-links.json' with { type: 'json' };
import cleanProjects from './clean-projects.json' with { type: 'json' };
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import review from './review-content.json' with { type: 'json' };
import content from './content.json' with { type: 'json' };

const engine = process.env.TECTONIC || 'tectonic';
const output = resolve(process.argv[2] || 'resume-candidates');
if (execFileSync(engine, ['--version'], { encoding: 'utf8' }).trim() !== 'Tectonic 0.17.0')
  throw new Error('Use Tectonic 0.17.0');
mkdirSync(output, { recursive: true });

const tex = text => text.replace(/[\\{}$&#_%~^|]/g, c =>
  ({ '\\': '\\textbackslash{}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}', '|': '\\textbar{}' })[c] || '\\' + c);
const command = (name, ...args) => '\\' + name + args.map(value => '{' + value + '}').join('');
const emphasize = (text, phrase) => phrase ? tex(text).replace(tex(phrase), command('textbf', tex(phrase))) : tex(text);
const links = items => items.map(([label, url]) =>
  command('prooflink', url.replace(/[%#]/g, '\\$&'), tex(label))).join(' \\separator ');

const [current, ...earlier] = content.jobs;
const currentPhrases = [null, 'MCP/HTTP testing platform', 'daily claims-image API', null,
  'hourly distributed QA execution platform', 'Go/SOAP API replacement', null];
const projectPhrases = ['RFCs adopted in Hive v4/v5', '58 merged PRs across eight repositories'];
const skillLabels = ['Languages', 'Services and data', 'Infrastructure', 'AI and testing', 'Delivery'];
const skillGroups = content.skills.flatMap(line => line.split(' · ')).map((group, index) =>
  command('skill', skillLabels[index], tex(group)));
const stackedSkills = command('skillsbody', skillGroups.join('\\par\n'));
const compactSkills = command('skillsbody', [
  skillGroups.slice(0, 2).join(' \\skillseparator '),
  skillGroups[2],
  skillGroups.slice(3).join(' \\skillseparator '),
].join('\\par\n'));

function job(job, style) {
  const [employer, previousRole] = job.heading.split(' | ');
  return command(style, tex(employer), tex(job.role || previousRole), tex(job.dates));
}

function work(order, block) {
  return order.map(index => command(block, emphasize(current.bullets[index], currentPhrases[index]))).join('\n');
}

function projects(style, start = 0, end = content.projects.length) {
  return content.projects.map((project, index) =>
    command(index < 2 && style === 'evidenceproject' ? 'featuredproject' : style, tex(project.name), emphasize(project.description, projectPhrases[index]), links(project.links))).slice(start, end).join('\n');
}

const conventional = [0, 1, 2, 3, 4, 5, 6];
const focused = [4, 0, 1, 2, 3, 5, 6];
const sections = {
  experience: command('sectiontitle', 'EXPERIENCE'),
  projects: command('sectiontitle', 'OPEN-SOURCE ENGINEERING'),
  skills: command('sectiontitle', 'TECHNICAL SKILLS'),
};
const earlierJobs = style => earlier.map(item =>
  job(item, style) + '\n' + command('earlier', tex(item.bullets[0]))).join('\n');

const projectUrls = [...content.projects.flatMap(project => project.links.map(([, url]) => url)),
  ...review.originalProjects.map(project => project.url), ...cleanLinks];
const cleanEntries = cleanProjects.flatMap(([heading, entries]) => [
  command('workgroup', tex(heading)),
  ...entries.map(entry => {
    const parts = entry.split(/(\[[^\]]+\|\d+\])/);
    return command('cleanproject', parts.map((part, index) => {
      if (index % 2 === 0) return index === 0 && part.startsWith('Linux systems')
        ? command('textbf', 'Linux systems') + tex(part.slice('Linux systems'.length)) : tex(part);
      const [label, target] = part.slice(1, -1).split('|');
      const link = links([[label, projectUrls[Number(target)]]]);
      return index === 1 && parts[0] === '' ? command('textbf', link) : link;
    }).join(''));
  }),
]);

const compositions = {
  A: [sections.experience, job(current, 'row'), command('workgroup', 'QA and integration'),
    work([4, 1, 5, 6], 'achievement'), command('workgroup', 'Healthcare systems'), work([0, 2, 3], 'achievement'),
    earlierJobs('row'), sections.projects, projects('inlineproject'), sections.skills, compactSkills],
  B: [sections.experience, job(current, 'stacked'), '\\begin{workbody}',
    work(conventional.slice(0, 4), 'paragraphitem'), '\\vspace{3pt}',
    work(conventional.slice(4), 'paragraphitem'), '\\end{workbody}', earlierJobs('row'),
    sections.projects, projects('namedproject'), sections.skills, stackedSkills],
  H: [sections.projects, projects('evidenceproject'), sections.experience,
    job(current, 'datedrow'), command('workgroup', 'QA and integration'),
    work([4, 1, 5, 6], 'achievement'), command('workgroup', 'Healthcare systems'),
    work([0, 2, 3], 'achievement'), earlierJobs('datedrow'), sections.skills, compactSkills],
  R: [sections.projects, ...review.originalProjects.map(({ name, url, description }) =>
    command('originalproject', links([[name, url]]), tex(description))),
    projects('evidenceproject', 2, 3), projects('evidenceproject', 0, 2),
    projects('evidenceproject', 3), sections.experience,
    job(current, 'datedrow'), command('workgroup', 'QA and integration'),
    work([4, 1, 5, 6], 'achievement'), command('workgroup', 'Healthcare systems'),
    work([0, 2, 3], 'achievement'), earlierJobs('datedrow'), sections.skills, compactSkills],
  S: [sections.experience, job(current, 'datedrow'), command('workgroup', 'QA and integration'),
    work([4, 1, 5, 6], 'achievement'), command('workgroup', 'Healthcare systems'),
    work([0, 2, 3], 'achievement'), earlierJobs('datedrow'),
    sections.skills, stackedSkills, '\\newpage', sections.projects, ...cleanEntries],
  C: [sections.projects, projects('evidenceproject', 0, 2), sections.experience,
    job(current, 'row'), work(focused.slice(0, 1), 'lead'), work(focused.slice(1), 'achievement'),
    earlierJobs('row'), command('sectiontitle', 'MORE OPEN-SOURCE ENGINEERING'),
    projects('evidenceproject', 2), sections.skills, stackedSkills],
};

const template = readFileSync(new URL('./layout.tex', import.meta.url), 'utf8');
for (const [id, composition] of Object.entries(compositions)) {
  const style = readFileSync(new URL('./layout-' + (['R', 'S'].includes(id) ? 'H' : id) + '.tex', import.meta.url), 'utf8');
  const source = template.replace('%%STYLE%%', () => ['R', 'S'].includes(id) ? style + '\n' + readFileSync(new URL('./layout-' + id + '.tex', import.meta.url), 'utf8') : style)
    .replace('%%NAME%%', () => tex(content.name))
    .replace('%%TITLE%%', () => tex(content.title))
    .replace('%%CONTACT%%', () => tex(content.contactText) + ' \\separator ' + links(content.contactLinks))
    .replace('%%SUMMARY%%', () => tex(['R', 'S'].includes(id) ? review.summary : content.summary))
    .replace('%%BODY%%', () => composition.join('\n'));
  writeFileSync(resolve(output, id + '.tex'), source);
  execFileSync(engine, ['--untrusted', '--bundle', 'https://relay.fullyjustified.net/default_bundle_v33.tar', '--keep-logs', id + '.tex'], {
    cwd: output,
    env: { ...process.env, SOURCE_DATE_EPOCH: '1795651200', FORCE_SOURCE_DATE: '1' },
    stdio: 'inherit',
  });
}
