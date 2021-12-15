FROM amd64/alpine:3.14
# version 3.14 needed to work with mac m1. add if needed

# Installs latest Chromium (92) package.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn \
      npm

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Puppeteer v10.0.0 works with Chromium 92.

WORKDIR /home/app
COPY . .
# RUN npm config set unsafe-perm true
RUN npm install -g pm2
RUN npm install
CMD ["node", "coordinator.js"]
