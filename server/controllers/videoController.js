const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

exports.processVideo = async (req, res) => {
    try {
        const videoPath = req.file.path; // Raw video path
        const instructions = JSON.parse(req.body.editInstructions);
        const outputPath = `uploads/processed-${Date.now()}.mp4`;

        let command = ffmpeg(videoPath);

        // 1. Apply Filters (Brightness, Contrast, Saturation)
        // FFmpeg values: brightness (-1.0 to 1.0), contrast (0.0 to 10.0)
        const b = (instructions.filters.brightness - 100) / 100;
        const c = instructions.filters.contrast / 100;
        const s = instructions.filters.saturate / 100;

        command.videoFilters([
            {
                filter: 'eq',
                options: { brightness: b, contrast: c, saturation: s }
            }
        ]);

        // 2. Apply Speed
        if (instructions.playbackSpeed !== 1) {
            command.videoFilters(`setpts=${1/instructions.playbackSpeed}*PTS`);
        }

        // 3. Apply Text Overlays (Burning text into video)
        instructions.layers.forEach(layer => {
            if (layer.type === 'text') {
                command.videoFilters({
                    filter: 'drawtext',
                    options: {
                        text: layer.content,
                        fontsize: 24,
                        fontcolor: 'cyan',
                        x: '(w-text_w)/2',
                        y: '(h-text_h)/2'
                    }
                });
            }
        });

        command
            .on('end', () => {
                res.status(201).json({ 
                    message: "Video Rendered Successfully", 
                    url: outputPath 
                });
            })
            .on('error', (err) => {
                console.error(err);
                res.status(500).send("Rendering Failed");
            })
            .save(outputPath);

    } catch (error) {
        res.status(500).send("Server Error");
    }
};