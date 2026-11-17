import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("clean up unused uploads", { hours: 1 }, internal.files.cleanupOrphans, {});

export default crons;
