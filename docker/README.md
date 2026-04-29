# Docker notes

- Build and start containers:

```bash
docker-compose up --build -d
```

- View logs:

```bash
docker-compose logs -f
```

- Enter app container:

```bash
docker-compose exec app bash
```

- After first start you may need to run inside the app container:

```bash
composer install
php artisan key:generate
php artisan migrate
php artisan storage:link
```

Notes:
- Web is exposed on http://localhost:8080
- Database host is `db` in containers (mapped to host 3306)
