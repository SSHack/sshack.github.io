---
published: true
layout: post
title: "Créer une infrastructure de phishing gratuitement avec Amazon Web Service et Gophish"
description: "Cet article décrit comment créer une infrastructure pour une opération de phishing souvent utilisée dans une opération RedTeam ou APT."
lang: fr_FR
category: Phishing, Social Engineering, Mail
---
![Créer une infrastructure de phishing gratuitement avec Amazon Web Service et Gophish](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/illustration.jpg)

Il est très simple de déployer une infrastructure de phishing grâce aux services d’Amazon Web Service ainsi qu’au framework [Gophish](https://getgophish.com/). Ce framework opensource est dédié à la création de campagnes de phishing et permet un suivi très précis.
La création d'une campagne de phishing se décline en 3 étapes :
1. Création de l'infrastructure AWS
2. Installation de Gopish
3. Création du profil Gopish, template et landing page


## Création de l'infrastructure AWS
Amazon Web Service propose de profiter d'offres pendant 12 mois après la date d'inscription de départ sur AWS. De ce fait, il est possible de déployer une instance de serveur qui sera disponible 24/24h.
Pour cela, il suffit de s'inscrire sur le [AWS](https://aws.amazon.com/fr/).
Une fois le compte crée, il suffit de déployer une instance de calcul EC2 :

![Déploiement de l'instance EC2](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/deploiement_instance_EC2.png "Déploiement de l'instance EC2")

Il faut ensuite choisir un système compatible avec l'offre gratuite. Je préfère personnellement choisir Ubunut Server :

![Sélection du système d'exploitation](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/selection_OS.png "Sélection du système d'exploitation")

Plusieurs offres de puissance sont disponibles, la configuration minimale suffit amplement à Gophish :

![Choix de la configuration du serveur](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/choix_configuration_serveur.png "Choix de la configuration du serveur")

L'étape suivante consiste à créer une paire de clé au format .pem qui permettra de se connecter directement via SSH à l'instance :

![Création d'une paire de clé](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/creation_paire_cle_ssh.png "Création d'une paire de clé")

À ce stade, l'instance devrait être lancée :

![Instance en cours d'exécution](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/instance.png "Instance en cours d'exécution")

La dernière configuration nécessaire concerne l'ouverture de port de la machine. En effet, il est nécessaire d'autoriser les flux entrants vers les ports :
* 22 (SSH)
* 80 (HTTP pour la page de phishing)
* 3333 (Interface d'administration de Gophish)
* 443 (HTTPS pour la page de phishing)

Il faut donc configurer le *Groupe de sécurité* :

![Groupe de sécurité](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/groupe_securite_aws.png "Groupe de sécurité")

La configuration doit ressembler à cela :

![Configuration finale de l'ouverture de port](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/configuration_ouverture_port_aws.png "Configuration finale de l'ouverture de port")

*Note : Il est conseillé de modifier le port par défaut de la page d'administration de Gophish et d'autoriser uniquement l'ouverture de port depuis la machine de l'attaquant*

Il faut ensuite connaître l'adresse IP pour se connecter à cette instance, Amazon fournit la ligne de commande à entrer en cliquant sur le bouton *Se connecter* :

![Bouton se connecter](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/bouton_connexion.png "Bouton se connecter")

La configuration de l'instance AWS est désormais terminée.

## Installation de Gopish
Il est maintenant nécessaire d'installer Gophish. La dernière version doit être téléchargée sur le [dépôt Github officiel](https://github.com/gophish/gophish/releases).
*Note : Tout ce que je décrirai à partir de ce chapitre jusqu'à la fin de l'article est disponible sur [la documentation officielle disponible à cettre adresse](https://docs.getgophish.com/user-guide/).*

Le binaire est déjà compilé et prêt à l'emploi. Il suffit d'extraire le contenu avec la commande suivante :
```bash
unzip gophish-v0.11.0-linux-64bit.zip
```
Il faut ensuite démarrer gophish en tant que root :
```bash
sudo ./gophish
```
L'interface d'administration devrait à présent être accessible depuis l'adresse `https://<IP de l'instance AWS>:3333`
Les identifiants par défaut sont :
* Identifiant : **admin**
* Mot de passe : **gophish**

![Interface d'administration de Gophish](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/interface_administration_gophish.png "Interface d'administration de Gophish")

## Création du profil Gopish, template et landing page
### Création du profil
Il est nécessaire de configurer un profil Gophish, c'est à dire configurer des identifiants SMTP, un compte Gmail par exemple peut être utilisé :

![Configuration SMTP](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/configuration_smtp.png "Configuration SMTP")

### Création du template d'email
Il est maintenant nécessaire de créer un template d'email. Gophish permet d'utiliser des variables dans le template telles que :

{% raw  %}
| Variable         | Description                                                                                            |
|------------------|--------------------------------------------------------------------------------------------------------|
| {{.RId}}         | L'identifiant unique de la cible                                                                       |
| {{.FirstName}}   | Le prénom de la cible                                                                                  |
| {{.LastName}}    | Le nom de famille de la cible                                                                          |
| {{.Position}}    | La fonction dans l'entreprise de la cible                                                              |
| {{.Email}}       | L'adresse mail de la cible                                                                             |
| {{.From}}        | L'adresse mail de l'expéditeur                                                                         |
| {{.TrackingURL}} | L'URL de tracking qui sert à la génération du tableau de bord de statistique de la campagne de Gophish |
| {{.Tracker}}     | Une autre manière de déclarer le tracker : `<img src="{{.TrackingURL}}"/>`                             |
| {{.URL}}         | L'URL de phishing                                                                                      |
| {{.BaseURL}}     | L'adresse du chemin de base du serveur. Idéal pour faire des liens vers des ressources statiques.      |
{% endraw %}

L'email peut être rédigé en HTML pour ajouter plus de structure et le rendre moins "brut".

![Création du template d'email](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/creation_template_email_gophish.png "Création du template d'email")

### Création de la landing page
La landing page correspond à la page qui sera ouverte lorsque l'utilisateur clique sur le lien. Elle peut être un formulaire par exemple. Deux solutions sont disponibles pour la création de la landing page :
* Du code HTML peut directement être entré.
* Gophish peut copier automatiquement la page en entrant l'adresse du site à copier
[La documentation](https://docs.getgophish.com/user-guide/documentation/landing-pages) décrit cette procédure.

### Création d'un groupe de victimes
Cette étape consiste à créer un groupe qui référence les victimes :

![Création du groupe](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/creation_groupe_gophish.png "Création du groupe")

Plusieurs méthodes sont possibles :
* Les victimes peuvent être entrées manuellement. Il est important de remplir tous les champs car les variables comme les prénoms, noms, adresse mail et emploi dans l'entreprise se basent sur ces informations.
* Il est également possible d'importer les victimes via un fichier CSV.
[La documentation](https://docs.getgophish.com/user-guide/documentation/groups) décrit de manière plus précise comment utiliser ces fonctionnalités et le format du CSV attendu.

### Création de la campagne
La dernière étape est la création de la campagne. Tous les éléments précédemment créés

![Création de la campagne](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/creation_campagne_gophish.png "Création de la campagne")

Lorsque tout est correctement configuré, il suffit de cliquer sur *Lauch Campaign* pour que les mails soient envoyés à toutes les cibles entrées dans le groupe.

Un tableau de bord lié à la campagne est alors disponible indiquant le nombre d'ouverture de mails et clicks :

![Tableau de bord de la campagne](/assets/images/2020-10-06-Crer-une-infrastructure-de-phishing/tableau_bord_gophish.png "Tableau de bord de la campagne")

### Bonus
Petite astuce, lors d'une campagne de phishing, la **contextualisation** et la **personnalisation** du template génèrera un taux de clic beaucoup plus élevé.

Par exemple, en ce moment : Un mail venant des RH pour annoncer les nouvelles recommandations sanitaires juste après les annonces gouvernementales liées au COVID-19 sera beaucoup plus impactant qu'un mail d'annonce de chèque cadeau Noël en plein mois d'août.

Il est également possible de personnaliser le mail, en sachant qu'une personne attend un colis, il peut être pertinent d'écrire un mail en rapport avec le sujet.

**Plus l'attaquant aura d'informations sur la victime, plus le mail pourra être personnalisé et contextualisé.**
