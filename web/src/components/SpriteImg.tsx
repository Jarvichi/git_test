/// <reference types="vite/client" />
import React, { useState } from 'react'
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
