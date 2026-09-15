FROM php:8.2-cli-alpine

# Install system dependencies & build tools
RUN apk add --no-cache \
    curl \
    git \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    oniguruma-dev \
    sqlite-dev \
    postgresql-dev \
    bash

# Install PHP extensions (supporting MySQL, PostgreSQL, and SQLite)
RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql pdo_sqlite mbstring exif pcntl bcmath opcache

# Get Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . /app

# Install composer dependencies
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

# Create essential directories and set full permissions for storage & cache
RUN mkdir -p /app/bootstrap/cache \
    /app/storage/framework/cache \
    /app/storage/framework/sessions \
    /app/storage/framework/views \
    /app/storage/logs \
    && chown -R www-data:www-data /app \
    && chmod -R 777 /app/storage /app/bootstrap/cache

# Render provides PORT environment variable (typically 10000)
ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-c", "php artisan config:clear && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
