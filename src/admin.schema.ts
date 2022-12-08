import { Schema, PassportLocalDocument, PassportLocalSchema, Model, PassportLocalModel } from 'mongoose';
import passportLocalMongoose from "passport-local-mongoose";
import { APIAdmin } from './Types';

const schema: PassportLocalSchema<PassportLocalDocument, PassportLocalModel<APIAdmin>> = new Schema({
    _id: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
})

schema.plugin(passportLocalMongoose);

export default schema