import * as DocumentPicker from 'expo-document-picker'
import * as FS from 'expo-file-system'
import { Logger } from './Logger'
import { db } from '@db'
import { eq } from 'drizzle-orm'
import { instructs } from 'db/schema'

export namespace Instructs {
    export const loadFile = async (name: string) => {
        return FS.readAsStringAsync(`${FS.documentDirectory}instruct/${name}.json`, {
            encoding: FS.EncodingType.UTF8,
        })
    }

    export const saveFile = async (name: string, preset: InstructType) => {
        return FS.writeAsStringAsync(
            `${FS.documentDirectory}instruct/${name}.json`,
            JSON.stringify(preset),
            { encoding: FS.EncodingType.UTF8 }
        )
    }

    export const deleteFile = async (name: string) => {
        return FS.deleteAsync(`${FS.documentDirectory}instruct/${name}.json`)
    }

    export const getFileList = async () => {
        return FS.readDirectoryAsync(`${FS.documentDirectory}instruct`)
    }

    export const uploadFile = async () => {
        return DocumentPicker.getDocumentAsync({ type: 'application/json' }).then((result) => {
            if (result.canceled) return
            const name = result.assets[0].name.replace(`.json`, '')
            return FS.copyAsync({
                from: result.assets[0].uri,
                to: `${FS.documentDirectory}/instruct/${name}.json`,
            })
                .then(() => {
                    return FS.readAsStringAsync(`${FS.documentDirectory}/instruct/${name}.json`, {
                        encoding: FS.EncodingType.UTF8,
                    })
                })
                .then((file) => {
                    const filekeys = Object.keys(JSON.parse(file))
                    const correctkeys = Object.keys(defaultInstruct())
                    const samekeys = filekeys.every((element, index) => {
                        return element === correctkeys[index]
                    })
                    if (!samekeys) {
                        return FS.deleteAsync(`${FS.documentDirectory}/instruct/${name}.json`).then(
                            () => {
                                throw new TypeError(`JSON file has invalid format`)
                            }
                        )
                    } else return name
                })
                .catch((error) => Logger.log(`Failed to load: ${error.message}`, true))
        })
    }

    // db

    export const createDefaultInstruct = async () => {
        await createInstruct(defaultInstruct())
    }

    export const createInstruct = async (instruct: InstructType) => {
        await db.insert(instructs).values(instruct)
    }

    export const readInstruct = async (id: number) => {
        const instruct = await db.query.instructs.findFirst({
            where: eq(instructs.id, id),
        })
    }

    export const updateInstruct = async (id: number, instruct: InstructType) => {
        await db.update(instructs).set(instruct).where(eq(instructs.id, id))
    }

    export const deleteInstruct = async (id: number) => {
        await db.delete(instructs).where(eq(instructs.id, id))
    }

    export const defaultInstruct = (): InstructType => {
        return {
            system_prompt:
                "Write {{char}}'s next reply in a roleplay chat between {{char}} and {{user}}.",
            input_sequence: '### Instruction: ',
            output_sequence: '### Response: ',
            first_output_sequence: '',
            last_output_sequence: '',
            system_sequence_prefix: '### Instruction: ',
            system_sequence_suffix: '',
            stop_sequence: '',
            separator_sequence: '',
            wrap: false,
            macro: false,
            names: false,
            names_force_groups: false,
            activation_regex: '',
            name: 'Default',
        }
    }
}

export type InstructType = {
    system_prompt: string
    input_sequence: string
    output_sequence: string
    first_output_sequence: string
    last_output_sequence: string
    system_sequence_prefix: string
    system_sequence_suffix: string

    stop_sequence: string
    separator_sequence: string
    wrap: boolean
    macro: boolean
    names: boolean
    names_force_groups: boolean
    activation_regex: string
    name: string
}
