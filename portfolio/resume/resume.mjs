export const resumeBody = `<article class="resume" aria-labelledby="resume-name">
<header>
<h1 id="resume-name">Joshua Yorko</h1>
<p class="resume-tagline">Software Engineer | Distributed Systems &amp; Agentic AI</p>
<p class="resume-contact">Worcester, MA · (260) 443-8425 · <a href="mailto:joshua.yorko@gmail.com">joshua.yorko@gmail.com</a> · <a href="https://github.com/joshyorko">GitHub</a> · <a href="https://www.linkedin.com/in/joshua-yorko-560103a9/">LinkedIn</a></p>
<p class="resume-summary">I build and operate healthcare backend systems, distributed automation and AI evaluation tooling. I also maintain open-source execution runtimes and contribute architectural designs to autonomous software engineering projects.</p>
</header>
<div class="resume-download"><a class="button" href="/resume/JoshuaYorko-Resume.pdf" download>Download Résumé</a></div>

<section>
<h2>EXPERIENCE</h2>

<div class="resume-job">
<div class="resume-job-heading"><h3>Gainwell Technologies</h3><p class="resume-dates">Jun 2023 - Present</p></div>
<p class="resume-role">Advisor Application Designer</p>
<ul>
<li>Build and operate event-driven AWS healthcare systems using Terraform, Lambda, ECS, SQS, DynamoDB and S3, with durable state, retries and idempotent processing.</li>
<li>Built an MCP/HTTP testing platform for call-processing pipelines and repeatable AI evaluations, including blinded prompt comparisons, transcript grounding and regression tests.</li>
<li>Built and operate a daily claims-image API integrating four clearinghouses, with asynchronous FastAPI services, PostgreSQL caching, object storage and Kubernetes deployment.</li>
<li>Built daily claims allocation around analyst skills, availability and priorities, delivering individualized workloads and exception reports from Python/SQL pipelines.</li>
<li>Designed and operate an hourly distributed QA execution platform: producer/consumer queues in DocumentDB, autoscaling Kubernetes ARC runners, atomic work claims, failure replay and idempotent results. Added redacted diagnostics for agent-assisted fixes.</li>
<li>Building a Go/SOAP API replacement for browser-based QA, with SQS, DynamoDB transactions, durable write intents and reconciliation of uncertain external submissions.</li>
<li>Built an isolated Windows VM and Docker lab with synthetic data to enable reproducible vendor API integration testing without access to production PHI.</li>
</ul>
</div>

<div class="resume-job">
<div class="resume-job-heading"><h3>Gainwell Technologies | Senior Data Engineer / Software Engineer</h3><p class="resume-dates">Jun 2022 - Mar 2023</p></div>
<ul>
<li>Built AWS Glue/S3/PySpark data pipelines and PostgreSQL-backed services for Django applications.</li>
</ul>
</div>

<div class="resume-job">
<div class="resume-job-heading"><h3>Lambent Spaces | Implementations Specialist</h3><p class="resume-dates">Mar 2021 - Oct 2022</p></div>
<ul>
<li>Built Python/SQL tooling for customer implementations and troubleshooting.</li>
</ul>
</div>

<div class="resume-job">
<div class="resume-job-heading"><h3>CVS Health | Data Analyst</h3><p class="resume-dates">May 2019 - Mar 2021</p></div>
<ul>
<li>Built Python deployment reporting for a Microsoft 365 rollout across 80,000 devices.</li>
</ul>
</div>
</section>

<section>
<h2>OPEN-SOURCE ENGINEERING</h2>

<div class="resume-project">
<p><strong>Hive Commons —</strong> Authored desired-state reconciliation and external software-factory RFCs adopted in Hive v4/v5; scoped a 16-issue epic and separated admission, verification and publication.</p>
<p class="resume-evidence"><a href="https://github.com/hivecommons/hive">Hive repo</a> · <a href="https://github.com/hivecommons/hive/issues/3845">Convergence RFC #3845</a> · <a href="https://github.com/hivecommons/hive/issues/8201">External factories RFC #8201</a> · <a href="https://github.com/hivecommons/hive/issues/8290">Maintainer adoption</a></p>
</div>

<div class="resume-project">
<p><strong>Project Bluefin —</strong> 58 merged PRs across eight repositories: agent execution/review, OCI composition, native ARM64 qualification and CI reliability; authored exploratory testing RFCs.</p>
<p class="resume-evidence"><a href="https://github.com/projectbluefin">Project Bluefin</a> · <a href="https://github.com/search?q=org%3Aprojectbluefin+author%3Ajoshyorko+is%3Apr+is%3Amerged&amp;type=pullrequests">Merged PRs</a> · <a href="https://github.com/projectbluefin/contribute/pull/191">Review #191</a> · <a href="https://github.com/projectbluefin/contribute/pull/347">Review #347</a> · <a href="https://github.com/projectbluefin/testsuite/issues/1302">Desktop RFC #1302</a> · <a href="https://github.com/projectbluefin/testsuite/issues/1303">Validation RFC #1303</a></p>
</div>

<div class="resume-project">
<p><strong>RCC &amp; Actions Runtime —</strong> Maintain community continuations of Robocorp tooling: uv-native environments, immutable artifacts, remote/offline distribution, execution leases and Python MCP/HTTP tools.</p>
<p class="resume-evidence"><a href="https://github.com/joshyorko/rcc">RCC repo</a> · <a href="https://github.com/joshyorko/rcc/pull/119">Artifacts #119</a> · <a href="https://github.com/joshyorko/rcc/pull/81">uv-native #81</a> · <a href="https://github.com/joshyorko/actions">Actions Runtime</a> · <a href="https://github.com/joshyorko/actions/pull/317">Recovery #317</a></p>
</div>

<div class="resume-project">
<p><strong>Linux &amp; OCI systems —</strong> Build Dudley OS, DSB Common, Omarchy bootc and Webtop OS: signed reusable OCI payloads, immutable OS assembly and portable graphical workspaces.</p>
<p class="resume-evidence"><a href="https://github.com/joshyorko/dudley-os">Dudley OS</a> · <a href="https://github.com/joshyorko/dsb-common">DSB Common</a> · <a href="https://github.com/joshyorko/omarchy-bootc">Omarchy bootc</a> · <a href="https://github.com/joshyorko/webtop-os">Webtop OS</a></p>
</div>

<div class="resume-project">
<p><strong>Hauler —</strong> Fixed Docker-context resolution upstream, with regression tests and real container-image import verification.</p>
<p class="resume-evidence"><a href="https://github.com/hauler-dev/hauler">Hauler repo</a> · <a href="https://github.com/hauler-dev/hauler/pull/928">Docker context fix #928</a></p>
</div>
</section>

<section>
<h2>TECHNICAL SKILLS</h2>
<p class="resume-skills">Python, Go, SQL, TypeScript · FastAPI, PostgreSQL, DynamoDB · AWS, Terraform, Kubernetes, Docker, Argo CD</p>
<p class="resume-skills">MCP, Amazon Bedrock, LLM evaluation, Playwright, pytest · OCI, bootc, GitHub Actions</p>
</section>
</article>`;
