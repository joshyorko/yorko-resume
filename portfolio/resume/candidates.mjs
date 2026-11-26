import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import content from './content.json' with { type: 'json' };

const engine = process.env.TECTONIC || 'tectonic';
const output = resolve(process.argv[2] || 'resume-candidates');
const toolVersion = execFileSync(engine, ['--version'], { encoding: 'utf8' }).trim();
if (toolVersion !== 'Tectonic 0.17.0') throw new Error('Use Tectonic 0.17.0');
mkdirSync(output, { recursive: true });

const special = {
  '\\': String.raw`\textbackslash{}`, '~': String.raw`\textasciitilde{}`,
  '^': String.raw`\textasciicircum{}`, '|': String.raw`\textbar{}`,
};
const tex = text => text.replace(/[\\{}$&#_%~^|]/g, c => special[c] || '\\' + c);
const links = items => items.map(([label, url]) =>
  String.raw`\href{${url.replace(/[%#]/g, '\\$&')}}{${tex(label)}}`).join(' · ');

const variants = [
  { id: 'editorial', body: 'pagella', color: '214942', size: '10.5', leading: '12.7', rule: true, margin: '0.52in' },
  { id: 'modern', body: 'heros', color: '254670', size: '10.4', leading: '12.7', rule: false, margin: '0.61in' },
  { id: 'classic', body: 'termes', color: '303030', size: '10.7', leading: '12.9', rule: true, margin: '0.59in' },
];

for (const { id, body, color, size, leading, rule, margin } of variants) {
  const source = String.raw`\documentclass[letterpaper]{article}
\usepackage[top=0.45in,bottom=0.44in,left=${margin},right=${margin}]{geometry}
\usepackage{fontspec}
\setmainfont{texgyre${body}-regular.otf}[BoldFont=texgyre${body}-bold.otf]
\usepackage{xcolor}
\definecolor{accent}{HTML}{${color}}
\usepackage[unicode,colorlinks,urlcolor=accent]{hyperref}
\hypersetup{pdftitle={${tex(content.name)} — Résumé},pdfauthor={${tex(content.name)}}}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\newcommand{\sectiontitle}[1]{\par\vspace{8pt}{\bfseries\color{accent}\fontsize{10.5}{12}\selectfont #1\par}${rule ? String.raw`{\color{accent}\hrule height 0.35pt}\vspace{2pt}` : String.raw`\vspace{1.5pt}`}}
\newcommand{\job}[2]{\par\vspace{4pt}\textbf{#1} · #2\par}
\newcommand{\workitem}[1]{\par\hangindent=8pt\hangafter=1\makebox[8pt][l]{\textbullet}#1\par}
\newcommand{\project}[3]{\par\vspace{4pt}\textbf{#1 —} #2\par{\fontsize{9.2}{11}\selectfont #3\par}}
\begin{document}
\raggedright
\fontsize{${size}}{${leading}}\selectfont
{${id === "classic" ? String.raw`\centering` : ""}
{\bfseries\color{accent}\fontsize{26}{29}\selectfont ${tex(content.name)}\par}
{\bfseries ${tex(content.title)}\par}
${tex(content.contactText)} · ${links(content.contactLinks)}\par}
\vspace{6pt}
${tex(content.summary)}\par
\sectiontitle{EXPERIENCE}
${content.jobs.map(({ heading, dates, role, bullets }) =>
  String.raw`\job{${tex(heading)}}{${tex(dates)}}` + '\n' +
  (role ? tex(role) + String.raw`\par` + '\n' : '') +
  bullets.map(text => String.raw`\workitem{${tex(text)}}`).join('\n')).join('\n')}
\sectiontitle{OPEN-SOURCE ENGINEERING}
${content.projects.map(project =>
  String.raw`\project{${tex(project.name)}}{${tex(project.description)}}{${links(project.links)}}`).join('\n')}
\sectiontitle{TECHNICAL SKILLS}
${content.skills.map(text => tex(text) + String.raw`\par`).join('\n')}
\end{document}
`;
  writeFileSync(resolve(output, id + '.tex'), source);
  execFileSync(engine, ['--untrusted', '--bundle', 'https://relay.fullyjustified.net/default_bundle_v33.tar', '--keep-logs', id + '.tex'], {
    cwd: output,
    env: { ...process.env, SOURCE_DATE_EPOCH: '1795651200', FORCE_SOURCE_DATE: '1' },
    stdio: 'inherit',
  });
}
