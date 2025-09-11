
## Instructions for Me


Hi Josh,  This is your resume builder,  everything should be automated right now except xelatex pdf resume creation.  You will get to it but for now to update your resume you can update the github pages version here ```docs/index.md```. 

To update pdf version you need to install xelatex and compile the pdf,  instructions below

To ensure you have the necessary tools installed and to compile your resume using XeLaTeX, follow these steps:

1. Install TeX Live (options from smallest -> largest):
    ```sh
    # Minimal set (often sufficient for these templates)
    sudo apt-get update && sudo apt-get install -y texlive-xetex texlive-latex-extra texlive-fonts-extra texlive-fonts-recommended
    
    # OR full distribution (larger download ~4+ GB)
    sudo apt-get install -y texlive-full
    ```

2. Change directory into the respective resume template directory:
    ```sh
    cd templates/<resume_template_directory>
    ```

3. Compile the resume using XeLaTeX (run twice for proper refs/footer):
    ```sh
    xelatex {filename}.tex
    xelatex {filename}.tex
    ```

Replace `<resume_template_directory>` with the actual directory name and `{filename}` with the name of your .tex file.

### Available templates

Current template directories:

* `templates/awesome-resume/` -> main file: `JoshYorkoResume.tex`
* `templates/developer-resume/` -> main file: `main.tex`

Examples:
```sh
cd templates/awesome-resume
xelatex JoshYorkoResume.tex && xelatex JoshYorkoResume.tex

cd ../../templates/developer-resume
xelatex main.tex && xelatex main.tex
```

### Common issue: `Missing \begin{document}`

If you previously saw an error like:

```
! LaTeX Error: Missing \begin{document}.
l.35 p
      ink, awesome-orange, awesome-nephritis, awesome-concrete, awesome-dark...
```

It was caused by a line break inside a comment in `JoshYorkoResume.tex` that left the word `pink` (and following text) outside of a `%` comment line. This has been fixed by commenting the continuation. Pull latest / ensure the file contains:

```tex
\colorlet{awesome}{awesome-red} % Default colors include: awesome-emerald, awesome-skyblue, awesome-red, awesome-pink,
% awesome-orange, awesome-nephritis, awesome-concrete, awesome-darknight
```

If you ever edit that line, make sure every wrapped line still starts with `%`.

### Optional: simple Makefile

You can create a `Makefile` inside each template directory to automate builds:

```Makefile
FILE=JoshYorkoResume
all:
    xelatex $(FILE).tex && xelatex $(FILE).tex
clean:
    rm -f $(FILE).aux $(FILE).log $(FILE).out $(FILE).pdf $(FILE).toc
```

Then run:
```sh
make        # builds PDF
make clean  # removes build artifacts
```

Add similar for the developer resume (change `FILE=main`).

### Future improvement ideas
* Add a GitHub Action to compile and attach PDFs on push
* Provide a container image with TeX Live preinstalled for reproducible builds
* Script to copy final PDFs into `docs/assets/` for hosting

Let me know when you want to automate those and we can wire them up.