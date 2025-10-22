import { LinearGradient } from 'expo-linear-gradient'

import { Theme } from '@lib/theme/ThemeManager'

const ChatHeaderGradient = () => {
    const { color } = Theme.useTheme()
    return (
        <LinearGradient
            colors={[color.neutral._100, color.neutral._100 + '22']}
            style={{
                position: 'absolute',
                width: '100%',
                left: -8,
                top: 0,
                height: 16,
            }}
        />
    )
}

export default ChatHeaderGradient
