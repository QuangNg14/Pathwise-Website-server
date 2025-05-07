# 1) Start from official Node image
FROM node:22-slim AS build

# 2) Create app directory
WORKDIR /usr/src/app

# 3) Copy package manifests & install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# 4) Bundle app source
COPY . .

# 5) Expose the port your app listens on
EXPOSE 5001

# 6) Run the index
CMD ["node", "index.js"]
