Title: Local MySQL Database with Docker Compose 
Date: 2021-07-31 20:59
tags: docker, mysql

These are some brief instructions for installing a local MySQL database, using Docker Compose, for local development.

## Install Containers

1. Download the docker-compose.yml file

        wget 'https://gist.githubusercontent.com/jasonfigueroa/78db9eb5797b3351007b44fb18eae956/raw/871f6ee5354bfd61fcb53dace54a56c29b5f1a56/docker-compose.yml'

2. Install and run the containers

        docker-compose up -d

## Setup Non-Root User

1. See the containers running

        docker-compose ps

2. Take note of the Name of the database container, in this example it's docker_db_1

    ![Database container name in the terminal](images/database-container-name.png)

3. Connect to the database server using the database container name

        docker exec -it docker_db_1 mysql -uroot -prootpass


4. Grant all privileges to the non-root user

        GRANT ALL PRIVILEGES ON *.* TO 'user'@'%' WITH GRANT OPTION;

5. Flush privileges

        FLUSH PRIVILEGES;

6. Exit MySQL Client

        exit

## Download the Chinook MySQL Import File

1. Download the MySQL Chinook database import file

        wget 'https://raw.githubusercontent.com/lerocha/chinook-database/master/ChinookDatabase/DataSources/Chinook_MySql_AutoIncrementPKs.sql'


## Login and Import the Chinook Database

1. Navigate to <a href="http://localhost:8088" target="_blank">http://localhost:8088</a> in a browser

2. Login with username: user, password: userpass, database: Chinook

    ![Login page for Adminer](images/adminer-login.png)

3. Click on Import at the top left.

    ![Adminer import database link](images/adminer-database-import-link.png)

4. Under File Upload click on Browse and select the Chinook_MySql_AutoIncrementPKs.sql

5. Click the Execute button and wait a minute or two

6. You should see the sidebar populate with the tables.

    ![Adminer sidebar with tables](images/sidebar-with-tables.png)

## Destroy Containers and Volume

1. Destroy the Containers with

        docker-compose down -v

---
**NOTE**

An ERD for the Chinook database can be found <a href="https://github.com/lerocha/chinook-database/wiki/Chinook-Schema" target="_blank">here</a>.

---
