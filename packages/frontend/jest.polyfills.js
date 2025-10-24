// jest.polyfills.js

// Polyfill for TextEncoder and TextDecoder
import { TextEncoder, TextDecoder } from 'util'

// Make them globally available
Object.assign(global, { TextDecoder, TextEncoder })

// Polyfill for crypto.randomUUID if needed
if (!global.crypto) {
    global.crypto = {}
}

if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0
            const v = c === 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
    }
}

// Polyfill for structuredClone if needed
if (!global.structuredClone) {
    global.structuredClone = (obj) => {
        return JSON.parse(JSON.stringify(obj))
    }
}

// Mock for URL.createObjectURL
if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = jest.fn(() => 'mocked-url')
}

if (!global.URL.revokeObjectURL) {
    global.URL.revokeObjectURL = jest.fn()
}