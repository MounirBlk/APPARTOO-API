import { Document, Schema } from "mongoose"
import { civiliteTypes, roleTypes } from "../type";

export default interface PangolinInterface extends Document {
    //_id: { $oid: string }|null|string;
    email: string;//
    password: string;//
    name: string;//
    civilite: civiliteTypes;//
    role: roleTypes;//
    attempt?: number;
    createdAt?: Date;
    updateAt?: Date;
    lastLogin? : Date;
    token?: string | null;
    ami?: Schema.Types.ObjectId;//
    verifyPasswordSync: any;
}