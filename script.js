document.addEventListener('DOMContentLoaded', () => {
  const chatHistory = document.getElementById('chat-history');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const tierSelect = document.getElementById('tier-select');
  const facSelect = document.getElementById('fac-select');
  const coaSelect = document.getElementById('coa-select');
  const history = [];
  const MAX_TURNS = 12;

  // Updated toTitleCase: Title case base, always uppercase acronym-like content in parens (2+ letters, no spaces)
  function toTitleCase(str) {
    // Title case the entire string first
    let titled = str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    
    // Detect and uppercase content inside parentheses if acronym-like
    titled = titled.replace(/\(([^)]+)\)/g, (match, content) => {
      content = content.trim();
      // Remove non-letters for check
      const cleaned = content.replace(/[^A-Za-z]/g, '');
      // If 2+ letters, no spaces, and letter-based (acronym)
      if (cleaned.length >= 2 && !/\s/.test(content) && /^[A-Za-z]{2,}$/.test(cleaned)) {
        return `(${content.toUpperCase()})`;
      }
      return match; // Else, keep as-is (e.g., phrases with spaces)
    });
    
    return titled;
  }

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

  // Updated populateFACsByTier (replace existing)
  async function populateFACsByTier(tier) {
    console.log('Fetching FACs for tier:', tier);
    facSelect.innerHTML = '<option>Loading FACs...</option>';
    try {
      const res = await fetch('https://cgip-fac-assistant.b-russell776977.workers.dev/areas');
      console.log('Fetch response status:', res.status);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(`HTTP ${res.status}: ${payload.error || 'Unknown error'}`);
      }
      const areas = await res.json();
      console.log('Received', areas.length, 'category groups');
      
      // Flatten facs from all categories
      let allFacs = [];
      areas.forEach(group => {
        if (group.facs && Array.isArray(group.facs)) {
          allFacs.push(...group.facs);
        }
      });
      console.log('Flattened', allFacs.length, 'total FACs');
      
      // Filter by tier
      const options = allFacs.filter(f => f.tier === tier);
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
      
      // Dedup by id (use Set for unique ids)
      const uniqueFacs = [];
      const seenIds = new Set();
      options.sort((a, b) => a.name.localeCompare(b.name)).forEach(fac => {
        if (!seenIds.has(fac.id)) {
          seenIds.add(fac.id);
          uniqueFacs.push(fac);
        } else {
          console.log(`Skipping duplicate FAC: ${fac.id}`);
        }
      });
      
      uniqueFacs.forEach(fac => {
        const opt = document.createElement('option');
        opt.value = fac.id;
        opt.textContent = toTitleCase(fac.name); // Standardize to title case
        opt.dataset.url = fac.docx_url || '';
        facSelect.appendChild(opt);
      });
      console.log('FAC dropdown populated with', uniqueFacs.length, 'unique options');
    } catch (err) {
      console.error('Error loading FACs:', err);
      facSelect.innerHTML = `<option>Error: ${err.message}</option>`;
    }
  }

  const footerEl = document.getElementById('igmc-footer');
  async function loadIGMCStamp() {
    try {
      const res = await fetch('https://cgip-fac-assistant.b-russell776977.workers.dev/igmc/last-updated');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const when = data.pageUpdatedOn || 'Unavailable';
      footerEl.innerHTML = `
        <span style="opacity:.85">
          IGMC FAC site page updated on: <strong>${when}</strong>
          &nbsp;|&nbsp;
          <a href="${data.source}" target="_blank" rel="noopener" style="color:var(--usmc-scarlet);text-decoration:none;">View FACs</a>
        </span>`;
    } catch (e) {
      footerEl.textContent = 'IGMC FAC site last updated: Unavailable';
    }
  }

  loadIGMCStamp();

  // Function to make URLs clickable
  function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  }

  function addMessage(text, sender) {
    console.log('Adding message:', { text, sender });
    const msg = document.createElement('div');
    msg.className = 'chat-message ' + sender;
    if (sender === 'agent') {
      msg.innerHTML = linkify(text); // Make links clickable for AI responses
    } else {
      msg.textContent = text;
    }
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

    // Add thinking indicator
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'chat-message agent thinking';
    thinkingMsg.textContent = 'Thinking...';
    chatHistory.appendChild(thinkingMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    sendBtn.disabled = true;
    try {
      const res = await fetch('https://cgip-fac-assistant.b-russell776977.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          tier: tierSelect?.value,
          fac: facSelect?.value,           // still okay to send; backend can use it
          facLabel: binderLabel,
          facCode,
          facNumber,
          fac_number: facNumber,           // <-- add this
          facAcronym,
          facFamily,
          persona: coaSelect?.value,       // <-- optional: align naming with backend
          coa: coaSelect?.value,           // kept for backward compat
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
      console.log('Full response data:', data); // Debug log
      const reply = data.answer ?? data.error ?? '[No response]'; // Use 'answer'; fallback to error if present
      addMessage(reply, 'agent');
      history.push({ role: 'assistant', text: reply });
      if (history.length > MAX_TURNS * 2) history.splice(0, history.length - MAX_TURNS * 2);
    } catch (err) {
      console.error('Fetch error:', err);
      addMessage('Fetch failed: ' + err.message, 'agent');
    } finally {
      sendBtn.disabled = false;
      if (thinkingMsg.parentNode) {
        chatHistory.removeChild(thinkingMsg); // Remove thinking message
      }
    }
  });
});
