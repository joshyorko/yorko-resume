export const jumpTrigger = `<div class="jump-entry" hidden>
<button id="jump-open" type="button" aria-haspopup="dialog" aria-controls="jump-dialog" aria-keyshortcuts="/ Control+k Meta+k">Search <kbd aria-hidden="true"></kbd></button>
</div>`;

export const jumpDialog = `<dialog id="jump-dialog" aria-labelledby="jump-title">
  <div class="jump-panel">
    <div class="jump-heading"><h2 id="jump-title">Search this site</h2><button id="jump-close" type="button" aria-label="Close search">Close</button></div>
    <label class="visually-hidden" for="jump-input">Find a page, project, or skill</label>
    <input id="jump-input" type="text" role="combobox" aria-controls="jump-results" aria-expanded="true" aria-autocomplete="list" placeholder="Find a page, project, or skill" autocomplete="off" maxlength="120" enterkeyhint="go" autofocus>
    <p id="jump-status" class="visually-hidden" role="status"></p>
    <div id="jump-results" role="listbox" aria-label="Destinations"></div>
    <p id="jump-empty" hidden>No matches. Try a project or skill name.</p>
  </div>
</dialog>
<script type="module" src="/jump.mjs"></script>`;
