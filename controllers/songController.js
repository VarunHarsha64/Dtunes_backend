import cloudinary from "../config/cloudinary.js";
import { parseBuffer } from 'music-metadata'
import Song from "../models/Song.js";
import fs from 'fs'
import { title } from "process";

//when getting songs dont forget to send _id of the song as it is requred for deleting the song

export const getAllSongs = async (req, res) => {
    try {
        const songs = await Song.find()
        res.status(200).json({
            success: true,
            data: songs,
        });
    } catch (error) {
        console.error("Error fetching all songs:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
export const getSongById = async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ success: false, message: "Song not found" });
        }
        res.status(200).json({ success: true, data: song });
    } catch (error) {
        console.error("Error fetching song:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getSongsByArtist = async (req, res) => {
    try {
        const { name } = req.params;
        const songs = await Song.find({ artist: { $regex: new RegExp(name, 'i') } }); // case-insensitive
        res.status(200).json({ success: true, data: songs });
    } catch (error) {
        console.error("Error fetching songs by artist:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getMySongs = async (req, res) => {
    try {
        const songs = await Song.find({ uploadedBy: req.user._id });
        res.status(200).json({ success: true, data: songs });
    } catch (error) {
        console.error("Error fetching my songs:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const uploadSong = async (req, res) => {
    try {
        const file = req.file;
        const data = req.body;
        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded!" });
        }

        const cloudRes = await cloudinary.uploader.upload(file.path, {
            resource_type: 'video',
            folder: 'dtunes/songs'
        });

        const buffer = fs.readFileSync(file.path);
        const metadata = await parseBuffer(buffer, file.mimetype);

        const song = new Song({
            title: data.title || file.originalname,
            artist: data.artist || 'Unknown Artist',
            duration: Math.floor(metadata.format.duration),
            lyrics: data.lyrics || "", //handle this later
            cloudinaryUrl: cloudRes.secure_url,
            sourceType: 'upload',
            uploadedBy: req.user?._id || null,
        })

        await song.save();

        fs.unlinkSync(file.path);
        res.status(200).json({
            success: true,
            message: "Song uploaded successfully!"
        })
    } catch (err) {
        console.error('Error uploading song:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteSong = async (req, res) => {
    try {
        const { songId } = req.body;

        if (!songId) {
            return res.status(400).json({
                success: false,
                message: "Song ID is required"
            });
        }

        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({
                success: false,
                message: "Song not found"
            });
        }

        if (!song.uploadedBy || song.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this song"
            });
        }

        if (song.cloudinaryUrl) {
            const segments = song.cloudinaryUrl.split('/');
            const publicIdWithExtension = segments[segments.length - 1];
            const publicId = `dtunes/songs/${publicIdWithExtension.split('.')[0]}`;

            await cloudinary.uploader.destroy(publicId, {
                resource_type: 'video'
            });
        }

        await Song.findByIdAndDelete(songId);

        res.status(200).json({
            success: true,
            message: "Song deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting song:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const updateSong = async (req, res) => {
    try {
        const { songId, title, artist, lyrics } = req.body;

        if (!songId) {
            return res.status(400).json({
                success: false,
                message: "Song ID is required"
            });
        }

        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({
                success: false,
                message: "Song not found"
            });
        }

        if (song.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to update this song"
            });
        }

        if (title) song.title = title;
        if (artist) song.artist = artist;
        if (lyrics) song.lyrics = lyrics;

        await song.save();

        return res.status(200).json({
            success: true,
            message: "Song updated successfully",
            data: song
        });

    } catch (error) {
        console.error("Error updating song:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};