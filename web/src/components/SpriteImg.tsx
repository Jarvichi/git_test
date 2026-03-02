/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react'
import { spriteSlug } from '../game/sprites'

const BASE = import.meta.env.BASE_URL

interface Props {
  /** Unit or building name — used to derive the sprite slug. */
  name: string
  className?: string
}

/**
 * Tries to load `sprites/{slug}.png`, then `sprites/{slug}.svg`.
 * Renders nothing if both fail (caller keeps its own text/layout).
 */
export function SpriteImg({ name, className }: Props) {
  const slug = spriteSlug(name)
  const pngSrc = `${BASE}sprites/${slug}.png`
  const svgSrc = `${BASE}sprites/${slug}.svg`

  const [src, setSrc]       = useState(pngSrc)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    <img
      src={src}
      alt={name}
      className={className}
      style={{ display: loaded ? undefined : 'none' }}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (src === pngSrc) setSrc(svgSrc)
        else setFailed(true)
      }}
    />
  )
}

interface AnimatedProps {
  /** Unit name — used to derive sprite slug and frame files like `{slug}-1.svg`. */
  name: string
  /** Number of animation frames (e.g. 3 for goblin-1/2/3). */
  frameCount: number
  /** Frames per second for the walking animation. */
  fps: number
  className?: string
}

/**
 * Cycles through `sprites/{slug}-1.svg … sprites/{slug}-{frameCount}.svg`.
 * Falls back to `SpriteImg` (static sprite) if frame files are missing.
 */
export function AnimatedSpriteImg({ name, frameCount, fps, className }: AnimatedProps) {
  const slug = spriteSlug(name)
  const [frame, setFrame] = useState(1)
  const [useFallback, setUseFallback] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (useFallback) return
    intervalRef.current = setInterval(() => {
      setFrame(f => (f % frameCount) + 1)
    }, 1000 / fps)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [frameCount, fps, useFallback])

  if (useFallback) {
    return <SpriteImg name={name} className={className} />
  }

  return (
    <img
      src={`${BASE}sprites/${slug}-${frame}.svg`}
      alt={name}
      className={className}
      onError={() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setUseFallback(true)
      }}
    />
  )
}
