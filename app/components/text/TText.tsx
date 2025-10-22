import React, { useMemo } from 'react'
import { StyleSheet, Text, TextProps } from 'react-native'

import { Theme } from '@lib/theme/ThemeManager'

type FontColor = '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'

interface TTextProps extends TextProps {
    color?: FontColor
}
const styles = StyleSheet.create({
    text: {
        fontWeight: 'normal',
    },
})

const TText: React.FC<TTextProps> = ({ color = '100', children, style, ...props }) => {
    const { color: themeColor } = Theme.useTheme()
    const colorOverride = useMemo(
        () => ({
            color: themeColor.text[`_${color}`],
        }),
        [color, themeColor]
    )
    return (
        <Text style={[colorOverride, styles.text, style]} {...props}>
            {children}
        </Text>
    )
}

export default TText
