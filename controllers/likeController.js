import Song from "../models/Song.js";
import User from "../models/User.js";

export const toggleLikeSong = async (req, res) => {
    const userId = req.user.id;
    const songId = req.body.id;

    try {
        const user = await User.findById(userId);
        const song = await Song.findById(songId);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (!song) return res.status(404).json({ success: false, message: "Song not found" });

        const index = user.likedSongs.indexOf(songId);

        if (index === -1) {
            user.likedSongs.push(songId);
            song.likes += 1;
        } else {
            user.likedSongs.splice(index, 1); // Unlike
            song.likes -= 1;
        }

        await user.save();
        await song.save();

        res.status(200).json({ success: true, message: "Like status updated", data:{liked: index === -1, totalLikes: song.likes} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getLikedSongs = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('likedSongs');
        res.status(200).json({ success: true, likedSongs: user.likedSongs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
