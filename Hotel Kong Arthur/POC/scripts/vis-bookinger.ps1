# Viser de nyeste bookinger direkte fra MySQL. Bruges i demoen.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Get-Content scripts\vis-bookinger.sql | docker-compose exec -T db sh -c 'mysql -t --default-character-set=utf8mb4 -uroot -p$MYSQL_ROOT_PASSWORD hotel 2>/dev/null'