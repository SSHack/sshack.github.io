---
published: true
layout: post
title: "Temu : Derrière le Rideau des Offres Alléchantes, une Analyse Technique de la Collecte de Données"
description: "Cet article basé sur l'analyse technique de ntc.swiss décrit les différents mécanisme malveillants de Temu pour utiliser les données personnelles de ses utilisateurs."
lang: fr_FR
category: temu,malware,cybersecurité,données personnelles
---
![Temu : Derrière l'offre alléchante, se cache un malware](/assets/images/2026-01-15-Temu-derriere-le-rideau-des-offres-allechantes-une-analyse-technique-de-la-collecte-de-donnees/temu-malware.png)

Dans l'écosystème mobile actuel, les applications de commerce électronique promettent commodité et économies. Cependant, une vigilance accrue est de mise, particulièrement lorsqu'il s'agit d'applications populaires comme **Temu**. Une analyse technique approfondie, menée par [NTC (National Cyber Security Centre)](https://www.ntc.swiss/hubfs/temu-security-analysis-ntc-en.pdf), révèle des pratiques de collecte et de transmission de données qui méritent une attention particulière de la part des professionnels de la cybersécurité et des pentester. Cet article se propose de décortiquer les mécanismes techniques impliqués, en mettant l'accent sur les implications en matière de sécurité et de vie privée.

## Interpréteur JavaScript propriétaire

L'analyse met en lumière plusieurs mécanismes par lesquels Temu collecte des informations potentiellement sensibles. L'un des aspects les plus préoccupants est l'utilisation d'un **Interpréteur JavaScript propriétaire** pour la création de classes Java.

> "Creation of Java classes through a proprietary JavaScript interpreter"
> [...]
> "Temu’s self -developed JavaScript runtime environment provides developers with greater flexibility in tailoring supported features . This proprietary runtime can reduce the range of features to the essentials compared to existing JavaScript interpreters, which optimises performance. At the same time, interactions between JavaScript and underlying system interfaces, such as access to sensors, can be made more efficient."

Cette approche, bien qu'offrant une flexibilité accrue aux développeurs et des optimisations de performance, soulève des questions quant à la prévisibilité du code exécuté. Le document rapporte l'utilisation de fichiers `.lego` contenant du code JavaScript ou similaire, qui est ensuite traité par des classes Java.

> "The Temu mobile app is loading .lego files, that contain JavaScript or JavaScript -like source code . For example, it loads a file from https://static.kwcdn.com/fs-lg/lg/CameraPreNotifyPopup--a5f6b6f1c879d09bcb4c531b4882eea7.lego that uses the React JavaScript library. Figure 3 shows a part of the file for illustration."

Le processus de création d'éléments personnalisés via cette architecture permet potentiellement la création de n'importe quels objets de classes Java et l'appel de leurs méthodes statiques par réflexion.

> "Within the createCustomElement function a class object is returned, by calling class.ForName( String className )1. The name of the class that is returned originates from the Lego file content. This allows the app to create any objects of Java classes and call static methods of the classes via reflection."

Cette capacité, en particulier :

```java
public static void createCustomElement(o01.d dVar, LegoContext legoContext) {
    String classtoBeCreated  = M2FunctionManager.lego_object(0, dVar).getString();
    TValue lego_object = M2FunctionManager.lego_object(1, dVar);
    k b13 = j.b(dVar.C(), true, legoContext);
    if (lego_object != null) {
        b13.h(legoContext, lego_object);
    }
    Node node = new Node( classtoBeCreated , b13, legoContext);
}
```

Le code ci-dessus ouvre la porte à l'exécution de code arbitraire, rendant l'analyse statique plus ardue puisque le comportement peut varier dynamiquement.

## Collecte de Données Système et Identification
L'analyse révèle également des préoccupations quant à la collecte de données système :

> "Read out and transmit system files. The Android app collects and transmits data on the CPU of the end device to a TEMU backend. While accessing CPU performance data may have legitimate purposes, such as optimizing the application's performance based on the user's device capabilities, obtaining the SoC serial number raises potential privacy concerns. This unique identifier could be used to track users who are not logged in, when an Advertising ID is unavailable, or as an alternative method of user identification."

Des indices dans les bibliothèques natives suggèrent l'accès à des informations telles que le nombre de coeurs du CPU, la fréquence d'horloge et le numéro de série du SoC (System on Chip) :
```Java
String cpuPaths[] = {
    "/proc/cpuinfo",
    "/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq",
    "/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_min_freq"
};

for (String path : cpuPaths) {
    try (BufferedReader br = new BufferedReader(new FileReader(path))) {
        String line;
        while ((line = br.readLine()) != null) {
            Log.d("CPU_DATA", line);
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
}
```

La capacité d'identifier un appareil via son numéro de série SoC est particulièrement préoccupante, car elle peut servir de mécanisme de traçage persistant, contournant les mécanismes d'anonymisation comme l'ID publicitaire. Ces éléments contribuent à la création de profils utilisateurs détaillés et à une surveillance accrue des activités.

## Détection d'Applications Tierces
Un autre aspect notable est la capacité de l'application à détecter la présence d'autres applications installées sur l'appareil.

> "In fact, while using the Temu app on the device of the NTC test expert , the presence of the following third-party apps was detected:"

La liste des schémas d'URLs détectés, tels que :
```
canOpenURL: kakaotalk://
canOpenURL: squarecash://
canOpenURL: paypal://
canOpenURL: klarna://
canOpenURL: com.afterpay.afterpay-consumer://
canOpenURL: com.venmo.touch.v2://
canOpenURL: supertoss://
canOpenURL: vipps://
canOpenURL: mobilepay://
canOpenURL: naversearchapp://
canOpenURL: number26://
canOpenURL: paypay://
canOpenURL: ascendmoney://
canOpenURL: swish://
canOpenURL: whatsapp://
canOpenURL: aupay://
canOpenURL: satispay://
```

Et les requêtes déclarées dans `AndroidManifest.xml` pour Android :
```xml
<queries>
 <package android:name="com.facebook.katana"/>
 <package android:name="com.facebook.orca"/>
 <package android:name="com.instagram.android"/>
 <package android:name="com.whatsapp"/>
 <package android:name="com.snapchat.android"/>
 <package android:name="com.twitter.android"/>
 <package android:name="org.telegram.messenger"/>
 <package android:name="jp.naver.line.android"/>
 <package android:name="com.reddit.frontpage"/>
 <package android:name="com.discord"/>
 <package android:name="com.kakao.talk"/>
 <package android:name="com.instagram.barcelona"/>
 <package android:name="org.thoughtcrime.securesms"/>
 <provider android:authorities="com.facebook.katana.provider.PlatformProvider"/>
 <package android:name="com.facebook.wakizashi"/>
 <package android:name="com.afterpaymobile.us"/>
 <package android:name="com.afterpaymobile.uk"/>
 <package android:name="com.afterpaymobile"/>
</queries>
```

Ces éléments suggèrent une volonté de cartographier l'écosystème applicatif de l'utilisateur, potentiellement pour des analyses comportementales, du profilage, ou même pour identifier des vecteurs d'attaque ou de monétisation via des partenariats avec d'autres services.

## Données Chiffrées
Le chiffrement des données de configuration, bien que courant pour protéger des informations sensibles, rend l'analyse plus difficile :
> "Encrypting the configuration file makes it more difficult to analyse."

Des preuves d'utilisation d'un chiffrement AES avec des clés hardcodées pour certains paramètres suggèrent une tentative de dissimulation. Le déchiffrement met en évidence une approche potentiellement standardisée mais opaque. Le lien cyberchef suivant permet de déchiffrer tout code AES chiffré avec les clés hardcodées :
```
https://gchq.github.io/CyberChef/#recipe=AES_Decrypt(%7B'option':'Hex','string':'42132b322f063b161d4a7303745a596e'%7D,%7B'option':'Hex','string':'22505c58440b433c09520446547b7e12'%7D,'CBC','Raw','Raw',%7B'option':'Hex','string':''%7D,%7B'option':'Hex','string':''%7D)
```

L'impact exact de ces configurations chiffrées reste flou, mais il est supposé qu'elles contrôlent le contenu des WebViews.

## Localisation Précise
L'application Temu possède la **capacité technique de solliciter la localisation exacte du smartphone de l'utilisateur**. Cette fonctionnalité, bien que courante pour certaines applications, soulève des questions importantes lorsqu'elle est analysée sous l'angle de la protection des données personnelles et des risques de surveillance.

Dans les systèmes d'exploitation modernes comme Android et iOS, la distinction entre la localisation approximative (`ACCESS_COARSE_LOCATION`) et la localisation précise (`ACCESS_FINE_LOCATION`) est fondamentale pour la granularité des autorisations et la protection de la vie privée. Tandis que la première offre une géolocalisation moins précise (souvent basée sur les données cellulaires ou le Wi-Fi), la seconde s'appuie sur le GPS, fournissant des coordonnées d'une précision au mètre près.

L'analyse des fichiers *Manifest* de l'application confirme la présence des permissions requises pour le suivi de localisation précise sur les deux plateformes principales :
- Sur Android, le fichier `AndroidManifest.xml` déclare explicitement les permissions :
    ```xml
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION "/>
    ```
    Ces déclarations indiquent la capacité technique de l'application à solliciter ces niveaux de permission.

- Sur iOS, le fichier `Info.plist` contient l'entrée correspondante, avec une description utilisateur fournie :
    ```xml
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Only programs and features that you've allowed to access the location
    can use it. For example: to help you add a new address to your Temu address book
    faster.</string>
    ```
    Cette chaîne de caractères informe l'utilisateur sur l'usage potentiel des données de localisation lors de l'utilisation de l'application, un processus obligatoire pour les applications nécessitant l'accès à la localisation sur iOS.

La capacité à géolocaliser un utilisateur présente un **intérêt gouvernemental**. En effet, le rapport suggère que les données de localisation précises pourraient intéresser certaines entités gouvernementales, notamment pour le suivi d'individus jugés sensibles (employés gouvernementaux, forces de l'ordre, expatriés, ou membres de minorités sous surveillance). L'hypothèse d'une transmission de ces données à des instances gouvernementales, d'une revente, ou d'une utilisation à des fins de surveillance générale, est formulée.

## Mécanisme de modification du DNS
Une autre constatation technique pertinente concerne la manière dont Temu gère le trafic réseau, en particulier la résolution des noms de domaine. L'analyse révèle que l'application intègre un mécanisme optionnel permettant le recours à un serveur DNS personnalisé :
![DNS personnalisé](/assets/images/2026-01-15-Temu-derriere-le-rideau-des-offres-allechantes-une-analyse-technique-de-la-collecte-de-donnees/requete-dns.png)

Ce mécanisme pourrait permettre de contourner les bloqueurs de publicité qui se basent sur les requêtes DNS.
Par ailleurs, les métadonnées des requêtes constituent une source d'information complémentaire pour cerner l'activité de l'utilisateur, y compris ses schémas d'horaires.

## Absence de MFA
L'application propose une authentification multifacteur (MFA) optionnelle :
> "Multi-factor authentication is not enforced"
> "When registering an account, Temu only requires an e-mail address and a password or a telephone number. Multi-factor authentication is optional."

Le fait que la MFA soit optionnelle présente un risque accru pour les comptes utilisateurs, ouvrant la porte à des attaques de réutilisation de mot de passe (*credential reuse*), si des fuites de données pour l'utilisateur en question sont disponibles.

## Conclusion
Face à ces constats, l'analyse émet des recommandations claires :
- Questionner l'utilisation de l'application Temu, particulièrement dans un contexte professionnel ou gouvernemental.
- Mettre en place des mesures techniques et organisationnelles si l'utilisation est jugée indispensable. Cela inclut :
    - Accorder uniquement les permissions strictement nécessaires.
    - Utiliser un système d'exploitation à jour.
    - Restreindre l'utilisation de l'application au minimum requis.
- Privilégier l'accès via le navigateur mobile, qui présente une surface d'attaque réduite et moins d'opportunités de surveillance permanente.

Le rapport souligne également la nécessité d'une analyse plus poussée par des chercheurs supplémentaires pour élucider pleinement l'usage de certaines configurations et la collecte de données.

L'analyse technique de l'application Temu révèle une approche agressive en matière de collecte de données. Si les promesses de prix bas attireront toujours les consommateurs, les professionnels de la cybersécurité doivent être conscients des risques potentiels associés à l'utilisation de telles applications. Identifier les mécanismes de collecte, comprendre comment les données sont transmises et chiffrées, et évaluer les risques d'identification et de profilage sont des étapes cruciales pour une gestion de la sécurité mobile informée et efficace. La vigilance et la mise en oeuvre de contre-mesures appropriées sont essentielles pour protéger les utilisateurs et les organisations contre les menaces potentielles.