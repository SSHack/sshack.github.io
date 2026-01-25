---
published: true
layout: post
title: "Créer son propre environnement d’analyse multi-antivirus"
description: "Cet article explique comment créer un service comme VirusTotal afin de ne pas partager avec les éditeurs d'antivirus les fichiers analysés"
lang: fr_FR
category: Malware
---

Dans cet article je vais vous expliquer comment mettre en place votre propre système d’analyse multi-antivirus à l’instar de VirusTotal, MetaDefender ou encore Jotti. J’ai décidé de faire mon propre système car je ne souhaite pas partager avec le site internet ou les éditeurs d’antivirus les fichiers que j’analyse.

Le projet [Malice](https://github.com/maliceio/malice/) va grandement nous faciliter la tâche puisque ce projet à pour vocation de mettre à disposition sous forme d’image Docker plusieurs antivirus.

L’idée est donc la suivante. Installer Ubuntu sur une machine virtuelle, installer Malice et mettre à jour tous les moteurs antivirus puis déconnecter notre plateforme d’internet (par mesure de sécurité et de vie privée).

## Première étape : Installer Docker
Je pars du postulat que vous venez d’installer une machine virtuelle Ubuntu 18.10 (version Bureau et installation minimale suffisent). Personnellement, j’utilise [VirtualBox](https://www.virtualbox.org/) qui est libre et Open Source. Il faut allouer 4 GB de mémoire virtuelle au minimum à la machine virtuelle.

Pour installer Docker, ouvrir un terminal et exécuter les commandes suivantes :
```bash
sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - # Ajout des clés GPG de Docker
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" # Ajout du dépôt Docker dans la liste des dépôt Ubuntu
sudo apt-get update # Mise à jour du contenu des dépôts Ubuntu
sudo apt-get install docker docker.io
sudo usermod -aG docker $USER # Ajout de Docker en tant qu'utilisateur
sudo reboot now # Attention, Ubuntu va redémarrer, bien sauvegarder tous vos travaux.
```

## Deuxième étape : Installer Malice
Malice est disponible sur [GitHub](https://github.com/maliceio/malice/), il faut exécuter les commandes suivantes :
```bash
wget https://github.com/maliceio/malice/releases/download/v0.3.11/malice_0.3.11_linux_amd64.tar.gz -O /tmp/malice.tar.gz
# Cette commande télécharge la dernière version à l'heure où j'écris cet article
# Il faut prendre la dernière version sur la page GitHub du projet Malice
sudo tar -xzf /tmp/malice.tar.gz -C /usr/local/bin/
malice plugin update --all # Mise à jour de tous des plugins
```
Vous pouvez maintenant éteindre votre machine virtuelle et la déconnecter d’internet en désactivant la carte réseau. De retour dans le système d’exploitation, vous pourrez lancer une analyse d’un fichier EICAR par exemple. La signature du fichier EICAR est connu de tous les antivirus, c’est un fichier qui a pour but de tester le fonctionnement d’un antivirus.

Enregistrez dans un fichier eicar.com le contenu suivant :
```
X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
```
Lancer une analyse de ce fichier avec la commande : `malice scan ./eicar.com`
Le résultat de l’analyse devrait vous afficher un tableau avec tous les résultats des antivirus :
```
...
time="2018-12-30T13:13:22Z" level=fatal msg="signal: killed" category=av path=/malware/131f95c51cc819465fa1797f6ccacf9d494aaaff46fa3eac73ae63ffbdfd8267 plugin=bitdefender
#### F-Secure
| Infected      | Result      | Engine      | Updated      |
|:-------------:|:-----------:|:-----------:|:------------:|
| true | EICAR-Test-File (not a virus) | 11.10 build 68 | 20181224 |

#### Sophos
| Infected      | Result      | Engine      | Updated      |
|:-------------:|:-----------:|:-----------:|:------------:|
| true | EICAR-AV-Test | 5.53.0 | 20181224 |
...
```

Il se peut qu’une erreur liée à Elasticsearch apparaisse. Il suffit d’augmenter la zone de mémoire et vider les données du conteneur malice avec la commande suivante :  
```bash
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf && sudo sysctl -w vm.max_map_count=262144 && sudo docker rm -f malice && reboot now
```

Attention, il est nécessaire de mettre à jour régulièrement vos moteurs d’analyse. Pour cela, il suffit de réactiver votre carte réseau Virtual Box et de lancer la commande suivante sous Ubuntu :
```bash
malice plugin update --all # Mise à jour de tous des plugins
```
