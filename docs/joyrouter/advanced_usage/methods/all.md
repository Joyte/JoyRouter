---
title: Advanced Usage - All
---

All allows you to match all the routes that are not matched by other routes.

!!! example

    ```ts
    router
        .all("/", my_handler) // Matches all methods for the '/' route
        .all("/users", my_handler2) // Matches all methods for the '/users' route
        .all("*", my_404_handler) // Matches all methods for all routes
    ```

!!! warning

    Note that `.all(*, 404handler)` is already implemented in JoyRouter, so you don't need to add it manually.
    The page by default will return a 404 error with the json `{ detail: "Not Found" }`

!!! tip

    `.all` is essentially the same as `custom("*", ...)`, but it's more readable.
    You could also use `.custom("*", "*", my_404_handler)` to match all methods for all routes.
