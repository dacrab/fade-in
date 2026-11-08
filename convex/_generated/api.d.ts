/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as appointmentEmails from "../appointmentEmails.js";
import type * as appointments from "../appointments.js";
import type * as barbers from "../barbers.js";
import type * as barbershops from "../barbershops.js";
import type * as crons from "../crons.js";
import type * as devSeed from "../devSeed.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_email from "../lib/email.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_scheduling from "../lib/scheduling.js";
import type * as lib_shopStats from "../lib/shopStats.js";
import type * as lib_slots from "../lib/slots.js";
import type * as lib_slug from "../lib/slug.js";
import type * as migrations from "../migrations.js";
import type * as payments from "../payments.js";
import type * as reviews from "../reviews.js";
import type * as services from "../services.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  appointmentEmails: typeof appointmentEmails;
  appointments: typeof appointments;
  barbers: typeof barbers;
  barbershops: typeof barbershops;
  crons: typeof crons;
  devSeed: typeof devSeed;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/email": typeof lib_email;
  "lib/limits": typeof lib_limits;
  "lib/scheduling": typeof lib_scheduling;
  "lib/shopStats": typeof lib_shopStats;
  "lib/slots": typeof lib_slots;
  "lib/slug": typeof lib_slug;
  migrations: typeof migrations;
  payments: typeof payments;
  reviews: typeof reviews;
  services: typeof services;
  users: typeof users;
  validators: typeof validators;
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
