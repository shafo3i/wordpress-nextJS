import { z } from "zod"

// Next loads this before application client code. Keep browser validation CSP-safe;
// server-side Zod configuration and validation rules are unchanged.
z.config({ jitless: true })
