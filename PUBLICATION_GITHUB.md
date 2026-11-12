# Mettre Mission Savoirs en ligne avec GitHub Pages

Tout se fait dans le navigateur : aucun terminal, aucune installation et aucun compte pour les enfants. Le ZIP contient le code prêt à être déposé dans un dépôt GitHub.

## 1. Décompresser le ZIP

Décompresse `mission-savoirs-github.zip` sur ton ordinateur.

**Il faut envoyer les fichiers extraits, pas le ZIP lui-même.**

Le fichier `index.html` doit se retrouver directement à la racine du dépôt, avec :

```text
index.html
style.css
questions.js
curriculum.js
script.js
README.md
GUIDE_PROGRAMME.md
PUBLICATION_GITHUB.md
tests/
.nojekyll
.gitignore
```

Il ne doit pas être placé dans un sous-dossier `mission-savoirs/` du dépôt. Les fichiers cachés `.nojekyll` et `.gitignore` sont inclus ; s'ils ne sont pas visibles dans ton explorateur, les cinq fichiers du jeu restent suffisants pour le faire fonctionner. Les autres fichiers sont la documentation et les tests.

## 2. Créer le dépôt et ajouter les fichiers

1. Connecte-toi à [GitHub](https://github.com).
2. Clique sur **+ → New repository**.
3. Choisis le nom **mission-savoirs** et la visibilité **Public** pour utiliser GitHub Pages avec un compte gratuit.
4. Clique sur **Create repository**. Tu peux laisser les options d'initialisation décochées.
5. Sur la page du dépôt vide, clique sur **uploading an existing file**. Dans un dépôt déjà initialisé, utilise **Add file → Upload files**.
6. Glisse le **contenu** du dossier extrait dans la zone de dépôt. Vérifie que `index.html`, `style.css`, `questions.js`, `curriculum.js` et `script.js` sont au premier niveau.
7. Valide l'envoi avec **Commit changes**, sur la branche **main**.

Le dossier `tests` peut être déposé avec ses fichiers. Le ZIP lui-même ne doit pas être ajouté au dépôt à la place du code.

## 3. Activer GitHub Pages

Dans le dépôt :

1. Ouvre **Settings → Pages**.
2. Dans **Build and deployment**, choisis comme **Source : Deploy from a branch**.
3. Choisis la branche **main**, puis le dossier **/(root)**.
4. Clique sur **Save**.

Aucun workflow personnalisé n'est nécessaire pour ce site statique. GitHub publiera les changements ajoutés ensuite à cette branche.

## 4. Ouvrir le jeu

Après le déploiement, **Settings → Pages** affiche l'adresse du site et le bouton **Visit site**. L'onglet **Actions** permet de suivre la publication.

Avec le nom de dépôt proposé, l'adresse suit ce modèle :

```text
https://TON-PSEUDO.github.io/mission-savoirs/
```

Remplace `TON-PSEUDO` par ton identifiant GitHub. C'est un modèle, pas une adresse de publication déjà créée.

Si une erreur 404 apparaît, attends la fin du déploiement puis vérifie :

- `index.html` est directement à la racine et porte exactement ce nom en minuscules ;
- la branche sélectionnée dans Pages contient les fichiers ;
- le dossier choisi est **/(root)** ;
- le déploiement dans **Actions** est terminé sans erreur.

## Mettre le jeu à jour

Depuis **Add file → Upload files**, téléverse les versions modifiées des fichiers et valide le commit sur la branche de publication. GitHub Pages republie le site. Le nom du dépôt et l'adresse peuvent rester identiques.

Conserve le fichier `curriculum.js` avec les autres fichiers : il contient les missions du CM2. Aucun dossier `node_modules` ni commande de compilation n'est nécessaire.

## Profils et sauvegardes

Les prénoms, étoiles, erreurs, brouillons et dessins des joueurs restent dans le navigateur de chaque utilisateur. Ils ne sont pas inclus dans le dépôt ni dans ce ZIP.

La sauvegarde d'une page ouverte localement et celle du site GitHub Pages sont **distinctes** : les profils locaux ne sont pas transférés automatiquement vers l'adresse en ligne. Les profils en ligne ne se synchronisent pas entre ordinateurs ou navigateurs.

Pour jouer sans connexion, conserve aussi les fichiers extraits et ouvre `index.html` directement. Le site hébergé nécessite une connexion pour être chargé ; il ne possède pas de cache hors ligne installé.

## Vérifications du développeur

Les 32 contrôles du jeu ont été exécutés avant la création de l'archive. Pour les relancer si Node est disponible :

```sh
node tests/verify.cjs
```

Le rendu réel et l'impression doivent encore être essayés sur ton navigateur. Le dépôt et le site ne sont pas créés par la préparation de ce ZIP : la publication a lieu après les étapes ci-dessus.

## Documentation officielle

- [Ajouter des fichiers dans un dépôt](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [Choisir la source de publication de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)


## Ajout du CE1

Le ZIP actualisé inclut les deux classes. Déposer également le dossier `ce1/` et ses trois fichiers (`index.html`, `grade.js`, `curriculum.js`) à côté des fichiers du CM2. Le sélecteur en haut des pages relie les deux parcours. Le CM2 garde son adresse et ses clés de sauvegarde ; le CE1 possède ses propres carnets. Publier ensemble les fichiers principaux actualisés et le dossier CE1.


## Site existant : changer le titre

Pour afficher « Mission Savoirs », mettre à jour les fichiers du dépôt suffit. Le dépôt GitHub peut garder son nom actuel et le site son adresse habituelle. Renommer le dépôt est facultatif et peut changer l’adresse GitHub Pages.
