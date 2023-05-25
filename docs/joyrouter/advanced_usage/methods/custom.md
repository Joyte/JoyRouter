---
title: Advanced Usage - Custom
---

Custom requests are used for any other type of request that is not covered by the
other methods.

!!! example

    ```ts
    router
        .custom("PROPFIND", "/", my_handler) // Matches only PROPFIND requests for the '/' route
        .custom("PROPFIND", "/users", my_handler2) // Matches only PROPFIND requests for the '/users' route
    ```

!!! warning

    It's generally not recommended to use requests with a custom method. The HTTP protocol
    recommends sticking to the standard methods.
