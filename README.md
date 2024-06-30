# Учебная практика ITHub

## О реализации

- Для клиентской части используется фреймворк [SvelteKit](https://kit.svelte.dev/) и UI-toolkit [Skeleton](https://www.skeleton.dev/).
- Код клиентской части в /src/routes/+page.svelte
- Код серверной части в /server/

## Команды для запуска

```bash
# установка проекта
npm i

# запуск в dev-режиме, по умолчанию проект запустится на http://localhost:5173/
npm run dev

# запуск в production-режиме, по умолчанию проект запустится на http://localhost:4173/
npm run start
```

## Прочая полезная информация

- Для сборки проекта нужна NodeJS >= 22
- Для корректной работы проекта должен быть свободен порт 8080
- Ключевые слова см. в /server/urls_by_keywords.json
