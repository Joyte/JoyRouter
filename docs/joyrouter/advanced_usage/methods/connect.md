---
title: Advanced Usage - Connect
---

Connect requests are used to establish a connection to the server.

!!! example

    ```ts
    router
        .connect("/", my_handler) // Matches only CONNECT requests for the '/' route
        .connect("/users", my_handler2) // Matches only CONNECT requests for the '/users' route
    ```

!!! warning

    Connect requests in JoyRouter currently don't support things like websockets. The connect request is essentialy
    the same as the other requests.
