import Playlist from "../models/Playlist.js";
import { v4 as uuidv4 } from 'uuid';

export const createPlaylist = async (req, res) => {
    try {
        const { name, description, type } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Playlist name is required' });
        }

        let sharedLink = null;
        if (type === 'private') {
            sharedLink = uuidv4(); // generate a unique token for sharing
        }

        const playlist = new Playlist({
            name,
            description,
            type: type || 'personal', //personal is the default type
            creator: req.user._id,
            sharedLink,
        });

        await playlist.save();

        res.status(201).json({ success: true, message: 'Playlist created', data: { playlist } });
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const updatePlaylist = async (req, res) => {
    try {
        const { playlistId, name, description, visibility } = req.body;

        if (!playlistId) {
            return res.status(400).json({ success: false, message: "Playlist ID is required" });
        }

        // Validate visibility if provided
        const validVisibilities = ["private", "group", "public"];
        if (visibility && !validVisibilities.includes(visibility)) {
            return res.status(400).json({ success: false, message: "Invalid visibility value" });
        }

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        // Check if the user is the creator
        console.log(playlist)
        if (playlist.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        // Handle visibility updates
        const oldVisibility = playlist.visibility;

        if (oldVisibility === 'private') {
            if (visibility === 'private' || visibility === 'group') {
                // do nothing
            } else if (visibility === 'public') {
                playlist.sharedLink = null; // delete sharedLink
            }
        } else if (oldVisibility === 'group') {
            if (visibility === 'private') {
                playlist.collaborators = []; // clear collaborators
            } else if (visibility === 'group') {
                // do nothing
            } else if (visibility === 'public') {
                playlist.sharedLink = null; // remove sharedLink
            }
        } else if (oldVisibility === 'public') {
            if (visibility === 'private') {
                playlist.collaborators = [];
                playlist.sharedLink = uuidv4(); // generate new sharedLink
            } else if (visibility === 'group') {
                // keep collaborators if already present
                if (!playlist.sharedLink) {
                    playlist.sharedLink = uuidv4(); // generate new sharedLink if missing
                }
            } else if (visibility === 'public') {
                // do nothing
            }
        }

        playlist.visibility = visibility;

        // Update other fields if provided
        if (name) playlist.name = name;
        if (description) playlist.description = description;

        await playlist.save();

        return res.status(200).json({ success: true, message: "Playlist updated", data: { playlist } });
    } catch (error) {
        console.error("Error updating playlist:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


export const getUserPlaylists = async (req, res) => {
    try {
        const userId = req.user._id;

        const playlists = await Playlist.find({
            $or: [
                { creator: userId },
                { collaborators: userId }
            ]
        }).populate('songs');

        res.status(200).json({ success: true, data: { playlists } });
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getPlaylistBySharedLink = async (req, res) => {
    try {
        const { sharedLink } = req.params;

        if (!sharedLink) {
            return res.status(400).json({
                success: false,
                message: "Shared link parameter is required",
            });
        }

        const playlist = await Playlist.findOne({ sharedLink });

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: "Playlist not found with this shared link",
            });
        }

        // Optional: You might want to restrict info returned depending on your needs,
        // e.g. don't send collaborators or sensitive info for public/shared view.

        return res.status(200).json({
            success: true,
            playlist,
        });
    } catch (error) {
        console.error("Error fetching playlist by shared link:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const regenerateSharedLink = async (req, res) => {
    try {
        const { playlistId } = req.body;
        const userId = req.user._id;

        if (!playlistId) {
            return res.status(400).json({ success: false, message: "Playlist ID is required" });
        }

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        if (playlist.creator.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        if (playlist.visibility === "public") {
            return res.status(400).json({ success: false, message: "Public playlists do not have shared links" });
        }

        // Generate and assign new shared link
        const newSharedLink = uuidv4();
        playlist.sharedLink = newSharedLink;
        await playlist.save();

        res.status(200).json({
            success: true,
            message: "Shared link regenerated successfully",
            data: {
                sharedLink: newSharedLink
            },
        });

    } catch (err) {
        console.error("Error regenerating shared link:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const addSongToPlaylist = async (req, res) => {
    try {
        const { playlistId, songId } = req.body;

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        if (!playlist.creator.equals(req.user._id) && !(playlist.collaborators || []).includes(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this playlist' });
        }

        if (playlist.songs.includes(songId)) {
            return res.status(400).json({ success: false, message: 'Song already in playlist' });
        }

        playlist.songs.push(songId);
        await playlist.save();

        res.status(200).json({ success: true, message: 'Song added to playlist', data: { playlist } });
    } catch (error) {
        console.error('Error adding song to playlist:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const removeSongFromPlaylist = async (req, res) => {
    try {
        const { playlistId, songId } = req.body;

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        if (!playlist.creator.equals(req.user._id) && !(playlist.collaborators || []).includes(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this playlist' });
        }

        playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
        await playlist.save();

        res.status(200).json({ success: true, message: 'Song removed from playlist', data: { playlist } });
    } catch (error) {
        console.error('Error removing song from playlist:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const deletePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.body;

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        if (!playlist.creator.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this playlist' });
        }

        await Playlist.findByIdAndDelete(playlistId);

        res.status(200).json({ success: true, message: 'Playlist deleted successfully' });
    } catch (error) {
        console.error('Error deleting playlist:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

import User from '../models/User.js'; // Assuming you have a User model

export const addCollaborator = async (req, res) => {
    try {
        const { playlistId, collaboratorEmail } = req.body;

        if (!playlistId || !collaboratorEmail) {
            return res.status(400).json({ success: false, message: "Playlist ID and collaborator's email are required" });
        }

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        if (!playlist.creator.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only playlist creator can add collaborators' });
        }

        const collaborator = await User.findOne({ email: collaboratorEmail });
        if (!collaborator) {
            return res.status(404).json({ success: false, message: 'Collaborator user not found' });
        }

        if (playlist.collaborators.includes(collaborator._id)) {
            return res.status(400).json({ success: false, message: 'User is already a collaborator' });
        }

        playlist.collaborators.push(collaborator._id);
        await playlist.save();

        res.status(200).json({ success: true, message: 'Collaborator added', data: { playlist } });
    } catch (error) {
        console.error('Error adding collaborator:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const removeCollaborator = async (req, res) => {
    try {
        const { playlistId, collaboratorId } = req.body;

        if (!playlistId || !collaboratorId) {
            return res.status(400).json({ success: false, message: "Playlist ID and collaborator ID are required" });
        }

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }

        if (!playlist.creator.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only playlist creator can remove collaborators' });
        }

        if (!playlist.collaborators.includes(collaboratorId)) {
            return res.status(400).json({ success: false, message: 'User is not a collaborator' });
        }

        playlist.collaborators = playlist.collaborators.filter(id => id.toString() !== collaboratorId);
        await playlist.save();

        res.status(200).json({ success: true, message: 'Collaborator removed', data: { playlist } });
    } catch (error) {
        console.error('Error removing collaborator:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getPublicPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ type: "public" })?.populate('creator')?.populate('songs');

        return res.status(200).json({ success: true, data: { playlists } });
    } catch (err) {
        console.error("Error fetching public playlists:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const renamePlaylist = async (req, res) => {
    try {
        const { playlistId, name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "New name is required" });
        }

        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        if (!playlist.creator.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        playlist.name = name;
        await playlist.save();

        return res.status(200).json({ success: true, message: "Playlist renamed", data: { playlist } });
    } catch (err) {
        console.error("Error renaming playlist:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const duplicatePlaylist = async (req, res) => {
    try {
        const { playlistId } = req.body;

        const original = await Playlist.findById(playlistId).populate('songs');

        if (!original) {
            return res.status(404).json({ success: false, message: "Original playlist not found" });
        }

        const newPlaylist = new Playlist({
            name: `${original.name} (Copy)`,
            description: original.description,
            songs: original.songs,
            visibility: 'private',
            creator: req.user._id,
            sharedLink: uuidv4(),
        });

        await newPlaylist.save();

        res.status(201).json({ success: true, message: "Playlist duplicated", data: { playlist: newPlaylist } });
    } catch (err) {
        console.error("Error duplicating playlist:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getPlaylistById = async (req, res) => {
    try {
        const { playlistId } = req.params;

        const playlist = await Playlist.findById(playlistId)
            .populate('songs')
            .populate('collaborators');

        if (!playlist) {
            return res.status(404).json({ success: false, message: "Playlist not found" });
        }

        const isCreator = playlist.creator.equals(req.user._id);
        const isCollaborator = playlist.collaborators.some(
            (collabId) => collabId.equals(req.user._id)
        );

        if (
            playlist.visibility === 'public' ||
            isCreator ||
            isCollaborator
        ) {
            return res.status(200).json({ success: true, data: { playlist } });
        }

        return res.status(403).json({ success: false, message: "Unauthorized to view this playlist" });

    } catch (err) {
        console.error("Error fetching playlist by ID:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
