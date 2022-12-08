import mongoose from "mongoose";
import adminSchema from "./admin.schema";
import { APIAdmin } from "./Types";

export default mongoose.model<APIAdmin>("Admin", adminSchema)