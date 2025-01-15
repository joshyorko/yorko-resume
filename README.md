
## Instructions for Me


Hi Josh,  This is your resume builder,  everything should be automated right now except xelatex pdf resume creation.  You will get to it but for now to update your resume you can update the github pages version here ```docs/index.md```. 

To update pdf version you need to install xelatex and compile the pdf,  instructions below

To ensure you have the necessary tools installed and to compile your resume using XeLaTeX, follow these steps:

1. Install the full TeX Live distribution:
    ```sh
    sudo apt-get install texlive-full
    ```

2. Change directory into the respective resume template directory:
    ```sh
    cd templates/<resume_template_directory>
    ```

3. Compile the resume using XeLaTeX:
    ```sh
    xelatex {filename}.tex
    ```

Replace `<resume_template_directory>` with the actual directory name and `{filename}` with the name of your .tex file.