FROM node:20 AS node
WORKDIR /app
COPY package*.json ./
# Install all dependencies (including dev) so vite is available for build
RUN npm install --legacy-peer-deps --silent
COPY . .
RUN npm run build

FROM php:8.3-fpm

# system deps
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    zip \
    libpng-dev \
    libicu-dev \
    libxml2-dev \
    libonig-dev \
    && rm -rf /var/lib/apt/lists/*

# php extensions
RUN docker-php-ext-install pdo pdo_mysql zip mbstring exif pcntl bcmath gd

# composer (copying from official composer image)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# copy project files
COPY . .

# install php dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction || true

# copy built assets (built on host or earlier step)
# prefer using the build produced in the project workspace
COPY public/build ./public/build

# permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache || true

EXPOSE 9000
CMD ["php-fpm"]
