# JoyRouter

JoyRouter is a router designed for cloudflare workers. It has many functionalities, such as:

-   Swagger UI documentation
-   Automatic OPTIONS request handling
-   Middleware
-   JSON responses
-   Error responses
-   And more!

To access swagger ui, go to the url of your worker with the path '/docs'.
This page can be disabled by setting the `internalRoutes` option to false.

It is **_highly_** recommended to use the `jrdoc` tag along with [Jrdoc Highlighting for VSCode](https://marketplace.visualstudio.com/items?itemName=SinelServers.jrdoc-highlighting).
This will ease the process of creating your routes.

## Documentation

Documentation can be found [here](https://joyrouter.joyte.cc/).

## Installation

```bash
npm i @joyte/joyrouter
```

## Usage

```ts
import { JoyRouter } from "@joyte/joyrouter";

const router = new JoyRouter();

function post_path(request: Request) {
    return new Response("Hello world!", { status: 200 });
}

function get_path(request: Request, returnable: string) {
    /*jrdoc*/`
    An example function that returns the query parameter.
    @param where:query type:string name:returnable | The parameter to return
    `;

    return new Response(returnable, { status: 200 });
}

router
    .json("GET", "/", { detail: "Hello world!" }, 200)
    .post("/", post_path);
    .get

export default {
    async fetch(request: Request) {
        return await router.handle(req);
    },
};
```
