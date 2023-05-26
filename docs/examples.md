---
hide:
    - navigation
---

### Example A: Basic router

```ts
import { JoyRouter } from "@joyte/joyrouter";

const router = new JoyRouter();

router.json("GET", "/", { message: "Hello, world!" });

export default {
    async fetch(request: Request) {
        return await router.handle(req);
    },
};
```

---

### Example B: Advanced router

```ts
import { JoyRouter } from "@joyte/joyrouter";

const router = new JoyRouter();

class Holder {
    users: { [name: string]: [age: number] } = {};
}

let holder = new Holder();

/**
 * Gets the age of a user
 * @param name The name of the user
 * @returns The age of the user
 */
function getAge(name: string): number {
    /*jrdoc*/ `
    Gets the age of a user
    @param where:path type:string name:name | The name of the user
    `;
    return holder.users[name] ? holder.users[name][0] : -1;
}

/**
 * Gets all users with a certain age
 * @param user The name of the user
 * @returns all users with a certain age
 */
function getNames(age: number): string[] {
    /*jrdoc*/ `
    Gets all users with a certain age
    @param where:query type:number name:age | The age to search for
    `;
    let names: string[] = [];

    for (let name in holder.users) {
        if (holder.users[name][0] === age) {
            names.push(name);
        }
    }

    return names;
}

/**
 * Make a new user
 * @param name The name of the user
 * @param age The age of the user
 * @returns The name and age of the user
 */
function makeUser(name: string, age: number): [string, number] {
    /*jrdoc*/ `
    Make a new user
    @param where:query type:string name:name | The name of the user
    @param where:query type:number name:age | The age of the user
    @deprecated
    `;
    holder.users[name] = [age];
    return [name, age];
}

// Define routes
router
    .get("/user/get/name/:name", getAge)
    .get("/user/get/age/:age", getNames)
    .post("/user/create", makeUser);

// Export the router
export default {
    async fetch(request: Request) {
        return await router.handle(req);
    },
};
```

---

### Example C: Advanced router with after middleware

```ts
import { JoyRouter } from "@joyte/joyrouter";

const router = new JoyRouter();

class Library {
    books: { [title: string]: [author: string] } = {};
}

let library = new Library();

/**
 * Gets the author of a book
 * @param title The title of the book
 * @returns The author of the book
 */
function getAuthor(title: string): string {
    /*jrdoc*/ `
    Gets the author of a book
    @category acao
    @param where:path type:string name:title | The title of the book
    `;
    return library.books[title] ? library.books[title][0] : "Unknown";
}

/**
 * Gets all books by a certain author
 * @param author The author to search for
 * @returns all books by a certain author
 */
function getTitles(author: string): string[] {
    /*jrdoc*/ `
    Gets all books by a certain author
    @category acao
    @param where:query type:string name:author | The author to search for
    `;
    let titles: string[] = [];

    for (let title in library.books) {
        if (library.books[title][0] === author) {
            titles.push(title);
        }
    }

    return titles;
}

/**
 * Add a new book to the library
 * @param title The title of the book
 * @param author The author of the book
 * @returns The title and author of the book
 */
function addBook(title: string, author: string): [string, string] {
    /*jrdoc*/ `
    Add a new book to the library
    @param where:query type:string name:title | The title of the book
    @param where:query type:string name:author | The author of the book
    @deprecated
    `;
    library.books[title] = [author];
    return [title, author];
}

function afterMiddleware(response: Response) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
}

router
    .get("/book/get/title/:title", getAuthor)
    .get("/book/get/author/:author", getTitles)
    .post("/book/add", addBook)
    .use(afterMiddleware, "acao");

export default {
    async fetch(request: Request) {
        return await router.handle(req);
    },
};
```

---

### Example D: Advanced router with before middleware

```ts
import { JoyRouter, ClientError } from "@joyte/joyrouter";

const router = new JoyRouter();

class Dealership {
    cars: { [model: string]: [make: string, price: number] } = {};
}

let dealership = new Dealership();

/**
 * Gets the make and price of a car
 * @param model The model of the car
 * @returns The make and price of the car
 */
function getCarDetails(model: string): [string, number] {
    /*jrdoc*/ `
    Gets the make and price of a car
    @param where:path type:string name:model | The model of the car
    `;
    return dealership.cars[model] ? dealership.cars[model] : ["Unknown", 0];
}

/**
 * Gets all cars by a certain make
 * @param make The make to search for
 * @returns all cars by a certain make
 */
function getModels(make: string): string[] {
    /*jrdoc*/ `
    Gets all cars by a certain make
    @param where:query type:string name:make | The make to search for
    `;
    let models: string[] = [];

    for (let model in dealership.cars) {
        if (dealership.cars[model][0] === make) {
            models.push(model);
        }
    }

    return models;
}

/**
 * Add a new car to the dealership
 * @param model The model of the car
 * @param make The make of the car
 * @param price The price of the car
 * @returns The model, make, and price of the car
 */
function addCar(
    model: string,
    make: string,
    price: number
): [string, string, number] {
    /*jrdoc*/ `
    Add a new car to the dealership
    @param where:query type:string name:model | The model of the car
    @param where:query type:string name:make | The make of the car
    @param where:query type:number name:price | The price of the car
    @deprecated
    @category auth
    `;
    dealership.cars[model] = [make, price];
    return [model, make, price];
}

function authMiddleware(request: Request) {
    // Check if the request has the correct headers
    if (!request.headers.has("Authorization")) {
        throw new ClientError("Missing Authorization header", 401);
    }

    // Check if the request has the correct token
    if (request.headers.get("Authorization") !== "secret") {
        throw new ClientError("Invalid Authorization token", 401);
    }

    return request;
}

handler
    .get("/car/get/model/:model", getCarDetails)
    .get("/car/get/make/:make", getModels)
    .post("/car/add", addCar)
    .use(authMiddleware, "auth");

export default {
    async fetch(request: Request) {
        return await router.handle(req);
    },
};
```
