import mongoose from "mongoose";
import adminSchema from "./admin.schema";
import { APIAdmin } from "./types";

export default mongoose.model<APIAdmin>("Admin", adminSchema);
