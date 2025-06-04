import Alert from '@components/views/Alert'
import { AppSettings } from '@lib/constants/GlobalValues'
import { Characters } from '@lib/state/Characters'
import { Chats } from '@lib/state/Chat'
import { Logger } from '@lib/state/Logger'
import { mmkv } from '@lib/storage/MMKV'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Linking, Platform } from 'react-native'

export const setupNotifications = () => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowAlert: false,
            shouldShowBanner: false,
            shouldShowList: false,
        }),
    })
}

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('chatterUI', {
            name: 'chatterUI',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [250, 0, 250, 250],
            lightColor: '#FF231F7C',
        })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
    }
    if (finalStatus !== 'granted') {
        Alert.alert({
            title: 'Permission Required',
            description: 'ChatterUI requires permissions to send you notifications.',
            buttons: [
                {
                    label: 'Cancel',
                },
                {
                    label: 'Open Permissions',
                    onPress: () => {
                        Linking.openSettings()
                    },
                },
            ],
        })
        return false
    }

    return true
}

export function useNotificationObserver() {
    useEffect(() => {
        let isMounted = true

        async function redirect(notification: Notifications.Notification) {
            const autoLoad = mmkv.getBoolean(AppSettings.ChatOnStartup)
            const useAuth = mmkv.getBoolean(AppSettings.LocallyAuthenticateUser)
            if (autoLoad ?? useAuth) return
            const chatLoaded = Chats.useChatState.getState().data
            if (chatLoaded) return
            const data = notification.request.content.data
            const chatId = data?.chatId as number | undefined
            const characterId = data?.characterId as number | undefined
            if (chatId && characterId) {
                Logger.info('Loading chat from notification')
                try {
                    await Chats.useChatState.getState().load(chatId)
                    await Characters.useCharacterCard.getState().setCard(characterId)
                    router.push('/screens/ChatMenu')
                } catch (e) {
                    Logger.error('Failed to load chat: ' + e)
                }
            }
        }

        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (!isMounted || !response?.notification) {
                return
            }
            redirect(response?.notification)
        })

        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
            redirect(response.notification)
        })

        return () => {
            isMounted = false
            subscription.remove()
        }
    }, [])
}
