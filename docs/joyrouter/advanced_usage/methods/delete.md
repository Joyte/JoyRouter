---
title: Advanced Usage - Delete
---

Delete requests are used for deleting data on the server.

!!! example

    ```ts
    router
        .delete("/", my_handler) // Matches only DELETE requests for the '/' route
        .delete("/users", my_handler2) // Matches only DELETE requests for the '/users' route
    ```
