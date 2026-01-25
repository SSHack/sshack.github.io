---
published: true
layout: post
title: "Géolocaliser un PC grâce à PowerShell"
description: "Cet article décrit comment lors d'une opération de RedTeam ou APT, il est possible de géolocaliser précisément grâce à PowerShell la cible compromise."
lang: fr_FR
category: OSINT,geolocalisation,powershell
---
![Géolocaliser un PC grâce à PowerShell](/assets/images/2020-11-18-Geolocaliser-un-pc-grace-a-powershell/illustration.jpg)

Lorsqu'un PC est compromis, il peut-être intéressant de connaître sa géolocalisation. Géolocaliser un équipement peut également être utile pour des challenges OSINT.

Enfin, la géolocalisation peut permettre de retrouver son PC volé. Cependant, dans ce cas il est préférable de suivre les [recommandations de Microsoft](https://support.microsoft.com/fr-fr/account-billing/localiser-et-verrouiller-un-appareil-windows-perdu-890bf25e-b8ba-d3fe-8253-e98a12f26316) qui prévoient des fonctions natives et d'alerter les autorités compétentes.

Dans tous les cas, il est nécessaire d'avoir un accès distant au PC, qu'il soit connecté à internet et enfin, pouvoir exécuter du code PowerShell.


Beaucoup de méthodes pour localiser un PC se basent sur l'adresse IP. Cette méthode n'est pas fiable, en effet, elle permet au mieux d'avoir un niveau de précision de l'ordre de la ville. Dans mon cas, tous les sites de géolocalisation d'IP me proposent un point GPS à plus de 700 KM de ma localisation réelle...

La première technique que je propose ici se base sur...le GPS intégré. Oui, on ne réinvente pas la roue !

La deuxième méthode est quant à elle un petit peu différente et doit être utilisée dans le cas où la méthode du GPS ne fonctionnerait pas. Elle se base sur l'analyse des bornes voisines du PC à localiser.

## Localiser via le GPS au travers de l'API Windows
Cette méthode utilise donc l'API de Windows. C'est la méthode la plus simple et la plus répandue. C'est comme cela qu'un site détectera votre position par exemple, tout simplement en appelant l'API du navigateur qui lui, utilise l'API `GeoCoordinateWatcher` de Windows.
L'idée est donc de déclarer un `GeoWatcher` avec une précision de détection à `1` lors de l'instanciation du `GeoWatcher`. Ce paramètre correspond au niveau de précision `High`. Il faut ensuite démarrer le `GeoWatcher`, attendre 3 secondes qu'il détecte la position et sélectionner la Latitude et Longitude. Le code est donné en une ligne :
```powershell
$GeoWatcher = New-Object System.Device.Location.GeoCoordinateWatcher(1); $GeoWatcher.Start(); Start-Sleep -Milliseconds 3000; $GeoWatcher.Position.Location | Select Latitude,Longitude
```
Le résultat de la commande est alors le suivant :
[![Résultat de la commande PowerShell GeoCoordinateWatcher](/assets/images/2020-11-18-Geolocaliser-un-pc-grace-a-powershell/resultat_commande_geowatcher.jpg)](/assets/images/2020-11-18-Geolocaliser-un-pc-grace-a-powershell/resultat_commande_geowatcher.jpg)

Il est alors possible de coller les coordonnées directement dans Google Maps, par exemple en remplaçant la virgule par un point. Normalement, la localisation est assez précise. Dans mon cas, il y a une différence de 4 ou 5 mètres à vol d'oiseau.

*PS : Par soucis de confidentialité, j'ai modifié les coordonnées qui apparaissent sur l'image, je n'habite pas en pleine Mer de Karar en Russie :)*

## Localiser via les bornes voisines
La deuxième méthode est différente, elle peut-être utilisée même si le PC n'a pas de puce GPS. En effet, en analysant les bornes Bluetooth et Wifi qui sont aux alentours du PC en question, il est possible de "trianguler" ce dernier.
### Récupération des bornes voisines
Pour cela, il faut en premier lieu récupérer les bornes voisines via une commande PowerShell. La commande `netsh` avec un filtre sur le BSSID sera utilisée :
```powershell
netsh wlan show network mode=bssid | Select-String -Pattern BSSID
```
Le résultat de la commande est alors le suivant :
[![Résultat de la commande PowerShell netsh](/assets/images/2020-11-18-Geolocaliser-un-pc-grace-a-powershell/resultat_commande_netsh.jpg)](/assets/images/2020-11-18-Geolocaliser-un-pc-grace-a-powershell/resultat_commande_netsh.jpg)

*PS : Par soucis de confiendialité, j'ai aussi modifié les résultats de la commande.*

### Récupération des périphériques Bluetooth apparairés
Les périphériques Bluetooth doivent également être listés. Je n'ai pas trouvé d'autre moyen que d'utiliser la base de registre Windows. Le registre Windows sert à stocker des paramètres et informations sur le système. Le chemin `HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Services\DeviceAssociationService\State\Store\` stocke les informations sur les périphériques Bluetooth appairés.
Une requête PowerShell pour lister les noeuds peut ainsi être effectuée :  
```powershell
Get-ChildItem -Path HKLM:\SYSTEM\ControlSet001\Services\DeviceAssociationService\State\Store\ | Select-String -Pattern Bluetooth
```
Le résultat est alors le suivant :
[![Résultat de la commande PowerShell registre](/assets/images/2020-11-18-Geolocaliser-un-pc-grace-a-powershell/resultat_commande_registre.jpg)](/assets/images/2020-11-18-Geolocaliser-un-pc-grace-a-powershell/resultat_commande_registre.jpg)

La partie masquée en rouge représente l'adresse MAC de votre carte Bluetooth.
La partie masquée en vert représente les adresses MAC des périphériques qui sont apparairés avec le PC cible.

### Localisation des équipements via leur adresse BSSID/MAC
La deuxième étape consiste à localiser les équipements concernés. Pour cela, un excellent site internet existe : [Wigle](https://wigle.net/)

Selon Wikipédia :
>WIGLE (acronyme de Wireless Geographic Logging Engine) est un projet de géolocalisation collaboratif en ligne dont le but est de constituer une base de données libre sur les points d'accès Wi-Fi et les antennes-relais de téléphonie mobile dans le monde.

Il suffit de se créer un compte gratuit pour pouvoir afficher le formulaire de recherche par BSSID ou SSID. Si un des BSSID ou SSID entré est référencé sur le site, la localisation du PC est alors connu. Il suffit de cliquer sur `map` et le point GPS apparaît...
[![Résultat de la recherche Wigle](/assets/images/2020-11-18-Geolocaliser-un-pc-grace-a-powershell/recherche_wigle.jpg)](/assets/images/2020-11-18-Geolocaliser-un-pc-grace-a-powershell/recherche_wigle.jpg)
