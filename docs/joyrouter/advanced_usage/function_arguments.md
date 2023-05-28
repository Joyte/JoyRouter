---
title: Advanced Usage - Function Arguments
---

Arguments in a function interact with the @param system.
To understand how to use them, read the [documentation on @param](../../jrdoc/param.md).

!!! warning

    Cookie arguments aren't able to be tested in `/docs`. This is because
    setting cookies in requests is considered a security risk by most browsers,
    and so they don't allow it.

    I reccomend doing one of the following:
    ```md
    -    Use Postman to test cookie routes
    -    Set `where:` to a dfferent location like `query` temporarily
    -    Use an extension to set the cookies
    ```

!!! info "Avaliable arguments"

    === "where:"

        ```md
        -   `path` - The argument is in the path of the url
        -   `query` - The argument is a query parameter
        -   `header` - The argument is a header
        -   `cookie` - The argument is a cookie
        -   `body` - The argument is in the body of the request
        ```

    === "type:"

        ```md
        -   `string` - The argument is a string
        -   `number` - The argument is a number
        -   `boolean` - The argument is a boolean
        -   `object` - The argument is a json object
        ```

    === "contentType:"
        These are for use with the `body` `where:`.

        ```md
        -   `application/json` - The argument is a json object
        ```

!!! tip

    If using the `body` argument, the only type avaliable is `object`.
    It's also reccomended to specify a contentType.

## Path example:

!!! example

    ```ts
    /**
     * Gets the age of a user
     * @param name The name of the user
     * @returns The age of the user
     */
    function getAge(name: string): number {
        `
        Gets the age of a user
        @param where:path type:string name:name | The name of the user
        `;
        return 20;
    }

    router.get("/user/:name", getAge); // /user/john -> 20
    ```

## Query, header & cookie example:

!!! example

    ```ts
    /**
     * Gets all users with a certain age
     * @param user The name of the user
     * @returns all users with a certain age
     */
    function getAge(age: number): string[] {
        `
        Gets all users with a certain age
        @param where:query type:number name:age | The age to search for
        `;
        return ["john", "jane"]
    }

    router.get("/user", getAge);
    // /user?age=20 -> ["john", "jane"]

    // header Age: 30
    // /user -> ["joe", "alex"]

    // cookie Age: 40
    // /user -> ["anthony", "margret"]
    ```
