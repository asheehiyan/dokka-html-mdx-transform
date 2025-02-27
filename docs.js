class DocFunctions {

    constructor(src, dest, folder, package) {
        this.src = src
        this.dest = dest
        this.folder = folder
        this.package = package
    }

    transformFile(file) {
        return {
            type: "doc",
            id: "foo",
            label: "bar"
        }
    }

    generateForDir(dir) {
        return {
            type: "category",
            label: "Generated Label",
            link: {
                type: "doc",
                id: "generated-id"
            },
            items: []
        }
    }

    generateModule(module) {
        return []
    }

    joinParts(old, newPart) {
        if (old) {
            return `${old}.${newPart}`
        } else {
            return newPart
        }
    }
}