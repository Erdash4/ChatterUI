import ThemedButton from '@components/buttons/ThemedButton'
import CameraSheet from '@components/views/CameraSheet'
import ContextMenu from '@components/views/ContextMenu'
import { MaterialIcons } from '@expo/vector-icons'
import { XAxisOnlyTransition } from '@lib/animations/transitions'
import { AppSettings } from '@lib/constants/GlobalValues'
import { generateResponse } from '@lib/engine/Inference'
import { useUnfocusTextInput } from '@lib/hooks/UnfocusTextInput'
import { Characters } from '@lib/state/Characters'
import { Chats, useInference } from '@lib/state/Chat'
import { useChatInputTextStore } from '@lib/state/components/ChatInput'
import { Logger } from '@lib/state/Logger'
import { Theme } from '@lib/theme/ThemeManager'
import { randomUUID } from 'expo-crypto'
import { getDocumentAsync } from 'expo-document-picker'
import { Image } from 'expo-image'
import React, { useState } from 'react'
import { TextInput, TouchableOpacity, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import Animated, {
    BounceIn,
    FadeIn,
    FadeOut,
    LinearTransition,
    ZoomOut,
} from 'react-native-reanimated'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import ChatOptions from './ChatInputOptions'

export type Attachment = {
    uri: string
    type: 'image' | 'audio' | 'document'
    name: string
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

type ChatInputHeightStoreProps = {
    height: number
    setHeight: (n: number) => void
}

export const useInputHeightStore = create<ChatInputHeightStoreProps>()((set) => ({
    height: 54,
    setHeight: (n) => set({ height: Math.ceil(n) }),
}))

const ChatInput = () => {
    const inputRef = useUnfocusTextInput()

    const { color, borderRadius, spacing } = Theme.useTheme()
    const [sendOnEnter] = useMMKVBoolean(AppSettings.SendOnEnter)
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [hideOptions, setHideOptions] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const { addEntry } = Chats.useEntry()
    const { nowGenerating, abortFunction } = useInference(
        useShallow((state) => ({
            nowGenerating: state.nowGenerating,
            abortFunction: state.abortFunction,
        }))
    )
    const setHeight = useInputHeightStore(useShallow((state) => state.setHeight))

    const { charName } = Characters.useCharacterStore(
        useShallow((state) => ({
            charName: state?.card?.name,
        }))
    )

    const { userName } = Characters.useUserStore(
        useShallow((state) => ({ userName: state.card?.name }))
    )

    const { newMessage, setNewMessage } = useChatInputTextStore(
        useShallow((state) => ({
            newMessage: state.text,
            setNewMessage: state.setText,
        }))
    )

    const abortResponse = async () => {
        Logger.info(`Aborting Generation`)
        if (abortFunction) await abortFunction()
    }

    const handleSend = async () => {
        if (newMessage.trim() !== '' || attachments.length > 0)
            await addEntry(
                userName ?? '',
                true,
                newMessage,
                attachments.map((item) => item.uri)
            )
        const swipeId = await addEntry(charName ?? '', false, '')
        setNewMessage('')
        setAttachments([])
        if (swipeId) generateResponse(swipeId)
    }

    const handlePickImage = async () => {
        const result = await getDocumentAsync({
            type: 'image/*',
            multiple: true,
            copyToCacheDirectory: true,
        })
        if (result.canceled || result.assets.length < 1) return

        const newAttachments = result.assets
            .map((item) => ({
                uri: item.uri,
                type: 'image',
                name: item.name,
            }))
            .filter((item) => !attachments.some((a) => a.name === item.name)) as Attachment[]
        setAttachments([...attachments, ...newAttachments])
    }

    return (
        <View
            onLayout={(e) => {
                setHeight(e.nativeEvent.layout.height)
            }}
            style={{
                position: 'absolute',
                width: '98%',
                alignSelf: 'center',
                bottom: 4,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.sm,
                backgroundColor: color.neutral._100 + 'cc',
                borderWidth: 1,
                borderColor: color.neutral._200,
                boxShadow: [
                    {
                        offsetX: 1,
                        offsetY: 1,
                        color: color.shadow,
                        spreadDistance: 1,
                        blurRadius: 4,
                    },
                ],
                borderRadius: 16,
                rowGap: spacing.m,
            }}>
            <Animated.FlatList
                itemLayoutAnimation={LinearTransition}
                style={{
                    display: attachments.length > 0 ? 'flex' : 'none',
                    padding: spacing.l,
                    backgroundColor: color.neutral._200,
                    borderRadius: borderRadius.m,
                }}
                horizontal
                contentContainerStyle={{ columnGap: spacing.xl }}
                data={attachments}
                keyExtractor={(item) => item.uri}
                renderItem={({ item }) => {
                    return (
                        <Animated.View
                            entering={BounceIn}
                            exiting={ZoomOut.duration(100)}
                            style={{ alignItems: 'center', rowGap: 8 }}>
                            <Image
                                source={{ uri: item.uri }}
                                style={{
                                    width: 128,
                                    height: undefined,
                                    aspectRatio: 1,
                                    borderRadius: borderRadius.m,
                                    borderWidth: 1,
                                    borderColor: color.primary._500,
                                }}
                            />

                            <ThemedButton
                                iconName="close"
                                iconSize={20}
                                buttonStyle={{
                                    borderWidth: 0,
                                    paddingHorizontal: 2,
                                    paddingVertical: 2,
                                    position: 'absolute',
                                    alignSelf: 'flex-end',
                                    margin: -8,
                                    backgroundColor: color.neutral._500,
                                }}
                                onPress={() => {
                                    setAttachments(attachments.filter((a) => a.uri !== item.uri))
                                }}
                            />
                        </Animated.View>
                    )
                }}
            />
            <CameraSheet
                onTakePicture={(picture) => {
                    setAttachments((attachments) => [
                        ...attachments,
                        {
                            name: randomUUID().toString(),
                            uri: picture.uri,
                            type: 'image',
                        },
                    ])
                }}
                visible={showCamera}
                setVisible={setShowCamera}
            />
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: spacing.m,
                }}>
                <Animated.View layout={XAxisOnlyTransition}>
                    {!hideOptions && (
                        <Animated.View
                            entering={FadeIn}
                            exiting={FadeOut}
                            style={{
                                flexDirection: 'row',
                                columnGap: 8,
                                alignItems: 'center',
                            }}>
                            <ChatOptions />
                            <ContextMenu
                                triggerIcon="paperclip"
                                triggerIconSize={20}
                                buttons={[
                                    {
                                        label: 'Take Picture',
                                        icon: 'camerao',
                                        onPress: (close) => {
                                            setShowCamera(true)
                                            close()
                                        },
                                    },
                                    {
                                        label: 'Add Image',
                                        icon: 'picture',
                                        onPress: async (close) => {
                                            close()
                                            handlePickImage()
                                        },
                                    },
                                ]}
                                triggerStyle={{
                                    color: color.text._400,
                                    padding: 6,
                                    backgroundColor: color.neutral._200,
                                    borderRadius: 16,
                                }}
                                placement="top"
                            />
                        </Animated.View>
                    )}
                    {hideOptions && (
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <ThemedButton
                                iconSize={18}
                                iconStyle={{
                                    color: color.text._400,
                                }}
                                buttonStyle={{
                                    padding: 5,
                                    backgroundColor: color.neutral._200,
                                    borderRadius: 32,
                                }}
                                variant="tertiary"
                                iconName="right"
                                onPress={() => setHideOptions(false)}
                            />
                        </Animated.View>
                    )}
                </Animated.View>
                <AnimatedTextInput
                    layout={XAxisOnlyTransition}
                    ref={inputRef}
                    style={{
                        color: color.text._100,
                        backgroundColor: color.neutral._100,
                        flex: 1,
                        borderWidth: 2,
                        borderColor: color.primary._300,
                        borderRadius: borderRadius.l,
                        paddingHorizontal: spacing.m,
                        paddingVertical: spacing.m,
                    }}
                    onPress={() => {
                        setHideOptions(!!newMessage)
                    }}
                    numberOfLines={8}
                    placeholder="Message..."
                    placeholderTextColor={color.text._700}
                    value={newMessage}
                    onChangeText={(text) => {
                        setHideOptions(!!text)
                        setNewMessage(text)
                    }}
                    multiline
                    submitBehavior={sendOnEnter ? 'blurAndSubmit' : 'newline'}
                    onSubmitEditing={sendOnEnter ? handleSend : undefined}
                />
                <Animated.View layout={XAxisOnlyTransition}>
                    <TouchableOpacity
                        style={{
                            borderRadius: borderRadius.m,
                            backgroundColor: nowGenerating ? color.error._500 : color.primary._500,
                            padding: spacing.m,
                        }}
                        onPress={nowGenerating ? abortResponse : handleSend}>
                        <MaterialIcons
                            name={nowGenerating ? 'stop' : 'send'}
                            color={color.neutral._100}
                            size={24}
                        />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    )
}

export default ChatInput
