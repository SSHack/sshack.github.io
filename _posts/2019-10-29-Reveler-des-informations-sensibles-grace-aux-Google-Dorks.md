---
published: true
layout: post
title: "Révéler des informations sensibles grâce aux Google Dorks"
description: "Cet article présente les principales requêtes Google Dorks, les risques d'exposition de documents personnels et de vulnérabilités web, et comment s'en protéger."
categories: [CYBERSÉCURITÉ, OSINT]
tags: [google dorks, google hacking, osint, reconnaissance, fuite de données, cybersécurité, hacking éthique, recherche d'information, dorking, sécurité web]
image: /assets/images/2019-10-29-Reveler-des-informations-sensibles-grace-aux-Google-Dorks/illustration.jpg
---

J’aimerais parler des Google Dorks. Rien qui ne soit pas déjà connu, mais j’en avais vaguement parlé sur l’article du [Spying Challenge](/posts/Spying-Challenge-leHack-se-prendre-pour-james-bond-le-temps-dun-challenge/).

De quoi parle t-on quand on emploie le terme Google Dorks, selon [Wikipédia](https://fr.wikipedia.org/wiki/Google_hacking) :

*Le Google hacking est une technique consistant à utiliser un moteur de recherche, généralement Google, en vue de chercher des vulnérabilités ou de récupérer des données sensibles. Cette technique s’appuie sur les résultats de l’exploration et de l’indexation des sites internet par le robot Googlebot.*

Pour résumer, on pourrait dire qu’un Dork est un filtre, une sorte d’entonnoir qui va nous permettre d’arriver à des résultats très précis. Voici la liste basique des filtres :


| Opérateur                  | Utilité                                                                          | Exemple                                   |
|----------------------------|----------------------------------------------------------------------------------|-------------------------------------------|
| Guillemets :  » «          | Retourne les résultats qui contiennent exactement la chaîne                      | « Jean-Baptiste Poquelin »                |
| Trait d’union : –          | Exclu les résultats qui contiennent la chaîne                                    | Jean-Baptiste Poquelin -vente             |
| site:                      | Retourne les résultats du site en paramètre                                      | site:cultura.com Jean-Baptiste Poquelin   |
| Astérisque : *             | Retourne les résultats où l’astérisque peut être n’importe quel caractère        | * Poquelin                                |
| inurl:                     | Retourne les résultats qui contiennent l’URL indiquée                            | inurl:cultura.com poquelin                |
| intitle:                   | Retourne les résultats qui contiennent le titre indiqué                          | intitle:Jean-Baptiste poquelin biographie |
| inurl:.extension           | Retourne les résultats dont l’URL termine par le paramètre passé                 | inurl:.fr Jean-Baptiste Poquelin          |
| OR                         | Retourne les résultats pour l’une ou l’autre des requêtes                        | « Jean-Baptiste Poquelin » OR « Molière » |
| define:                    | Retourne les résultats correspondants à des définitions                          | define:Dramaturge                         |
| :before(Date) :after(Date) | Retourne les résultats datant d’avant la date indiquée ou après la date indiquée | « Jean-Baptiste Poquelin » after:2018     |
| filetype:                  | Retourne les résultats au format indiqué                                         | « Jean-Baptiste Poquelin » filetype:pdf   |

Maintenant que les bases sont posées, seule l’imagination (et le contenu référencé bien entendu) de la personne effectuant des recherches va limiter les résultats.

## Documents personnels exposés : un risque d’usurpation d’identité
Les Dorks montrent aussi à quel point des documents personnels peuvent se retrouver indexés. Sur les sites d’hébergement de fichiers PDF, de nombreux utilisateurs publient sans le savoir des RIB, des relevés bancaires ou des pièces d’identité : en autorisant l’hébergement public, ils autorisent aussi leur indexation par les moteurs de recherche. Une simple requête combinant l’opérateur `site:` et un mot-clé comme `IBAN` suffit à faire remonter ce type de fichiers.

Nous ne détaillons volontairement pas la démarche : cette section vise uniquement à sensibiliser au risque. Lors de ces recherches, les fichiers trouvés ont été signalés à l’hébergeur concerné. Pour une victime, les conséquences peuvent durer des années : il faut prouver qu’on n’a jamais contracté tel crédit ou effectué tel achat. [Cet article du journal Le Parisien](https://www.leparisien.fr/faits-divers/vol-de-permis-de-conduire-je-vis-un-cauchemar-02-11-2019-8185152.php) en parle très bien, et le problème est long à traiter comme le rapporte [cet autre article](https://www.leparisien.fr/faits-divers/permis-de-conduire-cette-arnaque-qui-vous-fait-payer-la-contravention-d-un-autre-02-11-2019-8185149.php). Des fichiers contenant des données médicales se retrouvent parfois aussi en ligne.

## Utiliser les Dorks pour se renseigner sur une entreprise
Étant donné la puissance des recherches, nous pouvons utiliser les Dorks pour se renseigner sur une entreprise. Je ne donnerai pas la requête mais on peut par exemple cibler une entreprise et un type de fichier. On peut donc par exemple apprendre qu’une grande entreprise spécialisée dans l’aérospatiale, la défense, la sécurité et le transport terrestre vend des antennes, guides d’ondes et équipements connexes aux gardes côtes américains. Ce type de fichier mentionne, le prix, les références… Cette information pourrait-être utilisée pour créer un mail d’hameçonnage (phishing en Anglais) par exemple.

## Utilisation des Dorks pour trouver des vulnérabilités
Les Dorks peuvent aussi être utilisé pour trouver des vulnérabilités, je vais prendre l’exemple d’une vulnérabilité de type Insecure Code Management. Pour faire simple, cette vulnérabilité réside dans le fait que le code source soit accessible publiquement. Comment ? Les développeurs ont tout simplement hébergé le dépôt SVN ou GIT sur le serveur directement. Ainsi, à la racine du site nous trouverons le fichier .git et .git/HEAD.

```
intitle:"index of" ".git"
```

Et voilà, une liste de sites potentiellement vulnérables, on peut faire la même chose pour la configuration SVN ou tout autre idée qui viendrait à l’esprit. Très rentable pour un pirate malveillant de faire un script en Python qui exploite la vulnérabilité de manière massive et automatique.

Je rappelle bien sûr que tout ce qui est écrit dans cet article est illégal selon l’utilisation que vous en faites. Vous pourrez également lire ces articles qui m’ont inspirés. [Use Google Search Operators to Find Elusive Information de null-byte.wonderhowto.com](https://null-byte.wonderhowto.com/how-to/use-google-search-operators-find-elusive-information-0198558/)

Korben à également sur son site [un article très intéressant sur le sujet ou vous trouverez une grande liste de Google Dorks.](https://korben.info/google-dorks-2019-liste.html)

Enfin, pour rester à jour sur les charges utiles (payload en Anglais), vous pouvez regarder de manière régulière la page de [exploit-db qui liste les derniers Dorks découverts](https://www.exploit-db.com/google-hacking-database).

## Comment se protéger de l’usurpation d’identité ?
Pour l’usurpation d’identité, c’est simple, il suffit de faire attention à ne pas envoyer ses fichiers sur n’importe quel site ou serveur. Bien vérifier que le site en question n’autorise pas l’indexation ni même la lecture seule avec un lien facile à devnier. Le mieux étant de chiffrer ses données et les stocker en local, mais bon à l’heure du stockage en ligne…

Si vous devez absolument envoyer vos documents en ligne ou à quelqu’un, vous pouvez éventuellement [ajouter un filigrane via le site ILovePDF](https://www.ilovepdf.com/fr/ajouter_filigrane_pdf).

Les données ne sont stockées que deux heures après le traitement selon la [FAQ du site](https://www.ilovepdf.com/fr/aide/foire-aux-questions), une fois votre traitement terminé, vous pouvez même le supprimer manuellement. Il ne reste donc que quelques secondes sur le serveur. Bien sûr, on est jamais à l’abri d’un serveur qui contient une porte dérobée avec quelqu’un qui volerait chaque document.

Pour la détection de vulnérabilités, selon moi c’est moins évident. Il faut je pense organiser des audits de sécurité le plus régulièrement possible.
