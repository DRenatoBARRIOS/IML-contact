# IML — Synchronisation GitHub → Neon → Vercel

**Statut : CURRENT**  
**Date : 24 septembre 2026**  
**Référence canonique :** ce document remplace les notes antérieures relatives à `main-test`, au déploiement des profils pays et à leur synchronisation avec Neon.

## 1. Chaîne de production canonique

La production du site IML suit désormais une seule chaîne :

```text
GitHub
DRenatoBARRIOS/IML-contact
        │
        └── main
             │
             ▼
Vercel
project: iml-contact
environment: production
             │
             ▼
Neon
project: IML
branch: production
database: neondb
             │
             ▼
https://imlhealth.org
```

La branche `main-test` n'est plus une branche de référence. La branche GitHub canonique est `main`.

## 2. Problème observé le 22 septembre 2026

Après le renommage de `main-test` en `main`, Vercel a correctement commencé à déployer `main`, mais le profil Tunisie n'était pas présent dans la base Neon de production.

Le code et le seed Tunisie existaient bien dans GitHub. Le problème venait du fait que l'initialisation automatique des données pays n'était exécutée que dans l'environnement Vercel `preview`.

Conséquence observée :

- GitHub contenait bien `TUN` ;
- Vercel déployait correctement le site ;
- Neon production ne contenait pas `TUN` ;
- l'API publique ne renvoyait que 17 pays.

La Tunisie a été réinjectée de manière ciblée dans Neon production. L'API publique est ensuite repassée à 18 pays.

## 3. Mécanisme de protection ajouté

La synchronisation des données indispensables à la production est centralisée dans :

```text
db/production-country-sync.mjs
```

Ce module :

1. vérifie l'état réel de la base ;
2. n'exécute un seed que si les données attendues sont absentes ou incomplètes ;
3. vérifie ensuite que l'état requis est bien atteint ;
4. échoue explicitement si la synchronisation n'aboutit pas.

Les profils actuellement protégés par ce registre sont notamment :

- Australie — audit événementiel v0.1, date zéro 24 septembre 2026 ;
- Ouzbékistan ;
- Tunisie ;
- correction Learning France / LRN-5 ;
- correction cyber-résilience Allemagne.

## 4. Synchronisation lors d'un déploiement Production

Le build Vercel exécute désormais :

```text
vite build
        │
        ▼
scripts/sync-production-country-data.mjs
```

La synchronisation de production n'est autorisée que lorsque les deux conditions suivantes sont vraies :

```text
VERCEL_ENV=production
VERCEL_GIT_COMMIT_REF=main
```

Elle ne s'exécute donc pas :

- sur une branche de développement ;
- sur une Preview Vercel ;
- pendant les tests GitHub Actions ;
- sur l'ancien nom `main-test`.

Si la synchronisation des données obligatoires échoue, le build Production doit échouer plutôt que publier silencieusement un site incomplet.

## 5. API publique

`api/countries.js` ne doit plus servir de mécanisme de migration de la base de production.

Il conserve uniquement une fonction de synchronisation pour la Preview canonique, afin de permettre les contrôles avant publication.

La production est synchronisée **avant la mise en ligne**, durant le build Vercel.

Cela sépare donc clairement :

```text
BUILD PRODUCTION  → synchronisation Neon production
API EN PRODUCTION → lecture
PREVIEW            → synchronisation contrôlée de la Preview
```

## 6. Ajouter un nouveau pays

Pour qu'un nouveau pays arrive durablement en production, le travail n'est pas terminé lorsque son fichier de seed est créé.

Le protocole est :

1. créer le seed documentaire et PostgreSQL ;
2. ajouter ou mettre à jour le manifeste d'audit des sources ;
3. ajouter le pays au registre `db/production-country-sync.mjs` avec un test d'état explicite ;
4. ajouter les tests de continuité correspondants ;
6. fusionner le travail dans `main` ;
7. laisser Vercel exécuter le build Production ;
8. vérifier `https://www.imlhealth.org/api/countries` après déploiement.

Le pays n'est considéré comme publié que lorsque l'API publique confirme sa présence.

## 7. Principes de sécurité

- Aucun mot de passe ni `DATABASE_URL` ne doit être écrit dans GitHub ou dans ce document.
- Les identifiants de connexion restent des variables d'environnement Vercel.
- Les seeds doivent être idempotents ou protégés par un contrôle d'état.
- Une opération destructive globale de la base n'est jamais utilisée pour publier un profil pays.
- Une incohérence de production doit provoquer une erreur visible plutôt qu'un succès silencieux.
- La base de production reste la source de vérité des profils effectivement publiés.

## 8. Contrôles automatiques

Le workflow `IML continuity guard` contrôle notamment :

- l'absence de dépendance à `main-test` ;
- l'existence du module de synchronisation ;
- l'existence du script Production ;
- la restriction de la synchronisation à `production + main` ;
- les invariants du profil Tunisie ;
- la construction du site.

Le workflow `IML source quality watch` continue séparément à contrôler la qualité des sources documentaires. Une erreur de qualité documentaire n'est pas confondue avec une erreur de déploiement.

## 9. État validé au 22 septembre 2026

```text
GitHub repository      DRenatoBARRIOS/IML-contact
GitHub branch          main
Vercel project         iml-contact
Vercel environment     production
Neon project           IML
Neon branch            production
Public domain          imlhealth.org
Tunisia / TUN          published
Public country count   18 avant publication Australia v0.1
```

## 10. Règle opérationnelle

**Un profil pays n'est jamais considéré comme en production parce qu'il existe dans GitHub. Il est en production uniquement lorsqu'il est présent dans Neon production et visible dans l'API publique.**
