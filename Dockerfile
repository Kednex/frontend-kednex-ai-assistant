# # base image
# FROM node:20-alpine 

# # Expose the port that your app will run on
# EXPOSE 5050

# # Set the working directory in the container
# WORKDIR /usr/src/app

# # Copy the package.json and install dependencies
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the application code
# COPY . .

# # CMD ["npm", "start", "-p", "5050"]
#  CMD ["npm", "start", "--", "-p", "5050"]



# --- STAGE 1: Dependencies & Build ---
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies needed for building
COPY package*.json ./
RUN npm ci

# Copy source files and build the production application
COPY . .
RUN npm run build


# --- STAGE 2: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5050
EXPOSE 5050

# Copy only the compiled production dependencies and assets
COPY package*.json ./
RUN npm ci --only=production

# Copy the generated Next.js build folder from the builder stage
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public

# Start Next.js directly using npx for maximum efficiency
# CMD ["npx", "next", "start", "-p", "5050"]
CMD ["npm", "start", "--", "-p", "5050"]
