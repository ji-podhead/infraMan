#!/bin/bash
set -e

# Führe das SQL-Skript aus, um den Netdata-Benutzer und die Berechtigungen zu erstellen.
# Wir verwenden psql, da dies nach der Initialisierung des Hauptbenutzers und der Datenbank ausgeführt wird.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Erstelle einen dedizierten Benutzer für Netdata
    CREATE USER netdata WITH PASSWORD 'a_secure_password_for_netdata';

    -- Gib dem Benutzer die Standardrolle 'pg_monitor'.
    -- Diese Rolle hat Lesezugriff auf viele nützliche Statistik-Views,
    -- ohne Zugriff auf die eigentlichen Daten in den Tabellen zu gewähren.
    -- Dies ist der sicherste und empfohlene Weg.
    GRANT pg_monitor TO netdata;
EOSQL