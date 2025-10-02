document.addEventListener('DOMContentLoaded', () => {
  const chatHistory = document.getElementById('chat-history');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const tierSelect = document.getElementById('tier-select');
  const facSelect = document.getElementById('fac-select');
  const coaSelect = document.getElementById('coa-select');
  const history = [];
  const MAX_TURNS = 12;

  // Check for missing DOM elements
  if (!chatHistory || !chatForm || !userInput || !tierSelect || !facSelect || !coaSelect) {
    console.error('Missing DOM elements:', {
      chatHistory: !!chatHistory,
      chatForm: !!chatForm,
      userInput: !!userInput,
      tierSelect: !!tierSelect,
      facSelect: !!facSelect,
      coaSelect: !!coaSelect
    });
    return;
  }

  const COA_OPTIONS = [
    { id: 'FACA Reference Interpreter', label: 'FACA Reference Interpreter' },
    { id: 'Evidence Pack Builder', label: 'Evidence Pack Builder' },
    { id: 'Checklist Readiness Coach', label: 'Checklist Readiness Coach' },
    { id: 'Training Crash-Course Generator', label: 'Training Crash-Course Generator' },
  ];

  const FAC_ACRONYMS = {
    'Antiterrorism': 'AT',
    'Operations Security': 'OPSEC',
    'Information and Personnel Security Program': 'IPSP',
    'Marine Corps Safety Management Systems': 'MCSMS',
    'Defense Travel System': 'DTS',
    'Government Travel Charge Card Program': 'GTCCP'
  };

  function populateCOAs() {
    console.log('Populating COA dropdown with', COA_OPTIONS.length, 'options');
    coaSelect.innerHTML = '';
    COA_OPTIONS.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.label;
      coaSelect.appendChild(opt);
    });
  }

  function binderStyleLabel(name) {
    if (/\b\d{3,4}(?:\.\d+)?$/.test(name)) return name;
    const m = name.match(/^(\d{3,4}(?:\.\d+)?):\s*(.+)$/);
    if (!m) return name;
    const num = m[1];
    const rawTitle = m[2].trim();
    const existingAcro = (rawTitle.match(/\(([A-Z]{2,})\)/) || [])[1];
    const titleBase = rawTitle.replace(/\s*\([^)]+\)\s*/g, '').trim();
    const acro = existingAcro || FAC_ACRONYMS[titleBase];
    return acro ? `${titleBase} (${acro}) ${num}` : `${titleBase} ${num}`;
  }

  function extractFacCodeAndAcr(labelText) {
    const num = (labelText.match(/\b\d{3,4}(?:\.\d+)?\b/) || [])[0] || '';
    const acr = (labelText.match(/\(([A-Z]{2,})\)/) || [])[1] || '';
    const base = num.replace(/\.\d+$/, '');
    const fam = Array.from(new Set([num, base, `${base}.1`, `${base}.01`].filter(Boolean)));
    return { facCode: base, facNumber: num, facAcronym: acr, facFamily: fam };
  }

  async function populateFACsByTier(tier) {
    console.log('Fetching FACs for tier:', tier);
    facSelect.innerHTML = '<option>Loading FACs...</option>';
    try {
      const res = await fetch('https://chanfana-openapi-template.b-russell776977.workers.dev/areas');
      console.log('Fetch response status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const areas = await res.json();
      console.log('Received', areas.length, 'FACs');
      const options = areas.filter(f => f.tier === tier);
      console.log('Filtered', options.length, 'FACs for tier', tier);
      facSelect.innerHTML = '';
      if (options.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No FACs for this tier';
        facSelect.appendChild(opt);
        console.log('No FACs for tier', tier);
        return;
      }
      for (const f of options) {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = binderStyleLabel(f.name);
        opt.dataset.url = f.docx_url;
        facSelect.appendChild(opt);
      }
      console.log('FAC dropdown populated with', options.length, 'options');
    } catch (err) {
      console.error('Failed to load FACs:', err);
      facSelect.innerHTML = '<option>Error loading FACs</option>';
    }
  }
  const footerEl = document.getElementById('igmc-footer');
  async function loadIGMCStamp() {
    try {
      const res = await fetch('https://chanfana-openapi-template.b-russell776977.workers.dev/igmc/last-updated');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const when = data.lastModified
        ? new Date(data.lastModified).toLocaleString()
        : 'Unavailable';
      footerEl.innerHTML = `
        <span style="opacity:.85">
          IGMC FAC site last updated: <strong>${when}</strong>
          &nbsp;|&nbsp;
          <a href="${data.source}" target="_blank" rel="noopener" style="color:var(--usmc-scarlet);text-decoration:none;">View FACs</a>
        </span>`;
    } catch (e) {
      footerEl.textContent = 'IGMC FAC site last updated: Unavailable';
    }
  }
  loadIGMCStamp();

  function addMessage(text, sender) {
    console.log('Adding message:', { text, sender });
    const msg = document.createElement('div');
    msg.className = 'chat-message ' + sender;
    msg.textContent = text;
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  console.log('Initializing script.js');
  populateCOAs();
  populateFACsByTier(tierSelect.value);
  tierSelect.addEventListener('change', () => {
    console.log('Tier changed to:', tierSelect.value);
    populateFACsByTier(tierSelect.value);
  });

  const sendBtn = chatForm.querySelector('button');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = userInput.value.trim();
    if (!input) return;

    addMessage(input, 'user');
    history.push({ role: 'user', text: input });
    if (history.length > MAX_TURNS * 2) history.splice(0, history.length - MAX_TURNS * 2);
    userInput.value = '';

    const rawLabel = facSelect?.options[facSelect.selectedIndex]?.text || '';
    const binderLabel = binderStyleLabel(rawLabel);
    const { facCode, facNumber, facAcronym, facFamily } = extractFacCodeAndAcr(binderLabel);
    const docxUrl = facSelect?.options[facSelect.selectedIndex]?.dataset.url || '';

    console.log('Sending POST with:', { query: input, tier: tierSelect?.value, fac: facSelect?.value, docxUrl });

    sendBtn.disabled = true;
    try {
      const res = await fetch('https://chanfana-openapi-template.b-russell776977.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          tier: tierSelect?.value,
          fac: facSelect?.value,
          facLabel: binderLabel,
          facCode,
          facNumber,
          facAcronym,
          facFamily,
          coa: coaSelect?.value,
          docx_url: docxUrl,
          history
        })
      });

      console.log('POST response status:', res.status);
      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        const payload = ct.includes('application/json') ? await res.json() : await res.text();
        const msg = typeof payload === 'string' ? payload : (payload?.error?.message || JSON.stringify(payload, null, 2));
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${msg}`);
      }

      const data = await res.json();
      const reply = data.message ?? data.output_text ?? '[No response]';
      addMessage(reply, 'agent');
      history.push({ role: 'assistant', text: reply });
      if (history.length > MAX_TURNS * 2) history.splice(0, history.length - MAX_TURNS * 2);
    } catch (err) {
      console.error('Fetch error:', err);
      addMessage('Fetch failed: ' + err.message, 'agent');
    } finally {
      sendBtn.disabled = false;
    }
  });
});
