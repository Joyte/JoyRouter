# JoyRouter

JoyRouter is a router designed for cloudflare workers. It has many functionalities, such as:

-   Swagger UI documentation
-   Automatic OPTIONS request handling
-   Middleware
-   JSON responses
-   Error responses
-   And more!

---

To access Swagger UI, go to the url of your worker with the path `/docs`.
This page, along with the rest of the internal routes can be disabled by setting the `internalRoutes` option to false.

!!! tip

    It is **_highly_** recommended to use the `jrdoc` tag along with [Jrdoc Highlighting for VSCode](https://marketplace.visualstudio.com/items?itemName=SinelServers.jrdoc-highlighting).
    This will ease the process of creating your routes significantly.

## Related

-   [Installation](installation.md)
-   [Usage](basic_usage.md)
