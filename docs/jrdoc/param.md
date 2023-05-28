---
title: JrDoc Param tag
---

The general format for a param tag is as follows:

```jsdoc
@param where:<location> type:<datatype> name:<name> [additional flags] | <description>
```

!!! abstract "Arguments"

    === "where:"

        `where:` specifies where the argument comes from. This can be `path`, `query`, etc.

        Here's an example of how you might use `where:`:

        ```jsdoc
        @param where:path type:string name:variable | The environment variable
        ```

        In this example, `variable` is an argument that will be obtained from the path.

        Have a look at the [function arguments section](../joyrouter/advanced_usage/function_arguments.md) for more information.

    === "type:"

        The `type:` part specifies the datatype of the argument. This can be `string`, `number`, etc. This determines how the argument will be interpreted by the function.

        It's useful to specify the type here, as it will be automatically converted to the correct type, or throw an error to the user if it's invalid.

        ```jsdoc
        @param where:query type:number name:id | The cat's id
        ```

        In this example, `id` is an argument that will be obtained from the query string and interpreted as an `number`.

        Have a look at the [function arguments section](../joyrouter/advanced_usage/function_arguments.md) for more information.

    === "name:"

        The `name:` part specifies the name of the argument. This is the identifier that will be used to reference the argument in your function.

        This **MUST** be the same as the name of the argument in your function. If it's not, the argument will not be passed to your function.

        ```jsdoc
        @param where:header type:string name:authorization | Authorization
        ```

        In this example, `authorization` is an argument that will be obtained from the header and passed to the function parameter `authorization`.

    === "contentType:"

        The `contentType:` part specifies the content type of the argument. This is only used for `body` arguments.

        ```jsdoc
        @param where:body type:object contentType:application/json name:body | The request body
        ```

        In this example, `body` is an argument that will be obtained from the body of the request and interpreted as a `json` object.

!!! abstract "Flags"

    There are additional optional flags that can be used to provide more information about the parameters.

    === "optional"

        This flag signifies that the parameter is not required.

        ```jsdoc
        @param where:path type:number name:id optional | The cat's id
        ```

        In this example, `id` is an optional argument.

    === "deprecated"

        This flag signifies that the parameter is deprecated and should not be used.

        ```jsdoc
        @param where:path type:number name:id deprecated | The deprecated cat's id
        ```

        In this example, `id` is a deprecated argument.

!!! abstract "Description"

    Lastly, the `|` symbol is used to separate the parameter specification from its description.

    ```jsdoc
    @param where:path type:number name:id optional | The cat's id
    ```

    In this example, `The cat's id` is the description of the `id` argument.
