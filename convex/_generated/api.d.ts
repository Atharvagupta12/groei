/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_cleanup from "../lib/cleanup.js";
import type * as lib_deepgram from "../lib/deepgram.js";
import type * as lib_net from "../lib/net.js";
import type * as lib_providers from "../lib/providers.js";
import type * as lib_voices from "../lib/voices.js";
import type * as likes from "../likes.js";
import type * as podcasts from "../podcasts.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  comments: typeof comments;
  crons: typeof crons;
  files: typeof files;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/cleanup": typeof lib_cleanup;
  "lib/deepgram": typeof lib_deepgram;
  "lib/net": typeof lib_net;
  "lib/providers": typeof lib_providers;
  "lib/voices": typeof lib_voices;
  likes: typeof likes;
  podcasts: typeof podcasts;
  usage: typeof usage;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
