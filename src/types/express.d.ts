import { JwtPayload } from "jsonwebtoken";


// why wen needed this file as we are addint req.user in the middleware but the express doesn't know about this
// but it gives use way to that we can extend and add any to our own so here we are extending to store that 
// req.user to TS won't complain about it j

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | string;
    }
  }
}

export {}; // makes this file a module, required for declare global to work correctly



/* 
Totally fair — this is genuinely one of TypeScript's more confusing corners. Let's strip away the jargon and build it up with a simple picture.

**First, forget `.d.ts` for a second. Just think about regular `.ts` files and "module vs script."**

Imagine every file you write is either:
- **A "script"** — everything you declare in it (a variable, a type, whatever) gets dumped into one big shared space that *every other file* can see, automatically, with no importing needed.
- **A "module"** — everything you declare in it is **private to that file**. Other files can't see it unless you explicitly `export` it, and you can't see other files' stuff unless you explicitly `import` it.

**Here's the actual rule TypeScript uses to decide which one a file is:** if a file has *at least one* `import` or `export` statement anywhere in it, TypeScript treats it as a module (private). If it has **zero** `import`/`export` statements, TypeScript treats it as a script (everything leaks into the shared global space).

That's it — that's the entire rule. It's a weirdly simple on/off switch based on something that seems unrelated.

---

**Now, what's `.d.ts`?**

A normal `.ts` file has real code that *runs* — functions, logic, `console.log`s. A `.d.ts` file ("declaration" file) has **no runtime code at all** — it only *describes shapes*. It's like a label on a box describing what's inside, without anything actually being in the box. Your `express.d.ts` doesn't *do* anything when the server runs; it just tells TypeScript "hey, by the way, `Request` objects also have this `.user` field."

---

**Now `declare global` makes sense:**

`declare global { ... }` means: *"I know my file is private (a module), but I specifically want to reach out and add something to that big shared global space anyway."* It's a deliberate, explicit exception to the "modules are private" rule — you're saying "normally nobody outside this file would see what I write here, but this specific thing I want everyone to see."

---

**And now `export {}`:**

Remember the on/off switch — *any* `import` or `export` makes a file a module. `export {}` is exporting... nothing. It does nothing useful on its own. But its mere presence flips the switch to "module," which is what allows `declare global` to make sense as "an exception to module privacy" — if the file were already a script (everything public by default), saying "let me deliberately make this one thing public" wouldn't mean anything, since everything's already public.

**In your actual file**, you already have `import { JwtPayload } from "jsonwebtoken"` at the top — and remember, *any* import already flips the switch. So `export {}` wasn't doing anything in your specific file; it was already a module because of that import line. I mentioned it mainly because you'll see it a lot in `.d.ts` files that *don't* happen to have an import already — it's a defensive habit, not something your file specifically needed.

Does that land better? Happy to go another round with a different analogy if any piece is still fuzzy before we move on to actually testing the protected route.


*/