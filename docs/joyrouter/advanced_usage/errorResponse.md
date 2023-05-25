---
title: Advanced Usage - errorResponse
---

errorResponse is a function that allows you to send a pre-defined error response to the client.
It's exactly the same as the Response object, but it returns json with a pre-defined error message.

!!! example

    ```ts
    function myErroringFunction() {
        return errorResponse(400); // Returns { "detail": "Bad Request" } with a status code of 400
    }

    router
        .get("/", myErroringFunction) // Matches only GET requests for the '/' route
    ```

A full list of avaliable error codes are avaliable at the bottom of the page.

Custom error messages can be sent by defining a second parameter:

!!! example

    ```ts
    function myErroringFunction() {
        return errorResponse(600, "My custom error message"); // Returns { "detail": "My custom error message" } with a status code of 600
    }

    router
        .get("/", myErroringFunction) // Matches only GET requests for the '/' route
    ```

Messages can also be added to `handler.errorResponses` to be used later:

!!! example

    ```ts
    router.errorResponses[600] = "My custom error message";

    function myErroringFunction() {
        return errorResponse(600); // Returns { "detail": "My custom error message" } with a status code of 600
    }

    router
        .get("/", myErroringFunction) // Matches only GET requests for the '/' route
    ```

## Error Codes

| Code | Message                         |
| ---- | ------------------------------- |
| 400  | Bad Request                     |
| 401  | Unauthorized                    |
| 403  | Forbidden                       |
| 404  | Not Found                       |
| 405  | Method Not Allowed              |
| 406  | Not Acceptable                  |
| 408  | Request Timeout                 |
| 409  | Conflict                        |
| 410  | Gone                            |
| 411  | Length Required                 |
| 412  | Precondition Failed             |
| 413  | Payload Too Large               |
| 414  | URI Too Long                    |
| 415  | Unsupported Media Type          |
| 416  | Range Not Satisfiable           |
| 417  | Expectation Failed              |
| 418  | I'm a teapot                    |
| 421  | Misdirected Request             |
| 422  | Unprocessable Entity            |
| 423  | Locked                          |
| 424  | Failed Dependency               |
| 425  | Too Early                       |
| 426  | Upgrade Required                |
| 428  | Precondition Required           |
| 429  | Too Many Requests               |
| 431  | Request Header Fields Too Large |
| 451  | Unavailable For Legal Reasons   |
| 500  | Internal Server Error           |
| 501  | Not Implemented                 |
| 502  | Bad Gateway                     |
| 503  | Service Unavailable             |
| 504  | Gateway Timeout                 |
| 521  | Web Server Is Down              |
