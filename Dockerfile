# 1) Build stage: build React app
FROM node:20-alpine AS build
WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./

# Install deps
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Inject build-time API URL (set via Cloudtype Build ARG)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build
RUN npm run build


# 2) Runtime stage: serve static files
FROM node:20-alpine
WORKDIR /app

# Install npm explicitly and then serve
RUN apk add --no-cache npm
RUN npm i -g serve

# Copy build output from the previous stage
COPY --from=build /app/build ./build

# Expose default port (Cloudtype will inject PORT)
EXPOSE 3000

# Run the static server; respect platform PORT if provided
CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]


