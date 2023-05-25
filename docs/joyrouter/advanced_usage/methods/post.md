---
title: Advanced Usage - Post
---

Post requests are used to send data to the server.

!!! example

    ```ts
    router
        .post("/", my_handler) // Matches only POST requests for the '/' route
        .post("/users", my_handler2) // Matches only POST requests for the '/users' route
    ```
