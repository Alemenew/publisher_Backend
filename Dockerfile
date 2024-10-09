# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=18.13.0
FROM node:${NODE_VERSION}-slim as base


LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential 


# Install node modules
COPY --link package-lock.json package.json ./
RUN npm ci

# Copy application code
COPY --link . .


# Final stage for app image
FROM base

ENV PATH /app/node_modules/.bin:/usr/local/bin:$PATH

# Copy built application
COPY --from=build /app /app

# Install chrome
RUN apt-get update -qq && \
 apt-get -y install curl unzip groff less wget
COPY --link ./install_chrome.sh /app/install_chrome.sh
RUN chmod +x /app/install_chrome.sh ; /app/install_chrome.sh
RUN echo "===> Installing chromedriver and google-chrome..." && \
    CHROMEDRIVER_VERSION=`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE` && \
    wget https://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip && \
    unzip chromedriver_linux64.zip -d /usr/bin && \
    chmod +x /usr/bin/chromedriver && \
    rm chromedriver_linux64.zip
    
#RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
#RUN apt-get install -y ./google-chrome-stable_current_amd64.deb

# Start the server by default, this can be overwritten at runtime
EXPOSE 3500
EXPOSE 3000
EXPOSE 27015
EXPOSE 27016
EXPOSE 27017

CMD ["/bin/bash", "-c", "chmod +x /app/env_setup.sh; /app/env_setup.sh null true; npm run start" ]
#CMD [ "npm", "run", "start" ]
