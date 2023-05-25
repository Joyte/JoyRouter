---
title: Advanced Usage - Patch
---

Patch requests are used to update data on the server.

!!! example

    ```ts
    router
        .patch("/", my_handler) // Matches only PATCH requests for the '/' route
        .patch("/users", my_handler2) // Matches only PATCH requests for the '/users' route
    ```
