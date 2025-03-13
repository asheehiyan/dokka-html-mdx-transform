class DocFunctions {

    constructor(src, dest, folder, output_path_prefix, displayed_sidebar) {
        this.src = src
        this.dest = dest
        this.folder = folder
        this.output_path_prefix = output_path_prefix
        this.displayed_sidebar = displayed_sidebar
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

module.exports = {
    DocFunctions
};