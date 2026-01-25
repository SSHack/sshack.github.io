---
published: true
layout: post
title: "Spying Challenge à leHack 2019 : Se prendre pour James Bond le temps d’un challenge"
description: "Cet article présente le challenge Spying Challenge qui s'est déroulé en 2019. Ce challenge est un challenge, phishing, espionnage lors de la conférence leHack"
lang: fr_FR
category: CTF
---
![Spying Challenge 2019](/assets/images/2019-07-13-Spying-Challenge-leHack-se-prendre-pour-james-bond-le-temps-dun-challenge/illustration.png)

J’ai eu la chance de participer à l’évènement [leHack 2019](https://lehack.org/fr), nouveau nom de La Nuit du Hack. Nous nous sommes lancés avec mon association [Hack In Provence](https://www.hackinprovence.fr/) dans le [Spying Challenge 2019](https://spyingchallenge.com/). Cette compétition a pour but de mettre à l’épreuve vos talents en matière d'**OSINT (renseignement d'origine sources ouvertes)**, **hack**, **tracking**, **social engineering**, **Lockpicking** (crochetage de serrure) et **intrusion physique**. Une panoplie de compétences passionnantes à développer histoire de se prendre pour James Bond le temps du challenge.

Le challenge était divisé en 2 phases, la première phase consistait à rechercher des renseignements sur l’entreprise nommée [Lictor](https://lictor.fr/) (entreprise fictive créée pour le challenge). Le but de l’enquête était de connaître absolument tout de cette organisation (ses activités, la vie de ses employés, leur mobilité géographique, etc.) afin de déjouer un potentiel coup d’état. Nous devions également enquêter sur un certain Gustave Leproleau qui selon les sources entretenait des relations avec l’entreprise en question.

La deuxième étape se déroulait pendant leHack et réunissait les 16 meilleures équipes.

Pour cette première partie, nous avons décidé de découper notre recherche d’informations en trois parties :
1. Recherche d’informations sur le site internet
2. Recherche d’informations via les moteurs de recherche
3. Social engineering sur l’entreprise et le réseau de Gustave Leproleau (les bérets tout court)

## La recherche d’informations sur le site
Cette étape n’a pas été trop difficile pour moi car j’ai pu reprendre des techniques utilisées lors des tests d’intrusion. J’ai rapidement trouvé un répertoire caché où se trouvaient des photos satellites. Il m’a fallu développer un script faisant du fuzzing sur les fichiers pour tenter de trouver d’autres fichiers cachés. N’étant pas fan de stéganographie, des membres de mon équipe se sont occupés de cette partie mais l’analyse n’a rien donné. Il nous a fallu analyser toutes les informations trouvées sur la vidéo :
[![Lictor vidéo de promotion](https://i.vimeocdn.com/video/790156485.jpg)](https://vimeo.com/341519795 "Lictor vidéo de promotion")

Ainsi, on récupère des informations sur la plaque d’immatriculation, on aperçoit une voiture diplomatique de Macédoine. On voit également des bons de commande pour l’entreprise Colt et une autre lettre parlant de de la république Vénézuélienne.

Nous avons également effectué des requêtes Whois, nmap afin de déterminer le propriétaire officiel du site et tenter de trouver des services ou sous domaines.

## La prise de renseignements via les moteurs de recherche
Google et ses Google Dorks peuvent se révéler très utiles dans une recherche de fichiers et pages censées être masquées. Le site étant très récent, la recherche avec les Dorks n’a rien donné. En revanche, nous avons trouvé des avis sur TrustPilot. Nous avons ainsi effectué des recherches inversées sur les images des clients laissant des commentaires mais une fois de plus, cette recherche n’a rien donnée.

Nous sommes tombés sur la page LinkedIn de l’entreprise. Ce réseau est excellent pour de la prise d’information car on peut voir qui travaille dans telle ou telle entreprise. Il est très facile de deviner le genre de projet en croisant les informations de différentes personnes.

Nous avons donc crée un trombinoscope des employés de l’entreprise. Il nous a fallu créer un faux profil LinkedIn dans le but de créer un faux réseau et avoir accès à des informations masquées sur LinkedIn. J’ai crée ce faux profil en changeant juste mon nom et la photo. J’ai gardé exactement les mêmes informations dans le but de ne pas avoir à réfléchir à cette nouvelle vie lorsque j’aurai au téléphone les employés de Lictor. Nous verrons ces étapes dans le chapitre suivant. Nous avons même recrée mon réseau pour que le profil soit le plus réaliste possible.

## Social engineering sur l’entreprise Lictor
C’est dans cette partie que nous avons vraiment commencé le social engineering. Nous avons découpé les étapes en trois sous-étapes :

1. La fausse proposition d’emploi
2. La fausse demande d’emploi
3. Le faux client

###  La fausse proposition d'emploi
Nous avons pensé à proposer un emploi à l’un des employés en faisant croire à cette personne par exemple que son profil nous intéressait. L’idée au travers de ce faux entretien est de récupérer le maximum d’informations à son insu en le faisant parler de son expérience au sein de Lictor. Le levier de l’égo doit être utilisé, il faut lui faire croire que ses compétences rares nous intéressent en lui proposant un salaire confortable…

Malheureusement, par manque de temps nous n’avons pas envoyé le mail. Il faut bien garder à l’esprit que cette technique est pourtant très efficace car la personne va devoir « se vendre » et donc obligatoirement parler de son activité et de ses compétences. [Des cadres d’entreprises françaises en ont malheureusement fait les frais en 2018.](https://lentreprise.lexpress.fr/rh-management/recrutement/les-cadres-francais-cibles-des-espions-chinois-sur-linkedin_2044088.html)

### La fausse demande d’emploi
Nous avons eu une autre idée pour récupérer des informations en toute discrétion : Postuler chez Lictor dans le but d’obtenir des informations. La période tombait à pic, étant diplômé en septembre, j’ai pu faire mine de chercher un emploi et ainsi récupérer des informations sur l’entreprise. La fausse identité créée auparavant a été utilisée. Mon CV a été réutilisé en changeant uniquement la photo et le nom. Le but étant de partir de l’identité réelle et changer le minimum d’informations pour être le plus naturel possible. Après quelques échanges par mail, j’ai pu rapidement obtenir un entretien téléphonique.

Il a été difficile de poser des questions, les réponses étaient floues. En revanche, en fonction du type de questions concernant les compétences recherchées par Lictor, on peut en déduire leur activité.

L’équipe de Lictor est composée de 20 personnes en France. Elle dispose de plusieurs antennes dans les pays d’Asie. Les employés n’organisent jamais d’apéros ou autre car ils sont très discrets, ils ne se montrent jamais ensemble et sont pour la plupart des gardes du corps. Ils auront un stand à leHack (Logique puisque la deuxième étape se déroulera pendant leHack).

Lictor travaille visiblement énormément sur des projets industriels, ils ont une branche spécialisée dans le piratage de systèmes SCADA. On peut en déduire qu’ils font du sabotage, espionnage industriel sur des environnements sensibles. Ils utilisent également l’outil Cobastrike pour leurs attaques offensives.

Ils fournissent également un service de Botnet et donc de DDOS potentiellement, ils cherchent des personnes ayant certaines connaissances sur les botnets.

Leur activité déborde également sur de la prise de renseignements car ils développent des exploits avec pour but de diffuser des malwares permettant de faire du keylogger et du vol de fichiers.

Globalement, notre ressenti est qu’ils proposent le même genre de prestation au niveau des exploits que l’entreprise Israélienne [NSO Group](https://www.nsogroup.com/). Ils ont visiblement un centre de formation qui permet aux employés de monter en compétence. Enfin, ils insistent bien sur le fait que les employés ne doivent pas avoir trop d’éthique pour travailler chez eux….

Concernant leur client, il s’agit d’entreprises privés pour faire de la “veille”/espionnage concurrentiel mais aussi des états où les missions sont beaucoup plus discrètes. La conversation a été enregistrée pour être fournie avec notre rapport mais je ne la diffuserai pas. Nous avons pu récupérer toutes ces informations au travers d’un simple appel…

### Le faux client
La dernière étape fut de se faire passer pour un client potentiel. Nous avons envoyé un mail sur l’adresse récupérée dans notre phase d’analyse de site. Nous avons fait mine que Lictor était recommandée par Gustave Leproleau. Très rapidement, on nous a donné le numéro du standard qui n’est transmis que de « bouche à oreille ».

Nous avons demandé des renseignements sur les gardes du corps et les stages de conduite. Nous avons insisté sur le fait qu’il nous fallait trois nouveaux gardes du corps et que nous aimerions choisir Lictor. Le but étant d’appuyer sur le levier financier car cette prestation représente un enjeu non négligeable pour Lictor.

Très vite, nous avons compris que Lictor propose clairement des services illégaux. L’entreprise propose un service de kidnapping, torture pour de la prise d’information, “mise en vacances” de personnes quelles qu’elles soient. Nous avons demandés si Lictor avait des références d’anciens clients à nous fournir. Nous avons obtenus des références comme des PDG et des chefs de guerre Africain mais aussi des opérations sur des zones de guerres. Lictor serait impliquée dans les attaques d’ambassades d’Arabie Saoudite ou Turquie dans ces deux pays. Cependant, l’information la plus capitale pour la mission a été d’avoir la confirmation que Gustave Leproleau était impliqué dans une action avec Lictor. Il semblerait que leur relation se soient dégradées d’où le fait que Gustave Leproleau ai quitté les bérets jaunes pour former les bérets tout court. Selon Gustave, Lictor est une société dangereuse et trop extrémiste.

## Social engineering le réseau de Gustave Leproleau
Nous avons donc cherché des informations sur ce fameux Gustave Leproleau et son mouvement les bérets jaunes. Des vidéos ont été postées sur YouTube, des posts sur des forums ont été fait. En analysant les vidéos, les commentaires… Nous avons recrée le réseau des bérets tout court. Nous avons ainsi pu voir que des fans du mouvement aident à la prolifération du réseau en créant des pages Facebook… Pour cartographier le réseau, nous avons utilisé l’outil Maltego :

[![Cartographie du réseau avec Maltego](/assets/images/2019-07-13-Spying-Challenge-leHack-se-prendre-pour-james-bond-le-temps-dun-challenge/cartographie-du-reseau-avec-Maltego.png)](/assets/images/2019-07-13-Spying-Challenge-leHack-se-prendre-pour-james-bond-le-temps-dun-challenge/cartographie-du-reseau-avec-Maltego.png)
Nous sommes rentrés en contact avec plusieurs des partisans en leur faisant croire que nous serions intéressés par rejoindre le mouvement. Nous avons obtenus parfois des réponses négatives mais aussi des réponses positives. Nous avons appris que Paul Etik membre déjà connu sur notre cartographie était passé Lieutenant et nous a proposé de rejoindre le réseau.

## Conclusion
Je m’arrêterai là pour cet article, malheureusement, notre rapport détaillé de 16 pages n’a pas suffi à être qualifié pour la deuxième phase. Les 16 premières équipes étaient qualifiées et nous avons fini 20ème parmi les 60 équipes venues du monde entier. Nous n’avons donc pas pu mettre en œuvre nos talents de crochetage de serrure ou intrusion physique. Je pense que pour être qualifié, nous aurions dû aller plus en profondeur dans notre analyse du réseau des bérets tout court. J’aurais aimé que les conditions du challenge n’interdisent pas d’envoyer des charges malveillantes. Un document Word ou PDF piégé aurait été rapide a créer pour moi et nous aurait grandement servi. Quoi qu’il en soit, ce challenge fut vraiment une bonne expérience et nous a permis de s’entraîner au social engineering. Au travers de ce challenge, je pense qu’il peut également servir à sensibiliser les entreprises et personnes sur les dangers du social engineering.
