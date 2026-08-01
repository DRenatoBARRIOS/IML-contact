# IML Health — mise à jour multipage GitHub

Ce paquet remplace la couche d’interface du site IML sans déplacer la base PostgreSQL ni modifier le contrat des profils pays.

## Résultat

- `src/App.jsx` ne contient plus le site entier : il choisit uniquement la page correspondant à l’adresse.
- Six pages secondaires distinctes sont placées dans `src/pages/`.
- L’en-tête, le pied de page, le masthead et l’explorateur pays sont placés dans `src/components/`.
- L’accueil ne montre ni logo ni cadre vide à côté de « IML Health ».
- Les pages secondaires montrent le logo dans son cadre.
- La carte occupe toute la largeur disponible.
- Les pays examinés utilisent quatre nuances ; les pays non examinés restent neutres.
- La sélection ajoute un contour ambre sans remplacer la couleur du pays.
- Tous les pays de la géométrie sont sélectionnables au clic et au clavier.
- Les anciennes ancres `#id4d`, `#evaluation`, `#methodology`, `#world`, `#profiles` et `#contact` restent reconnues.
- Les anciennes adresses `/id4d`, `/evaluation`, `/methodology`, `/world`, `/profiles` et `/contact` sont redirigées.

## Éléments inclus et éléments à préserver

Cette archive inclut `api/countries.js`, identique à l’API PostgreSQL/Neon de la version de référence. Vous pouvez donc l’ajouter au dépôt de test. Si le dépôt contient aussi d’autres fonctions API, conservez-les.

Ne supprimez pas et ne remplacez pas ces éléments lorsqu’ils existent déjà :

- la variable Vercel `DATABASE_URL` ;
- la base PostgreSQL/Neon ;
- `public/IML_Founding_Manuscript.pdf` ;
- `public/IML_Technical_Manuscript.pdf` ;
- les autres documents ou ressources publiques non inclus dans ce paquet.

Le service frontal essaie d’abord `/api/countries`, puis utilise le contrat historique `/api/countries-v2` comme solution de compatibilité. Le fichier historique `src/services/countriesApi.js` est conservé.

## Installation contrôlée

1. Créez une branche GitHub, par exemple `iml-multipage-update`.
2. Conservez une copie du dernier commit actuellement en production.
3. Copiez le contenu de ce paquet à la racine du dépôt du **site web** IML — pas dans le dépôt du logiciel clinique/desktop.
4. Conservez les fichiers listés dans la section précédente, surtout les PDF et les autres fonctions API éventuellement présentes.
5. Exécutez :

   ```bash
   npm install
   npm run check
   npm run build
   ```

6. Déployez d’abord la branche sur une adresse Vercel temporaire.
7. Testez toutes les adresses du tableau ci-dessous, la carte, les manuscrits et l’API.
8. Fusionnez seulement après validation. Gardez l’ancien déploiement Vercel disponible pour un retour arrière.

## Adresses à tester

| Adresse | Résultat attendu |
| --- | --- |
| `/` | Accueil sans cadre de logo dans l’en-tête |
| `/vision` | Logo encadré et page Vision |
| `/clinical-workspace` | Page Clinical Workspace |
| `/interoperability` | Page Interoperability et méthode |
| `/country-profiles` | Grande carte et profils pays |
| `/manuscripts` | Deux liens PDF |
| `/collaborate` | Page de collaboration |
| `/#world` | Conversion vers `/country-profiles` |
| `/#methodology` | Conversion vers `/interoperability#methodology` |
| `/#contact` | Conversion vers `/collaborate` |

## Retour arrière

Si une vérification échoue après fusion :

1. réaffectez immédiatement le domaine au dernier déploiement Vercel valide ;
2. ne modifiez ni PostgreSQL ni `DATABASE_URL` ;
3. corrigez la branche de mise à jour ;
4. relancez les tests avant une nouvelle bascule.

Cette séparation permet de revenir au site précédent sans restaurer la base de données.
