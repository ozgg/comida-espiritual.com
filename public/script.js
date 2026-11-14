document.addEventListener('DOMContentLoaded', function () {
  /**
   * List of all tracks from the list
   *
   * @type {HTMLAudioElement[]}
   */
  const tracks = Array.from(document.querySelectorAll('.tracks audio'))
  const overlay = document.querySelector('.cover .overlay')

  if (!overlay || tracks.length === 0) {
    return
  }

  const trackName = overlay.querySelector('p')
  const playButton = overlay.querySelector('.play')
  const prevButton = overlay.querySelector('.prev')
  const nextButton = overlay.querySelector('.next')

  /** Index of the current (playing or last played) track */
  let current = 0

  /** Page title to restore / append to */
  const albumTitle = document.title

  /** Whether any track has been started yet */
  let started = false

  /**
   * Start playback; ignore the rejection that happens when play() is
   * interrupted by pause() or by switching to another track.
   *
   * @param audio {HTMLAudioElement}
   */
  const play = function (audio) {
    const promise = audio.play()
    if (promise) {
      promise.catch(function (error) {
        if (error.name !== 'AbortError') {
          console.error(error)
        }
      })
    }
  }

  /**
   * Sync overlay with the actual playback state
   */
  const updateOverlay = function () {
    const audio = tracks[current]
    const isPlaying = !audio.paused && !audio.ended

    overlay.classList.toggle('stopped', !isPlaying)

    const caption = audio.closest('figure').querySelector('figcaption')

    document.title = started && caption
      ? `${caption.textContent.trim()} — ${albumTitle}`
      : albumTitle

    if (trackName) {
      if (started && caption) {
        trackName.innerHTML = caption.innerHTML
        trackName.lang = caption.lang
      } else {
        trackName.innerHTML = ''
        trackName.removeAttribute('lang')
      }
    }

    if (prevButton) {
      prevButton.disabled = current === 0
    }
    if (nextButton) {
      nextButton.disabled = current === tracks.length - 1
    }

    updateMediaSession(isPlaying, caption)
  }

  /**
   * Media Session API: track info and controls on the lock screen,
   * in OS media widgets and for hardware media keys
   */
  const mediaSession = 'mediaSession' in navigator ? navigator.mediaSession : null
  const coverImage = document.querySelector('.cover img')
  let metadataTrack = -1

  /**
   * Register a media action handler, ignoring actions the browser lacks
   *
   * @param action {MediaSessionAction}
   * @param handler {Function|null}
   */
  const setAction = function (action, handler) {
    try {
      mediaSession.setActionHandler(action, handler)
    } catch (error) {
      // Action is not supported by this browser
    }
  }

  /**
   * @param isPlaying {Boolean}
   * @param caption {HTMLElement|null}
   */
  const updateMediaSession = function (isPlaying, caption) {
    if (!mediaSession || !started) {
      return
    }

    if (metadataTrack !== current && 'MediaMetadata' in window) {
      metadataTrack = current
      mediaSession.metadata = new MediaMetadata({
        title: caption ? caption.textContent.trim() : '',
        artist: 'Dr. von Ozgg',
        album: 'Comida Espiritual',
        artwork: coverImage ? [{
          src: new URL(coverImage.getAttribute('src'), document.baseURI).href,
          sizes: '1074x1075',
          type: 'image/jpeg',
        }] : [],
      })
    }

    mediaSession.playbackState = isPlaying ? 'playing' : 'paused'

    // Hide prev/next in OS controls when there is no adjacent track
    setAction('previoustrack', current > 0 ? function () {
      playTrack(current - 1)
    } : null)
    setAction('nexttrack', current < tracks.length - 1 ? function () {
      playTrack(current + 1)
    } : null)
  }

  /**
   * Keep the OS progress bar in sync with the current track
   */
  const updatePosition = function () {
    const audio = tracks[current]
    if (!mediaSession || !('setPositionState' in mediaSession) || !isFinite(audio.duration)) {
      return
    }

    try {
      mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: Math.min(audio.currentTime, audio.duration),
      })
    } catch (error) {
      // Invalid state, e.g. during track switch
    }
  }

  if (mediaSession) {
    setAction('play', function () {
      play(tracks[current])
    })
    setAction('pause', function () {
      tracks[current].pause()
    })
    setAction('stop', function () {
      tracks[current].pause()
      tracks[current].currentTime = 0
    })
    setAction('seekto', function (details) {
      const audio = tracks[current]
      if (details.fastSeek && 'fastSeek' in audio) {
        audio.fastSeek(details.seekTime)
      } else {
        audio.currentTime = details.seekTime
      }
      updatePosition()
    })
    setAction('seekbackward', function (details) {
      const audio = tracks[current]
      audio.currentTime = Math.max(audio.currentTime - (details.seekOffset || 10), 0)
      updatePosition()
    })
    setAction('seekforward', function (details) {
      const audio = tracks[current]
      audio.currentTime = Math.min(audio.currentTime + (details.seekOffset || 10), audio.duration)
      updatePosition()
    })
  }

  /**
   * Play the track at given index, stopping the current one
   *
   * @param index {Number}
   */
  const playTrack = function (index) {
    if (index < 0 || index >= tracks.length) {
      return
    }

    if (index !== current) {
      tracks[current].pause()
      tracks[index].currentTime = 0
      current = index
    }

    play(tracks[current])
  }

  tracks.forEach(function (audio, index) {
    audio.addEventListener('play', function () {
      // Track was started from anywhere (overlay or native controls):
      // make it current and stop the others
      tracks.forEach(function (other) {
        if (other !== audio) {
          other.pause()
        }
      })
      current = index
      started = true
      updateOverlay()
      updatePosition()
    })

    audio.addEventListener('pause', updateOverlay)

    audio.addEventListener('loadedmetadata', function () {
      if (index === current) {
        updatePosition()
      }
    })

    audio.addEventListener('seeked', function () {
      if (index === current) {
        updatePosition()
      }
    })

    audio.addEventListener('ended', function () {
      if (index < tracks.length - 1) {
        playTrack(index + 1)
      } else {
        updateOverlay()
      }
    })
  })

  if (playButton) {
    playButton.addEventListener('click', function () {
      const audio = tracks[current]
      if (audio.paused) {
        play(audio)
      } else {
        audio.pause()
      }
    })
  }

  if (prevButton) {
    prevButton.addEventListener('click', function () {
      playTrack(current - 1)
    })
  }

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      playTrack(current + 1)
    })
  }

  updateOverlay()
  overlay.classList.remove('hidden')
})
