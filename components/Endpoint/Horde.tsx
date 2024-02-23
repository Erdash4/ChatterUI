import { FontAwesome, MaterialIcons } from '@expo/vector-icons'
import { Global, Color, Logger } from '@globals'
import { useState, useEffect } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native'
import { MultiSelect } from 'react-native-element-dropdown'
import { useMMKVObject, useMMKVString } from 'react-native-mmkv'
import { hordeHeader } from '@constants/Inference'

const Horde = () => {
    const [hordeKey, setHordeKey] = useMMKVString(Global.HordeKey)
    const [hordeModels, setHordeModels] = useMMKVObject<Array<HordeModel>>(Global.HordeModels)
    const [hordeWorkers, setHordeWorkers] = useMMKVObject<Array<HordeWorker>>(Global.HordeWorkers)

    const [dropdownValues, setDropdownValues] = useState<Array<string>>(
        hordeModels?.map((item) => {
            return item.name
        }) ?? []
    )
    const [keyInput, setKeyInput] = useState('')
    const [modelList, setModelList] = useState([])

    const getModels = async () => {
        const modelresults = await fetch(`https://stablehorde.net/api/v2/status/models?type=text`, {
            method: 'GET',
            headers: { ...hordeHeader() },
        }).catch(() => {
            Logger.log(`Could not connect to horde`, true)
        })
        if (!modelresults) return

        const list = await modelresults.json()
        const names = list.map((item: HordeModel) => {
            return item.name
        })
        setDropdownValues(dropdownValues.filter((item) => names.includes(item)))
        setModelList(list)
        if (hordeModels)
            setHordeModels(hordeModels.filter((item) => dropdownValues.includes(item.name)))

        const workerresults = await fetch(`https://stablehorde.net/api/v2/workers?type=text`, {
            method: 'GET',
            ...hordeHeader(),
        }).catch(() => {
            Logger.log(`Could not connect to horde`, true)
        })
        if (workerresults) {
            const workerlist = await workerresults.json()
            setHordeWorkers(workerlist)
        }
    }

    useEffect(() => {
        getModels()
    }, [])

    return (
        <View style={styles.mainContainer}>
            <Text style={styles.title}>API Key</Text>
            <Text style={styles.subtitle}>Key will not be shown</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                    style={styles.input}
                    value={keyInput}
                    onChangeText={(value) => {
                        setKeyInput(value)
                    }}
                    placeholder="Press save to confirm key"
                    placeholderTextColor={Color.Offwhite}
                    secureTextEntry
                />
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        if (keyInput === '') {
                            Logger.log(`No API Key provided!`, true)
                            return
                        }
                        setHordeKey(keyInput)
                        setKeyInput('')
                        Logger.log(`Key Saved!`, true)
                    }}>
                    <FontAwesome name="save" color={Color.Button} size={28} />
                </TouchableOpacity>
            </View>

            <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8 }}>
                    <Text style={{ ...styles.title, marginRight: 4 }}>Models</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            getModels()
                        }}>
                        <MaterialIcons name="refresh" color={Color.Button} size={28} />
                    </TouchableOpacity>
                </View>

                <MultiSelect
                    value={dropdownValues}
                    style={styles.dropdownbox}
                    selectedTextStyle={styles.selected}
                    data={modelList}
                    labelField="name"
                    valueField="name"
                    onChange={(item) => {
                        setHordeModels(
                            modelList.filter((value: HordeModel) => {
                                return item.includes(value.name)
                            })
                        )
                        setDropdownValues(item)
                    }}
                    containerStyle={styles.dropdownbox}
                    itemTextStyle={{ color: Color.Text }}
                    itemContainerStyle={{
                        backgroundColor: Color.DarkContainer,
                        borderRadius: 8,
                    }}
                    activeColor={Color.Container}
                    placeholderStyle={styles.selected}
                    placeholder="Select Model"
                    renderSelectedItem={(item: HordeModel, unSelect) => (
                        <View style={styles.iteminfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: Color.Text, flex: 1, fontSize: 16 }}>
                                    {item.name}
                                </Text>
                                <TouchableOpacity onPress={() => unSelect && unSelect(item)}>
                                    <MaterialIcons name="delete" color={Color.Button} size={28} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row' }}>
                                <View>
                                    <Text style={{ color: Color.Offwhite }}>Workers</Text>
                                    <Text style={{ color: Color.Offwhite }}>Performance</Text>
                                    <Text style={{ color: Color.Offwhite }}>ETA</Text>
                                </View>
                                <View style={{ marginLeft: 8 }}>
                                    <Text style={{ color: Color.Offwhite }}>: {item.count}</Text>
                                    <Text style={{ color: Color.Offwhite }}>
                                        : {item.performance}
                                    </Text>
                                    <Text style={{ color: Color.Offwhite }}>: {item.eta}s</Text>
                                </View>
                            </View>
                        </View>
                    )}
                />
            </View>
        </View>
    )
}

export default Horde

const styles = StyleSheet.create({
    mainContainer: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: Color.Background,
        flex: 1,
    },

    title: {
        color: Color.Text,
        fontSize: 20,
    },

    subtitle: {
        color: Color.Offwhite,
    },

    input: {
        flex: 1,
        color: Color.Text,
        backgroundColor: Color.DarkContainer,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginVertical: 8,
        borderRadius: 8,
    },

    button: {
        padding: 5,
        backgroundColor: Color.DarkContainer,
        borderRadius: 4,
        marginLeft: 8,
    },

    dropdownContainer: {
        marginVertical: 16,
    },

    dropdownbox: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginVertical: 8,
        backgroundColor: Color.DarkContainer,
        borderRadius: 8,
    },

    selected: {
        color: Color.Text,
    },

    iteminfo: {
        width: '100%',
        borderRadius: 8,
        backgroundColor: Color.Container,
        marginTop: 8,
        marginRight: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
})

type HordeModel = {
    name: string
    count: number
    performance: number
    queued: number
    jobs: number
    eta: number
    type: 'image' | 'text'
}

type HordeWorker = {
    type: 'image' | 'text'
    name: string
    id: string
    online: boolean
    requests_fulfilled: number
    kudos_rewards: number
    kudos_details: {
        generated: number
        uptime: number
    }
    performance: string
    threads: number
    uptime: number
    maintenance_mode: boolean
    paused: boolean
    info: string
    nsfw: boolean
    owner: string
    ipaddr: string
    trusted: boolean
    flagged: boolean
    suspicious: number
    uncompleted_jobs: number
    models: Array<string>
    forms: Array<string>
    team: {
        name: string
        id: string
    }
    contact: string
    bridge_agent: string
    max_pixels: number
    megapixelsteps_generated: number
    img2img: boolean
    painting: boolean
    'post-processing': boolean
    lora: boolean
    max_length: number
    max_context_length: number
    tokens_generated: number
}
