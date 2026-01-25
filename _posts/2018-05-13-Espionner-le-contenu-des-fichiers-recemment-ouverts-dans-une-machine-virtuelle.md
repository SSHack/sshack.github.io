---
published: true
layout: post
title: "Espionner le contenu des fichiers récemment ouverts dans une machine virtuelle"
description: "Cet article présente comment extraire des informations sensibles dans la mémoire RAM stockée d'une machine VirtualBox."
lang: fr_FR
category: Machine Virtuelle
---
![Flux de données : illustration](/assets/images/2018-05-13-Espionner-le-contenu-des-fichiers-recemment-ouverts-dans-une-machine-virtuelle/illustration.jpg)

Bonjour,
dans cet article j’aimerais partager avec vous une récente découverte que j’ai fait sur la fonctionnalité sauvegarder l’état, rien de bien transcendant mais ça peut être problématique selon certain cas.

## Le contexte
En créant une machine virtuelle l’autre jour, je me suis rendu compte que la configuration de VirtualBox peut être dangereuse dans certains cas. Lorsque l’on regarde l’emplacement des dossiers des instantanés, on se rend compte que par défaut ils se placent dans le répertoire utilisateur (non chiffré).

Ce dossier peut être accessible en démarrant sur un autre système d’exploitation où en branchant le disque dur comme un périphérique externe.

## Le test
J’ai donc décidé d’explorer un peu ce fichier sur une machine de test (VM Ubuntu) car je me suis dit que je pourrais y trouver des choses intéressantes…
Lorsque vous éteignez la machine en mode sauvegarde de l’état pour gagner du temps à l’allumage par exemple, une sauvegarde complète de tout ce qui est en mémoire vive est écrite dans un fichier .sav (sauvé dans les instantanés). J’ai donc crée un fichier texte de test qui simule le cas où Eclipse est ouvert avec tous les fichiers source ouvert d’un programme ou un fichier texte qui contient du contenu sensible. En explorant ce fameux fichier à l’aide d’un éditeur hexadécimal, on trouve pas mal d’informations notamment comme je le pensais, le contenu lui-même des fichiers et son emplacement puisqu’ils sont stockés temporairement en mémoire.

Il est ainsi possible de voire l'emplacement absolu du fichier texte directement en mémoire :

[![Emplacement absolu du fichier texte](/assets/images/2018-05-13-Espionner-le-contenu-des-fichiers-recemment-ouverts-dans-une-machine-virtuelle/chemin-fichier-en-memoire.png)](/assets/images/2018-05-13-Espionner-le-contenu-des-fichiers-recemment-ouverts-dans-une-machine-virtuelle/chemin-fichier-en-memoire.png)

Il en est de même pour le contenu en claire du fichier texte :

[![Contenu en claire du fichier texte](/assets/images/2018-05-13-Espionner-le-contenu-des-fichiers-recemment-ouverts-dans-une-machine-virtuelle/contenu-fichier-en-memoire.png)](/assets/images/2018-05-13-Espionner-le-contenu-des-fichiers-recemment-ouverts-dans-une-machine-virtuelle/contenu-fichier-en-memoire.png)

Tout le contenu est disponible, cela pourrait être un code source. Ce qui veut dire qu’un attaquant en ayant un accès physique à la machine non déchiffrée pourrait explorer quelques fichiers, ça peut se faire aussi avec un accès distant en volant ce fichier. Je n’ai pas eu le temps de chercher mais je ne serais pas surpris de pouvoir récupérer le mot de passe de session de Ubuntu.

## Comment sécuriser l’installation ?
Il y a un moyen très simple de palier à ce problème. Il faut modifier le dossier des instantanés et le mettre dans un conteneur TrueCrypt.

Pour se faire, il faut aller dans les paramètres de la machine virtuelle :

`Onglet général` -> `Avancé` -> `Dossier des instantannés` (rentrer le chemin d’un dossier qui est dans votre conteneur TrueCrypt actuellement déchiffré)

Ainsi, vous serez obligé de déchiffrer votre conteneur TrueCrypt pour avoir accès à ce fichier.

Vous pouvez aussi tout simplement arrêter d’utiliser cette fonctionnalité.
