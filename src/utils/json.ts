export const safeStringify = (value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number) => {
    try {
        return JSON.stringify(value, replacer, space);
    }catch (err) {
        return null;
    }
}
