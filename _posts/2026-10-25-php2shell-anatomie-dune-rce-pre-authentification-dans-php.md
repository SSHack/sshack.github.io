---
title: "php2shell (CVE-2026-109618 / CVE-2026-109619) : anatomie d'une RCE pré-authentification dans le cœur de PHP"
description: "Comment une fonction activée par défaut dans PHP permet d'obtenir un shell avec quelques requêtes POST : mécanisme de la vulnérabilité, chaîne d'exploitation, démonstration en laboratoire, détection et correction."
date: 2026-10-25 10:00:00 +0200
last_modified_at: 2026-10-25 10:00:00 +0200
categories: [Cybersécurité, Vulnerability Research]
tags: [php, php2shell, cve-2026-109618, cve-2026-109619, use-after-free, rce, php-fpm, exploitation, aslr, détection]
image:
  path: /assets/images/2026-10-25-php2shell/banner.svg
  alt: "php2shell : exécution de commande pré-authentification dans PHP"
---

Un fichier `index.php` qui affiche « Hello world ». Aucun formulaire, aucune authentification, aucune ligne de code vulnérable. Et pourtant, depuis le 20 octobre 2026, quelques requêtes `POST multipart/form-data` contenant un champ bien choisi suffisent à obtenir un shell sur le serveur qui l'héberge.

Cette vulnérabilité s'appelle **php2shell**. Elle ne se trouve pas dans votre application, ni dans un framework ou un CMS : elle est dans PHP lui-même, dans une fonction activée par défaut depuis PHP 5.4. Dans cet article, nous expliquons d'où vient le bug, comment il se transforme en exécution de commande, et nous montrons son exploitation sur un environnement de laboratoire.

## Qu'est-ce que php2shell ?

**php2shell désigne deux vulnérabilités du cœur de PHP, CVE-2026-109618 et CVE-2026-109619, notées CVSS v4.0 9.2 (critique).** Elles permettent à un attaquant non authentifié d'exécuter des commandes sur le serveur au moyen de requêtes `POST multipart/form-data`, avant l'exécution du moindre code applicatif. La configuration par défaut de PHP est vulnérable. Les détails ont fuité le 20/10/2026, avant la divulgation coordonnée, et une preuve de concept publique a suivi.

## L'essentiel en cinq points

- **Aucun prérequis applicatif.** N'importe quel script PHP accessible suffit, puisque le code vulnérable s'exécute avant votre script.
- **La cause : un *use-after-free*** dans le suivi de progression des téléversements (`session.upload_progress`), activé par défaut.
- **L'exploit public enchaîne trois étapes** : fuite d'une adresse du tas, fuite de l'adresse de `libphp`, puis détournement de l'exécution. Il contourne l'ASLR ; il lui suffit de connaître le binaire PHP ciblé.
- **En laboratoire**, la preuve de concept publique obtient l'exécution de commandes avec les droits du service web (`www-data`).
- **Correction** : PHP 8.2.35, 8.3.36, 8.4.27 ou 8.5.12. En attendant, la ligne `session.upload_progress.enabled = Off` fait échouer l'exploit public dès sa première étape.

## Quelles versions de PHP sont vulnérables à php2shell ?

| Branche | Statut | Versions affectées | Corrigée en |
|---|---|---|---|
| PHP 8.5 | Maintenue | < 8.5.12 | **8.5.12** |
| PHP 8.4 | Maintenue | < 8.4.27 | **8.4.27** |
| PHP 8.3 | Maintenue jusqu'au 31/12/2027 | < 8.3.36 | **8.3.36** |
| PHP 8.2 | Sécurité seulement, jusqu'au 31/12/2026 | < 8.2.35 | **8.2.35** |
| PHP 8.1, 8.0 et 7.x | Fin de vie (EOL) | Toutes | Pas de version corrigée (atténuations ci-dessous) |
| PHP 5.x | Fin de vie (EOL) | 5.4.0 et suivantes | Pas de version corrigée |

## Deux CVE distinctes

php2shell regroupe deux vulnérabilités distinctes. La correspondance ci-dessous provient du message du commit officiel 712e60f, qui associe chaque advisory GitHub à sa CVE.

| CVE | Advisory | Mécanisme | Rôle dans l'exploit public |
|---|---|---|---|
| **CVE-2026-109619** | GHSA-6wmf-4rv5-p3rp | *Use-after-free* via le suivi de progression des téléversements | C'est la vulnérabilité exploitée |
| **CVE-2026-109618** | GHSA-w8hw-w9fx-j79w | Corruption d'état quand une requête est interrompue brutalement (*bailout*) sur un dépassement de mémoire | Le même type d'interruption sert à faire fuiter des adresses |

> Le dépôt de PoC public rattache la voie du suivi de progression à CVE-2026-109618. Nous suivons ici la correspondance du commit officiel. Gardez cet écart en tête si vous croisez les deux numéros dans des sources différentes.
{: .prompt-warning }

## D'où vient le bug ?

### Une fonction pensée pour les barres de progression

Depuis PHP 5.4, PHP sait suivre l'avancement d'un téléversement de fichier. Le principe est simple. Le formulaire d'upload ajoute un champ caché `PHP_SESSION_UPLOAD_PROGRESS`. Pendant que le fichier arrive, PHP écrit l'avancement dans la session de l'utilisateur. Une seconde requête, lancée en JavaScript, lit cette session et affiche une barre de progression.

Pour que cela fonctionne, PHP doit mettre à jour la session **pendant** la réception du corps de la requête, donc **avant** que le script cible ne commence à s'exécuter. C'est le rôle de la fonction de rappel `php_session_rfc1867_callback` (`ext/session/session.c`), que l'analyseur multipart (`main/rfc1867.c`) appelle au fil de la lecture du corps.

Trois conséquences en découlent :

1. **Le paramètre `session.upload_progress.enabled` est à `On` par défaut.** Aucune action de l'administrateur n'est nécessaire pour exposer le serveur.
2. **Le script cible n'a aucune importance.** Il n'a pas besoin d'utiliser les sessions ni d'accepter des fichiers. Le code vulnérable s'exécute avant lui.
3. **Aucune authentification n'est requise.** La session est créée à la volée à partir du cookie `PHPSESSID` fourni par l'attaquant.

### Des pointeurs vers une mémoire qui disparaît

Pour mettre à jour la progression, la fonction de rappel conserve des **pointeurs bruts** (`zval *`) vers deux entrées de `$_SESSION` : le nombre total d'octets traités et le nombre d'octets du fichier en cours.

Le problème survient à la mise à jour suivante. Le tableau de progression est réécrit dans `$_SESSION`, et les anciennes entrées sont libérées. Les deux pointeurs, eux, ne sont pas mis à jour : ils désignent maintenant une zone mémoire rendue à l'allocateur. La fonction continue pourtant d'y écrire à chaque nouveau morceau du corps.

```text
   Schéma simplifié : requête multipart reçue morceau par morceau
   │
   ├─ morceau 1 : la session est ouverte, le tableau de progression créé
   │              le hook garde un pointeur P vers le compteur d'octets
   │
   ├─ morceau 2 : le tableau de progression est réécrit
   │              l'ancienne entrée est libérée ─► P pointe vers de la mémoire libre
   │
   └─ morceau 3 : le hook met à jour le compteur via P
                  ─► écriture dans une zone qui appartient peut-être déjà à autre chose
```

Il s'agit d'un **use-after-free sur le tas**. Si l'attaquant parvient à faire réallouer la zone libérée avec des données qu'il contrôle, il obtient une primitive d'écriture dans la mémoire du processus PHP.

### CVE-2026-109618 : l'état laissé par une requête interrompue

La seconde CVE repose sur un mécanisme différent. Quand l'allocateur de PHP détecte un dépassement de `memory_limit`, il émet une erreur fatale puis interrompt la requête d'un coup, par un saut non local (`longjmp`, appelé *bailout* dans le code de PHP). L'opération en cours est abandonnée au milieu, et les structures qu'elle manipulait restent à moitié initialisées.

Le cas publié concerne la construction d'un tableau : un compteur d'éléments est incrémenté avant l'allocation de la clé correspondante. Si le *bailout* survient entre les deux, le tableau annonce un élément qui n'existe pas vraiment. Le code qui nettoie ou réutilise ensuite cet état manipule des données invalides.

## Du bug au shell : la chaîne d'exploitation

Un use-after-free ne donne pas un shell à lui seul. Les serveurs modernes activent l'ASLR : les adresses du tas et des bibliothèques changent à chaque démarrage. Pour détourner l'exécution, l'attaquant doit d'abord savoir où se trouvent les objets qu'il vise. L'exploit public résout ce problème en trois étapes, toutes réalisées par HTTP.

| Étape | Objectif | Principe |
|---|---|---|
| **1. Fuite du tas** | Connaître l'adresse d'un bloc mémoire du processus | Une requête est volontairement interrompue en pleine analyse. Son état à moitié initialisé remonte dans la réponse, via le cookie de session, avec des octets qui contiennent une adresse du tas. |
| **2. Fuite de `libphp`** | Connaître l'adresse de base du code de PHP | Une seconde fuite révèle une adresse appartenant à la bibliothèque PHP, d'où l'on déduit son adresse de base. |
| **3. Écriture** | Exécuter une commande | Grâce aux deux adresses obtenues, le use-after-free du suivi de progression sert à réécrire une structure choisie, de façon à faire appeler une fonction interne de PHP capable d'exécuter des commandes. |

Deux détails rendent cette chaîne particulièrement dangereuse :

- **Elle ne dépend pas de l'application.** Les décalages nécessaires, propres à chaque binaire PHP, ne dépendent pas du site : deux serveurs qui utilisent la même image Docker partagent les mêmes valeurs. Un attaquant peut les calculer une fois pour toutes, hors ligne.
- **Elle contourne l'ASLR sans fuite applicative.** Le serveur fournit lui-même les adresses dont l'attaquant a besoin, par l'intermédiaire de ses propres erreurs.

> Nous restons volontairement au niveau du principe. Le but de cet article est de comprendre le mécanisme pour savoir le détecter et le bloquer, pas de fournir un mode d'emploi.
{: .prompt-info }

## Démonstration en laboratoire

### Le banc de test

Nous avons rejoué la preuve de concept publique sur un conteneur Docker Apache + mod_php dont l'image PHP est **volontairement laissée non corrigée** et configurée pour être vulnérable. Le conteneur n'était exposé que sur l'interface locale du poste d'analyse (`127.0.0.1`, port 8088). La cible est la page `index.php` du conteneur.

### Exploitation sans protection

Lancée contre la page, la preuve de concept enchaîne ses trois étapes du premier coup : elle obtient l'adresse d'un bloc du tas, puis l'adresse de base de `libphp`, et termine par l'écriture. La commande de preuve renvoie l'identité du compte qui l'a exécutée : **`uid=33(www-data)`**, le compte du serveur web.

```console
$ python3 ./poc_109618.py -u http://127.0.0.1:8088/index.php -c 'id' --proof-file '' --fetch /p1.txt

[*] target http://127.0.0.1:8088/index.php
[*] offsets loaded from out/offsets.env
[*] rotating worker over HTTP
[*] stage 1: heap leak (attempt 1/3)
[+] chunk base = 0x7f6118200000
[*] rotating worker over HTTP
[*] stage 2: libphp leak (attempt 1/3)
[+] libphp base = 0x7f611a1f8000
[*] rotating worker over HTTP
[*] stage 3: ...
[+] W3 attempt 1
PROOF: uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

### Couper la chaîne à sa racine

Nous avons ensuite désactivé le suivi de progression par un simple fichier de configuration, sans toucher au binaire ni aux sources de PHP :

```bash
printf 'session.upload_progress.enabled = Off\nmax_multipart_body_parts = 1000\nmemory_limit = 512M\n' \
  > /usr/local/etc/php/conf.d/zzzz-hardening.ini
apachectl -k graceful
```

Ce test conservait `memory_limit = 512M` ; pour la production, nous recommandons `-1` (voir plus bas).

Une sonde qui rejoue uniquement la première étape montre que le cookie de session renvoyé ne contient plus que 32 caractères hexadécimaux ordinaires : plus aucune adresse ne fuite.

```console
$ php -r "echo 'upload_progress=[' . ini_get('session.upload_progress.enabled') . '] cap=[' . ini_get('max_multipart_body_parts') . '] mem=[' . ini_get('memory_limit') . ']';"
upload_progress=[] cap=[1000] mem=[512M]
```

```console
$ curl -s http://127.0.0.1:8088/ini.php
upload_progress.enabled    =
max_multipart_body_parts   = 1000
memory_limit               = 512M

$ python3 ./spy_stage1.py
taille du PHPSESSID renvoyé : 32 octets
chunk base détecté          : aucun       -> pas de fuite, stage 1 mort
```

Relancée à l'identique, la preuve de concept échoue trois fois de suite à sa première étape et abandonne sur `HEAP_LEAK_FAILED`.

```console
$ python3 ./poc_109618.py -u http://127.0.0.1:8088/index.php -c 'id' --proof-file '' --fetch /p1.txt

[*] target http://127.0.0.1:8088/index.php
[*] rotating worker over HTTP
[*] stage 1: heap leak (attempt 1/3)
[-] heap leak missed
[*] rotating worker over HTTP
[*] stage 1: heap leak (attempt 2/3)
[-] heap leak missed
[*] rotating worker over HTTP
[*] stage 1: heap leak (attempt 3/3)
[-] heap leak missed
[*] rotating worker over HTTP
HEAP_LEAK_FAILED
```

Pour la contre-épreuve, nous avons retiré le fichier de configuration : l'exploit aboutit de nouveau, avec le même résultat `uid=33(www-data)`. La désactivation du suivi de progression est donc bien ce qui bloquait l'attaque.

```console
$ docker exec php2shell-target sh -c "rm /usr/local/etc/php/conf.d/zzzz-hardening.ini && apachectl -k graceful"

$ python3 ./poc_109618.py -u http://127.0.0.1:8088/index.php -c 'id' --proof-file '' --fetch /p1.txt

[*] stage 1: heap leak (attempt 1/3)
[+] chunk base = 0x7f6118200000
[*] stage 2: libphp leak (attempt 1/3)
[+] libphp base = 0x7f611a1f8000
[+] W3 attempt 1
PROOF: uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

## Pourquoi php2shell est si dangereuse

- **La surface d'attaque est maximale.** Tout serveur sous une version vulnérable, dans sa configuration par défaut, qui expose au moins un script PHP est concerné, quel que soit le CMS ou le framework.
- **Les protections applicatives sont hors jeu.** Le code vulnérable s'exécute avant l'application : authentification, validation des entrées et journalisation applicative interviennent trop tard.
- **Les requêtes ressemblent à des uploads légitimes.** Un `POST multipart/form-data` est un trafic banal, ce qui complique le filtrage par WAF.
- **L'hébergement mutualisé démultiplie l'impact.** Un shell `www-data` sur un serveur mutualisé peut donner accès aux fichiers de nombreux sites voisins.
- **Les versions en fin de vie restent répandues.** PHP 7.4, et parfois 5.x, tournent encore en production et ne recevront aucune version corrigée.

## Comment détecter une exploitation de php2shell ?

Le signal le plus fiable se trouve au niveau des processus : une exploitation réussie fait apparaître des **processus enfants inhabituels sous les workers PHP** (`php-fpm`, `php-cgi`, `apache2`, `httpd`). Surveillez en particulier :

- les shells (`sh`, `bash`) lancés par un worker PHP ;
- les interpréteurs (`python`, `perl`) et les outils réseau (`curl`, `wget`, `nc`) ;
- les commandes de reconnaissance (`id`, `uname`, `whoami`), comme celle de notre démonstration.

Sur les hôtes Linux sans EDR, [process-watcher](https://github.com/Neo23x0/process-watcher) de Florian Roth, en mode observation, détecte ces comportements.

Deux autres indices complètent la détection : dans les journaux web, des requêtes multipart contenant un champ `PHP_SESSION_UPLOAD_PROGRESS` sur des pages qui n'acceptent pas de fichier, et, dans les journaux PHP, des erreurs fatales de dépassement mémoire (« *Allowed memory size … exhausted* ») répétées, signe des interruptions provoquées pour faire fuiter des adresses.

En cas de doute, isolez l'hôte, conservez les journaux web et PHP, puis inspectez les racines web ainsi que `/tmp` et `/var/tmp` à la recherche de webshells.

## Comment se protéger de php2shell ?

### 1. Mettre à jour PHP

C'est la seule correction complète. Passez en **8.4.27 ou 8.5.12** de préférence, ou au minimum en 8.2.35 ou 8.3.36. Sur ces versions, les compteurs de progression ne sont plus des pointeurs mais des entiers (`zend_long`) : la fonction de suivi de progression continue de fonctionner, sans use-after-free.

### 2. Désactiver le suivi de progression en attendant

Si la mise à jour ne peut pas être immédiate, appliquez cette configuration, de préférence imposée dans le pool PHP-FPM :

```ini
session.upload_progress.enabled = Off
max_multipart_body_parts = 1000
memory_limit = -1
```

- **`session.upload_progress.enabled = Off`** supprime la vulnérabilité exploitée par l'exploit public. Notre démonstration montre qu'elle suffit à le faire échouer.
- **`memory_limit = -1`** retire le déclencheur de CVE-2026-109618, conformément à la recommandation de l'éditeur. Imposez-le par `php_admin_value[memory_limit] = -1` dans le pool PHP-FPM, et fixez une limite mémoire au niveau du conteneur (cgroup), car PHP ne borne plus la mémoire de ses workers.
- **`max_multipart_body_parts = 1000`** limite le nombre de parties d'une requête multipart. La directive existe nativement depuis PHP 8.0.28, 8.1.16 et 8.2.3 ; sur PHP 7.4 et antérieures, elle n'existe que si le binaire a été recompilé avec le correctif, et elle est ignorée sinon.

> Les barres de progression des téléversements basées sur `$_SESSION['upload_progress_*']` cessent de fonctionner. Recensez les applications concernées avant de déployer.
{: .prompt-warning }

### 3. Pour les versions en fin de vie

Pour les versions en fin de vie, l'équipe PHP a publié le commit [712e60f](https://github.com/php/php-src/commit/712e60f9edfd03f0960fc4fc3c2c375f42b90aa2), « *Avoid state corruption via bailout - Minimal mitigation for EOL version* ». Il neutralise la fonction de rappel vulnérable directement dans le binaire et remplace le *bailout* de l'allocateur par un arrêt propre du processus. Il faut recompiler PHP avec ce correctif. Des backports communautaires existent aussi pour PHP 5.6, 7.4, 8.0 et 8.1 ([Anton-Barinov/php2shell-patches](https://github.com/Anton-Barinov/php2shell-patches)).

> Un backport qui s'applique sans erreur ne prouve pas qu'il corrige les deux CVE. Vérifiez qu'il contient bien la partie « allocateur », celle qui traite CVE-2026-109618.
{: .prompt-danger }

Sur PHP 7.4 et antérieures, pour vérifier qu'un binaire intègre ce correctif, cherchez la directive qu'il ajoute :

```bash
grep -a -c max_multipart_body_parts /usr/local/sbin/php-fpm
```

Un résultat nul signale un binaire non corrigé. Ce contrôle ne vaut pas pour PHP 8.x, où la directive existe de toute façon : vérifiez-y le numéro de version.

### 4. Filtrer en amont, en complément

Le dépôt PoC public fournit des règles ModSecurity, `.htaccess`, Lighttpd et Cloudflare qui bloquent les requêtes multipart portant `PHP_SESSION_UPLOAD_PROGRESS` ou envoyées hors des routes d'upload, ainsi qu'un extrait de Caddyfile qui désactive le suivi de progression sous FrankenPHP. Ces filtres peuvent être contournés : utilisez-les en plus de la mise à jour ou de la configuration, jamais à leur place.

## FAQ

### Mon application n'utilise pas les sessions PHP. Suis-je vulnérable ?

Oui. La fonction de suivi de progression ouvre elle-même la session, avant l'exécution de votre script et indépendamment de son contenu. Seul le paramètre `session.upload_progress.enabled`, ou une version corrigée de PHP, détermine l'exposition.

### Un attaquant a-t-il besoin d'un compte ou d'un formulaire d'upload ?

Non. Des requêtes `POST multipart/form-data` vers n'importe quel script PHP accessible suffisent. L'attaquant fournit lui-même le cookie de session et le champ `PHP_SESSION_UPLOAD_PROGRESS`.

### Désactiver session.upload_progress suffit-il ?

Contre l'exploit public, oui : notre démonstration le montre, l'attaque échoue dès sa première étape. Contre CVE-2026-109618, non, car elle ne passe pas par ce mécanisme. Ajoutez `memory_limit = -1` et planifiez la mise à jour.

### Quels droits obtient l'attaquant ?

Ceux du service qui exécute PHP, généralement `www-data` sous Debian et Ubuntu. L'attaquant peut alors lire le code et les fichiers de configuration du site (identifiants de base de données compris), déposer un webshell et chercher à élever ses privilèges.

### Comment savoir si mon serveur a été attaqué ?

Recherchez des processus enfants inhabituels sous les workers PHP, des erreurs fatales de dépassement mémoire répétées dans les journaux PHP, et des fichiers récents dans les racines web, `/tmp` et `/var/tmp`.

## Conclusion

php2shell montre qu'une fonction oubliée peut suffire à exposer tout un parc. Le suivi de progression des téléversements ne sert qu'à afficher une barre de progression, et il est pourtant activé par défaut. Un choix d'implémentation, conserver des pointeurs bruts vers des données susceptibles d'être libérées, s'est transformé en exécution de commande pré-authentification.

En attendant la mise à jour, une ligne de configuration suffit à bloquer l'exploit public. Le plus difficile est de savoir où tournent toutes vos versions de PHP, y compris celles que plus personne ne surveille.

**Vous voulez savoir si vos serveurs sont exposés à php2shell, ou valider un correctif avant de le déployer ?** Chez SSHack, nous menons ce type d'analyse de bout en bout : identification des versions exposées, reproduction en laboratoire et plan de remédiation priorisé. Écrivez-nous à [contact@sshack.me](mailto:contact@sshack.me).

## Références

- Commit php-src [712e60f](https://github.com/php/php-src/commit/712e60f9edfd03f0960fc4fc3c2c375f42b90aa2) : « *Avoid state corruption via bailout - Minimal mitigation for EOL version* » (A. Le Blanc, I. Tovilo)
- Advisories : GHSA-w8hw-w9fx-j79w (CVE-2026-109618), GHSA-6wmf-4rv5-p3rp (CVE-2026-109619)
- Preuve de concept et mesures de contournement : [eness/php2shell-CVE-2026-109618-CVE-2026-109619-PoC](https://github.com/eness/php2shell-CVE-2026-109618-CVE-2026-109619-PoC)
- Backports communautaires pour les branches EOL : [Anton-Barinov/php2shell-patches](https://github.com/Anton-Barinov/php2shell-patches)
- Détection : [Neo23x0/process-watcher](https://github.com/Neo23x0/process-watcher)
