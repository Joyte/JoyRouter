import { OpenAPIV3 } from "./OpenAPI3";

/**
 * This class is used for the docs page of the JoyRouter.
 * It can be disabled by setting enableDocs to false in the JoyRouter class instance.
 */
export class JoyRouterDocs {
    /**
     * Name of the exposed API.
     * @example "JoyRouter"
     * @example "My API"
     */
    public title: string = "JoyRouter";

    /**
     * Version of the exposed API.
     * Should be in the format of a semantic version number.
     * @see https://semver.org/
     * @example "1.0.0"
     * @example "1.0.0-alpha"
     */
    public version: string = "1.0.0";

    /**
     * Description of the exposed API.
     * CommonMark syntax can be used for rich text representation.
     * @see https://spec.commonmark.org/
     */
    public description: string | undefined =
        "JoyRouter is a router for Cloudflare Workers";
    /**
     * Terms of service URL for the exposed API.
     * Must be in the format of a URL.
     */
    public termsOfServiceURL: string | undefined;
    /**
     * Contact information for the exposed API.
     * Set to a OpenAPIV3.ContactObject object.
     */
    public contact: OpenAPIV3.ContactObject | undefined;
    /**
     * License information for the exposed API.
     * Set to a OpenAPIV3.LicenseObject object.
     */
    public license: OpenAPIV3.LicenseObject | undefined;

    /**
     * The regex used to find the jsdoc comment.
     */
    public jsdocRegex: RegExp = new RegExp("(?<prefix>(`[^;]))(?<jsdoc>[^`]*)");

    /**
     * The regex used to find the tags in the jsdoc comment.
     */
    public tagRegex: RegExp = new RegExp(
        "@(?<tag>[a-zA-Z]+)\\s*(?<value>[^@]*)",
        "g"
    );

    /**
     * Convert camelCase to Pascal Case with spaces
     * @param str String to convert
     * @returns Pascal Case with spaces
     * @example
     * pascalspacecase("helloWorld"); // "Hello World"
     */
    private pascalspacecase = (str: string) => {
        return str
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
    };

    private allowedParamAttributes: string[] = [
        "name",
        "type",
        "where",
        "optional",
        "deprecated",
        "contentType",
    ];

    public handlerArgs: {
        [path: string]: {
            [method: string]: {
                [key: string]: { [key: string]: string };
            };
        };
    } = {};

    /**
     * Sorts tags into their proper OpenAPIV3 objects.
     *
     * Tags are by default required, and must be in the format of `@tagname attribute1 attribute2 | description`.
     * To set the name or type of the tag, add `name` or `type` as an attribute.
     * For example, `@param where:query name:id type:number`
     *
     * To add a description to the tag, add a `|` and the description.
     * For example, `@param where:query type:number name:id | Returns user data`
     *
     * To make a parameter optional, add `optional` as one of the attributes.
     * For example, `@param where:body type:string optional name:data | Gets generic data`
     *
     * To make a parameter deprecated, add `deprecated` as one of the attributes.
     * For example, `@param where:header name:authorization type:string deprecated optional | The authorization header`
     *
     * @param tagName The name of the tag
     * @param tagValue The tag content
     * @returns The OpenAPIV3 object
     */
    public tagSorter(
        tagName: string,
        tagValue: string,
        targetFunction: Function
    ): Object {
        /**
         * Sorts attributes into an object.
         * @param attributes The attributes to sort
         * @returns The sorted attributes, plus any unsorted attributes in the `unsorted` property
         */
        function sortNamedAttributes(
            _this: JoyRouterDocs,
            attributes: string[]
        ): (key: string) => any {
            const attributeObject: { [key: string]: any } = {};

            for (const attribute of attributes) {
                if (attribute.includes(":")) {
                    const attributeSplit = attribute.split(":");
                    if (
                        !_this.allowedParamAttributes.includes(
                            attributeSplit[0]
                        )
                    ) {
                        throw new Error(
                            `Invalid named attribute '${attribute}' for '${tagName}' tag in function '${targetFunction.name}'`
                        );
                    }
                    attributeObject[attributeSplit[0]] = attributeSplit[1];
                } else {
                    if (
                        _this.allowedParamAttributes.includes(attribute) &&
                        !attributeObject.hasOwnProperty(attribute)
                    ) {
                        attributeObject[attribute] = true;
                    } else {
                        throw new Error(
                            `Invalid attribute '${attribute}' for '${tagName}' tag in function '${targetFunction.name}'`
                        );
                    }
                }
            }

            // Return a getter function
            return (key: string) => {
                return attributeObject.hasOwnProperty(key)
                    ? attributeObject[key]
                    : undefined;
            };
        }

        switch (tagName) {
            case "param":
                const param = tagValue.split("|");
                const paramAttributes = sortNamedAttributes(
                    this,
                    param[0].trim().split(" ")
                );
                const paramDescription = param[1]?.trim();

                // Raise an error if the param is missing a name
                if (
                    !paramAttributes("name") ||
                    !paramAttributes("type") ||
                    !paramAttributes("where")
                ) {
                    throw new Error(
                        `Missing name, type, or where attribute for param tag '@${tagName} ${tagValue}' in function '${targetFunction.name}'`
                    );
                }

                if (
                    paramAttributes("where") === "path" &&
                    paramAttributes("optional")
                ) {
                    throw new Error(
                        `Path parameters cannot be optional for param tag '@${tagName} ${tagValue}' in function '${targetFunction.name}'`
                    );
                }

                let returnObject:
                    | OpenAPIV3.ParameterObject
                    | OpenAPIV3.RequestBodyObject
                    | {} = {};
                if (paramAttributes("where") === "body") {
                    returnObject = {
                        description: paramDescription,
                        required: paramAttributes("optional") ? false : true,
                        content: {
                            [paramAttributes("contentType")]: {
                                schema: {
                                    type: paramAttributes("type"),
                                },
                            },
                        },
                    };
                } else {
                    returnObject = {
                        in: paramAttributes("where"),
                        name: paramAttributes("name"),
                        description: paramDescription,
                        required: paramAttributes("optional") ? false : true,
                        deprecated: paramAttributes("deprecated"),
                        schema: {
                            type: paramAttributes("type"),
                            ...(paramAttributes("contentType")
                                ? {
                                      format: paramAttributes("contentType"),
                                  }
                                : {}),
                        },
                    };
                }

                return returnObject ? returnObject : {};

            case "deprecated":
                return true;

            case "category":
                return tagValue;
        }

        return {};
    }

    /**
     * Generates a document object for a function.
     * Unfortunately, there's no simple way to access a jsdoc comment without using nonstandard and performance-impacting methods.
     *
     * The way that I have settled to resolve this, is to make the user add a jsdoc-style multiline string at the top of any function which the user wants documentation on.
     * This way, the function's documentation is defined in the function source code directly, and can be accessed without any performance impact (apart from regex).
     *
     * @param targetFunction Function to generate docs for
     * @returns Object containing the documentation
     * @example
     * const openapi = new JoyRouterDocs();
     * const docs = await openapi.generateFunctionDocs(myFunction);
     */
    generateFunctionDocs(targetFunction: Function): { [key: string]: any } {
        // Find the jsdoc comment
        const match = this.jsdocRegex.exec(targetFunction.toString());

        // Create an object to store the tags
        const tagsObject: { [key: string]: any } = {
            parameters: [],
            requestBody: undefined,
        };

        if (match !== null && match.groups !== undefined) {
            // Get all the tags and their values
            const tags = match.groups.jsdoc.matchAll(this.tagRegex);

            // If there are no tags, stop
            if (tags !== null || tags !== undefined) {
                for (const tag of tags) {
                    // Add the tag to the object
                    if (
                        tag.groups?.tag !== undefined &&
                        tag.groups.value !== undefined
                    ) {
                        const tagObj = this.tagSorter(
                            tag.groups.tag,
                            tag.groups.value,
                            targetFunction
                        );

                        // Check if the object is a ParameterObject
                        if (tagObj.hasOwnProperty("in")) {
                            tagsObject.parameters.push(tagObj);
                        }
                        // Check if the object is a RequestBodyObject
                        else if (tagObj.hasOwnProperty("content")) {
                            if (tagsObject.requestBody !== undefined) {
                                throw new Error(
                                    `Multiple RequestBodyObject defined for function '${targetFunction.name}'. Only one request body is allowed per function.`
                                );
                            }
                            tagsObject.requestBody = tagObj;
                        }
                        // Otherwise, add it to the object
                        else {
                            // tagObj is a string
                            if (typeof tagObj === "string") {
                                tagsObject[tag.groups.tag] = tagObj.trim();
                            } else {
                                tagsObject[tag.groups.tag] = tagObj;
                            }
                        }
                    }
                }

                // Remove the tags from the jsdoc comment
                match.groups.jsdoc = match.groups.jsdoc.replace(
                    this.tagRegex,
                    ""
                );
            }
        }

        if (match == null) {
            return {
                name: this.pascalspacecase(targetFunction.name),
            };
        } else {
            return {
                name: this.pascalspacecase(targetFunction.name),
                description: match.groups?.jsdoc.trim(),
                ...tagsObject,
            };
        }
    }

    public generateOpenAPI(routes: {
        [path: string]: { [method: string]: Function };
    }): OpenAPIV3.Document {
        const openapi: OpenAPIV3.Document = {
            openapi: "3.0.0",
            info: {
                title: this.title,
                version: this.version,
                description: this.description,
                termsOfService: this.termsOfServiceURL,
                contact: this.contact,
                license: this.license,
            },
            paths: {},
        };

        for (const path in routes) {
            // Skip if path is reserved
            if (path === "/docs" || path === "/openapi.json" || path === "*") {
                continue;
            }

            openapi.paths[path] = {};
            for (const method in routes[path]) {
                // Function data
                const functionData = this.generateFunctionDocs(
                    routes[path][method]
                );

                // PathsObject[PathItemObject]
                openapi.paths[path] = {
                    [method.toLowerCase()]: {
                        tags: [functionData.category ?? "default"],
                        summary: functionData ? functionData.name : undefined,
                        description: functionData
                            ? functionData.description
                            : undefined,
                        operationId: routes[path][method].name,
                        parameters: functionData.parameters,
                        deprecated: functionData.tags?.deprecated,
                        requestBody: functionData.requestBody,
                        responses: {
                            200: {
                                description: "Successful Response",
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                detail: {
                                                    type: "string",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                };
            }
        }

        return openapi;
    }

    /**
     * Generate the openapi.json response
     * @param document OpenAPIV3.Document object
     * @returns Response object
     * @example
     * const openapi = new JoyRouterDocs();
     * const openapiDocument = openapi.generateOpenAPI(routes);
     * const openapiResponse = openapi.openapiJSONPage(openapiDocument);
     * return openapiResponse;
     */
    public async openapiJSONPage(
        document: OpenAPIV3.Document
    ): Promise<Response> {
        return new Response(JSON.stringify(document), {
            headers: {
                "content-type": "application/json;charset=UTF-8",
            },
        });
    }

    /**
     * Generate the docs html file.
     * @returns Response object
     */
    public async docsPage(): Promise<Response> {
        let html = /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Swagger UI</title>
            <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
            <link rel="icon" type="image/png" href="/docs/favicon.ico" sizes="32x32" />
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script>
                window.onload = function() {
                    const ui = SwaggerUIBundle({
                        url: "/openapi.json",
                        dom_id: '#swagger-ui'
                    })
                }
            </script>
        </body>
        </html>`;

        return new Response(html, {
            headers: {
                "content-type": "text/html;charset=UTF-8",
            },
        });
    }
}
