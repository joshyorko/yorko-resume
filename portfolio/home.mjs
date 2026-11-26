for (const button of document.querySelectorAll('[data-copy]')) {
  const text = document.getElementById(button.dataset.copy).textContent;
  button.hidden = !navigator.clipboard;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Select and copy';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 2000);
  });
}
