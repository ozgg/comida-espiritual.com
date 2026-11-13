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

    if (trackName) {
      const caption = audio.closest('figure').querySelector('figcaption')
      if (isPlaying && caption) {
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
      updateOverlay()
    })

    audio.addEventListener('pause', updateOverlay)

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
