import platform from './platform-review.json' with { type: 'json' };
import review from './review-content.json' with { type: 'json' };
import additionalLinks from './clean-links.json' with { type: 'json' };
import './verify-approved.mjs';
import content from './content.json' with { type: 'json' };

const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const links = items => items.map(([label, href]) =>
  `<a href="${escape(href)}">${escape(label)}</a>`).join(' · ');

const projectUrls = [...content.projects.flatMap(project => project.links.map(([, url]) => url)),
  ...review.originalProjects.map(project => project.url), ...additionalLinks];
const renderProject = entry => entry.split(/(\[[^\]]+\|\d+\])/).map((part, index) => {
  if (index % 2 === 0) return escape(part);
  const [label, target] = part.slice(1, -1).split('|');
  const anchor = links([[label, projectUrls[Number(target)]]]);
  return index === 1 && entry.startsWith('[') ? '<strong>' + anchor + '</strong>' : anchor;
}).join('');

const bulletList = bullets => '<ul>' + bullets.map(text => '<li>' + escape(text) + '</li>').join('') + '</ul>';
const currentWork = bullets =>
  '<h4>Production backend services</h4>' + bulletList([2, 0, 3].map(i => bullets[i])) +
  '<h4>Distributed execution and AI evaluation</h4>' + bulletList([4, 1, 5, 6].map(i => bullets[i]));
const skillLabels = ['Languages', 'Services and data', 'Infrastructure', 'AI and testing', 'Delivery'];

export const resumeBody = `<article class="resume" aria-labelledby="resume-name">
<header>
<h1 id="resume-name">${escape(content.name)}</h1>
<p class="resume-tagline">${escape(platform.title)}</p>
<p class="resume-contact">${escape(content.contactText)} · ${links(content.contactLinks)}</p>
<p class="resume-summary">${escape(platform.summary)}</p>
</header>
<div class="resume-download"><a class="button" href="/resume/JoshuaYorko-Resume.pdf" download>Download Résumé</a></div>

<section>
<h2>EXPERIENCE</h2>

${content.jobs.map(({ heading, dates, role, bullets }, index) => `<div class="resume-job">
<div class="resume-job-heading"><h3>${escape(heading)}</h3><p class="resume-dates">${escape(dates)}</p></div>
${role ? `<p class="resume-role">${escape(role)}</p>\n` : ''}${index === 0 ? currentWork(bullets) : bulletList(bullets)}
</div>`).join('\n\n')}
</section>

<section>
<h2>TECHNICAL SKILLS</h2>
${content.skills.flatMap(line => line.split(' · ')).map((text, index) =>
  '<p class="resume-skills"><strong>' + skillLabels[index] + '</strong> — ' + escape(text) + '</p>').join('')}
</section>
<section>
<h2>OPEN-SOURCE ENGINEERING</h2>
${platform.projects.map(([heading, entries]) => `<h3>${escape(heading)}</h3>
${entries.map(entry => `<p class="resume-project">${renderProject(entry)}</p>`).join('')}`).join('')}
</section>
</article>`;
