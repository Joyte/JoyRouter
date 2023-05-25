---
title: JrDoc
---

# Jrdoc

Jrdoc is JoyRouter's custom syntax for defining arguments.
Its main feature is specifying parameters for functions.

!!! tip

    It is **_highly_** recommended to use the `jrdoc` tag along with [Jrdoc Highlighting for VSCode](https://marketplace.visualstudio.com/items?itemName=SinelServers.jrdoc-highlighting).
    This will ease the process of creating your routes significantly.

## Syntax

The Jrdoc syntax is simple and intuitive. There are multiple jsdoc-style tags that can be used to specify arguments, such as `@param` and `@returns`.
Have a look at the pages for each tag to learn more about them.

-   [param](param.md) - Parameter attributes
-   [returns](returns.md) - What the route can return
-   [throws](throws.md) - What the route throws in an error
-   [example](example.md) - An example of how to use the route
-   [additional](additional.md) - Additional tags such as `@optional`
-   [category](category.md) - Categorize your routes
-   [more examples](jrdoc_examples.md) - More examples of Jrdoc syntax

## Example

Here's an example of how you might use Jrdoc to specify parameters for a function:

```ts
/**
 * Get an environment variable
 * @returns Response Object with environment variables
 */
export async function listEnv(variable: string): Promise<Response> {
    /*jrdoc*/ `
    List the environment variables for the application
    @param where:path type:string name:variable | String argument
    `;

    let envresult;
    try {
        envresult = ENV.get(variable);
    } catch (e: any) {
        envresult = e.message;
    }

    return new Response(
        JSON.stringify({
            detail: "Environment variables",
            variable: variable,
            value: envresult,
        }),
        {
            status: 200,
        }
    );
}
```

In this example, the `listEnv` function is documented with Jrdoc to specify that it has a `variable` parameter of type `string` that comes from the `path`.
