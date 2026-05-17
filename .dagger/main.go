package main

import (
	"context"
	"dagger/yorko-resume/internal/dagger"
)

type YorkoResume struct{}

const (
	workdir         = "/src"
	resumeTexDir    = workdir + "/templates/awesome-resume"
	resumePDF       = resumeTexDir + "/JoshYorkoResume.pdf"
	publishedPDF    = workdir + "/docs/assets/JoshYorkoResume.pdf"
	siteDir         = workdir + "/site"
	buildImage      = "python:3.12-bookworm"
)

// BuildPdf compiles the canonical XeLaTeX resume source and returns the PDF.
func (m *YorkoResume) BuildPdf(
	ctx context.Context,
	// +defaultPath="/"
	source *dagger.Directory,
) *dagger.File {
	return m.buildContainer(source).File(resumePDF)
}

// BuildSite compiles the resume PDF, copies it into docs/assets, then builds the MkDocs site.
func (m *YorkoResume) BuildSite(
	ctx context.Context,
	// +defaultPath="/"
	source *dagger.Directory,
) *dagger.Directory {
	return m.buildContainer(source).Directory(siteDir)
}

// Check runs the full isolated build factory used by CI.
func (m *YorkoResume) Check(
	ctx context.Context,
	// +defaultPath="/"
	source *dagger.Directory,
) (string, error) {
	return m.buildContainer(source).
		WithExec([]string{"test", "-s", publishedPDF}).
		WithExec([]string{"test", "-f", siteDir + "/index.html"}).
		WithExec([]string{"sh", "-c", "printf 'Built %s and %s\\n' docs/assets/JoshYorkoResume.pdf site/index.html"}).
		Stdout(ctx)
}

func (m *YorkoResume) buildContainer(source *dagger.Directory) *dagger.Container {
	return dag.Container().
		From(buildImage).
		WithEnvVariable("DEBIAN_FRONTEND", "noninteractive").
		WithExec([]string{"apt-get", "update"}).
		WithExec([]string{"apt-get", "install", "-y", "--no-install-recommends", "texlive-xetex", "texlive-latex-extra", "texlive-fonts-extra", "texlive-fonts-recommended"}).
		WithMountedCache("/root/.cache/pip", dag.CacheVolume("yorko-resume-pip-cache")).
		WithMountedDirectory(workdir, source).
		WithWorkdir(workdir).
		WithExec([]string{"python", "-m", "pip", "install", "--upgrade", "pip"}).
		WithExec([]string{"python", "-m", "pip", "install", "mkdocs==1.5.3", "mkdocs-material==9.4.6", "mkdocs-minify-plugin==0.7.1", "mkdocs-git-revision-date-localized-plugin==1.2.1", "mkdocs-glightbox==0.3.4", "pymdown-extensions==10.8"}).
		WithWorkdir(resumeTexDir).
		WithExec([]string{"xelatex", "-interaction=nonstopmode", "-halt-on-error", "JoshYorkoResume.tex"}).
		WithExec([]string{"xelatex", "-interaction=nonstopmode", "-halt-on-error", "JoshYorkoResume.tex"}).
		WithExec([]string{"cp", resumePDF, publishedPDF}).
		WithWorkdir(workdir).
		WithExec([]string{"mkdocs", "build", "--strict"})
}
