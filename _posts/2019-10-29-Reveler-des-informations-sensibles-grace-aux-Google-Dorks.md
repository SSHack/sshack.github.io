---
published: true
layout: post
title: "Révéler des informations sensibles grâce aux Google Dorks"
description: "Cet article présente les principales requêtes Google Dorks pour trouver des documents confidentiels, usurpation d'identité, vulnérabilité web"
lang: fr_FR
category: Google Dorks
---
![Google Dorks](/assets/images/2019-10-29-Reveler-des-informations-sensibles-grace-aux-Google-Dorks/illustration.jpg)

J’aimerais parler des Google Dorks. Rien qui ne soit pas déjà connu, mais j’en avais vaguement parlé sur l’article du [Spying Challenge](https://clement-bouder.fr/blog/ctf/2019/07/13/Spying-Challenge-leHack-se-prendre-pour-james-bond-le-temps-dun-challenge.html).

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

## Utilisation des Dorks pour de l’usurpation d’identité
On peut s’en servir tout d’abord pour trouver des documents d’identité par exemple sur des sites hébergeant des fichiers PDF. Dans le cas présent, les utilisateurs ont explicitement autorisé le site à héberger le document de manière publique et donc à être indexé :
`site:www.fichier-pdf.fr filetype:pdf intext:IBAN FR76`
[![Vol de RIB via des Google Dorks](/assets/images/2019-10-29-Reveler-des-informations-sensibles-grace-aux-Google-Dorks/google-dorks-iban.jpg)](/assets/images/2019-10-29-Reveler-des-informations-sensibles-grace-aux-Google-Dorks/google-dorks-iban.jpg)
Il ne reste qu’à l’usurpateur de choisir sa banque ou de spécifier carrément une certaine banque comme la Caisse d’Épargne (elle ou une autre, peu importe) et choisir son identité, particulier ou entreprise, il y a le choix :
```
site:www.fichier-pdf.fr intext:IBAN FR76*caisse*
```

Ce n’est qu’un RIB me dirait vous, il nous manque des relevés de comptes et factures ! C’est parti :
```
site:www.fichier-pdf.fr intext:*caisse*relevé*`
```

[![Vol de relevé bancaire via des Google Dorks](/assets/images/2019-10-29-Reveler-des-informations-sensibles-grace-aux-Google-Dorks/google-dorks-carte-identite.jpg)](/assets/images/2019-10-29-Reveler-des-informations-sensibles-grace-aux-Google-Dorks/google-dorks-carte-identite.jpg)

Je n’ai pas pris le temps de vérifier si les relevés et les RIB sont liés mais il n’est pas difficile en croisant les données de modifier les fichiers afin de constituer une véritable identité. D’ailleurs, ça serait « cool » d’avoir une carte vitale ou identité :

```
site:www.fichier-pdf.fr intext:*identite*
site:www.fichier-pdf.fr intext:*vitale*
```
[![Vol de carte d’identité via des Google Dorks](/assets/images/2019-10-29-Reveler-des-informations-sensibles-grace-aux-Google-Dorks/google-dorks-releves-bancaire.jpg)](/assets/images/2019-10-29-Reveler-des-informations-sensibles-grace-aux-Google-Dorks/google-dorks-releves-bancaire.jpg)

Bien sûr, il faudra quelques coups de Photoshop ou GIMP mais rien de bien compliqué. Je me suis arrêté au seuls résultats du site www.fichier-pdf.fr (que j’ai contacté pour signaler les fichiers), je vous laisse imaginer si j’avais cherché sur le web entier. Voilà comment en quelques minutes une personne qui à simplement envoyé en deux clics ses documents se retrouve piégée pour de longues années à essayer de prouver qu’elle n’a jamais contracté ce crédit, acheté cet article sur le Darkweb ou n’importe quoi d’autre. [Cet article du journal Le Parisien](http://www.leparisien.fr/faits-divers/vol-de-permis-de-conduire-je-vis-un-cauchemar-02-11-2019-8185152.php) en parle très bien. Le problème d’usurpation d’identité est long à traiter comme le rapporte [cet autre article](http://www.leparisien.fr/faits-divers/permis-de-conduire-cette-arnaque-qui-vous-fait-payer-la-contravention-d-un-autre-02-11-2019-8185149.php). Malheureusement, il arrive aussi que des fichiers contenant des données médicales soient en ligne par exemple.

## Utiliser les Dorks pour se renseigner sur une entreprise
Étant donné la puissance des recherches, nous pouvons utiliser les Dorks pour se renseigner sur une entreprise. Je ne donnerai pas la requête mais on peut par exemple cibler une entreprise et un type de fichier. On peut donc par exemple apprendre qu’une grande entreprise spécialisée dans l’aérospatiale, la défense, la sécurité et le transport terrestre vend des antennes, guides d’ondes et équipements connexes aux gardes côtes américains. Ce type de fichier mentionne, le prix, les références… Cette information pourrait-être utilisée pour créer un mail d’hameçonnage (phishing en Anglais) par exemple.

## Utilisation des Dorks pour trouver des failles de sécurité
Les Dorks peuvent aussi être utilisé pour trouver des failles de sécurité, je vais prendre l’exemple d’une faille de type Insecure Code Management. Pour faire simple, cette faille réside dans le fait que le code source soit accessible publiquement. Comment ? Les développeurs ont tout simplement hébergé le dépôt SVN ou GIT sur le serveur directement. Ainsi, à la racine du site nous trouverons le fichier .git et .git/HEAD.

```
intitle:"index of" ".git"
```

Et voilà, une liste de sites potentiellement vulnérables, on peut faire la même chose pour la configuration SVN ou tout autre idée qui viendrait à l’esprit. Très rentable pour un pirate malveillant de faire un script en Python qui exploite la faille de manière massive et automatique.

Je rappelle bien sûr que tout ce qui est écrit dans cet article est illégal selon l’utilisation que vous en faites. Vous pourrez également lire ces articles qui m’ont inspirés. [Use Google Search Operators to Find Elusive Information de null-byte.wonderhowto.com](https://null-byte.wonderhowto.com/how-to/use-google-search-operators-find-elusive-information-0198558/)

Korben à également sur son site [un article très intéressant sur le sujet ou vous trouverez une grande liste de Google Dorks.](https://korben.info/google-dorks-2019-liste.html)

Enfin, pour rester à jour sur les charges utiles (payload en Anglais), vous pouvez regarder de manière régulière la page de [exploit-db qui liste les derniers Dorks découverts](https://www.exploit-db.com/google-hacking-database).

## Comment se protéger de l’usurpation d’identité ?
Pour l’usurpation d’identité, c’est simple, il suffit de faire attention à ne pas envoyer ses fichiers sur n’importe quel site ou serveur. Bien vérifier que le site en question n’autorise pas l’indexation ni même la lecture seule avec un lien facile à devnier. Le mieux étant de chiffrer ses données et les stocker en local, mais bon à l’heure du stockage en ligne…

Si vous devez absolument envoyer vos documents en ligne ou à quelqu’un, vous pouvez éventuellement [ajouter un filigrane via le site ILovePDF](https://www.ilovepdf.com/fr/ajouter_filigrane_pdf).

Les données ne sont stockées que deux heures après le traitement selon la [FAQ du site](https://www.ilovepdf.com/fr/aide/foire-aux-questions), une fois votre traitement terminé, vous pouvez même le supprimer manuellement. Il ne reste donc que quelques secondes sur le serveur. Bien sûr, on est jamais à l’abri d’un serveur qui contient une porte dérobée avec quelqu’un qui volerait chaque document.

Pour la détection de failles, selon moi c’est moins évident. Il faut je pense organiser des audits de sécurité le plus régulièrement possible.
