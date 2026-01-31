import fs from 'fs/promises';
import cloudinary from "@/config/cloudinary";
import { RequestHandler } from "express";

export const uploadFile: RequestHandler = async (req, res) => {
    const file = req.file
    if (!file) return res.fail(400, "FILE_MISSING", "Provided file was empty/invalid")

    const result = await cloudinary.uploader.upload(file.path, {
        asset_folder: "sharow",
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true
    })

    try {
        await fs.unlink(file.path)
    } catch (error) {
        console.error("Error Unlinking", file.path)
    }
    return res.success(201, { publicId: result.public_id }, "Successfully uploaded the file")
}
