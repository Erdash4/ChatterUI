import { AntDesign } from '@expo/vector-icons'
import { LayoutRectangle } from 'react-native'
import { create } from 'zustand'

export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'center'

export type ContextMenuButtonProps = {
    key?: string
    label: string
    onPress?: (close: () => void) => void
    submenu?: ContextMenuButtonProps[]
    icon?: keyof typeof AntDesign.glyphMap
    iconSize?: number
    textColor?: string
    variant?: 'normal' | 'warning'
    disabled?: boolean
}

export type ContextMenuStoreProps = {
    openMenuId: string | null
    anchor: LayoutRectangle | null
    placement: Placement
    buttons: ContextMenuButtonProps[]
    openMenu: (
        id: string,
        anchor: LayoutRectangle,
        buttons: ContextMenuButtonProps[],
        placement: Placement
    ) => void
    closeMenu: () => void
}

export const useContextMenuStore = create<ContextMenuStoreProps>((set) => ({
    openMenuId: null,
    anchor: null,
    placement: 'auto',
    buttons: [],
    openMenu: (id, anchor, buttons, placement) =>
        set({ openMenuId: id, anchor, buttons, placement }),
    closeMenu: () => set({ openMenuId: null, anchor: null, buttons: [], placement: 'auto' }),
}))
