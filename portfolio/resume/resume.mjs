import content from './content.json' with { type: 'json' };

const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const links = items => items.map(([label, href]) =>
  `<a href="${escape(href)}">${escape(label)}</a>`).join(' · ');

export const resumeBody = `<article class="resume" aria-labelledby="resume-name">
<header>
<h1 id="resume-name">${escape(content.name)}</h1>
<p class="resume-tagline">${escape(content.title)}</p>
<p class="resume-contact">${escape(content.contactText)} · ${links(content.contactLinks)}</p>
<p class="resume-summary">${escape(content.summary)}</p>
</header>
<div class="resume-download"><a class="button" href="/resume/JoshuaYorko-Resume.pdf" download>Download Résumé</a></div>

<section>
<h2>EXPERIENCE</h2>

${content.jobs.map(({ heading, dates, role, bullets }) => `<div class="resume-job">
<div class="resume-job-heading"><h3>${escape(heading)}</h3><p class="resume-dates">${escape(dates)}</p></div>
${role ? `<p class="resume-role">${escape(role)}</p>\n` : ''}<ul>
${bullets.map(text => `<li>${escape(text)}</li>`).join('\n')}
</ul>
</div>`).join('\n\n')}
</section>

<section>
<h2>OPEN-SOURCE ENGINEERING</h2>

${content.projects.map(({ name, description, links: evidence }) => `<div class="resume-project">
<p><strong>${escape(name)} —</strong> ${escape(description)}</p>
<p class="resume-evidence">${links(evidence)}</p>
</div>`).join('\n\n')}
</section>

<section>
<h2>TECHNICAL SKILLS</h2>
${content.skills.map(text => `<p class="resume-skills">${escape(text)}</p>`).join('\n')}
</section>
</article>`;
