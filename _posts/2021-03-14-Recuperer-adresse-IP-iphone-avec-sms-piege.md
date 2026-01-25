---
published: true
layout: post
title: "Récupérer l'adresse IP d'un iPhone en envoyant un SMS piégé"
description: "Cet article décrit comment récupérer l'adresse IP d'un iPhone en envoyant un SMS piégé."
lang: fr_FR
category: iphone,ios,hack,adresseIP,SMS
---
![Récupérer IP iPhone avec SMS piégé](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/illustration.jpg)

Cet article décrit comment faire **fuiter l'adresse IP externe d'un iPhone** (et donc le **géolocaliser** plus ou moins précisément) en envoyant un **SMS piégé**.
L'application iMessage native d'iOS offre une fonctionnalité de prévisualisation du **contenu des liens** lorsqu'un contact est enregistré dans l'application Contacts.
La prévisualisation affiche le titre de la page, l'image et une description courte.
Certains services comme [IPLogger](https://iplogger.org) permettent de sauvegarder l'adresse IP d'un utilisateur qui clique sur un lien. L'utilisateur piégé se retrouve alors redirigé vers la page d'origine sans même se rendre compte qu'il est passé par une page piégée.

## Exploitation
Un attaquant qui est enregistré dans la liste de contact peut forger une page piégée et l'envoyer à sa victime. La page piégé redirigera vers [cette image de chat](https://www.zooplus.fr/magazine/wp-content/uploads/2019/06/comprendre-le-langage-des-chats.jpg).

[![Image piégée](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/no_previsualisation.PNG)](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/no_previsualisation.PNG)

Note : Le site iplogger.org pourrait être changé en utilisant un site choisi pour créer un scénario de phishing pour encourager l'utilisateur à cliquer sur le lien de prévisualisation. Par exemple, un attaquant pourrait utiliser `message-apple.org`.

Si la victime clique sur `Toucher pour charger l'aperçu`, le contenu est chargé **sans avoir à visiter la page** :

[![Prévisualisation sans cliquer](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/previsualisation.PNG)](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/previsualisation.PNG)

Du côté de l'attaquant, **l'adresse IP externe de la victime** est visible :

[![Adresse IP de la victime](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/IP.PNG)](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/IP.PNG)

L'attaquant peut alors voir l'adresse IP de la victime, son fournisseur d'accès internet, localiser approximativement ou précisément selon les outils en possession de l'attaquant...
Dans le cas présent, l'agent utilisé est `bot` ce qui prouve que l'utilisateur n'a pas cliqué sur le lien. Autrement, l'agent serait `Safari`.
Afin de mener à bien une telle attaque, l'attaquant doit au préalable être enregistré dans les contacts de la victime. Cependant, ce prérequis peut facilement être contourné via une autre attaque qui est le spoofing de SMS avec des services comme https://www.spoofbox.com/fr/appli/faux-sms.
Deux autres points importants :
- JavaScript n'est pas exécuté lors de la prévisualisation du lien ce qui limite l'impact de cette attaque.
- L'agent du navigateur est modifié pour ne pas faire fuiter d'informations concernant les versions d'iOS ou macOS (si le message est ouvert sur iMessage pour macOS) : `Bot: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0`

Autre point (qui m'a convaincu de le signaler à Apple) est que cette petite astuce n'est pas exploitable sur Android car l'application message de Google requête depuis leur serveur la prévisualisation du message. L'adresse IP réelle de l'utilisateur ne peut donc pas fuiter.

## Impact CVSS
Si je devais définir un imact CVSS, je l'aurais classé comme suit :

[![Impact CVSS](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/CVSS.PNG)](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/CVSS.PNG)

Cependant, il faut bien garder à l'esprit qu'après échanges avec le département sécurité de Apple, comme je m'y attendais, leur réponse à été que l'application fonctionne comme il se doit (et ils ont raison) :
[![Email de Apple](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/email.PNG)](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/email.PNG)


## Comment empêcher la fuite d'adresse IP de l'iPhone
La requête de prévisualisation devrait être envoyée par les serveurs d'Apple pour préserver l'anonymat de l'utilisateur.

## Quels sont les version d'iOS affectées
Le test a été effectué sur un iPhone 7 en version 14.4.

[![Version d'iOS affectée](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/details.PNG)](/assets/images/2021-03-14-Recuperer-adresse-IP-iphone-avec-sms-piege/details.PNG)