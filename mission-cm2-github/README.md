# 🦊 Mission CM2 — L’aventure des savoirs

Un jeu de révision en français pour un élève de CM2 : **11 univers, 82 missions et 582 activités**, avec Nox le renard, profils par prénom, fiches, étoiles, badges, révisions et diplômes nominatifs.

## Mettre en ligne sur GitHub Pages

Le jeu est prêt à être publié comme site statique, sans compilation. Voir [PUBLICATION_GITHUB.md](PUBLICATION_GITHUB.md) pour le dépôt des fichiers extraits du ZIP et les réglages **main → /(root)** dans GitHub Pages. Les sauvegardes de la version locale et de la version en ligne sont distinctes.

## Ouvrir sur ordinateur

Double-cliquer sur **index.html** dans Chrome, Firefox ou Safari. Aucune installation, aucun serveur, aucun compte et aucune connexion Internet ne sont nécessaires pour jouer.

Conserver ensemble les cinq fichiers :

- `index.html`
- `style.css`
- `questions.js` (les 60 activités biodiversité d’origine)
- `curriculum.js` (matières, autres missions, activités et fiches)
- `script.js`

## Parcourir le CM2

L’accueil présente les 11 univers : français, mathématiques, histoire, géographie, sciences et technologie, anglais, enseignement moral et civique, arts et histoire des arts, éducation musicale, EPS, et « Grandir et vivre ensemble » (ÉVAR).

Chaque matière propose ses missions, une fiche « À retenir » par mission, ses révisions et un défi de 15 activités. Toutes les missions sont accessibles. Le **grand défi CM2** tire 15 activités différentes en couvrant les 11 univers.

[GUIDE_PROGRAMME.md](GUIDE_PROGRAMME.md) détaille les repères officiels consultés, les notions et les activités par chapitre. La référence est le CM2 français 2026–2027 ; l’anglais est la langue vivante choisie. Ce parcours de révision ne remplace pas la lecture d’œuvres intégrales, les échanges en classe, les expériences, ni la pratique accompagnée de l’EPS et des arts.

## Profils et reprise

- Au premier lancement, saisir le prénom pour créer un carnet.
- Chaque profil possède ses étoiles, ses réponses, ses erreurs, ses missions, ses brouillons écrits, ses dessins et ses diplômes.
- Au retour, le dernier profil est retrouvé. Le grand bouton **« Continuer mon aventure »** reprend sa séance à la question en cours.
- **« Changer d’aventurier »** affiche les carnets existants et permet d’en créer d’autres.
- Un prénom déjà connu retrouve son carnet, sans tenir compte des majuscules et des espaces superflus. Ajouter une initiale pour distinguer deux enfants portant le même prénom.
- **« Modifier mon prénom »** change le nom affiché sans perdre le parcours ; les diplômes s’adaptent.
- Changer de profil conserve les reprises de chacun. Commencer une autre séance dans un même profil remplace sa séance en cours.
- **« Recommencer mon parcours »** efface uniquement la progression du profil actif après confirmation. Son prénom et les autres profils restent conservés.

Les données restent dans `localStorage`, sur ce navigateur et cet ordinateur. La navigation privée, l’effacement des données du navigateur ou le déplacement du dossier peuvent empêcher de retrouver une sauvegarde. Un message signale une erreur d’accès au stockage ; dans ce cas, garder l’onglet ouvert.

### Anciennes sauvegardes biodiversité

Les profils déjà créés, les cinq missions d’origine, leurs 60 identifiants et les clés de stockage sont conservés. Les étoiles, badges et diplômes acquis ne sont pas réinitialisés. Le pourcentage global change car le programme comporte désormais davantage d’activités.

Un ancien défi biodiversité déjà terminé, ou repris après la mise à jour, conserve son diplôme biodiversité : il ne se transforme pas artificiellement en défi de tout le CM2. Une ancienne sauvegarde sans profil est reprise par le premier carnet créé. Sa clé d’origine reste intacte comme secours.

## Jouer

- **Choix et classements :** cliquer pour sélectionner ; pour plusieurs bonnes réponses, sélectionner toutes celles qui conviennent.
- **Cartes :** glisser-déposer, ou cliquer sur une carte puis son groupe. Les associations et les choix sont mélangés sans changer leurs corrections.
- **Ordre :** déplacer les cartes ou utiliser les boutons ↑ / ↓.
- **Calculs :** saisir le nombre sans son unité. Virgule et point décimal sont acceptés, ainsi que les espaces entre les milliers. Appuyer sur Entrée ou cliquer sur Vérifier.
- **Réponses ouvertes :** écrire, réfléchir ou réaliser la tâche, puis comparer au modèle ou aux critères. Aucune correction automatique du texte, de l’oral, de la création ou du geste sportif. « J’ai compris » autoévalue la notion ; « Je veux revoir » la garde dans les révisions.
- **Atelier artistique :** dessiner à la souris, choisir couleur et épaisseur, puis « Conserver mon dessin ». Chaque dessin sauvegardé appartient au profil actif. Le travail sur papier reste une alternative.
- **Clavier :** Tab pour naviguer, Entrée ou Espace pour choisir. Les champs, sélecteurs et boutons sont utilisables au clavier. Le dessin à la souris dispose d’une alternative sur papier avec description textuelle.

Les activités pratiques d’EPS se préparent ou se réalisent dans un espace et un encadrement adaptés. Le jeu n’impose aucun effort ni chronomètre. Les réponses ouvertes de sciences ou de relations peuvent s’appuyer sur des personnages imaginaires ; aucune information personnelle n’est nécessaire.

## Sons et écoutes

Le bouton 🔇 / 🔊 contrôle les sons, désactivés au départ. Les effets et exemples musicaux sont produits localement par Web Audio. Une alternative visuelle accompagne l’écoute musicale.

Les lectures anglaises sont facultatives et utilisent exclusivement une **voix anglaise locale** déclarée par le navigateur. Aucune voix distante n’est sollicitée. Si l’ordinateur n’en propose pas, le texte anglais reste disponible et le jeu fonctionne entièrement. La prononciation de l’enfant n’est pas enregistrée ni évaluée automatiquement.

## Récompenses et diplômes

Une première réussite ou une autoévaluation positive rapporte **3 étoiles** : maximum de 1 746 étoiles pour les 582 activités. Rejouer consolide le parcours sans multiplier les étoiles. Un badge de mission se débloque quand au moins la moitié de ses activités est comprise.

Une erreur explique la notion et permet de réessayer ou de continuer. Elle reste dans les révisions jusqu’à une réponse correcte ou une autoévaluation positive. Les activités comprises et les missions terminées sont des indicateurs distincts.

Un petit diplôme est disponible à la fin de chaque mission ; un diplôme supplémentaire récompense chaque défi de matière et le défi CM2. Les diplômes valorisent la réalisation du parcours, sans note ni certification scolaire. **« Mes diplômes »** présente uniquement ceux acquis par le profil actif, avec son prénom et leur date.

Ouvrir un diplôme puis **« Imprimer le diplôme »** : choisir une imprimante ou « Enregistrer en PDF ». La feuille de style prévoit une page A4 paysage. Désactiver les en-têtes et pieds de page du navigateur pour une impression plus propre.

## Vérifications

Avec Node installé pour le développement seulement :

```sh
node tests/verify.cjs
```

Les 32 contrôles automatisés vérifient notamment les 582 activités, leurs métadonnées, les formats et réponses, les fiches des 82 missions, les défis équilibrés, les entrées numériques, des calculs arithmétiques indépendants, la sauvegarde des nouveaux chapitres, les dessins par profil, les anciens profils et diplômes, les erreurs, les récompenses et l’absence de dépendances réseau.

**Limite de vérification :** les navigateurs ne peuvent pas être lancés dans l’environnement de réalisation. Les tests utilisent une simulation du DOM ; le rendu réel, les interactions à la souris/tactiles, les voix locales et l’impression sur Chrome/Firefox/Safari restent à vérifier sur ordinateur.
