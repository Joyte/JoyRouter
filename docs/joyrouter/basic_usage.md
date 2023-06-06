## Create and define

To use JoyRouter, import it from the source:

```ts
import { JoyRouter } from "joyrouter";
```

Then, create a new instance of the router:

```ts
const router = new JoyRouter();
```

## Add a route

To add a route, use the `router.custom` method. It takes the following parameters:

```ts
method: string,
path: string,
handler: (request: Request, ...args: any[]) => Response | Promise<Response>
```

For example, to add a route that returns "Hello world!" on a `GET` request to `/`, use the following code:

```ts
function hello_world(request: Request) {
    return new Response("Hello world!", { status: 200 });
}

router.custom("GET", "/", hello_world);
```

There are also numerous helper functions that predefine the method:

```ts
router
    .get("/", hello_world)
    .post("/", hello_world)
    .put("/", hello_world)
    .delete("/", hello_world)
    .patch("/", hello_world);

// etc.
```

## Handle a request

To start handling requests, use the `router.handle` method. You should have this code in your main file:

```ts
export default {
    async fetch(request: Request) {
        return await router.handle(req);
    },
};
```

## Full code:

```ts
import { JoyRouter } from "joyrouter";

const router = new JoyRouter();

function hello_world(request: Request) {
    return new Response("Hello world!", { status: 200 });
}

router.get("/", hello_world);

export default {
    async fetch(request: Request) {
        return await router.handle(req);
    },
};
```
