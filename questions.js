/* Banque CM2 : 12 activités par mission. Les réponses libres sont autoévaluées,
   jamais corrigées par recherche de mots-clés. Les flèches signifient « est mangé par ». */
'use strict';

const MISSIONS = [{
  name: 'Le monde vivant',
  icon: '🌱',
  place: 'La clairière des découvertes',
  color: '#2b8057',
  badge: 'Explorateur du vivant',
  intro: 'Ouvre grand les yeux : la nature est pleine de vie !'
}, {
  name: 'Classons les animaux !',
  icon: '🐾',
  place: 'Le sentier des animaux',
  color: '#b96532',
  badge: 'Expert des animaux',
  intro: 'Observe les caractères communs pour former des groupes.'
}, {
  name: 'La vie dans la mare',
  icon: '🐸',
  place: 'La mare aux secrets',
  color: '#267d96',
  badge: 'Gardien de la mare',
  intro: 'Plonge dans un milieu où tous les êtres vivants sont liés.'
}, {
  name: 'Qui mange qui ?',
  icon: '🕸️',
  place: 'La forêt des connexions',
  color: '#8062a7',
  badge: 'Maître des chaînes alimentaires',
  intro: 'Suis les flèches pour découvrir les relations alimentaires.'
}, {
  name: 'Sauvons la biodiversité !',
  icon: '🌍',
  place: 'La vallée de demain',
  color: '#ad7a1e',
  badge: 'Protecteur de la planète',
  intro: 'À toi de jouer pour redonner des couleurs à la nature !'
}];
const QUESTIONS = [];
function add(m, type, prompt, options, correct, explanation, extra = {}) {
  const n = QUESTIONS.filter(q => q.mission === m).length + 1;
  QUESTIONS.push({
    id: `m${m + 1}-${String(n).padStart(2, '0')}`,
    mission: m,
    category: MISSIONS[m].name,
    difficulty: n > 8 ? 2 : 1,
    type,
    prompt,
    options,
    correct,
    explanation,
    hint: 'Prends le temps d’observer et de comparer.',
    ...extra
  });
}
// Mission 1 — diversité du vivant, besoins et cycles de vie.
add(0, 'qcm', 'La biodiversité, c’est…', ['seulement les animaux sauvages', 'la diversité du vivant et de ses milieux', 'le nombre d’arbres dans une forêt', 'seulement les espèces rares'], [1], 'La biodiversité comprend la diversité des espèces, des individus au sein d’une espèce et des milieux de vie.');
add(0, 'tf', 'Une plante est un être vivant.', ['Vrai', 'Faux'], [0], 'Une plante grandit, se nourrit, peut se reproduire et finit par mourir. Elle est vivante même si elle ne se déplace pas.');
add(0, 'sort', 'Vivant ou non-vivant ? Observe chaque carte.', ['🌳 Chêne', '🪨 Caillou', '🐌 Escargot', '💧 Eau', '🍄 Champignon', '☀️ Soleil'], [0, 1, 0, 1, 0, 1], 'Les arbres, les champignons et les escargots sont vivants. L’eau, les cailloux et le Soleil ne sont pas des êtres vivants.', {
  groups: ['Vivant', 'Non-vivant']
});
add(0, 'qcm', 'De quoi une plante verte a-t-elle besoin pour pousser ?', ['d’eau, de lumière, d’air et de matières minérales', 'seulement de bonbons', 'd’obscurité permanente', 'uniquement d’insectes'], [0], 'Une plante verte utilise la lumière, l’eau, le dioxyde de carbone de l’air et les matières minérales pour fabriquer sa matière.');
add(0, 'multi', 'Quels indices peuvent montrer qu’un animal est vivant ?', ['Il grandit.', 'Il est forcément vert.', 'Il se nourrit.', 'Il peut se reproduire.'], [0, 2, 3], 'Un animal se nourrit, grandit et peut se reproduire. La couleur ne permet pas de savoir s’il est vivant.');
add(0, 'tf', 'Tout ce qui bouge est vivant.', ['Vrai', 'Faux'], [1], 'Une voiture roule et un nuage se déplace, mais ils ne sont pas vivants. Le mouvement seul ne suffit pas.');
add(0, 'blanks', 'Complète le cycle de vie.', ['naît', 'grandit', 'reproduire', 'meurt'], [0, 1, 2, 3], 'Un être vivant naît, grandit, peut se reproduire puis meurt. Tous les individus ne se reproduisent pas.', {
  sentence: 'Un être vivant ___, puis il ___. Il peut se ___ et finit par mourir : il ___.'
});
add(0, 'image', 'Lequel de ces éléments est un être vivant ?', ['🦋 Papillon', '🧱 Brique', '🪑 Chaise', '⚽ Ballon'], [0], 'Le papillon est un animal. Il se nourrit, grandit au cours de son développement et peut se reproduire.');
add(0, 'match', 'Associe chaque être vivant à son besoin.', ['🌻 Tournesol', '🐟 Truite', '🐝 Abeille'], [0, 1, 2], 'Le tournesol a besoin de lumière. La truite utilise l’oxygène dissous dans l’eau. L’abeille se nourrit notamment de nectar.', {
  targets: ['Lumière pour fabriquer sa matière', 'Oxygène dissous dans l’eau', 'Nectar des fleurs']
});
add(0, 'qcm', 'Deux coccinelles de la même espèce ont des couleurs un peu différentes. Cela montre…', ['qu’une seule est vivante', 'qu’elles vivent forcément ailleurs', 'une diversité entre individus d’une même espèce', 'qu’elles sont des plantes'], [2], 'Des individus de la même espèce peuvent présenter des différences : cette diversité fait aussi partie de la biodiversité.');
add(0, 'definition', 'Avec tes mots, explique ce qu’est la biodiversité.', [], ['model'], 'La biodiversité est la diversité des êtres vivants, de leurs différences au sein d’une même espèce et de leurs milieux de vie.', {
  hint: 'Pense aux espèces, à leurs différences et aux milieux où elles vivent.'
});
add(0, 'qcm', 'Quel exemple montre une diversité de milieux de vie ?', ['quatre cailloux identiques', 'une forêt, une mare et une prairie', 'trois chaises', 'uniquement une truite'], [1], 'Une forêt, une mare et une prairie sont des milieux différents qui abritent des êtres vivants différents.');
// Mission 2 — caractères observables et groupes emboîtés.
add(1, 'multi', 'Quels animaux possèdent des poils ?', ['🐿️ Écureuil', '🐄 Vache', '🦆 Canard', '🐸 Grenouille'], [0, 1], 'L’écureuil et la vache ont des poils : ce sont des mammifères. Le canard a des plumes.');
add(1, 'image', 'Qui possède des plumes ?', ['🐌 Escargot', '🦆 Canard', '🐟 Truite', '🐞 Coccinelle'], [1], 'Le canard est un oiseau. Les plumes sont un caractère commun aux oiseaux.');
add(1, 'qcm', 'Combien de pattes une coccinelle adulte possède-t-elle ?', ['Quatre', 'Six', 'Huit', 'Dix'], [1], 'La coccinelle est un insecte : au stade adulte, elle possède six pattes.');
add(1, 'tf', 'L’araignée est un insecte.', ['Vrai', 'Faux'], [1], 'Une araignée possède huit pattes. Les insectes adultes en possèdent six : l’araignée n’est donc pas un insecte.');
add(1, 'sort', 'Déplace chaque animal dans le groupe qui correspond à son caractère.', ['🐌 Escargot', '🐞 Coccinelle', '🕷️ Araignée', '🐟 Truite', '🐸 Grenouille', '🐿️ Écureuil', '🐄 Vache', '🦆 Canard'], [0, 1, 2, 3, 4, 5, 5, 6], 'On classe à partir de caractères possédés : coquille, six ou huit pattes, nageoires à rayons, peau nue, poils ou plumes.', {
  groups: ['Coquille', '6 pattes', '8 pattes', 'Nageoires à rayons', 'Peau nue humide', 'Poils', 'Plumes'],
  hint: 'Compte les pattes et observe ce qui couvre le corps.'
});
add(1, 'qcm', 'Quel caractère la vache et le canard partagent-ils ?', ['Des plumes', 'Six pattes', 'Un squelette interne avec une colonne vertébrale', 'Une coquille'], [2], 'La vache et le canard sont des vertébrés : ils ont un squelette interne avec une colonne vertébrale.');
add(1, 'match', 'Associe chaque animal à un caractère.', ['🐌 Escargot', '🐞 Coccinelle', '🕷️ Araignée'], [0, 1, 2], 'L’escargot a une coquille, la coccinelle adulte six pattes et l’araignée huit pattes.', {
  targets: ['Une coquille', 'Six pattes', 'Huit pattes']
});
add(1, 'nested', 'Complète les groupes emboîtés avec les étiquettes.', ['🐄 Vache', '🦆 Canard', '🐿️ Écureuil', '🐟 Truite'], [0, 1, 0, 2], 'Tous ces animaux appartiennent aux vertébrés. À l’intérieur, la vache et l’écureuil sont dans le groupe des mammifères ; le canard dans celui des oiseaux.', {
  groups: ['Mammifères · poils', 'Oiseaux · plumes', 'Poissons à nageoires rayonnées'],
  hint: 'Un animal appartient aussi aux grands groupes qui entourent le sien.'
});
add(1, 'tf', 'Deux animaux qui vivent dans l’eau appartiennent forcément au même groupe de classification.', ['Vrai', 'Faux'], [1], 'Le lieu de vie ne suffit pas : une grenouille et une truite vivent dans l’eau mais ne possèdent pas tous les mêmes caractères.');
add(1, 'blanks', 'Complète la règle du naturaliste.', ['possèdent', 'communs'], [0, 1], 'Classer consiste à regrouper les êtres vivants selon les caractères qu’ils possèdent en commun.', {
  sentence: 'Pour classer les êtres vivants, on observe ce qu’ils ___ et on cherche leurs caractères ___.'
});
add(1, 'definition', 'Explique ce que sont des groupes emboîtés.', [], ['model'], 'Un petit groupe est contenu dans un groupe plus grand. Par exemple, les mammifères possèdent des poils et appartiennent aux vertébrés, qui possèdent une colonne vertébrale.');
add(1, 'qcm', 'Quel caractère observe-t-on pour regrouper l’écureuil et la vache parmi les mammifères ?', ['Ils mangent exactement la même chose.', 'Ils ont la même taille.', 'Ils vivent tous dans un arbre.', 'Ils possèdent des poils.'], [3], 'Les poils sont un caractère des mammifères. Le régime alimentaire, la taille et le lieu de vie ne sont pas communs à tous les mammifères.');
// Mission 3 — milieu, peuplement et interactions.
add(2, 'pond', 'Explore la mare : découvre le rôle des sept habitants.', ['Grenouille', 'Têtard', 'Libellule', 'Larve de libellule', 'Héron', 'Poisson', 'Plantes aquatiques'], [0, 1, 2, 3, 4, 5, 6], 'Dans la mare, les êtres vivants interagissent entre eux et avec l’eau, la lumière et le sol.', {
  hint: 'Touche chaque habitant pour découvrir sa fiche.'
});
add(2, 'qcm', 'Un écosystème comprend…', ['seulement des animaux', 'un milieu, ses êtres vivants et leurs relations', 'seulement de l’eau', 'uniquement des plantes'], [1], 'Un écosystème comprend un milieu de vie, les êtres vivants qui le peuplent et leurs interactions.');
add(2, 'sort', 'Dans la mare, distingue les êtres vivants des éléments non vivants.', ['🐸 Grenouille', '💧 Eau', '🌿 Plante aquatique', '☀️ Lumière', '🐟 Poisson', '🪨 Roche'], [0, 1, 0, 1, 0, 1], 'L’eau, la lumière et les roches font partie du milieu. Grenouilles, plantes et poissons sont des êtres vivants.', {
  groups: ['Êtres vivants', 'Éléments non vivants']
});
add(2, 'tf', 'La larve de libellule vit dans l’eau.', ['Vrai', 'Faux'], [0], 'Avant de devenir un adulte volant, la libellule passe un stade de larve aquatique.');
add(2, 'order', 'Remets les grandes étapes de la vie d’une grenouille dans l’ordre.', ['🥚 Œufs', '🐟 Têtard', '🐸 Jeune grenouille avec quatre pattes', '🐸 Grenouille adulte'], [0, 1, 2, 3], 'Des œufs sortent des têtards. Ils se transforment, développent des pattes, perdent leur queue et deviennent des grenouilles.');
add(2, 'match', 'Retrouve le rôle de chaque habitant.', ['🌿 Plante aquatique', '🪶 Héron', '🐸 Grenouille adulte'], [0, 1, 2], 'Les plantes offrent des abris. Le héron peut manger des poissons. La grenouille adulte mange notamment des insectes.', {
  targets: ['Offre un abri aux petits animaux', 'Peut capturer un poisson', 'Peut manger un insecte']
});
add(2, 'qcm', 'Si une mare s’assèche complètement, que peut-il arriver aux poissons qui y restent ?', ['Ils se changent en oiseaux.', 'Ils n’ont plus besoin d’eau.', 'Ils risquent de mourir.', 'Ils fabriquent une nouvelle mare.'], [2], 'Les poissons ont besoin d’eau pour vivre et respirer grâce à leurs branchies. L’assèchement menace leur survie.');
add(2, 'image', 'Qui est un végétal de la mare ?', ['🐸 Grenouille', '🌿 Potamot (plante aquatique)', '🪶 Héron', '🐟 Poisson'], [1], 'Le potamot est une plante aquatique. Il utilise la lumière pour fabriquer sa matière.');
add(2, 'blanks', 'Complète la définition.', ['milieu', 'vivants', 'relations'], [0, 1, 2], 'Une mare est un écosystème : son milieu, ses êtres vivants et leurs relations forment un ensemble.', {
  sentence: 'Un écosystème associe un ___ de vie, des êtres ___ et leurs ___.'
});
add(2, 'tf', 'Les plantes aquatiques peuvent servir de refuge à de petits animaux.', ['Vrai', 'Faux'], [0], 'Les feuilles et les tiges offrent des cachettes aux petits animaux, qui peuvent ainsi échapper à certains prédateurs.');
add(2, 'definition', 'Avec tes mots, définis un écosystème.', [], ['model'], 'Un écosystème est l’ensemble formé par un milieu de vie, les êtres vivants qui l’habitent et les relations entre eux et avec ce milieu.');
add(2, 'qcm', 'Pourquoi éviter de prélever tous les têtards d’une mare ?', ['Ils ne servent à rien.', 'Ils peuvent tous vivre sans eau.', 'Cela rend l’eau potable.', 'Ils font partie de l’écosystème et deviendront des grenouilles.'], [3], 'Les têtards participent aux relations alimentaires et au renouvellement des grenouilles. Les laisser dans leur milieu protège la mare.');
// Mission 4 — flèche de la nourriture au consommateur.
add(3, 'qcm', 'Dans une chaîne alimentaire, que signifie A → B ?', ['A est mangé par B.', 'A mange B.', 'A vit toujours dans B.', 'A est plus grand que B.'], [0], 'La flèche va de l’être vivant mangé vers celui qui le mange. Elle signifie « est mangé par ».');
add(3, 'order', 'Construis cette chaîne, du végétal au prédateur.', ['🌿 Herbe', '🦗 Criquet', '🐸 Grenouille', '🐍 Couleuvre'], [0, 1, 2, 3], 'L’herbe est mangée par le criquet, le criquet par la grenouille, qui peut être mangée par une couleuvre.');
add(3, 'sort', 'Producteur ou consommateur ?', ['🌿 Herbe', '🐇 Lapin', '🌳 Chêne', '🦊 Renard', '🌼 Pâquerette', '🐸 Grenouille'], [0, 1, 0, 1, 0, 1], 'Les végétaux verts fabriquent leur matière grâce à la lumière : ce sont des producteurs primaires. Les animaux consomment d’autres êtres vivants.', {
  groups: ['Producteurs primaires', 'Consommateurs']
});
add(3, 'tf', 'Une grenouille adulte fabrique sa nourriture avec la lumière.', ['Vrai', 'Faux'], [1], 'La grenouille est un consommateur : elle mange d’autres animaux. Ce sont les végétaux verts qui utilisent la lumière pour fabriquer leur matière.');
add(3, 'links', 'Relie ce réseau : sélectionne le mangé puis celui qui le mange.', ['🌿 Herbe', '🦗 Criquet', '🐇 Lapin', '🐸 Grenouille', '🦊 Renard'], ['0-1', '0-2', '1-3', '2-4'], 'Dans ce réseau simplifié, l’herbe nourrit criquet et lapin ; le criquet nourrit la grenouille ; le lapin nourrit le renard.', {
  edges: [[0, 1], [0, 2], [1, 3], [2, 4]],
  hint: 'Construis les quatre liens décrits : herbe/criquet, herbe/lapin, criquet/grenouille et lapin/renard.'
});
add(3, 'qcm', 'Dans herbe → lapin → renard, qui est le prédateur du lapin ?', ['L’herbe', 'Le lapin', 'Le renard', 'Le Soleil'], [2], 'Le renard capture et mange le lapin : c’est son prédateur. Le lapin est sa proie.');
add(3, 'match', 'Associe chaque mot à son sens.', ['Producteur primaire', 'Proie', 'Prédateur'], [0, 1, 2], 'Un végétal vert est un producteur primaire. Une proie est mangée par un prédateur qui la capture.', {
  targets: ['Fabrique sa matière grâce à la lumière', 'Animal capturé et mangé', 'Animal qui capture et mange une proie']
});
add(3, 'blanks', 'Dans herbe → lapin → renard, complète la lecture.', ['lapin', 'renard'], [0, 1], 'Les flèches suivent le trajet de la matière : de la nourriture vers celui qui la consomme.', {
  sentence: 'L’herbe est mangée par le ___. Puis ce dernier peut être mangé par le ___.'
});
add(3, 'order', 'Remets cette chaîne de la mare dans l’ordre.', ['🌿 Algue', '🦐 Petite crevette d’eau douce', '🐟 Perche', '🪶 Héron'], [0, 1, 2, 3], 'Une petite crevette d’eau douce peut manger des algues, la perche manger cette crevette et le héron manger la perche.');
add(3, 'definition', 'Explique la différence entre une chaîne et un réseau alimentaires.', [], ['model'], 'Une chaîne alimentaire est une suite d’êtres vivants où chacun est mangé par le suivant. Un réseau relie plusieurs chaînes alimentaires qui partagent des êtres vivants.');
add(3, 'qcm', 'Si les plantes d’un milieu disparaissent, que peut-il se passer ?', ['Aucun animal ne sera touché.', 'Les herbivores, puis leurs prédateurs, peuvent manquer de nourriture.', 'Les renards deviennent des plantes.', 'Les lapins mangent des pierres.'], [1], 'Les producteurs sont à la base de nombreuses chaînes alimentaires. Leur disparition peut toucher plusieurs consommateurs.');
add(3, 'links', 'Complète ce petit réseau de la mare en ajoutant les trois flèches.', ['🌿 Algue', '🦐 Crevette d’eau douce', '🐟 Perche', '🪶 Héron'], ['0-1', '1-2', '2-3'], 'L’algue est mangée par la crevette, la crevette par la perche, la perche par le héron.', {
  edges: [[0, 1], [1, 2], [2, 3]],
  hint: 'Le trajet commence avec l’algue et finit avec le héron.'
});
// Mission 5 — conséquences et solutions concrètes.
add(4, 'qcm', 'Quand on détruit une forêt, quel est un risque pour ses habitants ?', ['Ils gagnent tous un abri.', 'Ils perdent abris et nourriture.', 'Ils deviennent tous aquatiques.', 'Il n’y a aucune conséquence.'], [1], 'La déforestation détruit ou fragmente des habitats. Des espèces perdent leur abri, leur nourriture ou leurs lieux de reproduction.');
add(4, 'tf', 'Une rivière polluée peut mettre en danger les êtres vivants qui y habitent.', ['Vrai', 'Faux'], [0], 'Des polluants peuvent intoxiquer les êtres vivants ou perturber les conditions nécessaires à leur vie.');
add(4, 'sort', 'Classe ces actions pour la biodiversité.', ['🌳 Planter une haie locale', '🗑️ Jeter du plastique dans la mare', '🌼 Garder un coin fleuri', '🪓 Détruire une haie', '🧤 Ramasser des déchets avec un adulte', '🧪 Verser de la peinture dans la rivière'], [0, 1, 0, 1, 0, 1], 'Les haies et les fleurs fournissent des habitats et de la nourriture. Les déchets et les produits polluants dégradent les milieux.', {
  groups: ['Protège le milieu', 'Dégrade le milieu']
});
add(4, 'restore', 'Redonne vie à la vallée : choisis quatre actions utiles.', ['🧤 Ramasser les déchets avec un adulte', '🌱 Planter des végétaux locaux', '💧 Arrêter les rejets polluants', '🌼 Laisser un coin de prairie fleurie', '🧪 Ajouter des pesticides', '🧱 Bétonner la mare'], [0, 1, 2, 3], 'Retirer les déchets, éviter les rejets et restaurer des habitats variés aide les espèces à revenir. Le retour des êtres vivants prend du temps.');
add(4, 'multi', 'Comment aider les insectes pollinisateurs ?', ['Planter des fleurs locales variées.', 'Pulvériser systématiquement des insecticides.', 'Garder des zones fleuries.', 'Écraser les insectes.'], [0, 2], 'Les fleurs fournissent pollen et nectar. Éviter les insecticides et conserver des habitats aide les pollinisateurs.');
add(4, 'match', 'Associe chaque problème à une solution.', ['Déchets au bord de la mare', 'Disparition des haies', 'Pollution par des rejets'], [0, 1, 2], 'Chaque action répond à une cause : nettoyer prudemment, replanter des haies locales et stopper les rejets polluants.', {
  targets: ['Organiser un ramassage avec des adultes', 'Replanter des arbustes locaux', 'Empêcher les produits polluants d’atteindre l’eau']
});
add(4, 'qcm', 'Tu trouves un animal sauvage dans son milieu. Quel geste privilégier ?', ['L’emporter chez toi.', 'Le nourrir de bonbons.', 'L’observer à distance sans le déranger.', 'Détruire son abri pour mieux le voir.'], [2], 'Observer sans déranger permet de découvrir la nature tout en respectant les besoins des animaux.');
add(4, 'blanks', 'Complète cette idée pour protéger la nature.', ['habitats', 'pollution'], [0, 1], 'Protéger les milieux de vie et réduire les pollutions sont deux moyens importants de préserver la biodiversité.', {
  sentence: 'Pour aider la biodiversité, protégeons les ___ et réduisons la ___.'
});
add(4, 'tf', 'Introduire n’importe quelle espèce venue d’ailleurs est toujours bon pour un milieu.', ['Vrai', 'Faux'], [1], 'Certaines espèces introduites deviennent envahissantes et perturbent le milieu. On privilégie des végétaux locaux adaptés.');
add(4, 'image', 'Quel jardin offre le plus de ressources aux petits animaux ?', ['🧱 Une cour entièrement bétonnée', '🌼 Un jardin avec haie, fleurs locales et tas de feuilles', '🟫 Un sol nu sans végétation', '🗑️ Un jardin couvert de déchets'], [1], 'Une haie, des fleurs et des feuilles mortes offrent de la nourriture, des abris et des lieux de reproduction.');
add(4, 'definition', 'Propose deux actions pour protéger une mare et explique leur utilité.', [], ['model'], 'On peut ramasser les déchets avec un adulte pour limiter la pollution et conserver les plantes des berges pour offrir des abris aux animaux. On peut aussi empêcher les rejets polluants et observer sans prélever.');
add(4, 'qcm', 'Pourquoi relier des espaces naturels par des haies ?', ['Pour empêcher tous les animaux de bouger.', 'Pour remplacer l’eau.', 'Pour supprimer toutes les fleurs.', 'Pour permettre à certains animaux de se déplacer entre leurs habitats.'], [3], 'Les haies peuvent former des passages entre les habitats. Les animaux peuvent y trouver abri et nourriture pendant leurs déplacements.');
