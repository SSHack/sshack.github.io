---
published: true
layout: post
title: "Créer un partage NFS sous Linux"
description: "Cet article présente comment créer un dossier de partage en réseau local en utilisant le protocole Network File System (NFS) sous Linux de manière sécurisée."
lang: fr_FR
category: NFS
---
![Linux NFS](/assets/images/2017-11-11-Creer-un-partage-nfs-sous-linux/illustration.png)

Il faut tout d’abord comprendre que pour créer un partage NFS (Network File System) sous Linux Ubuntu, il faut un serveur et un ou plusieurs clients. Notre serveur servira à gérer les clients qui se connectent à ce dernier. Il contient un dossier partagé et un fichier de configuration. Les clients qui se connectent au serveur auront accès en lecture aux fichiers contenu dans le dossier du serveur. Il pourront aussi selon la configuration que vous lui indiquez écrire dans ce dossier. Veuillez noter que cet article est écrit grâce à la documentation officielle que je vous conseille fortement de lire : https://help.ubuntu.com/community/SettingUpNFSHowTo.

## La création du serveur
La première étape est de créer le serveur car il est indispensable pour qu’un client puisse se connecter. Il faut tout d’abord installer le paquet qui permet de lancer le serveur :
```bash
sudo apt-get install nfs-kernel-server
```

On va ensuite créer le dossier à partager, partant du postulat que l’on est dans `/home/NomUtilisateur/`:
```bash
sudo mkdir Partage
```

**Attention** : Il faut créer le dossier de partage avec le même utilisateur connecté, bien vérifier les droits du dossier.
Il faut maintenant éditer le fichier `nfs-kernel-server` grâce à la commande
```bash
sudo gedit /etc/default/nfs-kernel-server
```
et remplacer `NEED_SVCGSSD=""` par `NEED_SVCGSSD=no # no is default`.

Nous allons à nouveau devoir éditer un fichier, cette fois pour configurer les autorisations des clients. Le fichier `/etc/exports` doit être édité en mode utilisateur connecté et non en root. La commande doit donc être celle-ci :
```bash
gedit /etc/exports
```
Ajouter la ligne des autorisations à la fin du fichier :
```bash
/home/NomUtilisateur/Partage <IPduClient> (rw,fsid=0,no_subtree_check,async,insecure)
```

Les options doivent être utilisées selon la configuration souhaitée.
`rw` signifie que le client à les droits de lecture et d’écriture.
`no_subtree_check` signifie que la vérification des droits sur le partage des sous dossiers n’est pas effectuée.
`async` signifie que l’intégrité des transferts n’est pas vérifié par le serveur nfs, il y a un gain des performances.
L’adresse IP donnée doit être celle du ou des client(s), un astérisque peut être ajouté à la place d’un octet pour autoriser toutes les IP. Ce qui donnerait par exemple `192.168.0.*`
Exécuter la commande suivante pour redémarrer le serveur :
```bash
sudo service nfs-kernel-server restart
```

## La création du client
Exécuter la commande suivante pour installer le client :
```bash
sudo apt-get install nfs-common
```

Exécuter la commande suivante pour vérifier que le serveur partage bien le dossier demandé. L’adresse du serveur avec le dossier partagé devrait apparaître :
```bash
showmount -e adresseDuServeur
```

Exécuter la commande suivante pour monter le disque partagé :
```bash
sudo mount -t nfs4 -o proto=tcp,port=2049 adresseDuServeur:/ /home/utilisateurClient/DossierPartage
```


## Conclusion
Le dossier est maintenant accessible depuis le client. Si des problèmes d’accès sont rencontrés au montage, il faut vérifier les adresses IP configurées dans le serveur mais aussi les droits sur le dossier partagé côté serveur.
Je rappelle qu’il est fortement conseillé de lire la documentation officielle citée plus haut pour configurer correctement le serveur. Ce pense bête a pour but de lancer rapidement une installation mais demande une configuration plus poussée pour sécuriser l’installation.
