document.addEventListener('DOMContentLoaded', function() {
  /**
   * List of all tracks from the list
   *
   * @type {NodeListOf<HTMLAudioElement>}
   */
  const trackElements = document.querySelectorAll('.tracks audio')
  let current = 0

  const nextTrack = function () {
    /**
     * Audio element for current track
     *
     * @type {HTMLAudioElement}
     */
    const audio = trackElements[current]
    if (audio) {
      audio.pause()
    }

    current++
    if (trackElements.length >= current + 1) {
      playCurrent()
    } else {
      current = 0
    }
  }

  const playCurrent = function () {
    /**
     * Audio element for current track
     *
     * @type {HTMLAudioElement}
     */
    const audio = trackElements[current]
    // console.log(audio)
    if (audio) {
      audio.play()
    }
  }

  const setCurrent = function(e) {
    trackElements.forEach(function(audio, index) {
      if (audio === e.target) {
        current = index
        // console.log(`Current track index: ${index}`)
      } else {
        audio.pause()
      }
    })

    // console.log(`New current: ${current}`)
  }

  if (trackElements) {
    trackElements.forEach(function(audio) {
      audio.addEventListener('ended', nextTrack)
      audio.addEventListener('play', setCurrent)
    })
  }
})
