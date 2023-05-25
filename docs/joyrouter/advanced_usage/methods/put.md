---
title: Advanced Usage - Put
---

Put requests are used to replace data on the server.

!!! example

    ```ts
    router
        .put("/", my_handler) // Matches only PUT requests for the '/' route
        .put("/users", my_handler2) // Matches only PUT requests for the '/users' route
    ```
