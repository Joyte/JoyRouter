---
title: Advanced Usage - JSON
---

JSON is used for returning JSON upon a request.
A good usecase for this is returning a simple "Hello, World!" on the root route.

!!! example

    ```ts
    router
        .json("GET", "/", { message: "This is my root route!" }, 200) // Matches only GET requests for the '/' route
        .json("POST", "/users", { message: "This is my users route!" }, 200) // Matches only POST requests for the '/users' route
    ```
