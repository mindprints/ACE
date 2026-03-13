import React, { createContext, useContext, useState } from 'react'
import type { ContentPack, PackId } from '../data/contentPack'
import { developerPack } from '../data/packs/developer'
import { generalistPack } from '../data/packs/generalist'

const PACKS: Record<PackId, ContentPack> = {
  developer: developerPack,
  generalist: generalistPack,
}

const STORAGE_KEY = 'ace-content-pack'

function loadSavedPackId(): PackId {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'generalist' ? 'generalist' : 'developer'
}

interface ContentPackContextValue {
  pack: ContentPack
  packId: PackId
  setPackId: (id: PackId) => void
}

const ContentPackContext = createContext<ContentPackContextValue | null>(null)

export function ContentPackProvider({ children }: { children: React.ReactNode }) {
  const [packId, setPackIdState] = useState<PackId>(loadSavedPackId)

  const setPackId = (id: PackId) => {
    localStorage.setItem(STORAGE_KEY, id)
    setPackIdState(id)
  }

  return (
    <ContentPackContext.Provider value={{ pack: PACKS[packId], packId, setPackId }}>
      {children}
    </ContentPackContext.Provider>
  )
}

export function useContentPack(): ContentPackContextValue {
  const ctx = useContext(ContentPackContext)
  if (!ctx) throw new Error('useContentPack must be used inside ContentPackProvider')
  return ctx
}
