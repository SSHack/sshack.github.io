---
title: "php2shell (CVE-2026-109618 / CVE-2026-109619) : anatomie d'une RCE pré-authentification dans le cœur de PHP"
description: "Comment une fonction activée par défaut dans PHP permet d'obtenir un shell avec quelques requêtes POST : mécanisme de la vulnérabilité, chaîne d'exploitation, démonstration en laboratoire, détection et correction."
date: 2026-10-25 10:00:00 +0200
last_modified_at: 2026-10-25 20:05:00 +0200
categories: [Cybersécurité, Vulnerability Research]
tags: [php, php2shell, cve-2026-109618, cve-2026-109619, use-after-free, rce, mod_php, php-fpm, exploitation, aslr, détection]
image:
  path: /assets/images/2026-10-25-php2shell/banner.svg
  alt: "php2shell : exécution de commande pré-authentification dans PHP"
---

Un fichier `index.php` qui affiche « Hello world ». Aucun formulaire, aucune authentification, aucune ligne de code vulnérable. Et pourtant, depuis le 20 octobre 2026, quelques requêtes `POST multipart/form-data` contenant un champ bien choisi suffisent à obtenir un shell sur le serveur qui l'héberge.

Cette vulnérabilité s'appelle **php2shell**. Elle ne se trouve pas dans votre application, ni dans un framework ou un CMS : elle est dans PHP lui-même, et elle passe par une fonction activée par défaut depuis PHP 5.4. Dans cet article, nous expliquons d'où vient le bug, comment il se transforme en exécution de commande, et nous montrons son exploitation sur un environnement de laboratoire.

## Qu'est-ce que php2shell ?

**php2shell désigne deux vulnérabilités du cœur de PHP, CVE-2026-109618 et CVE-2026-109619, notées CVSS v4.0 9.2 (critique).** Elles permettent à un attaquant non authentifié d'exécuter des commandes sur le serveur au moyen de requêtes `POST multipart/form-data`. Sous Apache mod_php, tout se joue avant l'exécution du moindre code applicatif, et l'advisory officielle confirme l'exécution de code avec les limites par défaut de PHP. Les détails ont fuité le 20/10/2026, avant la divulgation coordonnée, et une preuve de concept publique a suivi. Les advisories et les versions corrigées ont été publiées le 21/10/2026.

## L'essentiel en cinq points

- **Aucun prérequis applicatif sous mod_php.** N'importe quel script PHP accessible suffit, puisque le code vulnérable s'exécute avant votre script. Sous PHP-FPM, l'exploitation demande en plus une opération applicative adaptée.
- **La cause : un état interne laissé invalide par une requête interrompue** (dépassement mémoire, erreur fatale), puis réutilisé par la requête suivante du même worker. Le suivi de progression des téléversements (`session.upload_progress`), activé par défaut, fournit le chemin exploité par l'exploit public.
- **L'exploit public enchaîne trois étapes** : fuite d'une adresse du tas, fuite de l'adresse de `libphp`, puis détournement de l'exécution. Il contourne l'ASLR ; il lui suffit de connaître le binaire PHP ciblé.
- **En laboratoire**, la preuve de concept publique obtient l'exécution de commandes avec les droits du service web (`www-data`).
- **Correction** : PHP 8.2.35, 8.3.36, 8.4.27 ou 8.5.12. Aucune configuration ne protège complètement ; en attendant, désactiver le suivi de progression et supprimer la limite mémoire par requête réduisent fortement le risque.

## Quelles versions de PHP sont vulnérables à php2shell ?

| Branche | Statut | Versions affectées | Corrigée en |
|---|---|---|---|
| PHP 8.5 | Maintenue | < 8.5.12 | **8.5.12** |
| PHP 8.4 | Maintenue | < 8.4.27 | **8.4.27** |
| PHP 8.3 | Sécurité seulement, jusqu'au 31/12/2027 | < 8.3.36 | **8.3.36** |
| PHP 8.2 | Sécurité seulement, jusqu'au 31/12/2026 | < 8.2.35 | **8.2.35** |
| PHP 8.1, 8.0 et 7.x | Fin de vie (EOL) | Toutes | Pas de version corrigée (atténuations ci-dessous) |
| PHP 5.x | Fin de vie (EOL) | 5.4.0 et suivantes | Pas de version corrigée |

## Deux CVE distinctes

php2shell regroupe deux vulnérabilités distinctes, décrites chacune par un avis de sécurité GitHub du projet PHP.

| CVE | Advisory | Mécanisme | Rôle dans l'exploit public |
|---|---|---|---|
| **CVE-2026-109618** | [GHSA-w8hw-w9fx-j79w](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w) | Corruption d'état quand un dépassement de mémoire interrompt brutalement (*bailout*) une opération en cours | Le dépassement mémoire provoqué par l'attaquant interrompt la requête et sert à faire fuiter des adresses |
| **CVE-2026-109619** | [GHSA-6wmf-4rv5-p3rp](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp) | *Use-after-free* : un état global laissé par une requête interrompue est réutilisé par la requête suivante du même worker | Le suivi de progression des téléversements produit puis réutilise cet état de session |

> Le script du dépôt de PoC public s'appelle `poc_109618.py`, et son README attribue la cause à un use-after-free dans le suivi de progression. D'après sa propre description, la chaîne s'appuie en réalité sur les deux mécanismes : un dépassement mémoire (CVE-2026-109618) et un état de session réutilisé (CVE-2026-109619). Nous suivons ici les advisories officielles. Gardez cet écart en tête si vous croisez les deux numéros dans des sources différentes.
{: .prompt-warning }

## D'où vient le bug ?

### Une fonction pensée pour les barres de progression

Depuis PHP 5.4, PHP sait suivre l'avancement d'un téléversement de fichier. Le principe est simple. Le formulaire d'upload ajoute un champ caché `PHP_SESSION_UPLOAD_PROGRESS`. Pendant que le fichier arrive, PHP écrit l'avancement dans la session de l'utilisateur. Une seconde requête, lancée en JavaScript, lit cette session et affiche une barre de progression.

Pour que cela fonctionne, PHP doit mettre à jour la session **pendant** la réception du corps de la requête, donc **avant** que le script cible ne commence à s'exécuter, et même avant l'initialisation normale de la requête. C'est le rôle de la fonction de rappel `php_session_rfc1867_callback` (`ext/session/session.c`), que l'analyseur multipart (`main/rfc1867.c`) appelle au fil de la lecture du corps.

Trois conséquences en découlent :

1. **Le paramètre `session.upload_progress.enabled` est à `On` par défaut.** Aucune action de l'administrateur n'est nécessaire pour exposer le serveur.
2. **Le script cible n'a aucune importance.** Il n'a pas besoin d'utiliser les sessions ni d'accepter des fichiers. Le code vulnérable s'exécute avant lui.
3. **Aucune authentification n'est requise.** La session est créée à la volée à partir du cookie `PHPSESSID` fourni par l'attaquant (`session.use_strict_mode` est désactivé par défaut).

### CVE-2026-109618 : une requête interrompue en plein milieu

Quand l'allocateur de PHP détecte un dépassement de `memory_limit`, il émet une erreur fatale puis interrompt la requête d'un coup, par un saut non local (`longjmp`, appelé *bailout* dans le code de PHP). L'opération en cours est abandonnée au milieu. Dans certains contextes, de la mémoire de la requête est déjà accessible alors qu'elle n'est pas complètement initialisée : la procédure de fin de requête la lit ensuite et travaille sur des données invalides. L'allocation qui échoue n'a même pas besoin d'être liée à la zone concernée.

L'attaquant peut provoquer ce dépassement pendant l'analyse du corps multipart, tout en restant sous les limites apparentes de PHP. L'advisory cite trois moyens :

- une requête multipart sans longueur déclarée exploitable passe le contrôle initial de `post_max_size` et continue d'envoyer des données ;
- une partie multipart peut porter un nombre illimité d'en-têtes, qui occupent bien plus de mémoire dans PHP que sur le réseau ;
- les champs fichier vides ne comptent pas dans `max_file_uploads` mais créent quand même les tableaux de métadonnées, et des noms de champs imbriqués multiplient ce travail.

Sous Apache mod_php, la procédure de fin de requête est appelée même quand le démarrage de la requête a échoué : tout se déroule avant le code applicatif. PHP-FPM arrête le worker dans ce cas, ce qui le protège de ce scénario précis ; l'advisory le considère néanmoins comme exposé une fois la requête démarrée, sans exploit complet démontré.

### CVE-2026-109619 : un état qui survit à la requête

Un worker PHP traite des requêtes successives. Certaines variables globales (état de la session, du décodeur, des erreurs) pointent vers de la mémoire qui appartient à la requête en cours. Elles doivent être remises à zéro avant que cette mémoire soit libérée.

Si une erreur fatale ou un dépassement mémoire interrompt l'opération avant cette remise à zéro, la mémoire de la requête est libérée mais la variable globale pointe toujours dessus. Certaines opérations de la requête suivante, traitée par le même worker, s'exécutent avant l'initialisation normale et lisent cette valeur périmée.

```text
   Schéma simplifié : deux requêtes traitées par le même worker
   │
   ├─ requête A : le suivi de progression initialise l'état de session
   │              un dépassement mémoire interrompt la requête (longjmp)
   │              l'état n'est pas remis à zéro
   │
   ├─ fin de A  : la mémoire de la requête est libérée
   │              ─► l'état global de session pointe vers de la mémoire libre
   │
   └─ requête B : le suivi de progression relit cet état avant l'initialisation normale
                  ─► accès à une zone qui appartient peut-être déjà à autre chose
```

Il s'agit d'un **use-after-free sur le tas**. Si l'attaquant parvient à faire réallouer la zone libérée avec des données qu'il contrôle, il peut réécrire des structures internes du processus PHP.

L'advisory confirme deux points d'entrée pour la seconde requête :

- **le suivi de progression des téléversements**, utilisé par l'exploit public, validé contre mod_php et contre PHP-FPM (sous FPM, avec une opération applicative adaptée) ;
- **les avertissements émis en appliquant la configuration avant l'initialisation de la requête** : directives obsolètes ou invalides dans un `.htaccess` ou un `php_value` sous mod_php, ou paramètres `PHP_VALUE` envoyés par nginx à PHP-FPM. Masquer les erreurs (`@`, `display_errors`, `error_reporting`) ne protège pas.

Le cas confirmé le plus solide ne passe d'ailleurs pas par le suivi de progression : sur **PHP 8.5 avec `fatal_error_backtraces` activé**, l'état de la trace d'erreur n'est jamais remis à zéro, ce qui a permis une exécution de code contre mod_php.

## Du bug au shell : la chaîne d'exploitation

Un use-after-free ne donne pas un shell à lui seul. Les serveurs modernes activent l'ASLR : les adresses du tas et des bibliothèques changent à chaque démarrage. Pour détourner l'exécution, l'attaquant doit d'abord savoir où se trouvent les objets qu'il vise. Après avoir fait recycler le worker pour partir d'un tas propre, l'exploit public résout ce problème en trois étapes, toutes réalisées par HTTP.

| Étape | Objectif | Principe |
|---|---|---|
| **1. Fuite du tas** | Connaître l'adresse d'un bloc mémoire du processus | Une requête multipart envoie un champ plus gros que `memory_limit`. Le dépassement interrompt l'analyse ; l'état à moitié initialisé remonte dans la réponse, via le cookie de session, avec des octets qui contiennent une adresse du tas. |
| **2. Fuite de `libphp`** | Connaître l'adresse de base du code de PHP | Une seconde fuite révèle une adresse appartenant à la bibliothèque PHP, d'où l'on déduit son adresse de base. |
| **3. Écriture** | Exécuter une commande | Grâce aux deux adresses obtenues, l'état de session laissé invalide sert à réécrire une structure choisie, de façon à faire appeler une fonction interne de PHP capable d'exécuter des commandes. |

Les requêtes doivent atteindre le même worker. Plusieurs workers ou du trafic légitime augmentent le nombre de tentatives nécessaires, sans empêcher l'attaque.

Deux détails rendent cette chaîne particulièrement dangereuse :

- **Elle ne dépend pas de l'application sous mod_php.** Les décalages nécessaires, propres à chaque binaire PHP, ne dépendent pas du site : deux serveurs qui utilisent la même image Docker partagent les mêmes valeurs. Un attaquant peut les calculer une fois pour toutes, hors ligne.
- **Elle contourne l'ASLR sans fuite applicative.** Le serveur fournit lui-même les adresses dont l'attaquant a besoin, par l'intermédiaire de ses propres erreurs.

> Nous restons volontairement au niveau du principe. Le but de cet article est de comprendre le mécanisme pour savoir le détecter et le bloquer, pas de fournir un mode d'emploi.
{: .prompt-info }

## Démonstration en laboratoire

### Le banc de test

Nous avons rejoué la preuve de concept publique sur un conteneur Docker Apache + mod_php dont l'image PHP est **volontairement laissée non corrigée**. Le conteneur suit le profil documenté par le PoC : Apache en prefork, `display_errors` actif et un `memory_limit` inférieur au champ de 12 Mo que le PoC envoie pour provoquer le dépassement mémoire. Ces réglages ne sont pas ceux par défaut ; ils rendent le PoC public fiable, alors que l'advisory indique que d'autres façons de provoquer le dépassement fonctionnent avec les limites par défaut.

Le conteneur n'était exposé que sur l'interface locale du poste d'analyse (`127.0.0.1`, port 8088). La cible est la page `index.php` du conteneur.

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

### Couper la chaîne

Nous avons ensuite ajouté un fichier de configuration, sans toucher au binaire ni aux sources de PHP :

```bash
printf 'session.upload_progress.enabled = Off\nmax_multipart_body_parts = 1000\nmemory_limit = 512M\n' \
  > /usr/local/etc/php/conf.d/zzzz-hardening.ini
apachectl -k graceful
```

Ce fichier désactive le suivi de progression, limite le nombre de parties multipart et relève `memory_limit` à 512M. Ce dernier point compte : avec 512M, le champ de 12 Mo du PoC ne suffit plus à provoquer le dépassement mémoire de l'étape 1. Pour la production, nous recommandons `memory_limit = -1` (voir plus bas).

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

Pour la contre-épreuve, nous avons retiré le fichier de configuration : l'exploit aboutit de nouveau, avec le même résultat `uid=33(www-data)`. Ce fichier suffit donc à bloquer l'exploit public. En revanche, ce test ne permet pas d'attribuer l'effet au seul suivi de progression : le relèvement de `memory_limit` empêche probablement, à lui seul, le dépassement mémoire de l'étape 1.

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

Les adresses obtenues sont identiques à celles de la première exploitation. Ce n'est pas un défaut de l'ASLR : les workers Apache sont créés par duplication (`fork`) d'un même processus parent et héritent de sa disposition mémoire. Une adresse obtenue sur un worker reste valable sur les autres, ce qui facilite justement une attaque répartie sur plusieurs requêtes.

## Pourquoi php2shell est si dangereuse

- **La surface d'attaque est très large.** Tout serveur Apache mod_php sous une version vulnérable, qui expose au moins un script PHP, est concerné, quel que soit le CMS ou le framework. FrankenPHP est probablement dans le même cas. Sous PHP-FPM, le risque est réel mais dépend davantage de l'application et de la configuration.
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

D'autres indices complètent la détection :

- dans les journaux web, des requêtes multipart contenant un champ `PHP_SESSION_UPLOAD_PROGRESS` sur des pages qui n'acceptent pas de fichier ;
- dans les journaux PHP, des erreurs fatales répétées : dépassement mémoire (« *Allowed memory size … exhausted* »), « *Maximum execution time exceeded* », ou avertissements répétés avant l'exécution des scripts.

L'absence d'erreur dans les journaux ne prouve rien : une interruption peut survenir avant que PHP n'écrive son message, et les journaux excluent souvent certains niveaux de gravité.

En cas de doute, isolez l'hôte, conservez les journaux web et PHP, puis inspectez les racines web ainsi que `/tmp` et `/var/tmp` à la recherche de webshells.

## Comment se protéger de php2shell ?

### 1. Mettre à jour PHP

C'est la seule correction complète. Passez en **8.4.27 ou 8.5.12** de préférence, ou au minimum en 8.2.35 ou 8.3.36.

Le correctif officiel remplace le `longjmp` sur dépassement mémoire par un arrêt différé, déclenché proprement au prochain point sûr de la machine virtuelle, avec un arrêt immédiat du processus au-delà d'un second seuil. Il remet aussi à zéro les variables globales susceptibles d'être lues avant l'initialisation de la requête, dont celles de la session au début de chaque téléversement. La limite mémoire de PHP et le suivi de progression continuent de fonctionner.

Si vous n'utilisez pas le suivi de progression, l'advisory conseille de le laisser désactivé même après la mise à jour : cette fonction peu utilisée et peu testée attire désormais l'attention des attaquants.

### 2. Réduire l'exposition en attendant

> D'après l'advisory, **aucune configuration ne protège complètement** contre CVE-2026-109619 : une application, une extension ou un chemin du serveur peut encore produire ou réutiliser un état périmé. Les mesures ci-dessous réduisent le risque ; elles ne remplacent pas la mise à jour.
{: .prompt-danger }

Si la mise à jour ne peut pas être immédiate, appliquez cette configuration au niveau administrateur, puis redémarrez tous les workers PHP :

```ini
session.upload_progress.enabled = Off
max_multipart_body_parts = 1000
memory_limit = -1
; PHP 8.5 uniquement
fatal_error_backtraces = Off
```

- **`session.upload_progress.enabled = Off`** neutralise le scénario de session décrit par l'advisory, celui qu'emprunte l'exploit public. Il ne couvre pas les autres chemins de CVE-2026-109619.
- **`memory_limit = -1`** est, selon l'advisory, la principale atténuation par configuration de CVE-2026-109618 : sans limite par requête, l'attaquant ne peut plus provoquer le dépassement mémoire à la demande. Elle n'est pas complète : si `mmap()` échoue, PHP peut encore effectuer le `longjmp`. Imposez-la par `php_admin_value[memory_limit] = -1` dans le pool PHP-FPM, ou par `php_admin_value memory_limit -1` dans la configuration Apache pour mod_php, et vérifiez qu'aucun pool, répertoire ou application ne rétablit une limite finie.
- **`fatal_error_backtraces = Off`** (PHP 8.5) supprime le point de départ du cas confirmé le plus solide.
- **`max_multipart_body_parts = 1000`** limite le nombre de parties d'une requête multipart. La directive existe nativement depuis PHP 8.0.28, 8.1.16 et 8.2.3. Sur les versions antérieures, elle n'existe que si le binaire l'a reçue par un correctif, et elle est ignorée sinon.

Comme PHP ne borne plus la mémoire de ses workers, une limite au niveau du conteneur ou du cgroup (`memory.max`) peut prendre le relais, avec deux réserves : tuer un conteneur ou un cgroup peut tuer le master et tous les workers d'un coup, et il ne faut **pas** utiliser `RLIMIT_AS` ni `RLIMIT_DATA`, qui font échouer `mmap()` et ramènent précisément le chemin vulnérable.

L'advisory recommande aussi de :

- garder `post_max_size` bas et contrôler la taille réelle du corps de requête en frontal ;
- réduire `max_input_nesting_level` et borner le nombre de variables, de parties, d'en-têtes par partie et de fichiers ;
- bloquer en frontal les requêtes multipart si l'application n'en reçoit pas ;
- supprimer les directives obsolètes ou invalides des `.htaccess`, des `php_value` et des paramètres `PHP_VALUE`, qui produisent des avertissements avant l'initialisation de la requête ;
- si les performances le permettent, limiter chaque worker FPM à une seule requête (`pm.max_requests = 1`).

> Les barres de progression des téléversements basées sur `$_SESSION['upload_progress_*']` cessent de fonctionner. Recensez les applications concernées avant de déployer.
{: .prompt-warning }

### 3. Pour les versions en fin de vie

Pour les versions en fin de vie, l'équipe PHP a publié le commit [712e60f](https://github.com/php/php-src/commit/712e60f9edfd03f0960fc4fc3c2c375f42b90aa2), « *Avoid state corruption via bailout - Minimal mitigation for EOL version* », sur une branche dédiée à PHP 7.4. Il neutralise la fonction de rappel du suivi de progression directement dans le binaire, remplace le *bailout* de l'allocateur par un arrêt immédiat du processus (`_exit`), remet à zéro plusieurs variables globales en fin de requête et ajoute la directive `max_multipart_body_parts`. Il faut recompiler PHP avec ce correctif. Des backports communautaires existent aussi pour PHP 5.6, 7.4, 8.0 et 8.1 ([Anton-Barinov/php2shell-patches](https://github.com/Anton-Barinov/php2shell-patches)).

> Un backport qui s'applique sans erreur ne prouve pas qu'il corrige les deux CVE. Vérifiez qu'il contient bien la partie « allocateur », celle qui traite CVE-2026-109618.
{: .prompt-danger }

Sur un PHP 7.4 ou antérieur compilé depuis les sources officielles, la présence de la directive ajoutée par le correctif donne un premier indice (adaptez le chemin : `php-fpm`, ou `libphp7.so` pour mod_php) :

```bash
grep -a -c max_multipart_body_parts /usr/local/sbin/php-fpm
```

Un résultat nul signale un binaire non corrigé. Un résultat non nul ne prouve rien à lui seul : certains paquets de distribution (Debian, Ubuntu) ont rétroporté cette directive dès 2023 pour CVE-2023-0662. Ce contrôle ne vaut pas non plus pour PHP 8.0.28, 8.1.16, 8.2.3 et suivantes, où la directive existe nativement : vérifiez-y le numéro de version, ou la liste des correctifs du paquet.

### 4. Filtrer en amont, en complément

Le dépôt de PoC public fournit des règles ModSecurity, `.htaccess`, Lighttpd et Cloudflare qui bloquent les requêtes multipart portant `PHP_SESSION_UPLOAD_PROGRESS` ou envoyées hors des routes d'upload, ainsi qu'un extrait de Caddyfile qui désactive le suivi de progression sous FrankenPHP. Ces filtres peuvent être contournés : utilisez-les en plus de la mise à jour ou de la configuration, jamais à leur place.

## FAQ

### Mon application n'utilise pas les sessions PHP. Suis-je vulnérable ?

Oui. La fonction de suivi de progression ouvre elle-même la session, avant l'exécution de votre script et indépendamment de son contenu. Le dépassement mémoire de CVE-2026-109618 ne dépend pas non plus des sessions. Désactiver le suivi de progression réduit l'exposition ; seule une version corrigée de PHP la supprime.

### Un attaquant a-t-il besoin d'un compte ou d'un formulaire d'upload ?

Non. Sous mod_php, des requêtes `POST multipart/form-data` vers n'importe quel script PHP accessible suffisent. L'attaquant fournit lui-même le cookie de session et le champ `PHP_SESSION_UPLOAD_PROGRESS`.

### Désactiver session.upload_progress suffit-il ?

Non. Dans notre laboratoire, un fichier de configuration qui désactive le suivi de progression **et** relève `memory_limit` fait échouer l'exploit public dès sa première étape. Mais l'advisory est claire : ce réglage neutralise le scénario de session, pas CVE-2026-109618 ni les autres chemins de CVE-2026-109619 (avertissements de configuration, traces d'erreur de PHP 8.5). Ajoutez `memory_limit = -1`, `fatal_error_backtraces = Off` sur PHP 8.5, et planifiez la mise à jour.

### Quels droits obtient l'attaquant ?

Ceux du service qui exécute PHP, généralement `www-data` sous Debian et Ubuntu. L'attaquant peut alors lire le code et les fichiers de configuration du site (identifiants de base de données compris), déposer un webshell et chercher à élever ses privilèges.

### Comment savoir si mon serveur a été attaqué ?

Recherchez des processus enfants inhabituels sous les workers PHP, des erreurs fatales répétées dans les journaux PHP, et des fichiers récents dans les racines web, `/tmp` et `/var/tmp`. Des journaux silencieux ne suffisent pas à conclure.

## Conclusion

php2shell montre qu'une fonction oubliée peut suffire à exposer tout un parc. Le suivi de progression des téléversements ne sert qu'à afficher une barre de progression, et il est pourtant activé par défaut. Un état interne qui survit à une requête interrompue s'est transformé en exécution de commande pré-authentification.

En attendant la mise à jour, quelques lignes de configuration bloquent l'exploit public, sans protéger complètement. Le plus difficile est de savoir où tournent toutes vos versions de PHP, y compris celles que plus personne ne surveille.

**Vous voulez savoir si vos serveurs sont exposés à php2shell, ou valider un correctif avant de le déployer ?** Chez SSHack, nous menons ce type d'analyse de bout en bout : identification des versions exposées, reproduction en laboratoire et plan de remédiation priorisé. Écrivez-nous à [contact@sshack.me](mailto:contact@sshack.me).

## Références

- Advisory [GHSA-w8hw-w9fx-j79w](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w) (CVE-2026-109618) : « *RCE via OOM corruption* »
- Advisory [GHSA-6wmf-4rv5-p3rp](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp) (CVE-2026-109619) : « *RCE via stale global state* »
- Commit php-src [712e60f](https://github.com/php/php-src/commit/712e60f9edfd03f0960fc4fc3c2c375f42b90aa2) : « *Avoid state corruption via bailout - Minimal mitigation for EOL version* » (A. Le Blanc, I. Tovilo)
- Correctif des branches maintenues : [506e87f](https://github.com/php/php-src/commit/506e87fa7dcdd306975e5b8f8265ee03527aacbf) (PHP 8.4.27)
- [Versions de PHP supportées](https://www.php.net/supported-versions.php)
- Preuve de concept et mesures de contournement : [eness/php2shell-CVE-2026-109618-CVE-2026-109619-PoC](https://github.com/eness/php2shell-CVE-2026-109618-CVE-2026-109619-PoC)
- Backports communautaires pour les branches EOL : [Anton-Barinov/php2shell-patches](https://github.com/Anton-Barinov/php2shell-patches)
- Détection : [Neo23x0/process-watcher](https://github.com/Neo23x0/process-watcher)
