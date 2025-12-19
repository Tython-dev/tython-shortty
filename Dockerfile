# Étape 1 : base sur une image officielle Node.js
FROM node:22-alpine

# Définir la variable d'environnement
ENV NODE_ENV=production

# Créer le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers nécessaires à l'installation des dépendances
COPY package.json package-lock.json ./

# Installer uniquement les dépendances de production
RUN npm install --omit=dev

# Copier tous les autres fichiers du projet
COPY . .

# Créer un dossier pour les fichiers de base de données si besoin
RUN mkdir -p /var/lib/kutt

# Exposer le port 3000 (port utilisé par Kutt)
EXPOSE 3000

# Commande à exécuter au démarrage du conteneur
CMD ["npm", "run", "dev"]
