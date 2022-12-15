import * as mongoose from 'mongoose';
import PangolinInterface from '../interfaces/PangolinInterface';
import { allTypes } from '../type';
const bcrypt = require("mongoose-bcrypt");

const PangolinSchema = new mongoose.Schema<PangolinInterface>({
    email: {
        trim: true,
        index: true,
        type: String,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        bcrypt: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    civilite: {
        type: String,
        default: "Homme",
        required: true,
        enum: allTypes().civiliteTypesTab,
    },
    role: {
        type: String,
        default: null,
        enum: allTypes().roleTypesTab,
        required: true
    },
    attempt: {
        default: 0,
        type: Number,
        required: false
    },
    createdAt: {
        default: new Date(),
        type: Date,
        required: false
    },
    updateAt: {
        default: new Date(),
        type: Date,
        required: false
    },
    lastLogin: {
        default: new Date(),
        type: Date,
        required: false
    },
    token: {
        default: null,
        type: String,
        required: false
    },
    ami: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PangolinModel',
        required: false,
        default: null
    },// Ajout un AMI
}, {
    collection: "pangolins",
    timestamps: true,
    autoCreate: true
});

PangolinSchema.plugin(bcrypt);
PangolinSchema.index({
    email: 1
});

export default mongoose.model<PangolinInterface>("PangolinModel", PangolinSchema);