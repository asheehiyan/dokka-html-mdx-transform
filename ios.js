const path = require('path');
const fs = require('fs-extra')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { DocFunctions } = require("./docs");

class IOSFunctions extends DocFunctions {

    constructor(src, dest, folder, output_path_prefix) {
        super(src, dest, folder, output_path_prefix)
    }

    transformFile(file) {
        const content = fs.readFileSync(file)
        const dom = new JSDOM(content).window.document
        const mainContent = dom.querySelector(".main-content")
        const name = path.basename(file, '.html')
        for (let a of mainContent.querySelectorAll("a")) {
            const href = a.getAttribute("href")
            if (href && !href.startsWith("http")) {
                a.setAttribute("href", href.replace(/\.html/, ""))
            }
        }
        const newString = mainContent.innerHTML
        const withoutEnding = path.basename(file).replace(".html", "")
        const newHtmlPath = path.join(this.dest, this.folder, path.relative(this.src, path.dirname(file)), withoutEnding + ".source")
        const newMdxPath = path.join(this.dest, this.folder, path.relative(this.src, path.dirname(file)), withoutEnding + ".mdx")
        fs.outputFileSync(newHtmlPath, newString)
        fs.outputFileSync(newMdxPath, `
import JazzyComponent from "@site/src/components/JazzyComponent"
import sourceHTML from './${withoutEnding}.source'

<JazzyComponent dokkaHTML={sourceHTML}/>
        `)

        console.log(`transformed file: ${file} -> ${this.output_path_prefix + path.join(this.folder, path.relative(this.src, path.dirname(file)), withoutEnding).replace(/\\/g, "/")}`)
        console.log(`\tname: ${name}`)
        return {
            type: "doc",
            id: this.output_path_prefix + path.join(this.folder, path.relative(this.src, path.dirname(file)), withoutEnding).replace(/\\/g, "/"),
            label: name
        }
    }

    generateForDir(dir) {
        console.log(`generating for dir: ${dir}`)
        const dirName = path.dirname(dir)
        console.log(`dirName: ${dirName}`)
        const displayName = dirName.substring(dirName.lastIndexOf(path.sep) + 1)
        console.log(`displayName: ${displayName}`)
        const subdirs = []
        const files = []
        for (const subdir of fs.readdirSync(dir)) {
            console.log(`\tchecking subdir: ${subdir}`)
            const subdirPath = path.join(dir, subdir)
            if (fs.statSync(subdirPath).isDirectory()) {
                subdirs.push(subdirPath)
            } else {
                files.push(subdirPath)
            }
        }
        
        const items = [
            ...subdirs.map(subdir => this.generateForDir(subdir)),
            ...files.map(file => this.transformFile(file))
        ]

        console.log(`Generated for dir ${dir}: ${JSON.stringify(items)}`)

        return {
            type: "category",
            label: displayName,
            items: items
        }
    }

    generateModule(module) {
        console.log(`generating module: ${module}`)
        const packageHierarchy = {}
        const packageMap = {}

        packageMap[module] = {
            type: "category",
            label: module,
            items: []
        }

        const modulePath = path.join(this.src, module)
        for (const pckg of fs.readdirSync(modulePath)) {
            const packagePath = path.join(modulePath, pckg)
            if (fs.statSync(packagePath).isDirectory()) {
                if (pckg == "scripts") {
                    continue
                }
                const generated = this.generateForDir(packagePath)
                const packageStructure = generated.label.split(".")
                let currentMap = packageHierarchy
                for (const packagePart of packageStructure) {
                    if (currentMap[packagePart] == undefined) {
                        currentMap[packagePart] = {}
                    }
                    currentMap = currentMap[packagePart]
                }
                packageMap[generated.label] = generated
            } else {
                const generated = this.transformFile(packagePath)
                console.log(`generated: ${JSON.stringify(generated)} for ${packagePath}`)
                packageHierarchy[generated.label] = {}
                packageMap[generated.label] = generated
            }
        }

        console.log(`Generated module: ${JSON.stringify([packageHierarchy, packageMap])}`)
        return [packageHierarchy, packageMap]
    }

    generateCategoriesRec(packageHierarchy, packageMap, localName, globalName) {
        console.log(`generating categories rec: ${JSON.stringify(packageHierarchy)}, ${JSON.stringify(packageMap)}, ${localName}, ${globalName}`)
        const items = []
        let sidebarElement = null
        if (globalName in packageMap) {
            sidebarElement = packageMap[globalName]
            sidebarElement.label = localName
            localName = ""
        }
        for (const newPart in packageHierarchy) {
            items.push(...this.generateCategoriesRec(packageHierarchy[newPart], packageMap, this.joinParts(localName, newPart), this.joinParts(globalName, newPart)))
        }

        if (sidebarElement != null) {
            if (sidebarElement.items != null) {
                sidebarElement.items = [...sidebarElement.items, ...items]
            } else if (items.length > 0) {
                sidebarElement.items = items
            }
            console.log(`returning sidebar element: ${JSON.stringify(sidebarElement)}`)
            return [sidebarElement]
        } else {
            console.log(`returning items: ${JSON.stringify(items)}`)
            return items
        }
    }
}

module.exports = IOSFunctions