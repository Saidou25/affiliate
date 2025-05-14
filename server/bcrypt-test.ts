import bcrypt from "bcrypt";
const plain = "1q2w3e";
const hash = "$2b$10$VVVdqJ6oNqHHHI1kuE6k2.8pxzZ5pZmQt71vtBjr2Y4hI1u0.tU2q";

bcrypt.compare(plain, hash).then(res => console.log("Compare result:", res));
