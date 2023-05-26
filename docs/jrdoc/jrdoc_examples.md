---
title: JrDoc x2 Examples
---

### Some examples of JrDoc in action.

```jrdoc
Make a new user
@param where:path type:string name:name | The name of the user
@param where:query type:number name:age | The age of the user
@deprecated
```

```jrdoc
Gets the age of a user
@param where:path type:string name:name | The name of the user
```

```jrdoc
Gets all users with a certain age, or all users if no age is specified
@param where:query type:number name:age optional | The age to search for
```
