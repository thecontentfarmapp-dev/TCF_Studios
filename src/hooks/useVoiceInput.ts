'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

type Status = 'idle' | 'listening' | 'error'

type Options = {
  onTranscript?: (text: string) => void
  lang?: string
  continuous?: boolean
}

export function useVoiceInput({
  onTranscript,
  lang = 'en-NZ',
  continuous = true,
}: Options = {}) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const interimRef = useRef<string>('')
  const finalRef = useRef<string>('')

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  function createRecognition() {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    return recognition
  }

  const start = useCallback((existingText = '') => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser. Use Chrome or Safari.')
      return
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    finalRef.current = existingText
    interimRef.current = ''

    const recognition = createRecognition()
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setStatus('listening')
      setError(null)
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let newFinal = finalRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          newFinal += (newFinal ? ' ' : '') + result[0].transcript
          finalRef.current = newFinal
        } else {
          interim += result[0].transcript
        }
      }

      interimRef.current = interim
      const full = interim ? `${newFinal}${newFinal ? ' ' : ''}${interim}` : newFinal
      onTranscript?.(full)
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return // ignore no-speech
      if (event.error === 'aborted') return   // user stopped
      setError(`Mic error: ${event.error}`)
      setStatus('idle')
    }

    recognition.onend = () => {
      setStatus('idle')
      interimRef.current = ''
    }

    recognition.start()
  }, [isSupported, onTranscript, lang, continuous])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setStatus('idle')
  }, [])

  const toggle = useCallback((existingText = '') => {
    if (status === 'listening') {
      stop()
    } else {
      start(existingText)
    }
  }, [status, start, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop() }
  }, [])

  return { status, error, isSupported, start, stop, toggle, isListening: status === 'listening' }
}
