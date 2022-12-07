import { PassportLocalDocument } from "mongoose";

export interface APIAdmin extends PassportLocalDocument {
  email: string;
  password: string;
}