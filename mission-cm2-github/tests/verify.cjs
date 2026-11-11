/* Contrôles sans dépendance : node tests/verify.cjs
   Simule le DOM pour tester les parcours et la persistance, sans remplacer un essai visuel. */
const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const path = require('node:path'),
  root = path.resolve(__dirname, '..');
const bank = fs.readFileSync(path.join(root, 'questions.js'), 'utf8');
const curriculum = fs.readFileSync(path.join(root, 'curriculum.js'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log('✓ ' + name);
}
const store = new Map();
function environment(storage = store) {
  const elements = new Map();
  function element(key) {
    if (!elements.has(key)) elements.set(key, {
      innerHTML: '',
      textContent: '',
      hidden: false,
      disabled: false,
      dataset: {},
      style: {},
      classList: {
        add() {},
        remove() {}
      },
      setAttribute() {},
      getAttribute() {
        return '';
      },
      append() {},
      replaceChildren() {},
      focus() {},
      addEventListener() {},
      querySelectorAll() {
        return [];
      },
      querySelector(s) {
        return element(key + ' ' + s);
      },
      getBoundingClientRect() {
        return {
          x: 0,
          y: 0,
          width: 100,
          height: 50
        };
      },
      showModal() {},
      close() {}
    });
    return elements.get(key);
  }
  const document = {
    getElementById: id => element('#' + id),
    querySelector: s => element(s),
    querySelectorAll: () => [],
    addEventListener() {},
    createElementNS: () => element('svg')
  };
  const c = vm.createContext({
    console,
    document,
    localStorage: {
      getItem: k => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, v)
    },
    window: {
      scrollTo() {},
      addEventListener() {},
      print() {}
    },
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    requestAnimationFrame: f => f()
  });
  vm.runInContext(bank + '\n' + curriculum + '\n' + script, c);
  return {
    run: s => vm.runInContext(s, c),
    elements
  };
}
let env = environment();
let run = s => env.run(s);
const qs = JSON.parse(run('JSON.stringify(QUESTIONS)'));
test('Un prénom est demandé avant de commencer', () => {
  assert.equal(run('currentView'), 'profiles');
  run("startMission(0)");
  assert.equal(run('session'), null);
  assert.equal(run("createProfile('   ')"), false);
  assert.equal(run('profilesStore.profiles.length'), 0);
  run("createProfile('Camille')");
  assert.equal(run('currentProfile().name'), 'Camille');
  assert.equal(run('currentView'), 'home');
});
test('Banque complète et conservation des 60 questions biodiversité', () => {
  assert.ok(qs.length >= 580);
  assert.equal(new Set(qs.map(q => q.id)).size, qs.length);
  for (let i = 0; i < 5; i++) assert.equal(qs.filter(q => q.mission === i).length, 12);
});
test('Métadonnées et réponses valides pour toutes les activités', () => {
  for (const q of qs) {
    assert.ok(q.id && q.category && q.difficulty && q.type && q.prompt && q.explanation);
    assert.ok(q.correct.length);
    if (q.type === 'number') {
      assert.equal(q.correct.length, 1);
      assert.ok(Number.isFinite(q.correct[0]));
      continue;
    }
    if (q.type === 'definition') {
      assert.deepEqual(q.correct, ['model']);
      continue;
    }
    if (q.type === 'links') {
      assert.deepEqual(q.edges.map(([a, b]) => `${a}-${b}`).sort(), q.correct.slice().sort());
      for (const [a, b] of q.edges) {
        assert.notEqual(a, b);
        assert.ok(q.options[a] && q.options[b]);
      }
      continue;
    }
    if (['sort', 'nested', 'match', 'order'].includes(q.type)) assert.equal(q.correct.length, q.options.length);
    if (['sort', 'nested', 'match'].includes(q.type)) {
      const groups = q.groups || q.targets;
      for (const n of q.correct) assert.ok(Number.isInteger(n) && n >= 0 && n < groups.length);
    } else for (const n of q.correct) assert.ok(Number.isInteger(n) && n >= 0 && n < q.options.length);
    if (q.type === 'blanks') assert.equal(q.sentence.split('___').length - 1, q.correct.length);
    if (['qcm', 'image'].includes(q.type)) assert.equal(q.options.length, 4);
    if (q.type === 'tf') assert.equal(q.options.length, 2);
  }
});
test('Tous les formats demandés sont présents', () => {
  for (const type of ['qcm', 'tf', 'sort', 'nested', 'order', 'match', 'image', 'blanks', 'definition', 'pond', 'links', 'restore']) assert.ok(qs.some(q => q.type === type), type);
});
test('Toutes les activités se rendent et acceptent leurs bonnes réponses', () => {
  for (const q of qs) {
    run(`start(['${q.id}'],'review')`);
    if (q.type === 'definition') {
      run('validate()');
      assert.ok(env.elements.get('#feedback').innerHTML.includes(q.practice ? 'critères' : 'réponse modèle'));
      run('resolve(true,true)');
    } else {
      if (q.type === 'number') run(`document.getElementById('number-answer').value='${q.correct[0]}'`);
      run(q.type === 'links' ? `links=${JSON.stringify(q.correct)}` : q.type === 'pond' ? 'discovered=[0,1,2,3,4,5,6]' : `answer=${JSON.stringify(q.correct)}`);
      run('validate()');
    }
    assert.equal(run('answered'), true, q.id);
    assert.equal(run(`state.mastered.includes('${q.id}')`), true, q.id);
    run('next()');
    assert.equal(run('currentView'), 'result');
  }
  assert.equal(run('state.mastered.length'), qs.length);
  assert.equal(run('state.stars'), qs.length * 3);
  assert.equal(run('state.badges.length'), run('MISSIONS.length'));
});
test('Une erreur est mémorisée et ne bloque pas la suite', () => {
  run("start(['m1-01','m1-02'],'review');answer=[0];validate()");
  assert.equal(run("state.errors.includes('m1-01')"), true);
  assert.equal(run("state.mastered.includes('m1-01')"), false);
  run('next()');
  assert.equal(run('session.index'), 1);
});
test('Sauvegarde et reprise de la question en cours', () => {
  env = environment();
  run = s => env.run(s);
  assert.equal(run('state.session.index'), 1);
  assert.equal(run("state.errors.includes('m1-01')"), true);
  run('resume()');
  assert.equal(run('qNow().id'), 'm1-02');
});
test('Révision ciblée, résolution des erreurs et protection contre les étoiles répétées', () => {
  run("start([...state.errors],'review');answer=[1];validate()");
  assert.equal(run('state.errors.length'), 0);
  assert.equal(run('state.mastered.length'), qs.length);
  assert.equal(run('state.stars'), qs.length * 3);
});
test('Réponse libre : autoévaluation et option « Je veux revoir »', () => {
  run("start(['m1-11'],'definitions');validate()");
  assert.equal(run('answered'), false);
  assert.ok(env.elements.get('#feedback').innerHTML.includes('Je veux revoir'));
  run('resolve(false,true)');
  assert.equal(run("state.errors.includes('m1-11')"), true);
  run('next()');
  assert.equal(run('currentView'), 'result');
});
test('Les cartes non placées invitent à poursuivre, sans fausse correction', () => {
  run("start(['m2-05'],'review');validate()");
  assert.equal(run('answered'), false);
  run('selected=0;place(0)');
  assert.equal(run('answer[0]'), 0);
  assert.equal(run('selected'), null);
});
test('Le défi global tire 15 activités uniques et couvre les 11 univers', () => {
  for (let n = 0; n < 30; n++) {
    run('startChallenge(null)');
    assert.equal(run('session.ids.length'), 15);
    assert.equal(run('new Set(session.ids).size'), 15);
    assert.equal(run('new Set(session.ids.map(id=>QUESTION_BY_ID.get(id).subject)).size'), 11);
  }
});
test('Le défi se termine et crée un diplôme imprimable', () => {
  run('startChallenge(null)');
  for (let i = 0; i < 15; i++) {
    run('resolve(true);next()');
  }
  assert.equal(run('currentView'), 'result');
  assert.ok(run('state.grandFinal.date'));
  run('diploma()');
  assert.equal(run('currentView'), 'diploma');
  assert.ok(env.elements.get('#app').innerHTML.includes('Explorateur du CM2'));
  assert.ok(typeof env.elements.get('#print').onclick === 'function');
});
test('Les missions historiques et les écrans de révision restent accessibles', () => {
  for (let m = 0; m < 5; m++) {
    run(`startMission(${m})`);
    assert.equal(run('session.ids.length'), 12);
    assert.equal(run('session.mission'), m);
  }
  run('review()');
  assert.equal(run('currentView'), 'review');
  run('home()');
  assert.equal(run('currentView'), 'home');
});
test('Aucune dépendance ou ressource distante pour ouvrir le jeu hors ligne', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
    css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.ok(!/(?:src|href)=["']https?:/i.test(html));
  assert.ok(!/@import|url\(\s*["']?https?:/.test(css));
  assert.ok(!/\bfetch\(|XMLHttpRequest|WebSocket/.test(script));
  for (const file of ['style.css', 'questions.js', 'curriculum.js', 'script.js']) assert.ok(fs.existsSync(path.join(root, file)));
  assert.ok(css.includes('@media print'));
  assert.ok(css.includes('prefers-reduced-motion'));
});
test('Chaque format corrigé rejette une réponse fausse sans bloquer la suite', () => {
  const types = ['qcm', 'tf', 'multi', 'image', 'sort', 'nested', 'match', 'blanks', 'order', 'links', 'restore'];
  for (const type of types) {
    const q = qs.find(q => q.type === type);
    run(`start(['${q.id}'], 'review')`);
    if (type === 'links') {
      run(`links=${JSON.stringify(q.correct.map(l => l.split('-').reverse().join('-')))}`);
    } else {
      const bad = [...q.correct];
      if (['sort', 'nested', 'match'].includes(type)) {
        bad[0] = (bad[0] + 1) % (q.groups || q.targets).length;
      } else if (['blanks', 'order'].includes(type)) {
        [bad[0], bad[1]] = [bad[1], bad[0]];
      } else if (['multi', 'restore'].includes(type)) {
        bad.push(q.options.findIndex((_, i) => !q.correct.includes(i)));
      } else {
        bad[0] = (bad[0] + 1) % q.options.length;
      }
      run(`answer=${JSON.stringify(bad)}`);
    }
    run('validate()');
    assert.equal(run('answered'), true, type);
    assert.equal(run(`state.errors.includes('${q.id}')`), true, type);
    assert.ok(env.elements.get('#feedback').innerHTML.includes('Réessayer'), type);
    run('next()');
    assert.equal(run('currentView'), 'result', type);
  }
});
test('Une sauvegarde corrompue permet de recommencer', () => {
  const corrupted = environment(new Map([['mission-biodiversite-profils-v2', '{']]));
  assert.equal(corrupted.run('state.stars'), 0);
  assert.equal(corrupted.run('currentView'), 'profiles');
});
test('Deux profils conservent des parcours et reprises indépendants', () => {
  const storage = new Map(),
    e = environment(storage),
    r = s => e.run(s);
  r("createProfile('Léa');startMission(0);answer=[1];validate();next()");
  const lea = r('currentProfile().id');
  assert.equal(r('state.stars'), 3);
  r("profilesPage();createProfile('Hugo')");
  const hugo = r('currentProfile().id');
  assert.notEqual(lea, hugo);
  assert.equal(r('state.stars'), 0);
  assert.equal(r('state.session'), null);
  r('startMission(1);answer=[0,1];validate();next()');
  r(`selectProfile('${lea}');resume()`);
  assert.equal(r('state.stars'), 3);
  assert.equal(r('qNow().id'), 'm1-02');
  r(`selectProfile('${hugo}');resume()`);
  assert.equal(r('qNow().id'), 'm2-02');
  const reloaded = environment(storage);
  assert.equal(reloaded.run('currentProfile().name'), 'Hugo');
  assert.equal(reloaded.run('state.stars'), 3);
  assert.ok(reloaded.elements.get('#app').innerHTML.includes('data-action="resume"'));
  assert.ok(reloaded.elements.get('#app').innerHTML.includes('Continuer mon aventure'));
  reloaded.run('resume()');
  assert.equal(reloaded.run('qNow().id'), 'm2-02');
});
test('Un prénom déjà connu retrouve son carnet, sans écraser la progression', () => {
  const e = environment(new Map()),
    r = s => e.run(s);
  r("createProfile('  Léa  ');startMission(0);answer=[1];validate()");
  const id = r('currentProfile().id');
  r("createProfile('Hugo');createProfile(' LÉA ')");
  assert.equal(r('profilesStore.profiles.length'), 2);
  assert.equal(r('currentProfile().id'), id);
  assert.equal(r('state.stars'), 3);
});
test('Le prénom peut être modifié sans perdre le carnet', () => {
  const e = environment(new Map()),
    r = s => e.run(s);
  r("createProfile('Léa');startMission(0);answer=[1];validate()");
  const id = r('currentProfile().id');
  r("renameProfile('Léa B.')");
  assert.equal(r('currentProfile().name'), 'Léa B.');
  assert.equal(r('currentProfile().id'), id);
  assert.equal(r('state.stars'), 3);
  r("createProfile('Hugo')");
  assert.equal(r("renameProfile('Léa B.')"), false);
  assert.equal(r('currentProfile().name'), 'Hugo');
});
test('La remise à zéro ne touche que le profil actif', () => {
  const e = environment(new Map()),
    r = s => e.run(s);
  r("createProfile('Léa');startMission(0);answer=[1];validate()");
  const lea = r('currentProfile().id');
  r("createProfile('Hugo');startMission(0);answer=[1];validate()");
  e.elements.get('#confirm-reset').onclick();
  assert.equal(r('currentProfile().name'), 'Hugo');
  assert.equal(r('state.stars'), 0);
  r(`selectProfile('${lea}')`);
  assert.equal(r('state.stars'), 3);
});
test('L’ancien parcours est récupéré une seule fois dans le premier profil', () => {
  const old = {
    version: 1,
    stars: 9,
    mastered: ['m1-01'],
    errors: ['m1-02'],
    completed: [0],
    badges: [0],
    final: {
      date: '11/11/2026'
    },
    session: {
      ids: ['m2-01', 'm2-02'],
      index: 1,
      mode: 'mission',
      mission: 1,
      earned: 3,
      correctIds: ['m2-01']
    }
  };
  const backup = JSON.stringify(old),
    storage = new Map([['mission-biodiversite-v1', backup]]);
  const e = environment(storage),
    r = s => e.run(s);
  assert.equal(r('currentView'), 'profiles');
  assert.ok(r('profilesStore.legacy'));
  r("createProfile('Camille')");
  assert.equal(r('state.stars'), 9);
  assert.equal(r('state.errors[0]'), 'm1-02');
  assert.equal(r('state.session.index'), 1);
  r('diploma(0)');
  assert.ok(e.elements.get('#app').innerHTML.includes('Camille'));
  assert.equal(storage.get('mission-biodiversite-v1'), backup);
  r("createProfile('Hugo')");
  assert.equal(r('state.stars'), 0);
  assert.equal(r('state.final'), null);
  const reload = environment(storage);
  assert.equal(reload.run('profilesStore.legacy'), null);
  assert.equal(reload.run('profilesStore.profiles.length'), 2);
});
test('Les petits diplômes de mission portent le prénom du bon aventurier', () => {
  const storage = new Map(),
    e = environment(storage),
    r = s => e.run(s);
  r("createProfile('Éloïse');startMission(0)");
  for (let i = 0; i < 12; i++) r('resolve(true);next()');
  assert.equal(r('state.completed[0]'), 0);
  assert.ok(r('state.diplomas[0]'));
  r('diploma(0)');
  assert.equal(r('currentView'), 'diploma');
  assert.ok(e.elements.get('#app').innerHTML.includes('Mon petit diplôme de mission'));
  assert.ok(e.elements.get('#app').innerHTML.includes('class="diploma-name">Éloïse'));
  assert.ok(typeof e.elements.get('#print').onclick === 'function');
  const eloise = r('currentProfile().id');
  r("createProfile('Hugo');diploma(0)");
  assert.equal(r('currentView'), 'home');
  const reloaded = environment(storage);
  reloaded.run(`selectProfile('${eloise}');diploma(0)`);
  assert.equal(reloaded.run('currentView'), 'diploma');
  assert.ok(reloaded.elements.get('#app').innerHTML.includes('Éloïse'));
});
test('Les prénoms affichés sont échappés et limités à 32 caractères', () => {
  const e = environment(new Map()),
    r = s => e.run(s);
  r(`createProfile('<img src=x onerror=alert(1)>')`);
  assert.ok(!e.elements.get('#app').innerHTML.includes('<img src=x'));
  assert.ok(e.elements.get('#app').innerHTML.includes('&lt;img'));
  assert.equal(r("cleanName('  Ana  Maria  ')"), 'Ana Maria');
  assert.equal(r("cleanName('a'.repeat(100)).length"), 32);
});
test('Les 11 univers et les 82 missions ont une fiche et au moins 6 activités', () => {
  const subjects = JSON.parse(run('JSON.stringify(SUBJECTS)'));
  const missions = JSON.parse(run('JSON.stringify(MISSIONS)'));
  assert.equal(subjects.length, 11);
  assert.equal(missions.length, 82);
  for (const subject of subjects) {
    assert.ok(missions.some(m => m.subject === subject.id));
    run(`subjectPage('${subject.id}')`);
    assert.equal(run('currentView'), 'subject');
    assert.ok(env.elements.get('#app').innerHTML.includes(subject.name));
  }
  for (let i = 0; i < missions.length; i++) {
    assert.ok(missions[i].lesson.length >= 3);
    assert.ok(qs.filter(q => q.mission === i).length >= 6);
    run(`lessonPage(${i})`);
    assert.equal(run('currentView'), 'lesson');
  }
  run('programPage()');
  assert.equal(run('currentView'), 'program');
  assert.ok(env.elements.get('#app').innerHTML.includes('82 missions'));
});
test('Les défis par matière restent dans la matière et produisent un diplôme nominatif', () => {
  const subjects = JSON.parse(run('JSON.stringify(SUBJECTS)'));
  for (const subject of subjects) {
    run(`startChallenge('${subject.id}')`);
    assert.equal(run('session.ids.length'), 15);
    assert.equal(run('new Set(session.ids).size'), 15);
    assert.equal(run(`session.ids.every(id=>QUESTION_BY_ID.get(id).subject==='${subject.id}')`), true);
    for (let i = 0; i < 15; i++) run('resolve(true);next()');
    assert.ok(run(`state.subjectFinals['${subject.id}'].date`));
    run(`diploma('${subject.id}')`);
    assert.equal(run('currentView'), 'diploma');
    assert.ok(env.elements.get('#app').innerHTML.includes('Camille'));
  }
  run('diplomasPage()');
  assert.equal(run('currentView'), 'diplomas');
});
test('Saisie numérique : décimaux français, erreurs et poursuite du parcours', () => {
  for (const [text, value] of [['3,72', 3.72], ['3.72', 3.72], ['2 040 006', 2040006], ['  0,75  ', .75], ['-2', -2]]) assert.equal(run(`parseNumeric(${JSON.stringify(text)})`), value);
  for (const text of ['', 'bonjour', '1/2', '3,4,5', 'Infinity']) assert.equal(run(`parseNumeric(${JSON.stringify(text)})`), null);
  const q = qs.find(q => q.type === 'number');
  run(`start(['${q.id}'],'review')`);
  run("document.getElementById('number-answer').value='';validate()");
  assert.equal(run('answered'), false);
  run("document.getElementById('number-answer').value='999';validate()");
  assert.equal(run('answered'), true);
  assert.equal(run(`state.errors.includes('${q.id}')`), true);
  run('next()');
  assert.equal(run('currentView'), 'result');
});
test('Les calculs explicites ont des résultats arithmétiques cohérents', () => {
  let checked = 0;
  for (const q of qs) {
    if (q.type !== 'number' || !/^Calcule(?: mentalement)? : /.test(q.prompt)) continue;
    let expr = q.prompt.replace(/^Calcule(?: mentalement)? : /, '').replace(/\.$/, '').replace(/[ \u00a0\u202f]/g, '').replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    assert.match(expr, /^[0-9.+*/()\-]+$/);
    assert.ok(Math.abs(vm.runInNewContext(expr) - q.correct[0]) < 1e-9, q.prompt);
    checked++;
  }
  assert.equal(checked, 14);
});
test('Mélanger les choix conserve les réponses et affiche les lettres dans l’ordre', () => {
  run("start(['m1-01'],'review');choiceOrder=[2,0,3,1];drawExercise()");
  const html = env.elements.get('#exercise').innerHTML;
  assert.ok(html.indexOf('data-choice="2"') < html.indexOf('data-choice="0"'));
  assert.match(html, /data-choice="2"[^>]*><span class="choice-key">A/);
  run('answer=[1];validate()');
  assert.equal(run('answered'), true);
  assert.equal(run("state.mastered.includes('m1-01')"), true);
});
test('Une mission ajoutée après la biodiversité survit au rechargement', () => {
  const storage = new Map(),
    e = environment(storage),
    r = s => e.run(s);
  r("createProfile('Noé');startMission(81)");
  const count = r('session.ids.length');
  for (let i = 0; i < count; i++) r('resolve(true);next()');
  assert.equal(r('state.completed.includes(81)'), true);
  const reload = environment(storage);
  assert.equal(reload.run('state.completed.includes(81)'), true);
  assert.ok(reload.run('state.diplomas[81]'));
  reload.run('diploma(81)');
  assert.ok(reload.elements.get('#app').innerHTML.includes('Noé'));
});
test('Les créations artistiques sont conservées par profil', () => {
  const storage = new Map(),
    e = environment(storage),
    r = s => e.run(s);
  const id = qs.find(q => q.studio).id;
  r(`createProfile('Lina');state.artworks['${id}']='data:image/png;base64,aGVsbG8=';save()`);
  const lina = r('currentProfile().id');
  r("createProfile('Tom')");
  assert.equal(r(`state.artworks['${id}']`), undefined);
  const reload = environment(storage);
  reload.run(`selectProfile('${lina}')`);
  assert.equal(reload.run(`state.artworks['${id}']`), 'data:image/png;base64,aGVsbG8=');
});
test('Un ancien défi biodiversité en cours conserve son diplôme historique', () => {
  const ids = qs.filter(q => q.mission < 5).slice(0, 15).map(q => q.id);
  const old = {
    version: 2,
    activeId: 'ancien',
    legacy: null,
    profiles: [{
      id: 'ancien',
      name: 'Camille',
      progress: {
        version: 1,
        session: {
          ids,
          index: 0,
          mode: 'challenge',
          mission: null,
          earned: 0,
          correctIds: []
        }
      }
    }]
  };
  const storage = new Map([['mission-biodiversite-profils-v2', JSON.stringify(old)]]),
    e = environment(storage),
    r = s => e.run(s);
  assert.equal(r('state.session.scope'), 'biodiversity');
  r('resume()');
  for (let i = 0; i < 15; i++) r('resolve(true);next()');
  assert.ok(r('state.final.date'));
  assert.equal(r('state.grandFinal'), null);
  r("diploma('biodiversity')");
  assert.ok(e.elements.get('#app').innerHTML.includes('Explorateur de la biodiversité'));
});
test('Les brouillons écrits sont retrouvés dans le bon profil', () => {
  const storage = new Map(),
    e = environment(storage),
    r = s => e.run(s);
  r("createProfile('Mila');start(['m1-11'],'definitions');document.getElementById('free-answer').value='Le vivant est très varié.';document.getElementById('free-answer').oninput()");
  const mila = r('currentProfile().id');
  r("createProfile('Paul')");
  assert.equal(r("state.drafts['m1-11']"), undefined);
  const reload = environment(storage);
  reload.run(`selectProfile('${mila}');resume()`);
  assert.equal(reload.run("document.getElementById('free-answer').value"), 'Le vivant est très varié.');
});
console.log(`\n${checks} contrôles réussis. Les essais visuels et tactiles nécessitent un vrai navigateur.`);
