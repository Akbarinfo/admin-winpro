import { useEffect, useId, useRef, useState } from 'react'
import { env } from '@/shared/config/env'
import { loadWebcc, type WebccRuntime } from './loadWebcc'

/** What the drawing says about itself («getSizes» in the old forms). */
export type WebccSizes = {
  width: number
  height: number
  area: number
  /** Drawing templates take these from the drawing too. */
  profileSystemId: number | null
  textureId: number | null
}

export type WebccStatus = 'loading' | 'ready' | 'error' | 'no-token'

/**
 * The window constructor for a form: <WebccCanvas webcc={…} /> draws it, the form asks it for the
 * drawing's sizes and image. Settings are the old forms' (FormTemplate, FormTemplete).
 */
export function useWebcc() {
  // An id of its own: the runtime finds its container by id.
  const containerId = `webcc-${useId().replace(/[^\w-]/g, '')}`
  // The container, once it's on the page: a form shows it only after its record loads, and the
  // runtime needs it the moment it starts.
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const runtime = useRef<WebccRuntime | null>(null)
  const [status, setStatus] = useState<WebccStatus>(env.WEBCC_TOKEN ? 'loading' : 'no-token')

  useEffect(() => {
    if (!env.WEBCC_TOKEN || !container) return
    let cancelled = false
    loadWebcc()
      .then((Runtime) => {
        if (cancelled) return
        const cc = new Runtime(env.WEBCC_TOKEN, containerId)
        cc.setCanvasScale(0.3, 0.3)
        cc.shapeManager.enLangMode = true
        cc.shapeManager.europeanStandard = true
        cc.shapeManager.dimFontSize = 70
        cc.shapeManager.strictWheel = true
        cc.shapeManager.labelFontSize = 30
        runtime.current = cc
        setStatus('ready')
      })
      .catch((error: unknown) => {
        console.error(error)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
      // Its canvas goes with it (StrictMode mounts twice; a form starts over after saving):
      // the Konva stage, and whatever else it left in the container.
      runtime.current?.stage?.destroy()
      runtime.current = null
      container.replaceChildren()
    }
  }, [container, containerId])

  const sizes = (): WebccSizes | null => {
    const sm = runtime.current?.shapeManager
    if (!sm) return null
    return {
      width: sm.width,
      height: sm.height,
      area: sm.area,
      profileSystemId: sm.profileSystem?.id ?? null,
      textureId: sm.mainTextureId ?? null,
    }
  }

  return {
    containerId,
    /** For the container element (WebccCanvas sets it). */
    attach: setContainer,
    status,
    /** Opens a saved drawing (its JSON text) and says its sizes; null — not ready yet. */
    openFile: (json: string): WebccSizes | null => {
      if (!runtime.current) return null
      runtime.current.shapeManager.openFile(json, false)
      return sizes()
    },
    sizes,
    /** The drawing as an image without dimensions (base64); null — no constructor. */
    image: (): string | null => runtime.current?.shapeManager.toSimpleNoDimData() ?? null,
  }
}

export type Webcc = ReturnType<typeof useWebcc>
