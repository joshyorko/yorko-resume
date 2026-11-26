const controls = document.querySelector('#skill-controls');
const field = document.querySelector('#skill-search');
const status = document.querySelector('#skill-count');
const groups = [...document.querySelectorAll('.skill-group')].map(group => ({
  group,
  entries: [...group.querySelectorAll('.skill')].map(entry => ({
    entry,
    text: entry.textContent.toLowerCase(),
  })),
}));

function filter() {
  const words = field.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const { group, entries } of groups) {
    let matches = 0;
    for (const { entry, text } of entries) {
      entry.hidden = !words.every(word => text.includes(word));
      if (!entry.hidden) matches += 1;
    }
    group.hidden = matches === 0;
    total += matches;
  }
  status.textContent = total === 0 ? 'No matching skills. Try a plugin name or a shorter term.' :
    `${total} ${total === 1 ? 'skill' : 'skills'}`;
}

field.addEventListener('input', filter);
controls.hidden = false;
filter();
