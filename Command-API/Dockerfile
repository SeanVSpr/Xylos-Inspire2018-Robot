# Select the base image
FROM node:carbon-alpine

LABEL maintainer="Sean Van Sprundel (Xylos NV)"

# Create the application directory
WORKDIR /app

# Move package.json to install required dependencies
COPY package.json /app
RUN npm install

# Move the source code
COPY . /app

# Execute source code
CMD node index.js