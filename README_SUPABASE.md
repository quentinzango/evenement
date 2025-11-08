# Intégration Supabase (sessions basées sur l'appareil + Edge Functions)

Ce document décrit en français comment configurer Supabase pour ton application : schémas SQL des tables, politiques RLS, création des buckets Storage, déploiement des Edge Functions et intégration côté React.

Fichiers fournis dans le dépôt :
- `src/lib/supabase.js` — client Supabase pour React
- `src/lib/device.js` — utilitaires pour générer/stocker le device_id et appeler l'Edge Function `register_device`
- `src/hooks/useMessagesSupabase.js` — hook React pour lire les messages (public) et poster via l'Edge Function `post_message`
- `supabase/functions/register_device/index.js` — template d'Edge Function pour enregistrer un device et retourner un token signé
- `supabase/functions/post_message/index.js` — template d'Edge Function pour vérifier le token et insérer un message

---

## 1) SQL — création des tables
Copie/colle ces requêtes dans Supabase → SQL Editor et exécute.

-- Table `profiles` (enregistre les profils liés à un device)
```sql
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  display_name text,
  phone_hint text,
  created_at timestamptz default now()
);
```

-- Table `messages` (discussion)
```sql
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);
```

-- Si tu veux gérer les médias (images/vidéos) :
```sql
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users(id) on delete set null,
  type text not null,
  filename text,
  url text,
  views integer not null default 0,
  likes integer not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists media_likes (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references media(id) on delete cascade,
  user_id uuid,
  created_at timestamptz not null default now(),
  constraint media_user_unique unique (media_id, user_id)
);
```

---

## 2) Politiques RLS recommandées
L'idée : permettre la lecture publique des messages/profiles mais interdire les inserts directs sur `messages` par le rôle `anon`. Les inserts seront faits par l'Edge Function (qui utilise la clé `service_role` côté serveur).

Exemples :

```sql
-- activer RLS
alter table messages enable row level security;
alter table profiles enable row level security;

-- lecture publique
create policy "public_select_messages" on messages for select using (true);
create policy "public_select_profiles" on profiles for select using (true);

-- ne pas créer de policy d'insert pour anon sur messages (insert via Edge Function/service role)
```

Pour `profiles` : tu peux autoriser un upsert par le client si tu veux (moins sûr) ou forcer la création via Edge Function (recommandé).

---

## 3) Edge Functions (register_device / post_message)

But :
- `register_device` : reçoit { device_id, display_name }, crée ou récupère le profil, renvoie un token JWT signé contenant `profile_id`.
- `post_message` : reçoit { token, text }, vérifie le token côté serveur, insère le message dans `messages` en utilisant la clé service_role.

Remarques :
- Ne mets jamais la clé `SERVICE_ROLE` dans le front-end.
- Définis ces variables d'environnement pour les fonctions : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DEVICE_TOKEN_SECRET`.

Les templates des fonctions sont fournis dans `supabase/functions/...`.

---

## 4) Déploiement des Edge Functions (exemples)

1) Installer Supabase CLI (si pas déjà fait) : https://supabase.com/docs/guides/cli

2) Se connecter à ton projet :

```powershell
supabase login
supabase link --project-ref your-project-ref
```

3) Déployer les fonctions :

```powershell
supabase functions deploy register_device --project-ref your-project-ref
supabase functions deploy post_message --project-ref your-project-ref
```

4) Configurer les variables d'environnement pour chaque function (dans le dashboard Supabase → Functions → Nom de la fonction → Settings) :

- `SUPABASE_URL` = `https://<your-project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (clé service role — récupère la dans Settings → API)
- `DEVICE_TOKEN_SECRET` = (secret long aléatoire pour signer les tokens devices)

Après déploiement tu auras des URLs publiques pour chaque fonction ; copie-les pour le front-end.

---

## 5) Intégration côté React (variables d'environnement)

Crée un fichier `.env.local` à la racine du projet React (ne le commite pas) :

```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_SUPABASE_STORAGE_BUCKET=media
REACT_APP_MAPBOX_TOKEN=...
```

Installer les dépendances côté client :

```powershell
npm install @supabase/supabase-js
```

Utilisation basique :
- `src/lib/supabase.js` contient la création du client Supabase.
- `src/lib/device.js` : `getOrCreateDeviceId()` et `registerDevice({ functionUrl, display_name })` pour obtenir le token signé.
- `src/hooks/useMessagesSupabase.js` : lecture/realtime (select public) et `postMessage({ functionUrl, token, text })` pour poster via l'Edge Function.

Exemple d'usage minimal :

1. À la première visite :
```js
const deviceId = getOrCreateDeviceId();
// si l'utilisateur saisit un nom :
await registerDevice({ functionUrl: REGISTER_URL, display_name: 'Jean' });
// la fonction renvoie token stocké en localStorage
```

2. Poster un message :
```js
await postMessage({ functionUrl: POST_URL, token: storedToken, text: 'Bonjour la communauté' });
```

3. Lire messages :
```js
const { messages } = useMessagesSupabase();
```

---

## 6) Storage (médias)

1. Dashboard → Storage → Create bucket `media` (public si tu veux URLs directes, privé si tu veux signed URLs).
2. Uploads : côté client upload vers Storage puis insert metadata en DB via Edge Function ou via `from('media').insert(...)` selon ta RLS.

---

## 7) Sécurité & recommandations
- Ne stocke jamais `SUPABASE_SERVICE_ROLE_KEY` dans le front-end.
- Utilise Edge Functions pour les opérations d'écriture qui doivent être contrôlées (messages, création de profils si tu veux contrôler l'accès).
- Les tokens devices peuvent expirer (ex: 30 jours). Prévois une stratégie de rafraîchissement (ré-appel de `register_device`).
- Pour limiter le spam : rate-limit côté Edge Function (par IP ou par device_id) et/ou modération manuelle.

---

## 8) SQL et policies d'exemple (rappel rapide)

Tables principales : `profiles`, `messages`, `media`, `media_likes` (voir section 1 pour SQL complet).

Activer RLS et autoriser uniquement SELECT public sur `messages` :

```sql
alter table messages enable row level security;
create policy "public_select_messages" on messages for select using (true);
```

L'insert est effectué par l'Edge Function qui utilise la clé `service_role`.

---

Si tu veux, je peux maintenant :
1) Mettre à jour `pages/Discussion.js` pour ajouter l'UI d'enregistrement de profil et d'envoi de message via les fonctions déployées ;
2) Te fournir les commandes PowerShell exactes et les étapes pas‑à‑pas pour déployer et configurer les env vars dans Supabase (avec exemples de valeurs) ;
3) Adapter les Edge Functions pour utiliser une méthode JWT compatible pure Deno (si tu veux les exécuter strictement côté Deno sans `jsonwebtoken`).

Dis‑moi quelle option tu préfères et je continue.
# Supabase Integration (device-based sessions + Edge Functions)

This document explains how to deploy the included Edge Functions and integrate Supabase into the React app.

Files added:
- `src/lib/supabase.js` - supabase client for React
- `src/lib/device.js` - helpers to generate/store device id and call register_device function
- `src/hooks/useMessagesSupabase.js` - hook to read messages and post via Edge Function
- `supabase/functions/register_device/index.js` - Edge Function (Deno) to register device and sign token
- `supabase/functions/post_message/index.js` - Edge Function (Deno) to verify token and insert message

## Steps

1. Install dependencies in the React project:

```powershell
npm install @supabase/supabase-js
npm install jsonwebtoken
```

2. Set environment variables in React (`.env.local`):

```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_SUPABASE_STORAGE_BUCKET=media
REACT_APP_MAPBOX_TOKEN=...
```

3. For Edge Functions, you need `supabase` CLI. See Supabase docs. Provide function env vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (service role key — keep private)
- `DEVICE_TOKEN_SECRET` (a random long secret)

4. Deploy functions (example):

```powershell
supabase functions deploy register_device --project-ref your-project-ref
supabase functions deploy post_message --project-ref your-project-ref
```

5. After deployment, copy the function URLs and use them in the React app when calling `registerDevice` and `postMessage`.

6. Create the SQL schema in Supabase (profiles, messages) using the SQL editor in the dashboard. See previous chat for SQL statements.

7. Configure RLS policies: keep `messages` INSERT blocked for public; use Edge Function (service role) to write.

## Usage notes
- The app generates a device id for each visitor and registers it to get a signed token. The signed token is stored in localStorage and is used to post messages via the Edge Function.
- Reading messages is public; posting requires the token.
- This avoids classical auth but remains reasonably secure because clients cannot insert directly into messages (RLS + Edge Function).
