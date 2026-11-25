const STORAGE_KEY = 'masar_cv_data_v48';
const MAX_MAIN_CERTS = 2;

if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const TEMPLATES = {
  ar_classic: { lang: 'ar', style: 'classic', hasPhoto: false, label: 'عربي رسمي ATS' },
  ar_photo: { lang: 'ar', style: 'classic', hasPhoto: true, label: 'عربي بصورة شخصية' },
  ar_modern_photo: { lang: 'ar', style: 'modern', hasPhoto: true, label: 'عربي عصري بصورة' },
  en_ats: { lang: 'en', style: 'classic', hasPhoto: false, label: 'English Classic ATS' },
  en_photo: { lang: 'en', style: 'modern', hasPhoto: true, label: 'English Modern + Photo' }
};

const arSample = {
  name: 'محمد العتيبي',
  role: 'محلل بيانات ومطور تقارير',
  phone: '0500000000',
  city: 'الرياض',
  objective: 'الالتحاق بفرصة عمل في الرياض تتيح توظيف مهاراتي في تنظيم البيانات وإعداد التقارير التحليلية وبناء نماذج عمل واضحة تدعم فرق العمل.',
  eduItems: [{ entity: 'جامعة الملك سعود', detail: 'بكالوريوس في نظم المعلومات', date: '2024' }],
  expItems: [{ entity: 'شركة التقنية المتقدمة', detail: 'إعداد تقارير أداء وجداول متابعة منظمة وتدقيق البيانات' }],
  certsItems: ['تحليل البيانات وبناء الجداول الاحترافية', 'أساسيات الحاسب الآلي'],
  skillsItems: ['تحليل البيانات', 'إعداد التقارير', 'مايكروسوفت إكسل', 'قواعد البيانات'],
  achItems: [{ entity: 'إدارة التقارير والعمليات', detail: 'تصميم نموذج متابعة وتنظيم بيانات قلل وقت إعداد التقارير' }],
  langsItems: ['العربية', 'الإنجليزية']
};

const enSample = {
  name: 'Mohammed Alotaibi',
  role: 'Data & Reporting Specialist',
  phone: '0500000000',
  city: 'Riyadh',
  objective: 'Entry-level data and reporting specialist in Riyadh seeking to apply structured data organization and analytical reporting to support teams.',
  eduItems: [{ entity: 'King Saud University', detail: 'B.Sc. in Information Systems', date: '2024' }],
  expItems: [{ entity: 'Advanced Tech Company', detail: 'Prepared structured performance reports and data quality checks' }],
  certsItems: ['Data Analysis & Spreadsheet Modeling', 'Computer Basics'],
  skillsItems: ['Microsoft Excel', 'SQL', 'Data Analysis', 'Report Writing'],
  achItems: [{ entity: 'Reporting & Operations', detail: 'Built a structured tracking template that reduced reporting time' }],
  langsItems: ['Arabic', 'English']
};

const titles = {
  ar: {
    objective: 'الهدف الوظيفي',
    education: 'التعليم والمؤهلات',
    experience: 'الخبرات والمشاريع',
    certifications: 'الدورات والشهادات',
    extraCerts: 'دورات إضافية',
    skills: 'المهارات',
    achievements: 'الإنجازات',
    languages: 'اللغات',
    defaultName: 'الاسم الأول واسم العائلة',
    defaultRole: 'المسمى الوظيفي المستهدف',
    defaultContact: 'البريد الإلكتروني - رقم الجوال - المدينة',
    photoPlaceholder: 'صورة شخصية'
  },
  en: {
    objective: 'Career Objective',
    education: 'Education',
    experience: 'Experience & Projects',
    certifications: 'Certifications & Courses',
    extraCerts: 'Additional Courses',
    skills: 'Skills',
    achievements: 'Achievements',
    languages: 'Languages',
    defaultName: 'First & Last Name',
    defaultRole: 'Target Role',
    defaultContact: 'Email - Phone & City',
    photoPlaceholder: 'Photo'
  }
};

const ordinalsAr = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
const ordinalsArMale = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

let activeWorkspaceSection = 'design';
let currentMainTab = 'ai';
let currentTemplateKey = 'ar_classic';
let currentTemplate = 'ar';
let currentDensity = 'normal';
let isShowingDemo = true;
let arPhotoDataUrl = '';
let enPhotoDataUrl = '';

const escapeHtml = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const normalizeForDedup = line => String(line || '').replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim().toLowerCase();

function deduplicateLines(lines) {
  const seen = new Set();
  const result = [];
  for (const raw of lines) {
    const cleaned = String(raw || '').trim();
    if (!cleaned) continue;
    const key = normalizeForDedup(cleaned);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }
  return result;
}

const getOrdinalLabel = (idx, gender) => (gender === 'male' ? ordinalsArMale[idx] : ordinalsAr[idx]) || `رقم ${idx + 1}`;
const getActiveTemplateConfig = () => TEMPLATES[currentTemplateKey] || TEMPLATES.ar_classic;
const setFieldVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
const getFieldVal = id => document.getElementById(id)?.value.trim() || '';
const normalizeArabicDigits = str => String(str || '').replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));
const polishArabicWriting = text => String(text || '').replace(/\s+/g, ' ').trim();
const hasAnyDynamicContent = items => Array.isArray(items) && items.some(it => it && (it.entity || it.detail || it.date));

function stopSpeaking() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }

function playCompletionTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + idx * 0.11 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.11 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.11);
      osc.stop(ctx.currentTime + idx * 0.11 + 0.24);
    });
  } catch (e) {}
}

function pickBestVoice(langCode) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;
  if (langCode === 'en') {
    return voices.find(v => /en/i.test(v.lang) && /natural|neural|google|samantha|daniel/i.test(v.name))
      || voices.find(v => /en/i.test(v.lang))
      || null;
  }
  const arVoices = voices.filter(v => /^ar(-|_|$)/i.test(v.lang));
  return arVoices.find(v => /ar-SA/i.test(v.lang) && /natural|neural|majed|tariq|laila|google/i.test(v.name))
    || arVoices.find(v => /natural|neural|majed|tariq|laila|google/i.test(v.name))
    || arVoices.find(v => /ar-SA/i.test(v.lang))
    || arVoices[0]
    || null;
}

function prepareSmoothSpeechText(text, langCode) {
  let s = String(text || '').trim();
  if (!s) return '';
  if (langCode === 'en') return s;
  return s
    .replace(/(^|\s)كم(\s|$)/g, '$1ما عدد$2')
    .replace(/([؟!])\s*/g, '$1، ')
    .replace(/الاسم الأول واسم العائلة/g, 'الاسم الأول واسم العائلة،')
    .replace(/المسمى الوظيفي المستهدف/g, 'المسمى الوظيفي المستهدف،')
    .replace(/رقم الجوال/g, 'رقم الجوال،')
    .replace(/البريد الإلكتروني/g, 'البريد الإلكتروني،')
    .replace(/الهدف الوظيفي/g, 'الهدف الوظيفي،')
    .replace(/\s+/g, ' ')
    .trim();
}

function speakText(text, langCode, afterCallback) {
  const clean = prepareSmoothSpeechText(text, langCode);
  if (!clean || !('speechSynthesis' in window)) {
    if (typeof afterCallback === 'function') afterCallback();
    return;
  }
  stopSpeaking();
  const utter = new SpeechSynthesisUtterance(clean);
  const voice = pickBestVoice(langCode);
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  } else {
    utter.lang = langCode === 'en' ? 'en-US' : 'ar-SA';
  }
  utter.rate = 0.88;
  utter.pitch = 1.02;
  if (typeof afterCallback === 'function') utter.onend = afterCallback;
  window.speechSynthesis.speak(utter);
}

function selectWorkspaceSection(secName) {
  stopSpeaking();
  activeWorkspaceSection = ['design', 'audit', 'dispatch', 'video'].includes(secName) ? secName : 'design';
  ['design', 'audit', 'dispatch', 'video'].forEach(key => {
    document.getElementById('navSec-' + key)?.classList.toggle('active', key === activeWorkspaceSection);
  });
  document.getElementById('section-design')?.classList.toggle('hidden-block', activeWorkspaceSection !== 'design');
  document.getElementById('section-audit')?.classList.toggle('hidden-block', activeWorkspaceSection !== 'audit');
  document.getElementById('section-dispatch')?.classList.toggle('hidden-block', activeWorkspaceSection !== 'dispatch');
  document.getElementById('video-guide-section')?.classList.toggle('hidden-block', activeWorkspaceSection !== 'video');

  if (activeWorkspaceSection === 'video' && typeof startPracticalWalkthrough === 'function') {
    startPracticalWalkthrough('design');
  } else if (activeWorkspaceSection === 'dispatch' && typeof applyEntityFilters === 'function') {
    applyEntityFilters();
  } else if (activeWorkspaceSection === 'design') {
    if (typeof renderCV === 'function') renderCV();
    if (currentMainTab === 'ai' && typeof renderStepView === 'function') renderStepView(false);
  }
  saveState();
}

function saveState() {
  const data = typeof getFormData === 'function' ? getFormData() : {};
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    activeSection: activeWorkspaceSection,
    mainTab: currentMainTab,
    templateKey: currentTemplateKey,
    template: currentTemplate,
    density: currentDensity,
    isShowingDemo,
    data
  }));
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed) return false;
    if (typeof parsed.isShowingDemo === 'boolean') isShowingDemo = parsed.isShowingDemo;
    if (parsed.data && typeof restoreFormData === 'function') restoreFormData(parsed.data);
    if (parsed.density) {
      currentDensity = parsed.density === 'compact' ? 'compact' : 'normal';
      const sel = document.getElementById('densitySelect');
      if (sel) sel.value = currentDensity;
    }
    if (parsed.templateKey && TEMPLATES[parsed.templateKey]) {
      currentTemplateKey = parsed.templateKey;
      currentTemplate = TEMPLATES[parsed.templateKey].lang;
    }
    document.querySelectorAll('.tpl-card').forEach(card => card.classList.remove('active'));
    document.getElementById('tplCard-' + currentTemplateKey)?.classList.add('active');
    if (parsed.mainTab && ['self', 'ai'].includes(parsed.mainTab)) currentMainTab = parsed.mainTab;
    if (parsed.activeSection && ['design', 'audit', 'dispatch', 'video'].includes(parsed.activeSection)) activeWorkspaceSection = parsed.activeSection;
    return true;
  } catch (e) {
    return false;
  }
}

function downloadPDF() {
  stopSpeaking();
  if (typeof stopVoiceRecognition === 'function') stopVoiceRecognition();
  selectWorkspaceSection('design');
  if (typeof renderCV === 'function') renderCV();
  window.print();
}
