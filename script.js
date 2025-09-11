const chatHistory = document.getElementById('chat-history');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    // Keep the last ~12 turns to control token usage
    const history = [];
    const MAX_TURNS = 12;

    // ===== BEGIN FAC/COA DATA & WIRING =====

// 1) Your FAC index (SAMPLE). Replace/expand with the real list from your CGIP/FAC work.
//    Keep the shape: { id, name, tier } where tier ∈ 'CoRE' | 'CoRE+' | 'Non-CoRE'
// Replace your FAC_INDEX with this:
const FAC_INDEX = [
  { id: 'fa-6500', name: '6500: Aircraft Rescue and Fire Fighting (ARFF)', tier: 'Non-CoRE' },
  { id: 'fa-3500-14', name: '3500.14: Aircrew Training Program', tier: 'CoRE+' },
  { id: 'fa-3302', name: '3302: Antiterrorism', tier: 'CoRE' },
  { id: 'fa-5370', name: '5370: Assistance and Hotline Program', tier: 'CoRE+' },

  { id: 'fa-3500-10', name: '3500.10: Aviation Command and Control Training', tier: 'Non-CoRE' },
  { id: 'fa-11130', name: '11130: Aviation Facilities', tier: 'Non-CoRE' },
  { id: 'fa-3700', name: '3700: Aviation Operations Administration', tier: 'CoRE+' },
  { id: 'fa-3750-6', name: '3750.6: Aviation Safety', tier: 'CoRE+' },
  { id: 'fa-6110', name: '6110: Body Composition and Military Appearance Program', tier: 'CoRE' },

  { id: 'fa-1040', name: '1040: Career Planning Program', tier: 'CoRE' },
  { id: 'fa-3040', name: '3040: Casualty Affairs', tier: 'CoRE' },
  { id: 'fa-3400', name: '3400: CBRN Defense', tier: 'Non-CoRE' },
  { id: 'fa-5060-20-color-guard', name: '5060.20: Color Guard', tier: 'Non-CoRE' },
  { id: 'fa-5040', name: '5040: Command Inspection Program', tier: 'CoRE+' },
  { id: 'fa-4400-201', name: '4400.201: Consumer- Level Supply', tier: 'CoRE' },

  { id: 'fa-5580-6', name: '5580.6: Criminal Justice Information Reporting Requirements', tier: 'CoRE+' },
  { id: 'fa-3501-36', name: '3501.36: Critical Infrastructure Protection (CIP) Program', tier: 'CoRE+' },
  { id: 'fa-5239', name: '5239: Cyber Security Management', tier: 'CoRE' },
  { id: 'fa-4650-39', name: '4650.39: Defense Travel System (DTS)', tier: 'CoRE' },
  { id: 'fa-1630', name: '1630: Detention Facilities', tier: 'Non-CoRE' },

  { id: 'fa-5215', name: '5215: Directives Management', tier: 'CoRE' },
  { id: 'fa-5060-20-drill', name: '5060.20: Drill', tier: 'Non-CoRE' },
  { id: 'fa-5090', name: '5090: Environmental Program Management', tier: 'Non-CoRE' },
  { id: 'fa-1754-4', name: '1754.4: Exceptional Family Member Program (EFMP)', tier: 'Non-CoRE' },
  { id: 'fa-3571-2', name: '3571.2: Explosive Ordnance Disposal (EOD) Technical Evaluation', tier: 'Non-CoRE' },

  { id: 'fa-11000-22', name: '11000.22: Family Housing', tier: 'Non-CoRE' },
  { id: 'fa-1500-60', name: '1500.60: Force Preservation Council (FPC) Program', tier: 'CoRE' },
  { id: 'fa-5510-2', name: '5510.2: Foreign Disclosure', tier: 'Non-CoRE' },
  { id: 'fa-1553-2', name: '1553.2: Formal School Management', tier: 'Non-CoRE' },
  { id: 'fa-4600-40', name: '4600.40: Government Travel Charge Card Program (GTCCP)', tier: 'CoRE' },

  { id: 'fa-8000', name: '8000: Ground Ordnance Maintenance', tier: 'Non-CoRE' },
  { id: 'fa-6000', name: '6000: Health Service Support (HSS)', tier: 'CoRE' },
  { id: 'fa-5750', name: '5750: Historical Program', tier: 'Non-CoRE' },
  { id: 'fa-5512', name: '5512: Identification Cards', tier: 'Non-CoRE' },
  { id: 'fa-5510-3', name: '5510.3: Information and Personnel Security Program (IPSP)', tier: 'CoRE' },
  { id: 'fa-3800', name: '3800: Intelligence', tier: 'CoRE' },

  { id: 'fa-5580', name: '5580: Law Enforcement Operations', tier: 'CoRE+' },
  { id: 'fa-1050', name: '1050: Leave, Liberty and Administrative Absence', tier: 'Non-CoRE' },
  { id: 'fa-5800-16-legal', name: '5800.16: Legal Administration', tier: 'CoRE' },
  { id: 'fa-4790-2', name: '4790.2: Maintenance Management', tier: 'Non-CoRE' },
  { id: 'fa-3501-1', name: '3501.1: Marine Corps Combat Readiness Evaluation', tier: 'CoRE+' },

  { id: 'fa-5000-18', name: '5000.18: Marine Corps Fleet Bands', tier: 'CoRE+' },
  { id: 'fa-1500-59', name: '1500.59: Marine Corps Martial Arts Program (MCMAP)', tier: 'CoRE' },
  { id: 'fa-5100-29', name: '5100.29: Marine Corps Safety Management Systems (MCSMS)', tier: 'CoRE' },
  { id: 'fa-1320', name: '1320: Marine Corps Sponsorship Program', tier: 'Non-CoRE' },
  { id: 'fa-3574', name: '3574: Marksmanship Program', tier: 'Non-CoRE' },

  { id: 'fa-1650', name: '1650: Military Awards', tier: 'CoRE' },
  { id: 'fa-1640-1', name: '1640.1: Military Correctional Facilities', tier: 'CoRE+' },
  { id: 'fa-5585-5', name: '5585.5: Military Working Dog (MWD) Operations', tier: 'CoRE+' },
  { id: 'fa-11240-licensing', name: '11240: Motor Transport Licensing', tier: 'Non-CoRE' },
  { id: 'fa-11240-operations', name: '11240: Motor Transport Operations', tier: 'Non-CoRE' },

  { id: 'fa-3710-7', name: '3710.7: Naval Air Training and Operating Procedures Standardization (NATOPS)', tier: 'CoRE+' },
  { id: 'fa-3070', name: '3070: Operations Security', tier: 'CoRE' },
  { id: 'fa-3800-2', name: '3800.2: Oversight-Intel/Non-Intel Sensitive Activities', tier: 'CoRE' },
  { id: 'fa-1610', name: '1610: Performance Evaluation System (PES)', tier: 'CoRE' },
  { id: 'fa-1700-37', name: '1700.37: Personal Financial Management Program (PFMP)', tier: 'Non-CoRE' },

  { id: 'fa-6100-13', name: '6100.13: Physical Fitness and Combat Fitness Program', tier: 'CoRE' },
  { id: 'fa-1500-62', name: '1500.62: Physical Fitness Program and Force Fitness Instructor Program', tier: 'CoRE' },
  { id: 'fa-5530', name: '5530: Physical Security', tier: 'CoRE' },
  { id: 'fa-5110-1', name: '5110.1: Postal Affairs and Official Mail Program - Military Postal Activity', tier: 'CoRE+' },

  { id: 'fa-5110-2', name: '5110.2: Postal Affairs and Official Mail Program - Organization', tier: 'CoRE' },
  { id: 'fa-5354-1', name: '5354.1: Prohibited Activities and Conduct Prevention and Response Program (PAC)', tier: 'CoRE' },
  { id: 'fa-3550-10', name: '3550.10: Range and Training Area Management', tier: 'Non-CoRE' },
  { id: 'fa-5210', name: '5210: Records Management', tier: 'CoRE' },
  { id: 'fa-1730', name: '1730: Religous Ministries', tier: 'Non-CoRE' }, // (spelling as listed on IGMC page)

  { id: 'fa-5214', name: '5214: Reports Management', tier: 'Non-CoRE' },
  { id: 'fa-1700-23', name: '1700.23: Request Mast Procedures', tier: 'CoRE' },
  { id: 'fa-1900-16', name: '1900.16: Separation, Retirement and Limited Duty', tier: 'CoRE' },
  { id: 'fa-1752-5', name: '1752.5: Sexual Assault Prevention and Response (SAPR)', tier: 'CoRE' },
  { id: 'fa-1700-36', name: '1700.36: Single Marine Program (SMP)', tier: 'Non-CoRE' },

  { id: 'fa-5300-17', name: '5300.17: Substance Assessment and Counseling Program', tier: 'CoRE' },
  { id: 'fa-1720-1', name: '1720.1: Suicide Prevention Program', tier: 'CoRE' },
  { id: 'fa-5060-20-sword', name: '5060.20: Sword Manual', tier: 'Non-CoRE' },
  { id: 'fa-1700-31', name: '1700.31: Transition Readiness Program (TRP)', tier: 'CoRE' },
  { id: 'fa-11000-1', name: '11000.1: Unaccompanied Housing', tier: 'CoRE' },
  { id: 'fa-1020', name: '1020: Uniform Inspection', tier: 'Non-CoRE' },

  { id: 'fa-3000-13', name: '3000.13: Unit Readiness', tier: 'CoRE' },
  { id: 'fa-1553-3', name: '1553.3: Unit Training Management (UTM)', tier: 'CoRE' },
  { id: 'fa-1754-9', name: '1754.9: Unit, Personal and Family Readiness Program (UPFRP)', tier: 'CoRE' },
  { id: 'fa-5580-2', name: '5580.2: USMC Criminal Investigation Division (USMC CID) Operations', tier: 'CoRE+' },
  { id: 'fa-5800-16-vwap', name: '5800.16: Victim and Witness Assistance Program (VWAP)', tier: 'CoRE' },

  { id: 'fa-1742-1', name: '1742.1: Voting Assistance Program', tier: 'CoRE' },
  { id: 'fa-1500-52', name: '1500.52: Water Survival Training Program', tier: 'CoRE' },
];


// 2) Proposed GenAI Courses of Action (SAMPLE LABELS).
//    If your prior chat has exact 4 names, replace these labels to match exactly.
const COA_OPTIONS = [
  { id: 'FACA Reference Interpreter', label: 'FACA Reference Interpreter' },
  { id: 'Evidence Pack Builder', label: 'Evidence Pack Builder' },
  { id: 'CGIP Auto-Checklist Prep', label: 'CGIP Auto-Checklist Prep' },
  { id: 'Training/Crash-Course Generator', label: 'Training/Crash-Course Generator' },
];

const tierSelect = document.getElementById('tier-select');
const facSelect  = document.getElementById('fac-select');
const coaSelect  = document.getElementById('coa-select');

function populateCOAs() {
  coaSelect.innerHTML = '';
  COA_OPTIONS.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = o.label;
    coaSelect.appendChild(opt);
  });
}

// Optional: a few known acronyms (add more as you discover them)
// Optional acronyms map (extend as needed)
const FAC_ACRONYMS = {
  'Antiterrorism': 'AT',
  'Operations Security': 'OPSEC',
  'Information and Personnel Security Program': 'IPSP',
  'Marine Corps Safety Management Systems (MCSMS)': 'MCSMS',
  'Defense Travel System (DTS)': 'DTS',
  'Government Travel Charge Card Program (GTCCP)': 'GTCCP'
};

// Turn "3302: Antiterrorism" → "Antiterrorism (AT) 3302"
function binderStyleLabel(name) {
  if (/\b\d{3,4}(?:\.\d+)?$/.test(name)) return name;        // already binder-ish
  const m = name.match(/^(\d{3,4}(?:\.\d+)?):\s*(.+)$/);
  if (!m) return name;
  const num = m[1];
  const rawTitle = m[2].trim();
  const existingAcro = (rawTitle.match(/\(([A-Z]{2,})\)/) || [])[1];
  const titleBase = rawTitle.replace(/\s*\([^)]+\)\s*/g, '').trim();
  const acro = existingAcro || FAC_ACRONYMS[titleBase];
  return acro ? `${titleBase} (${acro}) ${num}` : `${titleBase} ${num}`;
}

// Extract number + acronym + dotted variants from the final label
function extractFacCodeAndAcr(labelText) {
  const num = (labelText.match(/\b\d{3,4}(?:\.\d+)?\b/) || [])[0] || '';
  const acr = (labelText.match(/\(([A-Z]{2,})\)/) || [])[1] || '';
  const base = num.replace(/\.\d+$/, '');
  const fam = Array.from(new Set([num, base, `${base}.1`, `${base}.01`].filter(Boolean)));
  return { facCode: base, facNumber: num, facAcronym: acr, facFamily: fam };
}

function populateFACsByTier(tier) {
  const options = FAC_INDEX.filter(f => f.tier === tier);
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
    opt.value = f.id;                               // id (fa-####)
    opt.textContent = binderStyleLabel(f.name);     // binder-style text
    facSelect.appendChild(opt);
  }
}
    
// Init defaults (Tier defaults to CoRE)
populateCOAs();
populateFACsByTier(tierSelect.value);
tierSelect.addEventListener('change', () => populateFACsByTier(tierSelect.value));

// ===== END FAC/COA DATA & WIRING =====

function addMessage(text, sender) {
  const msg = document.createElement('div');
  msg.className = 'chat-message ' + sender;
  msg.textContent = text;
  chatHistory.appendChild(msg);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ONE clean submit handler
const sendBtn = chatForm.querySelector('button');

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;

  // show + record the user turn
  addMessage(input, 'user');
  history.push({ role: 'user', text: input });
  if (history.length > MAX_TURNS * 2) history.splice(0, history.length - MAX_TURNS * 2);
  userInput.value = '';

  // build binder-style label & clean FAC fields BEFORE fetch
  const rawLabel = facSelect?.options[facSelect.selectedIndex]?.text || '';
  const binderLabel = binderStyleLabel(rawLabel);
  const { facCode, facNumber, facAcronym, facFamily } = extractFacCodeAndAcr(binderLabel);

  sendBtn.disabled = true;
  try {
    const res = await fetch('https://chanfana-openapi-template.b-russell776977.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: input,
        tier: tierSelect?.value,
        fac: facSelect?.value,                 // id: e.g., "fa-3302"
        facLabel: binderLabel,                 // e.g., "Antiterrorism (AT) 3302"
        facCode,                               // "3302"
        facNumber,                             // "3302" or "3302.1"
        facAcronym,                            // "AT" if present
        facFamily,                             // ["3302","3302.1","3302.01"]
        coa: coaSelect?.value,
        history
      })
    });

    const ct = res.headers.get('content-type') || '';
    const payload = ct.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = typeof payload === 'string'
        ? payload
        : (payload?.error?.message || payload?.message || JSON.stringify(payload, null, 2));
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
