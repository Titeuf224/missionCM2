/* Contrôles sans dépendance : node tests/verify.cjs
   Simule le DOM pour tester les parcours et la persistance, sans remplacer un essai visuel. */
const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const path = require('node:path'),
  root = path.resolve(__dirname, '..');
const bank = fs.readFileSync(path.join(root, 'ce1/grade.js'), 'utf8');
const curriculum = fs.readFileSync(path.join(root, 'ce1/curriculum.js'), 'utf8');
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

const env = environment(), run = env.run;
run("createProfile('Camille')");
const qs = JSON.parse(run('JSON.stringify(QUESTIONS)'));
test('CE1 : tous les domaines ont des missions, fiches et activités', () => {
  assert.equal(run('SUBJECTS.length'), 11);
  assert.equal(new Set(qs.map(q => q.id)).size, qs.length);
  assert.equal(run('SUBJECTS.every(s => MISSIONS_BY_SUBJECT.get(s.id).length > 0)'), true);
  assert.equal(run('MISSIONS.every((m,i) => m.lesson.length >= 2 && missionQuestions(i).length >= 4)'), true);
});
test('CE1 : toutes les activités se rendent et acceptent leur réponse', () => {
  for (const q of qs) {
    run(`start(['${q.id}'],'review')`);
    if (q.type === 'definition') { run('validate();resolve(true,true)'); }
    else {
      if (q.type === 'number') run(`document.getElementById('number-answer').value='${q.correct[0]}'`);
      run(`answer=${JSON.stringify(q.correct)};validate()`);
    }
    assert.equal(run('answered'), true, q.id);
    assert.equal(run(`state.mastered.includes('${q.id}')`), true, q.id);
    run('next()');
    assert.equal(run('currentView'), 'result');
  }
});
test('CE1 : accueil, programme et diplôme portent la bonne classe', () => {
  run('home()'); assert.ok(env.elements.get('#app').innerHTML.includes('Le grand défi CE1'));
  run('programPage()'); assert.ok(!env.elements.get('#app').innerHTML.includes('CM2'));
  run('startChallenge(null)');
  assert.equal(run('session.ids.length'), 15);
  assert.equal(run('new Set(session.ids.map(id => QUESTION_BY_ID.get(id).subject)).size'),11);
  run('session.correctIds=[...session.ids];session.index=session.ids.length;finish();diploma("all")');
  assert.ok(env.elements.get('#app').innerHTML.includes('Explorateur du CE1'));
});
test('CE1 : reprise et stockage distinct du CM2', () => {
  run('startMission(0)');
  assert.ok(store.has('mission-ce1-profils-v2'));
  assert.equal(store.has('mission-biodiversite-profils-v2'), false);
  const loaded = environment();
  assert.equal(loaded.run('currentProfile().name'),'Camille');
  assert.equal(loaded.run('state.session.ids[0]'),run('state.session.ids[0]'));
});
console.log(`${checks} contrôles CE1 réussis : ${run('MISSIONS.length')} missions, ${qs.length} activités.`);
