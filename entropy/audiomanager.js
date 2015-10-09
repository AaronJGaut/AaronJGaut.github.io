function AudioManager(audioAssets, constants, context) {
        this.audioAssets = audioAssets;
        this.activePlaybacks = {};
        this.playbackIds = new Set();        

        var enforceGain = function(x) {
                if (x > 1) return 1;
                if (x < 0) return 0;
                return x;
        };

        this.DEFAULT_SOUND_GAIN = enforceGain(constants.DEFAULT_SOUND_GAIN);
        
        this.DEFAULT_MUSIC_GAIN = enforceGain(constants.DEFAULT_MUSIC_GAIN);
        
        this.DEFAULT_MASTER_GAIN = enforceGain(constants.DEFAULT_MASTER_GAIN);
        
        this.context = context;        
        
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.masterGain.gain.value = this.DEFAULT_MASTER_GAIN;
        
        this.soundGain = this.context.createGain();
        this.soundGain.connect(this.masterGain);
        this.soundGain.gain.value = this.DEFAULT_SOUND_GAIN;

        this.musicGain = this.context.createGain();
        this.musicGain.connect(this.masterGain);
        this.musicGain.gain.value = this.DEFAULT_MUSIC_GAIN;
}

AudioManager.prototype.start = function(audioId, type, playbackId, delay) {
        /* Plays a sound
         *      
         * Required arguments:
         * - audioId: should match an audioBuffer in audioAssets
         * - type: should be "music" or "sound"
         *      music - loops and volume is controlled by music gain.
         *              To stop the music, the stop function must be used.
         *      sound - plays once and volume is controlled by sound gain
         * - playbackId: a string used as a unique Id for a playback. The same
         *      Id can be used to later stop the playback. If playbackId
         *      is null then the playback will not be stored and will only
         *      stop when it ends on its own.
         *      
         * Optional arguments:
         * - delay: number of seconds to wait before playing. If undefined, the
         *      playback will begin immediately.
         */
        if (delay === undefined) {
                delay = 0;
        }
        if (playbackId !== null && this.playbackIds.contains(playbackId)) {
                throw "playbackId, " + playbackId + " already in use.";
        }
        switch(type) {
                case "music" :
                        var source = this.context.createBufferSource();
                        source.buffer = this.audioAssets[audioId];
                        source.connect(this.musicGain);
                        source.loop = true;

                        if (playbackId !== null) {
                                this.playbackIds.add(playbackId);
                                this.activePlaybacks[playbackId] = source;
                        }
                        
//                        source.start(this.context.currentTime+delay);
                        source.start(0);
                        break;

                case "sound" :
                        var source = this.context.createBufferSource();
                        source.buffer = this.audioAssets[audioId];
                        source.connect(this.soundGain);
                        
                        if (playbackId !== null) {
                                this.playbackIds.add(playbackId);
                                this.activePlaybacks[playbackId] = source;
                                source.onended = (function(d,s,p){ 
                                        return function() {
                                                delete d[p];
                                                s.remove(p);
                                        }
                                })(this.activePlaybacks, this.playbackIds, playbackId);
                        }

                        source.start(this.context.currentTime+delay);
                        break;
        }
};

AudioManager.prototype.stop = function(playbackId, delay) {
        /* Stops a playing or scheduled sound
         * 
         * Required arguments:     
         * - playbackId: the playbackId provided when the playback
         *      was created in start.
         *
         * Optional arguments:
         * -delay: number of seconds to wait before stopping. If undefined,
         *      the playback will be stopped immediately.
         */
        if (delay === undefined) {
                delay = 0;
        }
        
        if (this.playbackIds.contains(playbackId)) {
                this.playbackIds.remove(playbackId);
                this.activePlaybacks[playbackId].stop(this.context.currentTime+delay);
                delete this.activePlaybacks[playbackId];
        }
};

AudioManager.prototype.setSoundGain = function(gain) {
        /* Sets volume for all sound effects. 
         * Gain should be in the range [0, 1], and if not will be forced into
         * that range.
         */
        if (gain > 1) gain = 1;
        else if (gain < 0) gain = 0;
        this.soundGain.gain.value = gain;
};

AudioManager.prototype.setMusicGain = function(gain) {
        /* Sets volume for all music. 
         * Gain should be in the range [0, 1], and if not will be forced into
         * that range.
         */
        if (gain > 1) gain = 1;
        else if (gain < 0) gain = 0;
        this.musicGain.gain.value = gain;
};

AudioManager.prototype.setMasterGain = function(gain) {
        /* Sets volume for everything. 
         * Master volume is a second factor applied on top of music or sound gain. 
         * Gain should be in the range [0, 1], and if not will be forced into
         * that range.
         */
        if (gain > 1) gain = 1;
        else if (gain < 0) gain = 0;
        this.masterGain.gain.value = gain;
};
