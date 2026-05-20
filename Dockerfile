# base image
FROM node:20-alpine 

# Expose the port that your app will run on
EXPOSE 5050

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

CMD ["npm", "run", "start", "--", "-p", "5050"]