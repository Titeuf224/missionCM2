'use strict';

const KEY = 'mission-biodiversite-v1'; // Conservé pour récupérer les anciens parcours.
const PROFILES_KEY = 'mission-biodiversite-profils-v2';
const app = document.getElementById('app');
const fresh = () => ({
  version: 1,
  stars: 0,
  rewarded: [],
  mastered: [],
  errors: [],
  badges: [],
  completed: [],
  sound: false,
  session: null,
  final: null,
  diplomas: {},
  subjectFinals: {},
  grandFinal: null,
  lastSubject: null,
  artworks: {},
  drafts: {}
});
let storageOK = true;
// Chaque profil possède son propre état. L'ancien format reste intact en secours.
function sanitizeSave(s) {
  if (!s || s.version !== 1) return fresh();
  const d = fresh();
  for (const k of ['mastered', 'errors', 'rewarded']) d[k] = Array.isArray(s[k]) ? [...new Set(s[k].filter(id => QUESTIONS.some(q => q.id === id)))] : [];
  for (const k of ['badges', 'completed']) d[k] = Array.isArray(s[k]) ? [...new Set(s[k].filter(n => Number.isInteger(n) && n >= 0 && n < MISSIONS.length))] : [];
  if (!s.rewarded) d.rewarded = [...d.mastered];
  d.stars = Number.isFinite(s.stars) ? Math.max(0, s.stars) : 0;
  d.sound = s.sound === true;
  d.final = s.final && typeof s.final.date === 'string' ? s.final : null; // Diplôme biodiversité historique.
  d.grandFinal = s.grandFinal && typeof s.grandFinal.date === 'string' ? s.grandFinal : null;
  d.lastSubject = SUBJECTS.some(x => x.id === s.lastSubject) ? s.lastSubject : null;
  for (const subject of SUBJECTS) {
    const result = s.subjectFinals?.[subject.id];
    if (result && typeof result.date === 'string') d.subjectFinals[subject.id] = result;
  }
  if (s.drafts && typeof s.drafts === 'object') {
    for (const [id, value] of Object.entries(s.drafts)) {
      if (['definition', 'number'].includes(QUESTION_BY_ID.get(id)?.type) && typeof value === 'string') d.drafts[id] = value.slice(0, 1500);
    }
  }
  if (s.artworks && typeof s.artworks === 'object') {
    for (const [id, image] of Object.entries(s.artworks)) {
      if (QUESTION_BY_ID.get(id)?.studio && typeof image === 'string' && image.length < 300000 && image.startsWith('data:image/png;base64,')) d.artworks[id] = image;
    }
  }
  for (const i of d.completed) {
    const date = s.diplomas?.[i];
    d.diplomas[i] = typeof date === 'string' ? date : '';
  }
  if (s.session && Array.isArray(s.session.ids) && s.session.ids.length && s.session.ids.every(id => QUESTIONS.some(q => q.id === id)) && Number.isInteger(s.session.index) && s.session.index >= 0 && s.session.index < s.session.ids.length && ['mission', 'challenge', 'review', 'definitions'].includes(s.session.mode) && (s.session.mode !== 'mission' || Number.isInteger(s.session.mission) && s.session.mission >= 0 && s.session.mission < MISSIONS.length)) {
    d.session = {
      ...s.session,
      earned: Number(s.session.earned) || 0,
      correctIds: Array.isArray(s.session.correctIds) ? s.session.correctIds.filter(id => s.session.ids.includes(id)) : []
    };
    if (!Object.prototype.hasOwnProperty.call(s.session, 'scope')) {
      d.session.scope = s.session.mode === 'challenge' && s.session.ids.every(id => QUESTION_BY_ID.get(id).mission < 5) ? 'biodiversity' : s.session.mode === 'mission' ? MISSIONS[s.session.mission].subject : null;
    } else if (d.session.scope !== null && d.session.scope !== 'biodiversity' && !SUBJECTS.some(x => x.id === d.session.scope)) d.session.scope = null;
  }
  return d;
}
function cleanName(value) {
  return String(value).normalize('NFKC').replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim().replace(/\s+/g, ' ').slice(0, 32);
}
function nameKey(value) {
  return cleanName(value).toLocaleLowerCase('fr');
}
function readProfiles() {
  const empty = {
    version: 2,
    activeId: null,
    profiles: [],
    legacy: null
  };
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved?.version !== 2 || !Array.isArray(saved.profiles)) return empty;
      for (const p of saved.profiles) {
        if (p && typeof p.id === 'string' && typeof p.name === 'string' && cleanName(p.name) && !empty.profiles.some(x => x.id === p.id || nameKey(x.name) === nameKey(p.name))) {
          empty.profiles.push({
            id: p.id,
            name: cleanName(p.name),
            progress: sanitizeSave(p.progress)
          });
        }
      }
      empty.activeId = empty.profiles.some(p => p.id === saved.activeId) ? saved.activeId : null;
      empty.legacy = saved.legacy ? sanitizeSave(saved.legacy) : null;
      return empty;
    }
    const old = JSON.parse(localStorage.getItem(KEY));
    if (old?.version === 1) empty.legacy = sanitizeSave(old);
  } catch {
    storageOK = false;
  }
  return empty;
}
let profilesStore = readProfiles();
function currentProfile() {
  return profilesStore.profiles.find(p => p.id === profilesStore.activeId) || null;
}
let state = currentProfile()?.progress || fresh(),
  session = null,
  answer = [],
  selected = null,
  links = [],
  source = null,
  discovered = [],
  answered = false,
  modelOpen = false,
  currentView = 'home',
  currentSubject = null,
  choiceOrder = [],
  cardOrder = [],
  groupOrder = [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
const shuffle = a => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
function save() {
  const profile = currentProfile();
  if (profile) profile.progress = state;
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profilesStore));
  } catch {
    storageOK = false;
    toast('La sauvegarde est indisponible. Garde cet onglet ouvert pour continuer.');
  }
  updateHeader();
}
function updateHeader() {
  const profileButton = document.getElementById('profile-button');
  profileButton.textContent = currentProfile() ? '🦊 ' + currentProfile().name : '🦊 Choisir un aventurier';
  profileButton.setAttribute('aria-label', currentProfile() ? 'Changer d’aventurier. Profil actuel : ' + currentProfile().name : 'Choisir un aventurier');
  document.getElementById('star-counter').textContent = `★ ${state.stars}`;
  const b = document.getElementById('sound');
  b.textContent = state.sound ? '🔊' : '🔇';
  b.setAttribute('aria-label', state.sound ? 'Couper les sons' : 'Activer les sons');
  b.title = b.getAttribute('aria-label');
}
let audioContext;
function sound(ok) {
  if (!state.sound) return;
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    [0, 1, 2].forEach(n => {
      const o = audioContext.createOscillator(),
        g = audioContext.createGain();
      o.type = 'sine';
      o.frequency.value = ok ? [523, 659, 784][n] : [294, 262, 220][n];
      g.gain.setValueAtTime(0.0001, audioContext.currentTime + n * .09);
      g.gain.exponentialRampToValueAtTime(.055, audioContext.currentTime + n * .09 + .01);
      g.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + n * .09 + .2);
      o.connect(g);
      g.connect(audioContext.destination);
      o.start(audioContext.currentTime + n * .09);
      o.stop(audioContext.currentTime + n * .09 + .22);
    });
  } catch {/* Le jeu reste disponible sans audio. */}
}
let toastTimer;
function toast(text) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('visible'), 4000);
}
function celebrate() {
  const box = document.getElementById('confetti');
  box.innerHTML = Array.from({
    length: 22
  }, (_, i) => `<i style="--x:${Math.random() * 100}vw;--r:${Math.random() * 360}deg;--d:${Math.random() * .5}s;background:${['#f5c64f', '#e58d53', '#3b9c78', '#78b4c5'][i % 4]}"></i>`).join('');
  setTimeout(() => box.replaceChildren(), 2200);
}
function focusPage() {
  app.focus({
    preventScroll: true
  });
  window.scrollTo({
    top: 0,
    behavior: 'instant'
  });
}
const fox = () => `<svg class="fox" viewBox="0 0 160 160" role="img" aria-label="Nox, le renard explorateur"><path d="M36 76 21 13 67 42M92 42 139 13 125 81" fill="#df7841" stroke="#853e29" stroke-width="3"/><path d="m34 31 9 36 14-20m48 0 14 20 9-36" fill="#603a36"/><path d="M25 80Q30 30 80 35q51-5 56 45l-14 40-42 26-44-27Z" fill="#eb8b45"/><path d="m25 80 55 31 56-31-14 40-42 26-44-27Z" fill="#fff0d5"/><path d="m70 104 20 0-10 13Z" fill="#352e2e"/><path d="M51 79q8-9 16 0m27 0q8-9 16 0" fill="none" stroke="#352e2e" stroke-width="5" stroke-linecap="round"/><path d="M69 124q11 9 22 0" fill="none" stroke="#352e2e" stroke-width="3"/><path d="m46 132 33 17 32-18 10 19-40 10-45-11Z" fill="#267969"/><path d="M29 43q53-36 105 1l-3 15Q80 43 27 57Z" fill="#d3bb7d"/><path d="m49 44 7-27h47l11 28" fill="#e4cf99"/><path d="M59 31h45" stroke="#638f64" stroke-width="7"/></svg>`;
function landscape() {
  return `<svg class="landscape" viewBox="0 0 800 500" role="img" aria-label="Une vallée verdoyante avec une mare, des montagnes et un petit renard"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#cce9dc"/><stop offset="1" stop-color="#eff2cf"/></linearGradient><linearGradient id="water" x2="1" y2="1"><stop stop-color="#91cdc0"/><stop offset="1" stop-color="#429f9f"/></linearGradient></defs><rect width="800" height="500" fill="url(#sky)"/><circle cx="586" cy="107" r="48" fill="#f9d67a"/><path d="M0 257 175 84 328 250 438 141 610 290 730 155 800 224v276H0Z" fill="#a5c6ab"/><path d="m109 151 66-67 64 70-47-12-23-28-26 37Z" fill="#e8efdb"/><path d="M0 303Q140 196 330 291T800 268v232H0Z" fill="#7cab7b"/><path d="M0 355q204-131 416-30t384-9v184H0Z" fill="#4f9267"/><ellipse cx="459" cy="401" rx="218" ry="66" fill="#c4d9a1"/><ellipse cx="463" cy="397" rx="193" ry="52" fill="url(#water)"/><path d="M370 384h82m32 31h72m-105-17h92" stroke="#c1e5d5" stroke-width="4" stroke-linecap="round"/><g fill="#28634d"><path d="M48 320V91l-61 114h32l-44 64h44l-42 51Z"/><path d="M124 345V142L63 251h31l-44 60h44l-30 34Z"/><path d="M735 344V120l-63 115h32l-44 62h44l-30 47Z"/></g><g stroke="#674d35" stroke-width="9"><path d="M48 280v102m77-90v92m608-102v101"/></g><path d="M0 445q150-68 311 55H0m800-55q-144-85-293 55h293" fill="#28654c"/><g fill="#f6ce66"><circle cx="189" cy="394" r="5"/><circle cx="210" cy="419" r="4"/><circle cx="657" cy="418" r="5"/><circle cx="680" cy="401" r="4"/></g><g stroke="#255947" stroke-width="3" fill="none"><path d="M589 71q10-9 20 0 10-9 20 0m-174 42q8-8 16 0 8-8 16 0"/></g><g transform="translate(151 322)"><path d="M9 50q-56-51-43 9 13 32 56 12" fill="#e4914c"/><path d="M-34 59q4 20 25 23l-3-22Z" fill="#fff0d5"/><ellipse cx="27" cy="55" rx="22" ry="33" fill="#df8242"/><path d="m5 31-2-31 25 18L48 0l2 31-23 25Z" fill="#e58b48"/><path d="m4 30 23 14 23-14-23 26Z" fill="#fff0d5"/><circle cx="16" cy="27" r="2.5"/><circle cx="36" cy="27" r="2.5"/><path d="m23 39 8 0-4 6Z"/><path d="M7 53h39" stroke="#266e58" stroke-width="8"/></g><g fill="#79a67d"><ellipse cx="569" cy="391" rx="20" ry="6"/><ellipse cx="344" cy="408" rx="15" ry="5"/></g><text x="550" y="388" font-size="24">🐸</text></svg>`;
}
// Le prénom identifie un carnet local ; il n'est jamais envoyé sur Internet.
function profilesPage(rename = false) {
  if (currentProfile()) save();
  currentView = 'profiles';
  session = null;
  const active = currentProfile();
  app.innerHTML = `<section class="profiles-page"><div class="profile-welcome">${fox()}<div><span class="eyebrow">LES CARNETS D’AVENTURE</span><h1>Qui part <em>explorer ?</em></h1><p>Chaque aventurier a son parcours, ses étoiles et ses diplômes.</p></div></div>
  ${profilesStore.profiles.length ? `<div class="section-head"><h2>Retrouver mon parcours</h2>${active ? '<button class="text-button" data-action="home">← Retour à mon aventure</button>' : ''}</div><div class="profiles-grid">${profilesStore.profiles.map(p => `<button class="profile-card ${p.id === profilesStore.activeId ? 'active-profile' : ''}" data-profile="${esc(p.id)}"><span class="profile-avatar">${esc(p.name.slice(0, 1).toLocaleUpperCase('fr'))}</span><strong>${esc(p.name)}</strong><span>★ ${p.progress.stars} étoiles · ${p.progress.completed.length}/${MISSIONS.length} missions</span><progress max="${QUESTIONS.length}" value="${p.progress.mastered.length}" aria-label="${esc(p.name)} : ${p.progress.mastered.length} notions maîtrisées"></progress><span>${p.progress.session ? `↗ Reprendre à l’étape ${p.progress.session.index + 1} / ${p.progress.session.ids.length}` : 'Ouvrir mon carnet →'}</span></button>`).join('')}</div>` : ''}
  <form id="profile-form" class="profile-form"><h2>${rename && active ? 'Modifier mon prénom' : 'Un nouvel aventurier ?'}</h2><label for="profile-name">${rename && active ? 'Ton prénom' : 'Comment t’appelles-tu ?'}</label><div class="profile-input-row"><input id="profile-name" name="prenom" maxlength="32" required autocomplete="off" spellcheck="false" placeholder="Ton prénom" value="${rename && active ? esc(active.name) : ''}" aria-describedby="profile-help profile-error"><button class="primary" type="submit">${rename && active ? 'Enregistrer mon prénom' : 'Créer mon carnet'} →</button></div><p id="profile-help">${profilesStore.legacy ? 'Un parcours a déjà été commencé ici : le premier carnet le récupérera automatiquement.' : 'Ton carnet reste dans ce navigateur, sur cet ordinateur. Aucun compte nécessaire.'}</p><p id="profile-error" role="alert"></p>${active ? `<button class="text-button" type="button" data-action="${rename ? 'profiles' : 'rename'}">${rename ? 'Annuler la modification' : '✎ Modifier mon prénom'}</button>` : ''}</form>
  ${!storageOK ? '<p class="storage-warning">Le stockage est indisponible. Garde cet onglet ouvert pour conserver les carnets pendant cette séance.</p>' : ''}</section>`;
  document.getElementById('profile-form').onsubmit = e => {
    e.preventDefault();
    const result = rename && active ? renameProfile(document.getElementById('profile-name').value) : createProfile(document.getElementById('profile-name').value);
    if (!result) document.getElementById('profile-name').focus();
  };
  focusPage();
}
function profileError(message) {
  document.getElementById('profile-error').textContent = message;
  return false;
}
function createProfile(value) {
  const name = cleanName(value);
  if (!name) return profileError('Écris ton prénom pour créer ton carnet.');
  const existing = profilesStore.profiles.find(p => nameKey(p.name) === nameKey(name));
  if (existing) {
    selectProfile(existing.id);
    toast('Ton carnet existe déjà : le voici !');
    return true;
  }
  const id = 'aventurier-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  const progress = profilesStore.legacy || fresh();
  profilesStore.legacy = null;
  profilesStore.profiles.push({
    id,
    name,
    progress
  });
  selectProfile(id);
  return true;
}
function selectProfile(id) {
  const nextProfile = profilesStore.profiles.find(p => p.id === id);
  if (!nextProfile) return false;
  if (currentProfile()) save();
  profilesStore.activeId = id;
  state = nextProfile.progress;
  session = null;
  save();
  home();
  return true;
}
function renameProfile(value) {
  const name = cleanName(value),
    profile = currentProfile();
  if (!profile) return false;
  if (!name) return profileError('Écris ton prénom pour enregistrer la modification.');
  if (profilesStore.profiles.some(p => p.id !== profile.id && nameKey(p.name) === nameKey(name))) return profileError('Ce prénom a déjà un carnet. Choisis un prénom distinct, par exemple Léa B.');
  profile.name = name;
  save();
  home();
  toast('Ton prénom est mis à jour, avec tout ton parcours !');
  return true;
}
const subjectInfo = id => SUBJECTS.find(s => s.id === id);
const missionQuestions = id => QUESTIONS_BY_MISSION.get(id) || [];
const mastery = ids => ids.filter(id => state.mastered.includes(id)).length;
const subjectQuestions = id => QUESTIONS.filter(q => q.subject === id);
function nextMissionFor(id) {
  const chapters = MISSIONS_BY_SUBJECT.get(id) || MISSIONS_BY_SUBJECT.get('francais');
  return (chapters.find(m => !state.completed.includes(m.index)) || chapters[0]).index;
}
function progressPanel(ids, missionIds) {
  const count = mastery(ids),
    pct = Math.round(count / ids.length * 100);
  return `<section class="progress-card" aria-label="Ta progression"><div class="progress-label"><span class="compass">◈</span><div><strong>Le carnet de ${esc(currentProfile().name)}</strong><span>${count} activités comprises sur ${ids.length}</span></div></div><div class="progress-meter"><div class="meter-top"><span>Progression</span><strong>${pct} %</strong></div><progress max="${ids.length}" value="${count}" aria-label="Activités comprises"></progress></div><div class="stat"><strong>★ ${state.stars}</strong><span>étoiles dans tout le CM2</span></div><div class="stat"><strong>${missionIds.filter(i => state.completed.includes(i)).length}<small> / ${missionIds.length}</small></strong><span>missions terminées</span></div></section>`;
}
function home() {
  if (!currentProfile()) return profilesPage();
  currentView = 'home';
  currentSubject = null;
  session = null;
  app.innerHTML = `<div class="adventurer-bar"><span>🦊 Heureux de te retrouver, <strong>${esc(currentProfile().name)}</strong> !</span><button class="text-button" data-action="profiles">Changer d’aventurier ↗</button></div><section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span> TON CM2, TOUT UN MONDE À EXPLORER</div><h1>Petites missions.<br>Grandes <em>découvertes.</em></h1><p>Des mots, des nombres, des histoires et des idées…<br>Retrouve Nox pour une nouvelle aventure !</p><button class="primary start" data-action="${state.session ? 'resume' : 'start'}">${state.session ? '↗ Continuer mon aventure' : '🚀 Commencer l’aventure'}</button>${state.session ? `<p class="resume-note">${esc(QUESTION_BY_ID.get(state.session.ids[state.session.index]).category)} · étape ${state.session.index + 1} sur ${state.session.ids.length}</p>` : ''}<div class="hero-caption">${SUBJECTS.length} univers <span>•</span> ${MISSIONS.length} missions <span>•</span> ${QUESTIONS.length} activités</div></div><div class="hero-art">${landscape()}<span class="art-tag">✦ La curiosité est ton super-pouvoir !</span><span class="map-marker marker-one">📚</span><span class="map-marker marker-two">🧮</span></div></section>
  ${progressPanel(QUESTIONS.map(q => q.id), MISSIONS.map((_, i) => i))}
  <section class="missions-section"><div class="section-head"><div><span class="eyebrow">LA CARTE DES SAVOIRS</span><h2>Choisis ton prochain univers.</h2></div><button class="text-button" data-action="program">📖 Voir tous les chapitres</button></div><div class="subject-grid">${SUBJECTS.map(subject => {
    const qs = subjectQuestions(subject.id),
      ms = MISSIONS_BY_SUBJECT.get(subject.id),
      done = mastery(qs.map(q => q.id));
    return `<button class="subject-card" data-subject="${subject.id}" style="--accent:${subject.color}"><div class="subject-card-top"><span>${subject.icon}</span><b>↗</b></div><span class="eyebrow">${subject.world}</span><h3>${subject.name}</h3><p>${subject.description}</p><div class="subject-count">${ms.length} missions <span>${state.completed.filter(i => MISSIONS[i]?.subject === subject.id).length} terminées</span></div><progress max="${qs.length}" value="${done}" aria-label="${esc(subject.name)} : ${done} activités comprises"></progress></button>`;
  }).join('')}</div></section>
  <section class="bottom-grid"><button class="challenge-card" data-action="challenge"><span class="challenge-icon">🏆</span><div><span class="eyebrow">MÉLANGE TES SUPER-POUVOIRS</span><h2>Le grand défi CM2</h2><p>15 activités surprises dans les ${SUBJECTS.length} univers et un diplôme.</p></div><span class="round-arrow">↗</span></button><button class="review-card" data-action="review"><span>🧠</span><div><h3>Je révise mes erreurs</h3><p>${state.errors.length} activités à revoir à ton rythme</p></div><b>→</b></button></section>
  <section class="fox-note">${fox()}<p><strong>« On n’a pas besoin de tout savoir pour commencer ! »</strong><br>Choisis une matière, lis la fiche et essaie. Je suis là pour t’aider.</p><span class="signature">Nox, ton guide 🌿</span></section><div class="home-tools"><button class="text-button" data-action="program">📖 Mon programme et mes fiches</button><button class="text-button" data-action="diplomas">🎓 Mes diplômes</button><button class="text-button" data-action="reset">↺ Recommencer mon parcours</button></div>${storageWarning()}`;
  focusPage();
}
function storageWarning() {
  return !storageOK ? '<p class="storage-warning" role="status">Le stockage local est indisponible. Garde cet onglet ouvert pour conserver tes carnets pendant cette séance.</p>' : '';
}
function missionCard(m) {
  const qs = missionQuestions(m.index),
    done = mastery(qs.map(q => q.id));
  const number = MISSIONS_BY_SUBJECT.get(m.subject).findIndex(x => x.index === m.index) + 1;
  return `<article class="chapter-card"><button class="mission-card mission-${m.index % 5}" data-mission="${m.index}" style="--accent:${m.color}"><div class="card-top"><span class="mission-number">MISSION ${String(number).padStart(2, '0')}</span><span>${state.badges.includes(m.index) ? '🏅' : '↗'}</span></div><div class="mission-illustration">${m.icon}<span class="decor-leaf">✦</span></div><h3>${m.name}</h3><p class="chapter-intro">${esc(m.intro)}</p><div class="card-bottom"><span>${state.completed.includes(m.index) ? '✓ Mission terminée' : 'Partir explorer'}</span><span>${done}/${qs.length}</span></div><progress max="${qs.length}" value="${done}" aria-label="${esc(m.name)} : ${done} activités comprises"></progress></button><button class="text-button lesson-link" data-lesson="${m.index}">📖 La fiche à retenir</button></article>`;
}
function subjectPage(id) {
  if (!currentProfile()) return profilesPage();
  const subject = subjectInfo(id);
  if (!subject) return home();
  currentSubject = id;
  currentView = 'subject';
  session = null;
  state.lastSubject = id;
  save();
  const ms = MISSIONS_BY_SUBJECT.get(id),
    qs = subjectQuestions(id);
  app.innerHTML = `<section class="subject-page"><button class="text-button" data-action="home">← Tous mes univers</button><div class="subject-heading" style="--accent:${subject.color}"><span>${subject.icon}</span><div><span class="eyebrow">${subject.world}</span><h1>${subject.name}</h1><p>${subject.description}</p></div></div>${progressPanel(qs.map(q => q.id), ms.map(m => m.index))}<div class="subject-actions"><button class="primary" data-mission="${nextMissionFor(id)}">🚀 Ma prochaine mission</button><button class="secondary" data-scope-challenge="${id}">🏆 Défi ${subject.name}</button><button class="secondary" data-action="review">🧠 Mes révisions</button><button class="text-button" data-action="definitions">📖 Mes réponses modèles</button></div><div class="mission-grid curriculum-missions">${ms.map(missionCard).join('')}</div></section>`;
  focusPage();
}
function lessonPage(index) {
  if (!currentProfile()) return profilesPage();
  const m = MISSIONS[index];
  if (!m) return home();
  currentSubject = m.subject;
  currentView = 'lesson';
  session = null;
  app.innerHTML = `<section class="lesson-page"><button class="text-button" data-subject="${m.subject}">← ${subjectInfo(m.subject).name}</button><article class="question-card"><span class="eyebrow">📖 LA FICHE À RETENIR</span><h1>${m.icon} ${m.name}</h1><ul class="lesson-points">${m.lesson.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="instructions">Lis à ton rythme, puis teste tes idées. Tu peux revenir à cette fiche à tout moment.</p><button class="primary" data-mission="${index}">Jouer cette mission →</button></article></section>`;
  focusPage();
}
function programPage() {
  if (!currentProfile()) return profilesPage();
  currentView = 'program';
  currentSubject = null;
  session = null;
  app.innerHTML = `<section class="program-page"><button class="text-button" data-action="home">← Mes univers</button><span class="eyebrow">MES REPÈRES D’APPRENTISSAGE · CM2 2026–2027</span><h1>Un programme,<br><em>plein d’aventures.</em></h1><p>${MISSIONS.length} missions et ${QUESTIONS.length} activités pour retrouver les domaines du CM2. L’anglais est la langue vivante choisie. Les activités d’oral, d’écriture, de création et d’EPS se réalisent puis se comparent à des critères, sans correction automatique.</p>${SUBJECTS.map(s => `<details class="program-subject"><summary>${s.icon} ${s.name} · ${MISSIONS_BY_SUBJECT.get(s.id).length} missions</summary><div class="program-chapters">${MISSIONS_BY_SUBJECT.get(s.id).map(m => `<article><h3>${state.completed.includes(m.index) ? '✓ ' : ''}${m.name}</h3><p>${esc(m.intro)}</p><button class="text-button" data-lesson="${m.index}">Lire la fiche</button><button class="secondary" data-mission="${m.index}">Jouer →</button></article>`).join('')}</div></details>`).join('')}<p class="instructions">Les repères officiels et le détail de la couverture sont documentés dans GUIDE_PROGRAMME.md, fourni avec le jeu. Les livres, échanges, expériences et pratiques accompagnées prolongent ces révisions.</p></section>`;
  focusPage();
}
function startDefinitions() {
  const ids = QUESTIONS.filter(q => q.type === 'definition' && !q.practice && (!currentSubject || q.subject === currentSubject)).map(q => q.id);
  if (!ids.length) return lessonPage(nextMissionFor(currentSubject));
  start(ids, 'definitions', null, currentSubject);
}
function start(ids, mode, mission = null, scope = currentSubject) {
  if (!currentProfile()) return profilesPage();
  if (!ids.length) {
    toast('Rien à revoir pour le moment. Bravo !');
    return;
  }
  session = {
    ids,
    scope,
    index: 0,
    mode,
    mission,
    earned: 0,
    correctIds: []
  };
  state.session = session;
  save();
  renderQuestion();
}
function startMission(i) {
  if (!MISSIONS[i]) return;
  currentSubject = MISSIONS[i].subject;
  state.lastSubject = currentSubject;
  start(missionQuestions(i).map(q => q.id), 'mission', i, currentSubject);
}
// Tirage équilibré : chaque univers apparaît dans le défi global ; les chapitres tournent dans celui d'une matière.
function challengeIds(scope = null) {
  const groups = scope ? MISSIONS_BY_SUBJECT.get(scope).map(m => shuffle(missionQuestions(m.index))) : shuffle(SUBJECTS).map(s => shuffle(subjectQuestions(s.id)));
  const ids = [];
  while (ids.length < 15 && groups.some(g => g.length)) {
    for (const group of shuffle(groups)) {
      if (group.length && ids.length < 15) ids.push(group.pop().id);
    }
  }
  return shuffle(ids);
}
function startChallenge(scope = currentSubject) {
  if (scope && !subjectInfo(scope)) return;
  start(challengeIds(scope), 'challenge', null, scope);
}
function resume() {
  if (state.session) {
    session = state.session;
    currentSubject = subjectInfo(session.scope) ? session.scope : MISSIONS[QUESTION_BY_ID.get(session.ids[session.index]).mission].subject;
    renderQuestion();
  } else startMission(nextMissionFor(state.lastSubject || 'francais'));
}
function qNow() {
  return QUESTIONS.find(q => q.id === session.ids[session.index]);
}
const labels = {
  qcm: 'Choisis une réponse',
  tf: 'Vrai ou faux ?',
  multi: 'Choisis toutes les bonnes réponses',
  image: 'Observe et choisis',
  sort: 'Classe les cartes',
  nested: 'Explore les groupes emboîtés',
  order: 'Remets les cartes dans l’ordre',
  match: 'Associe les cartes',
  blanks: 'Complète les phrases',
  definition: 'Explique avec tes mots',
  pond: 'Observe la mare',
  links: 'Construis les flèches',
  restore: 'Restaure le milieu',
  number: 'À toi de calculer'
};
function renderQuestion() {
  currentView = 'question';
  answered = false;
  modelOpen = false;
  selected = null;
  source = null;
  links = [];
  discovered = [];
  const q = qNow(),
    m = MISSIONS[q.mission];
  choiceOrder = q.type === 'tf' ? [0, 1] : shuffle(q.options.map((_, i) => i));
  cardOrder = shuffle(q.options.map((_, i) => i));
  groupOrder = q.targets ? shuffle(q.targets.map((_, i) => i)) : (q.groups || []).map((_, i) => i);
  answer = ['sort', 'nested', 'match', 'blanks'].includes(q.type) ? q.options.map(() => null) : q.type === 'order' ? shuffle(q.options.map((_, i) => i)) : [];
  if (q.type === 'order' && answer.every((v, i) => v === i)) answer.reverse();
  app.innerHTML = `<section class="game-shell"><div class="game-heading"><button class="text-button" data-action="home">← Ma carte d’aventure</button><span class="pill">${session.mode === 'challenge' ? '🏆 Grand défi' : session.mode === 'review' ? '🧠 Révision' : m.icon + ' ' + subjectInfo(m.subject).name}</span></div><div class="game-progress"><span>${session.mode === 'mission' ? esc(m.name) : session.mode === 'definitions' ? 'Le carnet des définitions' : session.mode === 'review' ? 'On apprend de ses erreurs' : 'Le grand défi ' + (session.scope ? subjectInfo(session.scope)?.name || 'Biodiversité' : 'CM2')}</span><b>Étape ${session.index + 1} / ${session.ids.length}</b><progress value="${session.index}" max="${session.ids.length}" aria-label="Progression de la séance"></progress></div><div class="question-card"><div class="question-meta"><span class="eyebrow">${labels[q.type]}</span><span class="difficulty">${q.difficulty === 1 ? '🌿 Découverte' : '✦ Exploration'}</span></div><h1>${esc(q.prompt)}</h1><details class="inline-lesson"><summary>📖 Un rappel avant de jouer</summary><ul>${m.lesson.map(p => `<li>${esc(p)}</li>`).join('')}</ul></details>${activityMedia(q)}<div id="exercise"></div><div id="feedback" aria-live="polite"></div><div class="exercise-actions"><button class="text-button" id="hint-button">💡 Un petit indice</button><button class="primary" id="validate">${q.type === 'definition' ? q.practice ? 'Comparer avec les critères' : 'Voir la réponse modèle' : 'Vérifier ma découverte'} <span>→</span></button></div><p class="hint" id="hint" hidden>${esc(q.hint)}</p></div><div class="guide-line">${fox()}<p>${q.type === 'links' ? 'La flèche signifie « est mangé par ». Elle part de la nourriture !' : q.type === 'definition' ? 'Tes idées comptent. Compare ensuite avec le modèle, sans note.' : 'Prends ton temps. Chaque essai te fait progresser !'}</p><span>★ ${session.earned} étoiles dans cette aventure</span></div></section>`;
  drawExercise();
  if (q.tones) document.getElementById('listen-tones').onclick = () => playTones(q.tones);
  if (q.speech) document.getElementById('listen-speech').onclick = () => playSpeech(q.speech);
  document.getElementById('validate').onclick = validate;
  document.getElementById('hint-button').onclick = () => {
    const h = document.getElementById('hint');
    h.hidden = !h.hidden;
  };
  focusPage();
}
function card(q, i, extra = '') {
  return `<button class="animal-card ${selected === i ? 'selected' : ''}" data-item="${i}" ${extra} aria-pressed="${selected === i}">${esc(q.options[i])}</button>`;
}
function drawExercise() {
  const q = qNow(),
    el = document.getElementById('exercise');
  if (['qcm', 'tf', 'image', 'multi'].includes(q.type)) {
    el.innerHTML = `${q.type === 'multi' ? '<p class="instructions">Plusieurs réponses sont possibles.</p>' : ''}<div class="choices ${q.type === 'image' ? 'image-choices' : ''}">${choiceOrder.map((i, position) => {
      const o = q.options[i];
      return `<button class="choice ${answer.includes(i) ? 'chosen' : ''}" data-choice="${i}" aria-pressed="${answer.includes(i)}"><span class="choice-key">${q.type === 'tf' ? i ? '✕' : '✓' : String.fromCharCode(65 + position)}</span><span>${esc(o)}</span><span class="choice-check">${answer.includes(i) ? '✓' : ''}</span></button>`;
    }).join('')}</div>`;
    el.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => {
      if (answered) return;
      const i = +b.dataset.choice;
      answer = q.type === 'multi' ? answer.includes(i) ? answer.filter(v => v !== i) : [...answer, i] : [i];
      drawExercise();
      el.querySelector(`[data-choice="${i}"]`).focus();
    });
  } else if (['sort', 'nested', 'match'].includes(q.type)) {
    let names = q.groups || q.targets;
    el.innerHTML = `<p class="instructions">Glisse une carte, ou sélectionne-la puis touche son groupe. Au clavier : Tab puis Entrée.</p><div class="card-bank" aria-label="Cartes à classer">${cardOrder.map(i => answer[i] === null ? card(q, i, 'draggable="true"') : '').join('') || '<span>Toutes les cartes sont placées. Tu peux encore les déplacer.</span>'}</div>${q.type === 'nested' ? '<div class="nested-wrap"><div class="nested-title">ANIMAUX → VERTÉBRÉS · colonne vertébrale</div>' : ''}<div class="drop-grid ${q.type === 'match' ? 'match-grid' : ''}">${groupOrder.map(g => {
      const name = names[g];
      return `<div class="drop-zone" data-drop="${g}"><button class="drop-target" data-target="${g}" aria-label="Placer la carte sélectionnée dans ${esc(name)}"><strong>${esc(name)}</strong><span>＋</span></button><div class="placed">${q.options.map((_, i) => answer[i] === g ? card(q, i, 'draggable="true"') : '').join('')}</div></div>`;
    }).join('')}</div>${q.type === 'nested' ? '</div>' : ''}<button class="text-button" id="clear-board">↺ Replacer toutes les cartes au départ</button>`;
    bindBoard();
  } else if (q.type === 'order') {
    el.innerHTML = `<p class="instructions">Déplace les cartes ou utilise les flèches ↑ ↓. Lis ensuite de haut en bas${q.mission === 3 ? ' : « est mangé par »' : ''}.</p><div class="order-list">${answer.map((n, i) => `<div class="order-row" draggable="true" data-order="${i}"><span class="order-number">${i + 1}</span><span class="order-name">${esc(q.options[n])}</span><button class="icon-button" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Monter ${esc(q.options[n])}">↑</button><button class="icon-button" data-down="${i}" ${i === answer.length - 1 ? 'disabled' : ''} aria-label="Descendre ${esc(q.options[n])}">↓</button></div>${i < answer.length - 1 ? '<div class="chain-arrow" aria-hidden="true">↓</div>' : ''}`).join('')}</div>`;
    el.querySelectorAll('[data-up],[data-down]').forEach(b => b.onclick = () => {
      const i = +(b.dataset.up ?? b.dataset.down),
        j = i + (b.dataset.up !== undefined ? -1 : 1);
      [answer[i], answer[j]] = [answer[j], answer[i]];
      drawExercise();
      el.querySelector(`[data-${b.dataset.up !== undefined ? 'up' : 'down'}="${j}"]`).focus();
    });
    let dragging = null;
    el.querySelectorAll('[data-order]').forEach(row => {
      bindTouchDrag(row, () => {
        dragging = +row.dataset.order;
      }, target => {
        const to = target?.closest('[data-order]');
        if (to && dragging !== null) {
          answer.splice(+to.dataset.order, 0, answer.splice(dragging, 1)[0]);
          drawExercise();
        }
      });
      row.ondragstart = e => {
        dragging = +row.dataset.order;
        e.dataTransfer.setData('text/plain', String(dragging));
      };
      row.ondragover = e => e.preventDefault();
      row.ondrop = e => {
        e.preventDefault();
        if (dragging === null) return;
        const dest = +row.dataset.order;
        answer.splice(dest, 0, answer.splice(dragging, 1)[0]);
        drawExercise();
      };
    });
  } else if (q.type === 'blanks') {
    const parts = q.sentence.split('___');
    el.innerHTML = `<div class="word-bank">Mots proposés : ${shuffle(q.options).map(w => `<span>${esc(w)}</span>`).join('')}</div><div class="blank-sentence">${parts.map((p, i) => `${esc(p)}${i < parts.length - 1 ? `<select data-blank="${i}" aria-label="Mot à choisir pour le trou ${i + 1}"><option value="">Choisir…</option>${q.options.map((w, j) => `<option value="${j}" ${answer[i] === j ? 'selected' : ''}>${esc(w)}</option>`).join('')}</select>` : ''}`).join('')}</div>`;
    el.querySelectorAll('select').forEach(s => s.onchange = () => answer[+s.dataset.blank] = s.value === '' ? null : +s.value);
  } else if (q.type === 'number') {
    el.innerHTML = `<form id="number-form" class="number-form"><label for="number-answer">Mon résultat</label><div><input id="number-answer" inputmode="decimal" autocomplete="off" placeholder="Ton nombre…" aria-describedby="number-help"><span>${esc(q.unit || '')}</span></div><p class="instructions" id="number-help">Tu peux utiliser la virgule ou le point pour les décimaux. Entrée permet de vérifier.</p></form>`;
    document.getElementById('number-form').onsubmit = e => {
      e.preventDefault();
      validate();
    };
    bindDraft('number-answer', q);
  } else if (q.type === 'definition') {
    el.innerHTML = '<label class="free-label" for="free-answer">Ma réponse (tu peux aussi réfléchir à voix haute)</label><textarea id="free-answer" rows="4" maxlength="1500" placeholder="Pour moi…"></textarea><p class="instructions">Nox ne note pas ton texte ou ta réalisation : compare avec le modèle ou les critères.</p>';
    if (q.studio) mountStudio(q);
    bindDraft('free-answer', q);
  } else if (q.type === 'pond') {
    drawPond();
  } else if (q.type === 'links') {
    el.innerHTML = `<p class="instructions">Choisis une nourriture, puis celui qui la mange. Crée ${q.correct.length} flèches. Touche une relation pour la supprimer.</p><div class="link-workspace"><svg class="link-svg" id="link-svg" aria-hidden="true"><defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0 0 8 3 0 6" fill="#34836b"/></marker></defs></svg><div class="link-nodes">${q.options.map((o, i) => `<button class="animal-card ${source === i ? 'selected' : ''}" data-node="${i}" aria-pressed="${source === i}">${esc(o)}</button>`).join('')}</div></div><div class="relations" aria-live="polite">${links.length ? links.map((l, i) => {
      const [a, b] = l.split('-').map(Number);
      return `<button class="relation" data-remove-link="${i}" aria-label="Supprimer la relation ${esc(q.options[a])} est mangé par ${esc(q.options[b])}">${esc(q.options[a])} → ${esc(q.options[b])} <span>×</span></button>`;
    }).join('') : 'Tes relations apparaîtront ici.'}</div><p class="instructions" id="link-status">${source === null ? 'Choisis le premier être vivant.' : `${esc(q.options[source])} est mangé par…`}</p>`;
    el.querySelectorAll('[data-node]').forEach(b => b.onclick = () => {
      const i = +b.dataset.node;
      if (source === null) source = i;else {
        if (source !== i && !links.includes(`${source}-${i}`)) links.push(`${source}-${i}`);
        source = null;
      }
      drawExercise();
      el.querySelector(`[data-node="${i}"]`).focus();
    });
    el.querySelectorAll('[data-remove-link]').forEach(b => b.onclick = () => {
      links.splice(+b.dataset.removeLink, 1);
      drawExercise();
    });
    requestAnimationFrame(drawArrows);
  } else if (q.type === 'restore') {
    const useful = answer.filter(i => q.correct.includes(i)).length;
    el.innerHTML = `<div class="restoration level-${useful}" role="img" aria-label="Écosystème restauré : ${useful} actions utiles sur 4"><span class="restore-sky">${useful >= 3 ? '☀️' : '☁️'}</span><span class="restore-trees">${useful >= 2 ? '🌳 🌲 🌳' : '🪵 🪵'}</span><span class="restore-river">${useful >= 1 ? '💧 🐟' : '🗑️ 🧴'}</span><span class="restore-meadow">${useful >= 4 ? '🌼 🦋 🌻 🐝' : '🟤 🟤'}</span><span class="restore-label">${useful}/4 gestes utiles · ${useful === 4 ? 'La vallée reprend des couleurs !' : 'À toi de prendre soin du milieu'}</span></div><p class="instructions">Choisis quatre actions. Le paysage réagit à tes décisions !</p><div class="choices">${q.options.map((o, i) => `<button class="choice ${answer.includes(i) ? 'chosen' : ''}" data-restore="${i}" aria-pressed="${answer.includes(i)}">${esc(o)} <span>${answer.includes(i) ? '✓' : '＋'}</span></button>`).join('')}</div>`;
    el.querySelectorAll('[data-restore]').forEach(b => b.onclick = () => {
      const i = +b.dataset.restore;
      answer = answer.includes(i) ? answer.filter(v => v !== i) : [...answer, i];
      drawExercise();
      el.querySelector(`[data-restore="${i}"]`).focus();
    });
  }
}
// Cartes : déplacement natif à la souris, sélection + cible pour tactile et clavier.
function bindBoard() {
  const el = document.getElementById('exercise');
  el.querySelectorAll('[data-item]').forEach(b => {
    b.onclick = () => {
      selected = selected === +b.dataset.item ? null : +b.dataset.item;
      drawExercise();
      el.querySelector(`[data-item="${b.dataset.item}"]`).focus();
    };
    bindTouchDrag(b, () => {
      selected = +b.dataset.item;
    }, target => {
      const zone = target?.closest('[data-drop]');
      if (zone) place(+zone.dataset.drop);
    });
    b.ondragstart = e => {
      selected = +b.dataset.item;
      e.dataTransfer.setData('text/plain', String(selected));
      e.dataTransfer.effectAllowed = 'move';
    };
  });
  el.querySelectorAll('[data-target]').forEach(b => b.onclick = () => place(+b.dataset.target));
  el.querySelectorAll('[data-drop]').forEach(z => {
    z.ondragover = e => {
      e.preventDefault();
      z.classList.add('drag-over');
    };
    z.ondragleave = () => z.classList.remove('drag-over');
    z.ondrop = e => {
      e.preventDefault();
      place(+z.dataset.drop);
    };
  });
  document.getElementById('clear-board').onclick = () => {
    answer = answer.map(() => null);
    selected = null;
    drawExercise();
  };
}
// Glissement tactile natif par Pointer Events ; le tap reste disponible.
function bindTouchDrag(element, onStart, onDrop) {
  let active = null,
    moved = false;
  element.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || e.target.closest('.order-row button')) return;
    active = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId
    };
    moved = false;
    element.setPointerCapture(e.pointerId);
  });
  element.addEventListener('pointermove', e => {
    if (!active) return;
    if (!moved && Math.hypot(e.clientX - active.x, e.clientY - active.y) > 9) {
      moved = true;
      onStart();
      element.classList.add('touch-dragging');
    }
    if (moved) {
      e.preventDefault();
      document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop],[data-order]');
      if (target) target.classList.add('drag-over');
    }
  });
  element.addEventListener('pointerup', e => {
    if (!active) return;
    active = null;
    element.classList.remove('touch-dragging');
    document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
    if (moved) {
      e.preventDefault();
      onDrop(document.elementFromPoint(e.clientX, e.clientY));
    }
  });
  element.addEventListener('click', e => {
    if (moved) {
      e.stopImmediatePropagation();
      e.preventDefault();
      moved = false;
    }
  }, true);
  element.addEventListener('pointercancel', () => {
    active = null;
    moved = false;
    element.classList.remove('touch-dragging');
    document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
  });
}
function place(g) {
  if (selected === null) {
    toast('Choisis d’abord une carte à placer.');
    return;
  }
  answer[selected] = g;
  selected = null;
  drawExercise();
  const b = document.querySelector(`[data-target="${g}"]`);
  if (b) b.focus();
}
function drawArrows() {
  if (currentView !== 'question' || qNow().type !== 'links') return;
  const svg = document.getElementById('link-svg');
  if (!svg) return;
  svg.querySelectorAll('line').forEach(l => l.remove());
  const base = svg.getBoundingClientRect();
  links.forEach(l => {
    const [a, b] = l.split('-');
    const r1 = document.querySelector(`[data-node="${a}"]`).getBoundingClientRect(),
      r2 = document.querySelector(`[data-node="${b}"]`).getBoundingClientRect();
    const x1 = r1.x + r1.width / 2 - base.x,
      y1 = r1.y + r1.height / 2 - base.y,
      x2 = r2.x + r2.width / 2 - base.x,
      y2 = r2.y + r2.height / 2 - base.y,
      dist = Math.hypot(x2 - x1, y2 - y1),
      cut = Math.min(55, dist / 3);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    for (const [k, v] of Object.entries({
      x1: x1 + (x2 - x1) * cut / dist,
      y1: y1 + (y2 - y1) * cut / dist,
      x2: x2 - (x2 - x1) * cut / dist,
      y2: y2 - (y2 - y1) * cut / dist,
      stroke: '#34836b',
      'stroke-width': 3,
      'marker-end': 'url(#arrowhead)'
    })) line.setAttribute(k, v);
    svg.append(line);
  });
}
window.addEventListener('resize', drawArrows);
const POND = [{
  emoji: '🐸',
  x: 15,
  y: 49,
  text: 'La grenouille adulte mange notamment des insectes. Elle vit entre la terre et l’eau et pond dans l’eau.'
}, {
  emoji: '🐟',
  x: 38,
  y: 77,
  text: 'Le têtard est le jeune de la grenouille. Il vit dans l’eau et se transforme progressivement en grenouille.'
}, {
  emoji: '🪰',
  x: 54,
  y: 17,
  text: 'La libellule adulte vole au-dessus de la mare. C’est un insecte prédateur qui capture d’autres insectes.'
}, {
  emoji: '🦐',
  x: 18,
  y: 80,
  text: 'La larve de libellule vit dans l’eau et capture de petits animaux. Elle deviendra une libellule adulte.'
}, {
  emoji: '🪶',
  x: 79,
  y: 27,
  text: 'Le héron est un oiseau qui chasse sur les bords de la mare. Il peut capturer des poissons et des grenouilles.'
}, {
  emoji: '🐟',
  x: 67,
  y: 68,
  text: 'Les poissons respirent grâce à leurs branchies qui utilisent l’oxygène dissous dans l’eau. Leur nourriture dépend de leur espèce.'
}, {
  emoji: '🌿',
  x: 84,
  y: 78,
  text: 'Les plantes aquatiques utilisent la lumière pour fabriquer leur matière. Elles offrent des abris et produisent de l’oxygène à la lumière.'
}];
function drawPond() {
  const q = qNow(),
    el = document.getElementById('exercise');
  el.innerHTML = `<p class="instructions">Explore les sept habitants. Les petites illustrations sont des repères : lis leur nom.</p><div class="pond-scene"><span class="pond-sun">☀️</span><span class="pond-reeds">🌾</span><span class="pond-lily">🪷</span>${POND.map((p, i) => `<button class="pond-creature ${discovered.includes(i) ? 'seen' : ''}" style="left:${p.x}%;top:${p.y}%" data-pond="${i}" aria-label="Découvrir : ${q.options[i]}"><span>${p.emoji}</span><b>${esc(q.options[i])} ${discovered.includes(i) ? '✓' : ''}</b></button>`).join('')}</div><div class="pond-fact" role="status">${source === null ? '🌿 Choisis un habitant pour découvrir son rôle.' : `<strong>${esc(q.options[source])}</strong> — ${POND[source].text}`}</div><p class="instructions">${discovered.length} / 7 habitants découverts</p>`;
  el.querySelectorAll('[data-pond]').forEach(b => b.onclick = () => {
    source = +b.dataset.pond;
    if (!discovered.includes(source)) discovered.push(source);
    drawPond();
    el.querySelector(`[data-pond="${source}"]`).focus();
  });
}
function same(a, b) {
  return a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
}
function validate() {
  if (answered) return;
  const q = qNow();
  if (q.type === 'number') {
    const value = parseNumeric(document.getElementById('number-answer').value);
    if (value === null) {
      toast('Écris un nombre pour vérifier ton résultat.');
      return;
    }
    resolve(Math.abs(value - q.correct[0]) < 1e-9);
    return;
  }
  if (q.type === 'definition') {
    if (modelOpen) return;
    modelOpen = true;
    document.getElementById('feedback').innerHTML = `<div class="feedback model"><h3>📖 ${q.practice ? 'Les critères pour faire le point' : 'La réponse modèle'}</h3><p>${esc(q.explanation)}</p><p>${q.practice ? 'Regarde ta réalisation. Que réussis-tu déjà ? Que peux-tu encore améliorer ?' : 'Compare avec tes idées. As-tu retrouvé l’essentiel ?'}</p><div class="button-row"><button class="primary" id="understood">✓ J’ai compris</button><button class="secondary" id="review-definition">↺ Je veux revoir</button></div></div>`;
    document.getElementById('validate').hidden = true;
    document.getElementById('understood').onclick = () => resolve(true, true);
    document.getElementById('review-definition').onclick = () => resolve(false, true);
    document.getElementById('understood').focus();
    return;
  }
  if (['sort', 'nested', 'match', 'blanks'].includes(q.type) && answer.some(v => v === null)) {
    toast('Il reste des cartes ou des mots à placer. Tu peux y arriver !');
    return;
  }
  if (['qcm', 'tf', 'image', 'multi', 'restore'].includes(q.type) && answer.length === 0) {
    toast('Choisis une réponse pour continuer.');
    return;
  }
  if (q.type === 'pond' && discovered.length < 7) {
    toast('Il reste des habitants à découvrir dans la mare.');
    return;
  }
  if (q.type === 'links' && !links.length) {
    toast('Crée une première flèche : choisis le mangé, puis celui qui le mange.');
    return;
  }
  const correct = q.type === 'pond' ? true : q.type === 'links' ? same(links, q.correct) : ['sort', 'nested', 'match', 'blanks', 'order'].includes(q.type) ? answer.length === q.correct.length && answer.every((v, i) => v === q.correct[i]) : same(answer, q.correct);
  resolve(correct);
}
function resolve(ok, self = false) {
  const q = qNow();
  answered = true;
  const isNew = !state.rewarded.includes(q.id);
  if (ok) {
    if (!state.mastered.includes(q.id)) state.mastered.push(q.id);
    if (isNew) {
      state.rewarded.push(q.id);
      state.stars += 3;
      session.earned += 3;
    }
    state.errors = state.errors.filter(id => id !== q.id);
    if (!session.correctIds.includes(q.id)) session.correctIds.push(q.id);
    sound(true);
    celebrate();
    const m = q.mission;
    if (!state.badges.includes(m) && state.mastered.filter(id => QUESTIONS.find(x => x.id === id).mission === m).length >= Math.ceil(missionQuestions(m).length / 2)) {
      state.badges.push(m);
      toast('🏅 Nouveau badge : ' + MISSIONS[m].badge + ' !');
    }
  } else {
    if (!state.errors.includes(q.id)) state.errors.push(q.id);
    state.mastered = state.mastered.filter(id => id !== q.id);
    sound(false);
  }
  state.session = session;
  save();
  const fb = document.getElementById('feedback');
  fb.innerHTML = `<div class="feedback ${ok ? 'success' : 'retry'}"><h3>${ok ? self ? '🌟 Une notion mieux comprise !' : '✨ Bien joué, explorateur !' : self ? '📖 On garde cette notion à revoir.' : '🌿 Pas tout à fait. On apprend ensemble !'}</h3><p>${esc(q.explanation)}</p>${ok ? `<strong>${isNew ? '★ +3 étoiles' : '✓ Notion consolidée · étoiles déjà gagnées'}</strong>` : `<p class="gentle">${self ? 'Tu retrouveras cette définition dans tes révisions.' : 'Ta découverte est enregistrée dans tes révisions. Tu peux réessayer ou continuer.'}</p>`}<div class="button-row">${!ok ? '<button class="secondary" id="retry">↺ Réessayer</button>' : ''}<button class="primary" id="next">${session.index === session.ids.length - 1 ? 'Terminer cette aventure' : 'Continuer'} →</button></div></div>`;
  document.getElementById('validate').hidden = true;
  document.querySelectorAll('#exercise button,#exercise select,#exercise textarea,#exercise input').forEach(b => b.disabled = true);
  document.querySelectorAll('#exercise [draggable]').forEach(b => b.draggable = false);
  const retry = document.getElementById('retry');
  if (retry) retry.onclick = renderQuestion;
  document.getElementById('next').onclick = next;
  document.getElementById('next').focus();
}
function next() {
  if (session.index + 1 < session.ids.length) {
    session.index++;
    state.session = session;
    save();
    renderQuestion();
  } else finish();
}
function finish() {
  currentView = 'result';
  const s = session;
  if (s.mode === 'mission') {
    if (!state.completed.includes(s.mission)) state.completed.push(s.mission);
    if (!state.diplomas[s.mission]) state.diplomas[s.mission] = new Date().toLocaleDateString('fr-FR');
  }
  const missed = s.ids.filter(id => state.errors.includes(id));
  if (s.mode === 'challenge') {
    const result = {
      date: new Date().toLocaleDateString('fr-FR'),
      earned: s.earned,
      ids: s.ids,
      correct: s.correctIds
    };
    if (subjectInfo(s.scope)) state.subjectFinals[s.scope] = result;else if (s.scope === 'biodiversity') state.final = result;else state.grandFinal = result;
  }
  state.session = null;
  save();
  celebrate();
  app.innerHTML = `<section class="result-card"><span class="result-icon">${s.mode === 'challenge' ? '🏆' : s.mode === 'mission' ? '🏅' : '🌟'}</span><span class="eyebrow">UNE NOUVELLE ÉTAPE DANS TON AVENTURE</span><h1>${esc(currentProfile().name)}, ${s.mode === 'challenge' ? 'défi relevé !' : s.mode === 'mission' ? 'Mission accomplie !' : 'Bravo pour tes révisions !'}</h1><p>${s.mode === 'mission' ? `Tu as exploré « ${esc(MISSIONS[s.mission].name)} » ${state.badges.includes(s.mission) ? 'et gagné le badge' : '! Continue à réviser pour gagner ton badge.'}` : 'Chaque découverte te rapproche de la nature.'}</p>${s.mode === 'mission' && state.badges.includes(s.mission) ? `<div class="badge-earned">${MISSIONS[s.mission].icon} ${MISSIONS[s.mission].badge}</div>` : ''}<div class="result-stats"><div><strong>★ ${s.earned}</strong><span>étoiles gagnées</span></div><div><strong>${s.correctIds.length}</strong><span>notions comprises cette fois</span></div><div><strong>${missed.length}</strong><span>notions à revoir</span></div></div><p>${missed.length ? 'Tu peux continuer à apprendre avec tes révisions. Nox t’accompagne !' : 'Toutes les notions de cette aventure sont comprises. Quelle belle exploration !'}</p><div class="button-row">${s.mode === 'challenge' ? `<button class="primary" data-final="${s.scope || 'all'}">🎓 Découvrir mon diplôme</button>` : '<button class="primary" data-action="home">Retour à ma carte →</button>'}${missed.length ? '<button class="secondary" data-action="review">🧠 Revoir mes erreurs</button>' : ''}${s.mode === 'mission' ? `<button class="secondary" data-certificate="${s.mission}">🎓 Mon petit diplôme</button><button class="secondary" data-replay="${s.mission}">↺ Rejouer la mission</button>` : ''}</div><div class="notion-summary"><h3>Les notions maîtrisées de cette aventure</h3>${s.correctIds.length ? s.correctIds.map(id => `<p>✓ ${esc(QUESTIONS.find(q => q.id === id).prompt)}</p>`).join('') : '<p>Tu as découvert de nouvelles notions. Revois-les à ton rythme pour les consolider.</p>'}</div></section>`;
  focusPage();
}
function review() {
  if (!currentProfile()) return profilesPage();
  currentView = 'review';
  const errors = state.errors.filter(id => !currentSubject || QUESTION_BY_ID.get(id).subject === currentSubject);
  const units = currentSubject ? MISSIONS_BY_SUBJECT.get(currentSubject).map(m => ({
    name: m.name,
    icon: m.icon,
    qs: missionQuestions(m.index),
    action: `data-replay="${m.index}"`,
    label: 'Rejouer la mission'
  })) : SUBJECTS.map(s => ({
    name: s.name,
    icon: s.icon,
    qs: subjectQuestions(s.id),
    action: `data-subject="${s.id}"`,
    label: 'Explorer cet univers'
  }));
  app.innerHTML = `<section class="review-page"><button class="text-button" data-action="home">← Mes univers</button><span class="eyebrow">LE CARNET DE NOX ${currentSubject ? '· ' + subjectInfo(currentSubject).name : ''}</span><h1>On devient expert<br><em>en essayant.</em></h1><p>Les activités ouvertes sont indiquées comme comprises quand tu les autoévalues. Tu peux toujours les revoir.</p><div class="button-row"><button class="primary" id="review-errors" ${errors.length ? '' : 'disabled'}>🧠 Refaire mes ${errors.length} erreurs</button><button class="secondary" data-action="definitions">📖 Revoir les modèles</button><button class="secondary" data-action="program">Toutes mes fiches</button></div><div class="review-grid">${units.map(u => {
    const ids = u.qs.map(q => q.id),
      done = mastery(ids),
      miss = u.qs.filter(q => errors.includes(q.id));
    return `<article class="review-topic"><span>${u.icon}</span><h2>${u.name}</h2><p>✓ ${done} / ${u.qs.length} activités comprises</p><progress max="${u.qs.length}" value="${done}" aria-label="${esc(u.name)} : activités comprises"></progress><h3>${miss.length ? 'À retravailler' : 'À explorer ou à consolider'}</h3>${miss.slice(0, 8).map(q => `<p class="small-notion">🌱 ${esc(q.prompt)}</p>`).join('') || '<p class="small-notion">Aucune erreur enregistrée dans cet univers.</p>'}${miss.length > 8 ? `<p class="small-notion">Et ${miss.length - 8} autres dans la séance de révision.</p>` : ''}<details><summary>Mes activités comprises</summary>${u.qs.filter(q => state.mastered.includes(q.id)).map(q => `<p class="small-notion">✓ ${esc(q.prompt)}</p>`).join('') || '<p>Pars explorer pour remplir ton carnet.</p>'}</details><button class="secondary" ${u.action}>${u.label} →</button></article>`;
  }).join('')}</div></section>`;
  document.getElementById('review-errors').onclick = () => start(shuffle(errors), 'review', null, currentSubject);
  focusPage();
}
function certificateCount() {
  return state.completed.length + Object.keys(state.subjectFinals).length + (state.grandFinal ? 1 : 0) + (state.final ? 1 : 0);
}
function diplomasPage() {
  if (!currentProfile()) return profilesPage();
  currentView = 'diplomas';
  session = null;
  const earned = state.completed.map(index => ({
    ...MISSIONS[index],
    index
  }));
  app.innerHTML = `<section class="certificates-page"><button class="text-button" data-action="home">← Mes univers</button><span class="eyebrow">LES SOUVENIRS DE TES EXPLORATIONS</span><h1>Les diplômes de<br><em>${esc(currentProfile().name)}</em></h1><p>${certificateCount()} diplômes gagnés. Chaque mission terminée donne un souvenir personnalisé, même s’il reste des activités à revoir.</p><div class="certificates-grid">${earned.map(m => `<article class="certificate-preview"><span>${m.icon}</span><span class="eyebrow">${subjectInfo(m.subject).name}</span><h3>${m.name}</h3><p>${esc(currentProfile().name)}</p><button class="secondary" data-certificate="${m.index}">Voir et imprimer →</button></article>`).join('')}${Object.keys(state.subjectFinals).map(id => `<article class="certificate-preview final-certificate"><span>${subjectInfo(id).icon}</span><h3>Défi ${subjectInfo(id).name}</h3><p>${esc(currentProfile().name)}</p><button class="primary" data-final="${id}">Voir et imprimer →</button></article>`).join('')}${state.grandFinal ? `<article class="certificate-preview final-certificate"><span>🏆</span><h3>Le grand défi CM2</h3><p>${esc(currentProfile().name)}</p><button class="primary" data-final="all">Voir et imprimer →</button></article>` : ''}${state.final ? '<article class="certificate-preview final-certificate"><span>🌍</span><h3>Mon ancien défi biodiversité</h3><button class="secondary" data-final="biodiversity">Voir et imprimer →</button></article>' : ''}</div>${!certificateCount() ? '<div class="empty-card">🌟 Ton premier diplôme t’attend à la fin d’une mission !<br><button class="primary" data-action="home">Choisir une aventure →</button></div>' : ''}</section>`;
  focusPage();
}
function diploma(kind = state.grandFinal ? 'all' : 'biodiversity') {
  if (!currentProfile()) return profilesPage();
  const isMission = Number.isInteger(kind),
    m = isMission ? MISSIONS[kind] : null,
    subject = subjectInfo(kind);
  if (isMission && (!m || !state.completed.includes(kind))) return;
  const result = isMission ? null : kind === 'all' ? state.grandFinal : kind === 'biodiversity' ? state.final : state.subjectFinals[kind];
  if (!isMission && !result) return;
  const date = isMission ? state.diplomas[kind] : result.date;
  const title = isMission ? m.name : kind === 'all' ? 'Explorateur du CM2' : kind === 'biodiversity' ? 'Explorateur de la biodiversité' : 'Explorateur · ' + subject.name;
  const description = isMission ? 'pour avoir terminé cette mission<br>et fait de nouvelles découvertes.' : kind === 'all' ? 'pour avoir relevé le Grand Défi CM2<br>et exploré les univers de la connaissance.' : kind === 'biodiversity' ? 'pour avoir relevé le Grand Défi Biodiversité<br>et exploré les merveilles du monde vivant.' : 'pour avoir relevé le défi ' + esc(subject.name) + '<br>avec curiosité et persévérance.';
  currentView = 'diploma';
  app.innerHTML = `<div class="diploma-tools"><button class="text-button" data-action="diplomas">← Mes diplômes</button><button class="primary" id="print">🖨️ Imprimer le diplôme</button></div><section class="diploma ${isMission ? 'small-diploma' : ''}"><div class="diploma-leaves">${isMission ? m.icon + ' ✦ ' + m.icon : '🌿 ✦ 🌿'}</div><span class="eyebrow">MISSION CM2 · ${isMission ? subjectInfo(m.subject).name : 'DÉFI RELEVÉ'}</span><h1>${isMission ? 'Mon petit diplôme de mission' : 'Diplôme d’exploration'}</h1><h2>${esc(title)}</h2><p>Ce diplôme est décerné à</p><p class="diploma-name">${esc(currentProfile().name)}</p><p>${description}</p><div class="diploma-seal">${isMission ? m.icon : '🏅'}</div><p class="diploma-motto">Découvrir • Essayer • Progresser</p><div class="diploma-sign"><span>${date ? 'Le ' + esc(date) : 'Une belle étape accomplie !'}</span><span>Nox, le renard explorateur 🦊</span></div></section><p class="print-note">Le diplôme de ${esc(currentProfile().name)} est prêt. Imprime-le ou choisis « Enregistrer en PDF ».</p>`;
  document.getElementById('print').onclick = () => window.print();
  focusPage();
}
function bindDraft(elementId, q) {
  const field = document.getElementById(elementId);
  field.value = state.drafts[q.id] || '';
  field.oninput = () => {
    state.drafts[q.id] = field.value.slice(0, 1500);
    save();
  };
}
function activityMedia(q) {
  let html = '';
  if (q.tones) html += `<div class="sound-activity"><button class="secondary" id="listen-tones">🎵 Écouter les sons</button><details><summary>Version visuelle accessible</summary><p>${esc(q.audioDescription)}</p></details></div>`;
  if (q.speech) html += `<div class="sound-activity"><button class="secondary" id="listen-speech">🔊 Écouter en anglais</button><p class="instructions">Lecture facultative avec une voix anglaise installée sur l’ordinateur. Si aucune voix locale n’est disponible, utilise le texte.</p><details><summary>Lire le texte anglais</summary><p lang="en">${esc(q.transcript)}</p></details></div>`;
  if (q.visual) {
    let shapes = '',
      label = '';
    if (q.visual === 'rectangle') {
      label = 'Rectangle : un côté mesure 8 centimètres, le côté voisin mesure 3 centimètres.';
      shapes = '<rect x="70" y="55" width="240" height="90" rx="2" fill="#deecd1" stroke="#39805b" stroke-width="3"/><text x="190" y="40" text-anchor="middle">8 cm</text><text x="325" y="107">3 cm</text>';
    }
    if (q.visual === 'chart') {
      label = 'Nombre de prêts : lundi 6, mardi 9, mercredi 5.';
      shapes = '<path d="M55 20v145h300" stroke="#68806b" fill="none"/><g fill="#74a182"><rect x="90" y="81" width="45" height="84"/><rect x="175" y="39" width="45" height="126"/><rect x="260" y="95" width="45" height="70"/></g><g text-anchor="middle"><text x="112" y="73">6</text><text x="197" y="31">9</text><text x="282" y="87">5</text><text x="112" y="189">Lun.</text><text x="197" y="189">Mar.</text><text x="282" y="189">Mer.</text></g>';
    }
    if (q.visual === 'cube') {
      label = 'Représentation en perspective d’un cube.';
      shapes = '<path d="m125 55 95 0 55-30h-95Zm0 0v100h95V55m0 100 55-30V25" fill="#e3edda" stroke="#4b8567" stroke-width="3"/><path d="m125 155 55-30h95M180 125V25" fill="none" stroke="#89a183" stroke-width="2" stroke-dasharray="6 5"/>';
    }
    if (q.visual === 'fraction') {
      label = 'Disque partagé en huit secteurs égaux dont trois sont colorés.';
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 - Math.PI / 2,
          b = (i + 1) * Math.PI / 4 - Math.PI / 2;
        shapes += `<path d="M200 100 L${200 + 78 * Math.cos(a)} ${100 + 78 * Math.sin(a)} A78 78 0 0 1 ${200 + 78 * Math.cos(b)} ${100 + 78 * Math.sin(b)}Z" fill="${i < 3 ? '#6b9b70' : '#f6f3dd'}" stroke="#426f50" stroke-width="2"/>`;
      }
    }
    html += `<figure class="activity-diagram"><svg viewBox="0 0 400 210" role="img" aria-label="${esc(label)}">${shapes}</svg></figure>`;
  }
  return html;
}
function playSpeech(text) {
  if (!state.sound) {
    toast('Active les sons avec le bouton 🔇, puis relance l’écoute.');
    return;
  }
  const synth = window.speechSynthesis;
  const voice = synth?.getVoices().find(v => v.localService && /^en(?:-|_)/i.test(v.lang));
  if (!voice) {
    toast('Aucune voix anglaise locale disponible. Tu peux lire le texte et t’entraîner avec un adulte.');
    return;
  }
  try {
    synth.cancel();
    const phrase = new SpeechSynthesisUtterance(text);
    phrase.voice = voice;
    phrase.lang = voice.lang;
    phrase.rate = .8;
    phrase.volume = .75;
    synth.speak(phrase);
  } catch {
    toast('L’écoute est indisponible. Utilise le texte anglais.');
  }
}
function parseNumeric(raw) {
  const text = String(raw).trim().replace(/[ \u00a0\u202f]/g, '').replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}
function playTones(tones) {
  if (!state.sound) {
    toast('Active les sons avec le bouton 🔇, puis relance l’écoute.');
    return;
  }
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    tones.forEach((frequency, i) => {
      const start = audioContext.currentTime + i * .8,
        o = audioContext.createOscillator(),
        g = audioContext.createGain();
      o.type = 'sine';
      o.frequency.value = frequency;
      g.gain.setValueAtTime(.0001, start);
      g.gain.exponentialRampToValueAtTime(.08, start + .04);
      g.gain.exponentialRampToValueAtTime(.0001, start + .55);
      o.connect(g);
      g.connect(audioContext.destination);
      o.start(start);
      o.stop(start + .6);
    });
  } catch {
    toast('Utilise la version visuelle si le son est indisponible.');
  }
}
function mountStudio(q) {
  const el = document.getElementById('exercise');
  el.innerHTML += `<section class="drawing-studio"><h3>🎨 Mon petit atelier</h3><p class="instructions">Dessine ici à la souris, ou réalise l’activité sur papier. Ton dessin est propre à ton profil.</p><div class="studio-tools"><label>Couleur <input id="brush-color" type="color" value="#267958"></label><label>Trait <input id="brush-size" type="range" min="2" max="20" value="5"></label><button class="secondary" id="clear-canvas">Effacer le dessin</button><button class="primary" id="save-canvas">Conserver mon dessin</button></div><canvas id="art-canvas" width="900" height="450" aria-label="Zone de dessin à la souris. Alternative : réalise sur papier et décris ta création dans le champ texte."></canvas><p id="canvas-status" role="status"></p></section>`;
  const canvas = document.getElementById('art-canvas');
  if (typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(0, 0, 900, 450);
  const image = state.artworks[q.id];
  if (image) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = image;
  }
  let active = false;
  const point = e => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * 900 / r.width, (e.clientY - r.top) * 450 / r.height];
  };
  canvas.onpointerdown = e => {
    if (answered) return;
    active = true;
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  canvas.onpointermove = e => {
    if (!active || answered) return;
    const [x, y] = point(e);
    ctx.strokeStyle = document.getElementById('brush-color').value;
    ctx.lineWidth = +document.getElementById('brush-size').value;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  canvas.onpointerup = canvas.onpointercancel = () => {
    active = false;
  };
  document.getElementById('clear-canvas').onclick = () => {
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, 900, 450);
    delete state.artworks[q.id];
    save();
    document.getElementById('canvas-status').textContent = 'Dessin effacé.';
  };
  document.getElementById('save-canvas').onclick = () => {
    state.artworks[q.id] = canvas.toDataURL('image/png');
    save();
    document.getElementById('canvas-status').textContent = storageOK ? 'Dessin conservé dans le carnet de ' + currentProfile().name + '.' : 'Dessin conservé pour cet onglet ; le stockage est indisponible.';
  };
}
// Navigation déléguée : aucun contenu distant, aucun suivi ni compte.
document.addEventListener('click', e => {
  const b = e.target.closest('[data-action],[data-mission],[data-replay],[data-profile],[data-certificate],[data-subject],[data-lesson],[data-final],[data-scope-challenge]');
  if (!b) return;
  if (b.dataset.profile !== undefined) return selectProfile(b.dataset.profile);
  if (b.dataset.certificate !== undefined) return diploma(+b.dataset.certificate);
  if (!currentProfile() && !['profiles', 'home'].includes(b.dataset.action)) return profilesPage();
  if (b.dataset.subject !== undefined) return subjectPage(b.dataset.subject);
  if (b.dataset.lesson !== undefined) return lessonPage(+b.dataset.lesson);
  if (b.dataset.final !== undefined) return diploma(b.dataset.final);
  if (b.dataset.scopeChallenge !== undefined) return startChallenge(b.dataset.scopeChallenge);
  if (b.dataset.mission !== undefined) return startMission(+b.dataset.mission);
  if (b.dataset.replay !== undefined) return startMission(+b.dataset.replay);
  switch (b.dataset.action) {
    case 'program':
      programPage();
      break;
    case 'profiles':
      profilesPage();
      break;
    case 'rename':
      profilesPage(true);
      break;
    case 'diplomas':
      diplomasPage();
      break;
    case 'home':
      home();
      break;
    case 'start':
      startMission(nextMissionFor(state.lastSubject || 'francais'));
      break;
    case 'resume':
      resume();
      break;
    case 'challenge':
      startChallenge();
      break;
    case 'review':
      review();
      break;
    case 'definitions':
      startDefinitions();
      break;
    case 'diploma':
      diploma();
      break;
    case 'reset':
      document.getElementById('reset-description').textContent = 'Le parcours de ' + currentProfile().name + ' sera effacé : étoiles, badges et diplômes. Les autres aventuriers gardent leur parcours.';
      document.getElementById('reset-dialog').showModal();
      break;
  }
});
document.getElementById('sound').onclick = () => {
  if (!currentProfile()) return profilesPage();
  state.sound = !state.sound;
  if (!state.sound) window.speechSynthesis?.cancel();
  save();
  if (state.sound) sound(true);
};
document.getElementById('cancel-reset').onclick = () => document.getElementById('reset-dialog').close();
document.getElementById('confirm-reset').onclick = () => {
  if (!currentProfile()) return;
  session = null;
  state = fresh();
  save();
  document.getElementById('reset-dialog').close();
  home();
  toast('Une nouvelle aventure commence !');
};
updateHeader();
home();
