---
title: Advanced Usage - Get
---

Get requests are the most simple of the HTTP methods.

Generally used for retrieving data from the server, they are the most common
type of request.

!!! example

    ```ts
    router
        .get("/", my_handler) // Matches only GET requests for the '/' route
        .get("/users", my_handler2) // Matches only GET requests for the '/users' route
    ```
