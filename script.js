const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const history = [];
const MAX_TURNS = 12;

const COA_OPTIONS = [
  { id: 'FACA Reference Interpreter', label: 'FACA Reference Interpreter' },
  { id: 'Evidence Pack Builder', label: 'Evidence Pack Builder' },
  { id: 'CGIP Auto-Checklist Prep', label: 'CGIP Auto-Checklist Prep' },
  { id: 'Training/Crash-Course Generator', label: 'Training/Crash-Course Generator' },
];

const tierSelect = document.getElementById('tier-select');
const facSelect = document.getElementById('fac-select');
const coaSelect = document.getElementById('coa-select');

function populateCOAs() {
  coaSelect.innerHTML = '';
  COA_OPTIONS.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = o.label;
    coaSelect.appendChild(opt);
  });
}

const FAC_ACRONYMS = {
  'Antiterrorism': 'AT',
  'Operations Security': 'OPSEC',
  'Information and Personnel Security Program': 'IPSP',
  'Marine Corps Safety Management Systems': 'MCSMS',
  'Defense Travel System': 'DTS',
  'Government Travel Charge Card Program': 'GTCCP'
};

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
  facSelect.innerHTML = '<option>Loading FACs...</option>';
  try {
    const res = await fetch('https://chanfana-openapi-template.b-russell776977.workers.dev/areas');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const areas = await res.json();
    const options = areas.filter(f => f.tier === tier);
    facSelect.innerHTML = '';
    if (options.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No FACs for this tier';
      facSelect.appendChild(opt);
      return;
    }
    for (const f of options) {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = binderStyleLabel(f.name);
      opt.dataset.url = f.docx_url;
      facSelect.appendChild(opt);
    }
  } catch (err) {
    facSelect.innerHTML = '<option>Error loading FACs</option>';
    console.error('Failed to load FACs:', err);
  }
}

function addMessage(text, sender) {
  const msg = document.createElement('div');
  msg.className = 'chat-message ' + sender;
  msg.textContent = text;
  chatHistory.appendChild(msg);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

populateCOAs();
populateFACsByTier(tierSelect.value);
tierSelect.addEventListener('change', () => populateFACsByTier(tierSelect.value));

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

    const ct = res.headers.get('content-type') || '';
    const payload = ct.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = typeof payload === 'string' ? payload : (payload?.error?.message || JSON.stringify(payload, null, 2));
      addMessage(`HTTP ${res.status} ${res.statusText}: ${msg}`, 'agent');
      return;
    }

    const reply = payload.message ?? payload.output_text ?? '[No response]';
    addMessage(reply, 'agent');
    history.push({ role: 'assistant', text: reply });
    if (history.length > MAX_TURNS * 2) history.splice(0, history.length - MAX_TURNS * 2);
  } catch (err) {
    addMessage('Fetch failed: ' + err.message, 'agent');
  } finally {
    sendBtn.disabled = false;
  }
});
