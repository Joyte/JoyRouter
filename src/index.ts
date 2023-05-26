import { JoyRouterDocs } from "./docs";

// Custom error
export class ClientError extends Error {
    public statusMessage: string = "Client Error";
    public statusCode: number = 400;

    constructor(statusMessage: string, statusCode: number = 400) {
        super(statusMessage);
        this.statusMessage = statusMessage;
        this.statusCode = statusCode;

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ClientError.prototype);
    }
}

/**
 * JoyRouter is a router designed for cloudflare workers.
 * It has many functionalities, such as:
 *  * Swagger UI documentation
 *  * Automatic OPTIONS request handling
 *  * Middleware
 *  * JSON responses
 *  * Error responses
 *  * And more!
 *
 * To access swagger ui, go to the url of your worker with the path '/docs'.
 * This page can be disabled by setting the `internalRoutes` option to false.
 *
 * @example
 * import { JoyRouter } from "./JoyRouter";
 *
 * const router = new JoyRouter();
 * router
 *      .get("/", function1)
 *      .post("/", function2)
 *      .get("/path", function3)
 *
 * export default {
 *     async fetch(request: Request) {
 *         return await router.handle(req);
 *     },
 * };
 */
export class JoyRouter {
    /**
     * specialHeaders is a list of headers that are used by default with the errorResponse method, and other related methods like json.
     */
    public specialHeaders: { [key: string]: string } = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Accept-Charset": "utf-8",
    };
    /**
     * errorResponses is a list of error responses that can be used with the errorResponse method.
     * The key is the status code, and the value is the status message.
     */
    public errorResponses: { [key: number]: string } = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Payload Too Large",
        414: "URI Too Long",
        415: "Unsupported Media Type",
        416: "Range Not Satisfiable",
        417: "Expectation Failed",
        418: "I'm a teapot",
        421: "Misdirected Request",
        422: "Unprocessable Entity",
        423: "Locked",
        424: "Failed Dependency",
        425: "Too Early",
        426: "Upgrade Required",
        428: "Precondition Required",
        429: "Too Many Requests",
        431: "Request Header Fields Too Large",
        451: "Unavailable For Legal Reasons",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        521: "Web Server Is Down",
    };

    public validWheres: string[] = ["path", "query", "header", "cookie"];

    public validDataTypes: string[] = ["string", "number", "boolean", "json"];

    /**
     * Whether you want the router to handle errors.
     * If set to false, the error traceback will be returned.
     * @example
     * router.handleErrors = false;
     */
    public handleErrors: boolean = true;

    /**
     * Enable the TRACE method.
     * Not recommended for production use.
     */
    public enableTRACEMethod: boolean = false;

    /**
     * Whether you want internal routes like /docs and /openapi.json to be enabled.
     */
    public internalRoutes = true;

    private urlRegex =
        /(?<scheme>https?:\/\/)(?<domain>[^\/]+)(?<path>\/[^?]+)(?<query>\?.*)?/;

    private pathVariablesRegex = /\/:(?<variable>[^\/]+)/g;

    /**
     * The jrdocs object.
     * This is used to configure the docs page.
     * @see JoyRouterDocs
     * @example
     * router.docs = new JoyRouterDocs();
     * router.docs.title = "My API";
     * router.docs.description = "My API description";
     */
    public docs: JoyRouterDocs = new JoyRouterDocs();

    private routingDict: {
        [key: string]: {
            methods: Array<string>;
            regex: RegExp;
            params: Array<string>;
        };
    } = {};
    private middleware: {
        [key: number]: { category: string; handler: Function; before: Boolean };
    } = {};
    private routes: { [path: string]: { [method: string]: Function } } = {};
    private handlerArgs: {
        [path: string]: {
            [method: string]: {
                [key: string]: { [key: string]: string };
            };
        };
    } = {};
    private handlerCategories: {
        [path: string]: {
            [method: string]: string;
        };
    } = {};

    /**
     * Return the typed arguments of a function.
     * Any function without a type for an arg will be set to 'any'.
     * Uses joyrouter-style comments to get the types.
     * Param tags are escaped with a backslash, remove these in your code.
     * @param func The function to get the arguments from.
     * @returns The arguments of the function.
     * @example
     * function myFunction(arg1: string, arg2: number) { }
     *
     * function myFunction2(arg1: string, arg2: number) {
     *  `
     *   \@param where:query type:string name:arg1 | Argument 1
     *   \@param where:path type:number name:arg2 | Argument 2
     *  `;
     * }
     *
     * router.getTypedFunctionArgs(myFunction); // { arg1: "any", arg2: "any" }
     * router.getTypedFunctionArgs(myFunction2); // { arg1: "string", arg2: "number" }
     */
    private getTypedFunctionArgs(func: Function): {
        [key: string]: { [key: string]: string };
    } {
        const functionAsString = func.toString();
        const args = functionAsString
            .split("\n")[0]
            .replace(/.*\((.*)\).*/, "$1")
            .split(",")
            .map((arg) => arg.trim());

        const argsDict: { [key: string]: { [key: string]: string } } =
            args[0] !== ""
                ? Object.fromEntries(
                      args.map((arg) => [
                          arg,
                          arg === "req" ? { type: "Request" } : { type: "any" },
                      ])
                  )
                : {};

        const jsdocMatch = functionAsString.match(this.docs.jsdocRegex);

        if (jsdocMatch) {
            const tags = jsdocMatch[0].match(this.docs.tagRegex);
            const paramTags = tags?.filter((tag) => tag.includes("@param"));

            if (paramTags) {
                paramTags.forEach((tag) => {
                    const typeMatch = tag.match(/type:([^ ]*)/);
                    const nameMatch = tag.match(/name:([^ ]*)/);
                    const whereMatch = tag.match(/where:([^ ]*)/);

                    const optionalMatch = tag.match(/ optional/);
                    const deprecatedMatch = tag.match(/ deprecated/);

                    const type = typeMatch?.[1];
                    const name = nameMatch?.[1];
                    const where = whereMatch?.[1];
                    const optional = optionalMatch ? true : false;
                    const deprecated = deprecatedMatch ? true : false;

                    // Make option and deprecated into a string
                    const other = `${optional ? "optional " : ""}${
                        deprecated ? "deprecated " : ""
                    }`;

                    if (type && name && where) {
                        if (!this.validWheres.includes(where)) {
                            throw new Error(
                                `Invalid where: ${where} in ${tag} in ${
                                    func.name
                                }. Should be one of ${this.validWheres.join(
                                    ", "
                                )}`
                            );
                        }

                        argsDict[name] = {
                            type: type,
                            where: where,
                            other: other,
                        };
                    }
                });
            }
        }

        return argsDict;
    }

    /**
     * Add an option to the optionsDict.
     * @param path The path to add the option to.
     * @param method The method to add.
     * @param responseHandler The response handler to add.
     * @param bypassReservedPaths Whether to bypass the reserved paths check. Don't set this to true unless you know what you're doing.
     * @example
     * router.addOption("/", "GET");
     */
    private addRoute(
        path: string,
        method: string,
        responseHandler: Function,
        bypassReservedPaths: boolean = false
    ): void {
        if (
            ["/docs", "/openapi.json"].includes(path) &&
            !this.internalRoutes &&
            !bypassReservedPaths
        ) {
            throw new Error(
                `The path '${path}' is reserved for internal use. Please use a different path or set internalRoutes to true.`
            );
        }

        let pathParams: string[] = [];
        let ogpath = path;
        if (this.pathVariablesRegex.test(path)) {
            pathParams =
                path.match(this.pathVariablesRegex)?.map((p) => p.slice(2)) ||
                [];

            // Remove the path variables from the path and format them like {variable}
            path = path.replace(this.pathVariablesRegex, "/{$1}");
        }

        // Get category from jsdoc
        const category = responseHandler
            .toString()
            .match(this.docs.jsdocRegex)?.[0]
            .match(/@category ([^ ]*)/)?.[1]
            .trim();

        // Add the category to the handlerCategories dict
        this.handlerCategories[path] = {
            ...this.handlerCategories[path],
            [method]: category || "default",
        };

        const handlerArgs = this.getTypedFunctionArgs(responseHandler);
        this.handlerArgs[path] = {
            ...this.handlerArgs[path],
            [method]: handlerArgs,
        };

        if (pathParams) {
            pathParams.forEach((arg) => {
                if (!handlerArgs[arg]) {
                    throw new Error(
                        `The path variable '${arg}' in '${ogpath}' does not have an '@param' tag in the handler function '${responseHandler.name}'.`
                    );
                } else if (handlerArgs[arg].where !== "path") {
                    throw new Error(
                        `The path variable '${arg}' in '${ogpath}' has the 'where:' tag set to '${handlerArgs[arg].where}' instead of 'path' in the handler function '${responseHandler.name}'.`
                    );
                }
            });

            pathParams.forEach((arg) => {
                handlerArgs[arg].where = "path";
            });
        }

        const methods = this.routingDict[path]?.methods || ["OPTIONS"];

        // Get regex for path, replacing any {<variable>} with [^/]+ as named capture groups using the variable name
        let regex = path.replace(
            /{([^}]*)}/g,
            (_, variable) => `(?<${variable}>[^/]+)`
        );

        this.routingDict[path] = {
            methods: [...new Set([...methods, method])],
            regex: new RegExp(`^${regex}$`),
            params: pathParams,
        };

        this.routes[path] = { ...this.routes[path], [method]: responseHandler };

        this.docs.handlerArgs = this.handlerArgs;
    }

    /**
     * Get the path from a URL.
     * @param url The URL to get the path from.
     * @returns The path.
     * @example
     * router.getPath("https://example.com/path/to/something?query=string"); // "/path/to/something"
     */
    private getPath(url: string): string {
        return url.match(this.urlRegex)?.groups?.path || "/";
    }

    /**
     * Get the path from a URL.
     * Neutralizes all path variables.
     * @param path The path to get the path from.
     * @returns The path.
     */
    private getPathInternal(url: string): string {
        for (let route in this.routes) {
            let routeInfo = this.routingDict[route];
            if (routeInfo.regex.test(this.getPath(url))) {
                return route;
            }
        }

        return "/";
    }

    /**
     * Get the arguments of a handler function.
     * @param request The request to get the arguments from.
     * @returns The arguments of the handler function.
     */
    private getHandlerArgs(request: Request): {
        [key: string]: { [key: string]: string };
    } {
        return this.handlerArgs[this.getPathInternal(request.url)][
            request.method
        ];
    }

    /**
     * Get the query parameters from a URL.
     * @param url The URL to get the query parameters from.
     * @returns The query parameters.
     */
    private getQuery(url: string): { [key: string]: string } {
        const query = url.match(this.urlRegex)?.groups?.query;

        if (!query) {
            return {};
        }

        const queryDict: { [key: string]: string } = {};

        query
            .replace("?", "")
            .split("&")
            .forEach((query) => {
                const [key, value] = query.split("=");
                queryDict[key] = value;
            });

        return queryDict;
    }

    /**
     * Get a handler from a request.
     * @param request The request to get the handler from.
     * @returns The handler and params.
     * @example
     * router.getResponse(req);
     */
    private getHandler(request: Request): {
        handler: Function;
        params: { [key: string]: string };
    } {
        const getHandlerInternal = (
            method: string,
            url: string
        ): { handler: Function; params: { [key: string]: string } } | null => {
            for (let path in this.routes) {
                let routeInfo = this.routingDict[path];
                if (routeInfo.regex.test(url)) {
                    let match = routeInfo.regex.exec(url);
                    let params = match?.groups || {};
                    const handler =
                        this.routes[path]?.[method] ||
                        this.routes[path]?.["*"] ||
                        this.routes["*"]?.[method] ||
                        this.routes["*"]?.["*"] ||
                        null;
                    return { handler, params };
                }
            }
            return null;
        };

        const path = this.getPath(request.url);
        const { handler, params } = getHandlerInternal(
            request.method,
            path
        ) || {
            handler: this.errorResponse(404),
            params: {},
        };

        return { handler, params };
    }

    /**
     * Get the methods that are allowed for a path.
     * @param path The path to get the methods for.
     * @returns An array of methods.
     * @example
     * router.getMethods("/"); // ["GET", "OPTIONS"]
     */
    getMethods(path: string): Array<string> {
        for (const [routePath, routeInfo] of Object.entries(this.routingDict)) {
            if (routeInfo.regex.test(path)) {
                return routeInfo.methods;
            }
        }
        return [];
    }

    /**
     * Handle a request to the GET method.
     * @param path The path to handle.
     * @param handler The handler to use.
     * @returns The BittyRouter instance.
     * @example
     * router.get("/", async () => {
     *   return new Response(JSON.stringify({ detail: "Hello, world!" }), {
     *      status: 200,
     * });});
     */
    get(path: string, handler: (...args: any) => Promise<Response>): JoyRouter {
        this.addRoute(path, "GET", handler);
        return this;
    }

    /**
     * Handle a request to the POST method.
     * @param path The path to handle.
     * @param handler The handler to use.
     * @returns The BittyRouter instance.
     * @example
     * router.post("/", async () => {
     *  return new Response(JSON.stringify({ detail: "Hello, world!" }), {
     *     status: 200,
     * });});
     */
    post(
        path: string,
        handler: (...args: any) => Promise<Response>
    ): JoyRouter {
        this.addRoute(path, "POST", handler);
        return this;
    }

    /**
     * Handle a request to the PUT method.
     * @param path The path to handle.
     * @param handler The handler to use.
     * @returns The BittyRouter instance.
     * @example
     * router.put("/", async () => {
     *  return new Response(JSON.stringify({ detail: "Hello, world!" }), {
     *     status: 200,
     * });});
     */
    put(path: string, handler: (...args: any) => Promise<Response>): JoyRouter {
        this.addRoute(path, "PUT", handler);
        return this;
    }

    /**
     * Handle a request to the PATCH method.
     * @param path The path to handle.
     * @param handler The handler to use.
     * @returns The BittyRouter instance.
     * @example
     * router.patch("/", async () => {
     *  return new Response(JSON.stringify({ detail: "Hello, world!" }), {
     *     status: 200,
     * });});
     */
    patch(
        path: string,
        handler: (...args: any) => Promise<Response>
    ): JoyRouter {
        this.addRoute(path, "PATCH", handler);
        return this;
    }

    /**
     * Handle a request to the DELETE method.
     * @param path The path to handle.
     * @param handler The handler to use.
     * @returns The BittyRouter instance.
     * @example
     * router.delete("/", async () => {
     *  return new Response(JSON.stringify({ detail: "Hello, world!" }), {
     *     status: 200,
     * });});
     */
    delete(
        path: string,
        handler: (...args: any) => Promise<Response>
    ): JoyRouter {
        this.addRoute(path, "DELETE", handler);
        return this;
    }

    /**
     * Handle a request to the CONNECT method.
     * @param path The path to handle.
     * @param handler The handler to use.
     * @returns The BittyRouter instance.
     * @example
     * router.connect("/", async () => {
     * return new Response(JSON.stringify({ detail: "Hello, world!" }), {
     *  status: 200,
     * });});
     */
    connect(
        path: string,
        handler: (...args: any) => Promise<Response>
    ): JoyRouter {
        this.addRoute(path, "CONNECT", handler);
        return this;
    }

    /**
     * Handle a request to a custom method.
     * @param method The method to handle.
     * @param path The path to handle.
     * @param handler The handler to use.
     * @returns The BittyRouter instance.
     * @example
     * router.custom("NERD", "/", async () => {
     * return new Response(JSON.stringify({ detail: "Hello, world!" }), {
     *   status: 200,
     * });});
     */
    custom(
        method: string,
        path: string,
        handler: (...args: any) => Promise<Response>
    ): JoyRouter {
        this.addRoute(path, method.toUpperCase(), handler);
        return this;
    }

    /**
     * Handle a request to any method.
     * @param path The path to handle.
     * @param handler The handler to use.
     * @returns The BittyRouter instance.
     * @example
     * router.all("*", async () => {
     *    return new Response(JSON.stringify({ detail: "404 Not Found" }), {
     *       status: 404,
     * });});
     */
    all(path: string, handler: (...args: any) => Promise<Response>): JoyRouter {
        this.addRoute(path, "*", handler);
        return this;
    }

    /**
     * Handle a request to a method, and return predefined JSON.
     * @param method The method to handle.
     * @param path The path to handle.
     * @param json The JSON to return.
     * @param code The status code to return.
     * @returns The BittyRouter instance.
     * @example
     * router.getjson("/", { detail: "Hello, world!" }, 200);
     */
    json(
        method: string,
        path: string,
        json: { [key: string]: any },
        code: number = 200,
        statusText: string = ""
    ): JoyRouter {
        this.addRoute(path, method, async (request: Request) => {
            return new Response(JSON.stringify(json), {
                status: code,
                statusText: statusText,
                headers: this.specialHeaders,
            });
        });

        return this;
    }

    /**
     * A helper function to return an error response. All parameters are optional except the status code.
     * The function itself returns a function, for use in the router.
     * @param code The status code to return.
     * @param message The message to return.
     * @param statusText The status text to return.
     * @returns The BittyRouter instance.
     * @example
     * return router.errorResponse(404);
     */
    errorResponse(
        code: number = 500,
        message: string = ""
    ): (req?: Request) => Promise<Response> {
        if (!this.errorResponses[code]) {
            throw new Error(
                `Invalid status code ${code} in errorResponse caller!`
            );
        }

        return async (): Promise<Response> => {
            let res = new Response(
                JSON.stringify({
                    detail: message ? message : this.errorResponses[code],
                }),
                {
                    status: code,
                    statusText: message ? message : this.errorResponses[code],
                    headers: new Headers({
                        "Content-Type": "application/json",
                    }),
                }
            );

            // Run middleware if enabled
            for (const middleware of Object.values(this.middleware)) {
                if (middleware.category !== "error") continue;

                try {
                    res = await middleware.handler(res);
                } catch (e) {
                    console.error(e);
                    // Return 500 if middleware fails
                    return new Response(
                        JSON.stringify({
                            detail: this.errorResponses[500],
                        }),
                        {
                            status: 500,
                            statusText: this.errorResponses[500],
                            headers: new Headers({
                                "Content-Type": "application/json",
                            }),
                        }
                    );
                }
            }
            return res;
        };
    }

    /**
     * Add middleware to the router. Runs an asynchronous function which takes a Response and must return a Response.
     * Middleware is run in the order it is added.
     * @param middleware The middleware function to run. Must take a Response object.
     * @returns The BittyRouter instance.
     * @example
     * function middleware(res: Response) {
     *     res.headers.set("X-Hello", "World"); // Set a header
     *     return res; // Return the response
     * }
     *
     * router.middleware(middleware);
     */
    use(
        middleware: (res: Response) => Response | Promise<Response>,
        category: string = "default"
    ): JoyRouter {
        // Make sure middleware only takes one parameter
        if (middleware.length !== 1) {
            throw new Error(
                `Invalid middleware function! Middleware must take a single parameter named either "request" or "response".`
            );
        }

        // Check what parameters the middleware function takes. If it is not response or request, throw an error.
        const functionAsString = middleware.toString();
        const args = functionAsString
            .split("\n")[0]
            .replace(/.*\((.*)\).*/, "$1")
            .split(",")
            .map((arg) => arg.trim());

        if (!["response", "request"].includes(args[0])) {
            throw new Error(
                `Invalid middleware function! Middleware must take a single parameter named either "request" or "response".`
            );
        }

        if (args[0] === "request" && category === "error") {
            throw new Error(
                `Invalid middleware function! Middleware that takes a request (before middleware) cannot be in the error category.`
            );
        }

        // Add middleware to the dictionary, with the key being the length of the dictionary, with the category as "default"
        this.middleware[Object.keys(this.middleware).length] = {
            handler: middleware,
            category: category,
            before: args[0] === "request",
        };

        return this;
    }

    /**
     * Get argument data for a request.
     * @param request The request to get data from.
     * @param arg The argument to get data for.
     * @param argData The argument data to use.
     * @param params The parameters to use.
     */
    getArgData(
        request: Request,
        arg: string,
        argData: { [key: string]: string },
        params: { [key: string]: string } = {}
    ): any {
        if (!this.validWheres.includes(argData.where)) {
            throw new Error(
                `Invalid data type ${
                    argData.where
                } in getArgData! Should be one of ${this.validWheres.join(
                    ", "
                )}`
            );
        }

        let applyDataType = (
            data: string | undefined,
            dataType: string,
            optional: boolean
        ) => {
            try {
                let result: any;
                switch (dataType) {
                    case "string":
                        result = data;
                        break;
                    case "number":
                        result = Number(data);
                        if (isNaN(result)) {
                            throw new TypeError("number");
                        }
                        break;
                    case "boolean":
                        if (["true", "t", "1"].includes(data!.toLowerCase())) {
                            result = true;
                        } else if (
                            ["false", "f", "0"].includes(data!.toLowerCase())
                        ) {
                            result = false;
                        } else {
                            throw new TypeError("boolean");
                        }
                        break;
                    case "object":
                        result = JSON.parse(decodeURIComponent(data!));
                        break;
                    default:
                        console.warn(
                            `Invalid data type ${dataType} in getArgData! Should be one of ${this.validDataTypes.join(
                                ", "
                            )}`
                        );
                }
                return result;
            } catch (e) {
                if (e instanceof SyntaxError) {
                    if (optional && data == undefined) return undefined;
                    throw new ClientError(
                        `Invalid JSON for ${arg}! ${e.message}`
                    );
                } else if (e instanceof TypeError) {
                    if (optional && data == undefined) return undefined;
                    throw new ClientError(
                        `Invalid data type for ${arg}! Should be '${e.message}'!`
                    );
                } else {
                    throw e;
                }
            }
        };

        switch (argData.where) {
            case "query":
                let data = this.getQuery(request.url)[arg];
                if (!data && !argData.other.includes("optional")) {
                    throw new ClientError(
                        `Missing required query parameter ${arg}!`
                    );
                }

                return applyDataType(
                    data,
                    argData.type,
                    argData.other.includes("optional")
                );
            case "header":
                let header = request.headers.get(arg);
                if (!header && !argData.other.includes("optional")) {
                    throw new ClientError(`Missing required header ${arg}!`);
                }

                return applyDataType(
                    header || undefined,
                    argData.type,
                    argData.other.includes("optional")
                );
            case "cookie":
                let cookie = request.headers.get("Cookie");
                if (!cookie && !argData.other.includes("optional")) {
                    throw new ClientError(`Missing required cookie ${arg}!`);
                }

                let cookieData = cookie
                    ?.split("; ")
                    .find((c) => c.startsWith(arg));
                if (!cookieData && !argData.other.includes("optional")) {
                    throw new ClientError(`Missing required cookie ${arg}!`);
                }

                return applyDataType(
                    cookieData?.split("=")[1],
                    argData.type,
                    argData.other.includes("optional")
                );
            case "path":
                let argument = params[arg];
                if (!argument && !argData.other.includes("optional")) {
                    throw new ClientError(
                        `Missing required path parameter ${arg}!`
                    );
                }

                return applyDataType(
                    argument,
                    argData.type,
                    argData.other.includes("optional")
                );
        }
    }

    /**
     * Handle a request, and return the response.
     * @param request The request to handle.
     * @returns The response.
     * @example
     * export default {
     *     async fetch(request: Request) {
     *         return await router.handle(req);
     *     },
     * };
     */
    async handle(request: Request): Promise<Response> {
        // Check if the docs are enabled
        if (this.internalRoutes && this.docs) {
            // Add the docs route
            this.addRoute("/docs", "GET", this.docs.docsPage, true);
            this.addRoute(
                "/openapi.json",
                "GET",
                () => {
                    return this.docs!.openapiJSONPage(
                        this.docs!.generateOpenAPI(this.routes)
                    );
                },
                true
            );
        }

        // If this is an OPTIONS request, return the allowed methods
        const allowedMethods = this.getMethods(
            this.getPathInternal(request.url)
        );
        if (request.method === "OPTIONS") {
            return new Response(
                JSON.stringify({ allowed_methods: allowedMethods }),
                {
                    headers: {
                        "Access-Control-Allow-Methods":
                            allowedMethods.join(", "),
                    },
                }
            );
        } else if (request.method === "TRACE" && this.enableTRACEMethod) {
            return new Response(
                JSON.stringify({
                    body: await request.text(),
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                })
            );
        } else {
            // Check if the method is allowed
            if (
                !allowedMethods.includes(request.method) &&
                !allowedMethods.includes("*") &&
                this.routes[this.getPathInternal(request.url)] &&
                request.method !== "HEAD"
            ) {
                return this.errorResponse(405)();
            }
        }

        // Get the handler and params
        let { handler, params } = this.getHandler(request);

        // Run the before middleware
        for (const middleware of Object.values(this.middleware)) {
            // Check if the middleware is an before middleware
            if (!middleware.before) continue;

            // Check if the middleware category is the same as the function's category
            if (
                this.handlerCategories[this.getPathInternal(request.url)][
                    request.method
                ] !== middleware.category
            ) {
                continue;
            }

            // Run the middleware
            try {
                request = await middleware.handler(request);
            } catch (e) {
                if (e instanceof ClientError) {
                    return this.errorResponse(e.statusCode, e.statusMessage)();
                } else if (e instanceof Error) {
                    return this.errorResponse(500, e.message)();
                }
            }
        }

        // Check if the handler wants a request object, and if so what position it is in.
        // Any other arguments should be filled with the appropriate values.
        let handlerArgs;
        handlerArgs = this.getHandlerArgs(request);
        // Loop through the handlerArgs dictionary and fill in the arguments.
        let args: any[] = [];

        // Loop through the arguments the function needs
        for (const arg of Object.keys(this.getTypedFunctionArgs(handler))) {
            // Check if a matching entry is in params
            if (params[arg]) {
                // If so, add it to args
                args.push(
                    this.getArgData(
                        request,
                        arg,
                        {
                            where: "path",
                            type: handlerArgs[arg]["type"],
                            other: "",
                        },
                        params
                    )
                );
                continue;
            } else if (handlerArgs[arg] && !["request"].includes(arg)) {
                // Matching entry must be in handlerargs
                args.push(this.getArgData(request, arg, handlerArgs[arg]));
            } else {
                // Check pre-defined arguments
                switch (arg) {
                    case "request":
                        args.push(request);
                        break;

                    default:
                        console.warn(
                            `Argument '${arg}' is defined in function '${handler.name}' but not jrdoc!`
                        );
                        args.push(undefined);
                        break;
                }
            }
        }

        // Run the handler
        let response = handler.apply(null, args).catch((e: Error) => {
            if (this.handleErrors) {
                console.error(e);
                return this.errorResponse(500)();
            } else {
                throw e;
            }
        });

        // Run the after middleware
        for (const middleware of Object.values(this.middleware)) {
            // Check if the middleware is an after middleware
            if (middleware.before) continue;

            // Check if the middleware category is the same as the function's category
            if (
                this.handlerCategories[this.getPathInternal(request.url)][
                    request.method
                ] !== middleware.category
            ) {
                continue;
            }

            response = response
                .then((response: Response) => {
                    return middleware.handler(response);
                })
                .catch((e: Error | ClientError) => {
                    if (e instanceof ClientError) {
                        return this.errorResponse(
                            e.statusCode,
                            e.statusMessage
                        )();
                    } else if (e instanceof Error) {
                        return this.errorResponse(500, e.message)();
                    }
                });
        }

        // HTTP Head method
        if (request.method === "HEAD") {
            response = response.then((res: Response) => {
                return new Response(null, {
                    status: res.status,
                    statusText: res.statusText,
                    headers: res.headers,
                });
            });
        }

        return response;
    }
}
