import mongoose from "mongoose";
import adminSchema from "./adminSchema";
import { APIAdmin } from "./Types";

export default mongoose.model<APIAdmin>("Admin", adminSchema)