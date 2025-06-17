import mongoose from "mongoose";
const AvatarReportSchema = new mongoose.Schema({
    avatarID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    Scamming:{
        type:Boolean,
        enum:[true,false],
    },
    Offensive:{
        type:Boolean,
        enum:[true,false]

    },
    SomethingElse:{
        type:Boolean,
        enum:[true,false]
    }



},{timestamps: true})
export const ReportAvt = mongoose.model("ReportAvt",AvatarReportSchema);