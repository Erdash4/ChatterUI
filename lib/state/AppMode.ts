import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import { Storage } from '@lib/enums/Storage'
import { createMMKVStorage } from '@lib/storage/MMKV'

type AppMode = 'local' | 'remote'

type AppModeStateProps = {
    appMode: AppMode
    setAppMode: (mode: AppMode) => void
}

export const useAppModeStore = create<AppModeStateProps>()(
    persist(
        (set) => ({
            appMode: 'local',
            setAppMode: (mode) => {
                set({ appMode: mode })
            },
        }),
        {
            name: Storage.AppMode,
            storage: createMMKVStorage(),
            partialize: (state) => ({ appMode: state.appMode }),
            version: 1,
        }
    )
)

export const useAppMode = () => {
    const { appMode, setAppMode } = useAppModeStore(
        useShallow((state) => ({
            appMode: state.appMode,
            setAppMode: state.setAppMode,
        }))
    )

    return { appMode, setAppMode }
}
