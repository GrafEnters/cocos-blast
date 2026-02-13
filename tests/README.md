# Запуск тестов

## Требования

- Node.js (версия 14 или выше)
- npm

## Установка зависимостей

Из корневой директории проекта выполните:

```bash
npm install
```

## Запуск тестов

```bash
npm test
```

Или напрямую через ts-node:

```bash
npx ts-node tests/run-tests.ts
```

## Структура тестов

- `BlastGameModel.test.ts` - тесты игровой модели
- `ValidationUtils.test.ts` - тесты утилит валидации
- `test-runner.ts` - простой тестовый раннер
- `run-tests.ts` - точка входа для запуска всех тестов
