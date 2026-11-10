# Runbook

How to build the images, run them, and back up and restore the orders. For a local check only: it chooses no host and pushes no image. Settings come from `.env.local` (`yarn env:setup`).

## Build and run

```bash
yarn infra:up        # PostgreSQL (and Grafana)
yarn docker:build    # the API image (apps/api/Dockerfile) and the app image (apps/app/Dockerfile)
yarn docker:up       # the API and the app; the app opens on http://localhost:8080
yarn docker:down     # stops the API and the app; the database stays up
```

The API listens on 3000 inside the network (no host port) and the app serves on 80, published on `127.0.0.1:8080`. Check: `http://localhost:8080` shows the 14 coffees, and `docker compose -f compose.yaml -f compose.packaged.yaml ps` shows `healthy`. The API reads `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` (and optionally `OTEL_EXPORTER_OTLP_ENDPOINT`) from the environment; no secret is in an image.

## Back up

```bash
yarn db:backup       # writes backups/<database>-<date>.dump (pg_dump, custom format) and prints its size
```

It fails with a message when the postgres container is not running. `backups/` is ignored by Git and holds addresses: keep it private.

## Restore, and check the counts

```bash
yarn db:restore backups/<file>.dump          # into a new database called restore_check
yarn db:restore backups/<file>.dump --drop   # the same, and drop restore_check at the end
```

The live database is never written to: the restore goes into `restore_check` (recreated each time) and the script prints the rows of `coffees`, `orders`, and `order_items` of the restored copy next to those of the live database, and says whether they are equal. They are equal when nothing was ordered since the backup. To keep a copy for a look, run without `--drop`; open it with `docker compose exec postgres psql -U <user> -d restore_check`, and drop it with the `--drop` form.

## Recover the live database

The scripts do not overwrite the live database on purpose. To recover it after a loss, stop the API, create an empty database, and run `pg_restore` of the file into it by hand, then start the API (Flyway checks the schema at startup). Try it first on `restore_check`.
