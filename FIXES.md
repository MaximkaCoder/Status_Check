# Що виправити

1. `assignee` / `reviewer` / `creator_name` — замінити рядки на FK до таблиці `User`
2. Пагінація на `/api/items` — зараз повертає всі записи без ліміту
3. JWT 30д без refresh — замінити на access (15хв) + refresh (30д) токени
4. Додати rate limiting на авторизаційні ендпоінти
5. Forgot password через email
6. Тести (unit + integration) та CI/CD pipeline
