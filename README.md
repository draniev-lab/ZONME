+# 🏠 Zoe House

> **Zoe House n’est plus un simple plan de développement.**
> C’est une **plateforme immobilière sécurisée, transactionnelle et augmentée par l’IA**, conçue pour devenir un **tiers de confiance** sur les marchés africains et émergents.

Ce README remplace l’ancien document orienté *to‑do list*.
Il décrit **ce qui existe déjà**, **ce qui est partiellement prêt**, et **où va réellement le produit**.

---

## 🎯 Vision Produit

Le vrai problème de l’immobilier local n’est pas l’offre.
C’est la **confiance** et le **paiement sécurisé**.

Zoe House se positionne comme :

* un **filtre anti‑arnaque**,
* un **intermédiaire financier (escrow)**,
* un **agent immobilier numérique 24/7**.

Objectif assumé : **monétiser chaque étape du parcours immobilier**, pas seulement l’annonce.

---

## 🧱 Stack Technique

* **Auth & Backend** : Firebase (Auth, Firestore, Cloud Functions)
* **Paiements** : Stripe (cartes) + Mobile Money (CinetPay / FedaPay – en cours)
* **IA** : Genkit (matching, scoring, prédiction, génération de contrats)
* **Temps réel** : Firestore
* **Médias** : Images, vidéos, visites 360°

Stack choisie pour une raison simple : **scaler vite sans dette technique inutile**.

---

## 🧑‍💼 1. Gestion des Utilisateurs (SOLIDE)

Statut : **✅ Fonctionnel**

* Inscription / connexion (email, Google, Facebook, téléphone)
* Profils distincts : client, propriétaire, agent, admin
* KYC complet (CNI / passeport / selfie)
* Tableau de bord par rôle
* Permissions & ACL

👉 Base saine. Sans ça, tout le reste est du vent.

---

## 🏘️ 2. Gestion des Biens (CORE)

Statut : **✅ Fonctionnel**

* Création / modification / suppression de biens
* Données complètes (prix, surface, localisation, caractéristiques)
* Documents légaux
* Galerie photos + vidéos + visites 360°
* Validation admin obligatoire (+ re‑validation après modification)
* Tags & statuts

👉 Peu d’annonces, mais propres.

---

## 🔍 3. Recherche Avancée & Carte

Statut : **🟡 Avancé**

* Recherche par zone, budget, type
* Filtres avancés (chambres, salles de bain, tri)
* Recherche cartographique interactive
* Tri intelligent assisté par IA

👉 Plus efficace que les groupes Facebook. Sans débat.

---

## 📅 4. Réservations & Visites

Statut : **✅ / 🟡**

* Demande de visite physique
* Calendrier de disponibilité
* Acceptation / refus propriétaire ou agence
* Suivi côté client
* Paiement de frais de réservation
* Notifications (structure prête, extension requise)

👉 Déjà utile. Devient critique avec l’escrow.

---

## 💳 5. Paiements

Statut : **🟡 Stratégique**

* Paiement par carte (Stripe – prêt)
* Paiement Mobile Money (structure prête)
* Commission plateforme (prête)

### Prochaine évolution majeure :

* **Séquestre immobilier (escrow)**

👉 C’est ici que Zoe House devient une machine à cash.

---

## 💬 6. Messagerie Temps Réel

Statut : **✅**

* Chat client ↔ propriétaire / agence
* Temps réel
* Envoi de fichiers
* Notifications (prêtes pour extension)

---

## 🏢 7. Module Agence

Statut : **✅**

* Comptes entreprise
* Gestion des agents
* Dashboard & statistiques
* Facturation mensuelle (actuellement simulée)

---

## 🧑‍🏠 8. Module Propriétaire

Statut : **✅**

* Gestion des biens
* Gestion des visites
* Statistiques de visibilité

👉 Devient un **SaaS payant** à l’étape suivante.

---

## 🧍 9. Module Client

Statut : **✅**

* Favoris
* Comparaison
* Historique & alertes
* Suivi des demandes

---

## 🤖 10. Intelligence Artificielle (Genkit)

Statut : **🟡 / stratégique**

* Matching intelligent de biens
* Base prête pour :

  * scoring de fiabilité locataire
  * estimation prédictive des prix
  * génération automatique de contrats
  * matching colocation

👉 L’IA n’est pas un gadget. C’est le moat.

---

## 🛠️ 11. Back‑Office Administrateur

Statut : **✅**

* Dashboard global
* Gestion utilisateurs & rôles
* Validation annonces & KYC
* Logs & paramètres généraux

👉 Le contrôle est centralisé. Volontairement.

---

## 🔐 12. Sécurité & Conformité

Statut : **🟡 Avancé**

* Anti‑fraude
* Logs d’activité
* Chiffrement Firestore
* RGPD local (partiel, extensible)

---

## 💰 Modèles de Revenus Actuels & Futurs

* Frais de réservation
* Commissions sur paiements sécurisés
* Abonnements propriétaires (PMS)
* Services IA premium
* Publicité boostée
* Données B2B (agrégées)

👉 Multi‑flux. Pas de dépendance unique.

---

## 🚀 Priorités Produit (sans bullshit)

1. Séquestre de paiement (escrow)
2. Badge **Zoe Verified**
3. Mobile Money natif
4. Scoring IA de fiabilité

Tout le reste est secondaire.

---

## 🧠 Philosophie

* Moins d’annonces
* Plus de sécurité
* Tolérance zéro pour l’arnaque

**Zoe House préfère perdre du trafic que perdre la confiance.**

---

## 📄 Licence

Projet propriétaire – Tous droits réservés.
