---
published: true
layout: post
title: "Sortir du mode de récupération sur un LG G6"
description: "Cet article présente comment sortir du mode de récupération du LG G6 en cas de blocage lors de l'instalation d'une custom ROM."
lang: fr_FR
category: Custom ROM
---
![LG G6](/assets/images/2017-12-28-Sortir-du-mode-de-recuperation-sur-un-lg-g6/illustration.png)

Il arrive parfois lors de l’installation d’une ROM personnalisée comme **Lineage OS** qu’un smartphone soit bloqué en mode récupération (Recovery Mode). Lors du démarrage, le téléphone démarre obligatoirement sur le **custom recovery TWRP** par exemple. Il est alors impossible d’en sortir même en réinstallant le système d’exploitation ou le custom recovery.

Une solution existe, réinstaller le système d’exploitation de base. Cette solution aura pour effet de remettre votre téléphone comme à sa sortie d’usine mais aussi supprimera le custom recovery.

Pour se faire, il est nécessaire d’avoir une machine qui tourne sous Windows (éviter les machines virtuelles ce qui pourrait engendrer des problèmes de pilotes).

Il faut en premier lieu installer les pilotes des smartphones LG disponible [sur cette page](http://www.lg.com/us/support/product-help/CT10000025-20150179827560-downloaded-apps).

Il faudra également installer le logiciel **LGUP de LG** en version 1.14 (à l’heure où j’écris cet article) qui permet de mettre à jour ou réinitialiser le système d’exploitation du smartphone. Le logiciel est disponible [sur cette page](https://forum.xda-developers.com/lg-g5/development/uppercut-lgup-loader-g5-variants-t3511295)

Sur la même page, il faut télécharger le logiciel **UPPERCUT** qui permet de résoudre certains problèmes de pilote. Dans certains cas, si vous n’utilisez pas UPPERCUT, le téléphone n’apparaîtra pas dans la liste des smartphones détectés par LGUP.

Enfin, le dernier fichier à télécharger est le fichier KDZ qui est en fait l’image du système d’exploitation de base. Vous pourrez télécharger la version qui vous convient [sur cette page](https://lg-kdz-firmware.com/lg-g6-firmware/492.html)

Une fois tous les fichiers téléchargés et installés, le plus gros du travail est fait.

Il vous faut **démarrer en mode Download**. Pour ce faire, **éteindre le téléphone**. **Rester appuyé quelques secondes** sur la **touche volume haut** et **brancher en même temps** le téléphone à l’ordinateur. Le téléphone est alors en mode Download.

Il ne reste qu’à lancer UPPERCUT en mode administrateur, il exécutera LGUP et votre téléphone apparaîtra dans la listes des téléphones branchés au port COM. Vous pouvez ensuite sélectionner **refurbish** ou **upgrade**, il faut ensuite choisir le fichier KDZ sur votre machine et cliquer sur `Install`.

Une fois terminé, votre téléphone sera comme neuf.
