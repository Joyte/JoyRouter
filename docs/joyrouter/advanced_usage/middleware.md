---
title: Advanced Usage - Middleware
---

Middleware allows you to modify a `Response` before it's sent to the client.
One example of this is adding CORS headers to all responses.

!!! warning

    You need to make middleware take **one** argument, either `request: Request` or `response: Response`.

## `Response` middleware

!!! example

    ```ts
    function addCORS(response: Response): Response {
        response.headers.set("Access-Control-Allow-Origin", "*");

        return response;
    }

    router
        .use(addCORS)
        .get("/", my_handler) // my_handler will return a response with the CORS headers
    ```

!!! tip

    Middleware is called in the order it's added to the router.
    This means that if you add middleware to the router, and then add middleware to a route, the route's middleware will be called first.

Another usecase is setting default headers for all responses:

!!! example

    ```ts
    function addDefaultHeaders(response: Response): Response {
        const defaultHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            "Accept-Charset": "utf-8",
        };

        // Remove content-type if it's text/plain, as that's the default
        if (res.headers.get("content-type") === "text/plain;charset=UTF-8") {
            res.headers.delete("content-type");
        }

        for (const [key, value] of Object.entries(defaultHeaders)) {
            if (!res.headers.has(key)) {
                res.headers.set(key, value);
            }
        }

        return response;
    }

    router
        .use(addDefaultHeaders)
        .get("/", my_handler) // my_handler will return a response with the default headers all set
    ```

## `Request` middleware

Middleware can also be used to modify the request before it's passed to the handler.
This is useful for things like authentication, where you want to check the request before it's passed to the handler.

To do this, use `router.use` with `request: Request`:

!!! tip

    Throwing a `ClientError` in middleware will return a json response with the error message and status code.

!!! example

    ```ts
    import { ClientError, JoyRouter } from "joyrouter";

    const router = new JoyRouter();

    function checkAuth(request: Request): Request {
        if (!request.headers.has("Authorization")) {
            throw new router.ClientError("Unauthorized", 400);
        }

        return request;
    }

    router
        .use(checkAuth)
        .get("/", my_handler) // my_handler will only be called if the request has an Authorization header

    export default {
        async fetch(request: Request) {
            return await router.handle(req);
        },
    };
    ```

## Middleware categories

Categories can be assigned to functions, using the `@category` decorator.
See [this page](../../jrdoc/category.md) for more information.

!!! tip

    By setting the middleware category to `error`, you can make it so that the middleware is only run when an error is thrown.
    (Also technically if `@category error` is set on a jsdoc route, but that's weird, don't do that!)

They can then be used to only run middleware for certain categories:

!!! example

    ```ts
    function myAccount() {
        `
        @category account
        `;
        return new Response("This is my account!", { status: 200 });
    }

    function helloWorld() {
        return new Response("Hello world!", { status: 200 });
    }

    router
        .use(checkAuth, "account") // Only run this middleware for routes with the "account" category
        .get("/account", myAccount) // myAccount will only be called if the request has an Authorization header
        .get("/", helloWorld) // helloWorld will be called for all requests
    ```
