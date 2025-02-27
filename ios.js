const path = require('path');
const fs = require('fs-extra')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { DocFunctions } = require("./docs");

class IOSFunctions extends DocFunctions {

    constructor(src, dest, folder) {
        super(src, dest, folder)
    }

    transformFile(file) {
        const content = fs.readFileSync(file)
        const dom = new JSDOM(content).window.document
        const mainContent = dom.querySelector(".main-content")
        const name = file.replace(/\.html/, "")
        for (let a of mainContent.querySelectorAll("a")) {
            const href = a.getAttribute("href")
            if (href && !href.startsWith("http")) {
                a.setAttribute("href", href.replace(/\.html/, "-"))
            }
        }
        const newString = mainContent.innerHTML
        const withoutEnding = path.basename(file).replace(".html", "-")
        const newHtmlPath = path.join(this.dest, this.folder, path.relative(this.src, path.dirname(file)), withoutEnding + ".source")
        const newMdxPath = path.join(this.dest, this.folder, path.relative(this.src, path.dirname(file)), withoutEnding + ".mdx")
        fs.outputFileSync(newHtmlPath, newString)
        fs.outputFileSync(newMdxPath, `
import DokkaComponent from "@graphglue/dokka-docusaurus"
import sourceHTML from './${withoutEnding}.source'

# ${name}

<DokkaComponent dokkaHTML={sourceHTML}/>
        `)
        return {
            type: "doc",
            id: path.join(this.folder, path.relative(this.src, path.dirname(file)), withoutEnding).replace(/\\/g, "/"),
            label: name
        }
    }

    generateForDir(dir) {
        const subdirs = []
        const files = []
        let indexPath = null
        for (const subdir of fs.readdirSync(dir)) {
            const subdirPath = path.join(dir, subdir)
            if (fs.statSync(subdirPath).isDirectory()) {
                subdirs.push(subdirPath)
            } else {
                if (subdir == `${subdir}.html`) {
                    indexPath = subdirPath
                } else {
                    files.push(subdirPath)
                }
            }
        }
        if (!indexPath) {
            throw new Error("no index found: " + dir)
        }
        const index = this.transformFile(indexPath)
        const items = [
            ...subdirs.map(subdir => this.generateForDir(subdir)),
            ...files.map(file => this.transformFile(file))
        ]
        return {
            type: "category",
            label: index.label,
            link: {
                type: "doc",
                id: index.id
            },
            items: items
        }
    }

    generateModule(module) {
        const packageHierarchy = {}
        const packageMap = {}
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
            }
        }
        return [packageHierarchy, packageMap]
    }

    generateCategoriesRec(packageHierarchy, packageMap, localName, globalName) {
        const items = []
        let sidebarElement = null
        if (globalName in packageMap) {
            sidebarElement = packageMap[globalName]
            sidebarElement.label = localName
            sidebarElement.className = "sidebar-package-title"
            localName = ""
        }
        for (const newPart in packageHierarchy) {
            items.push(...this.generateCategoriesRec(packageHierarchy[newPart], packageMap, this.joinParts(localName, newPart), this.joinParts(globalName, newPart)))
        }
        if (sidebarElement != null) {
            sidebarElement.items = [...sidebarElement.items, ...items]
            return [sidebarElement]
        } else {
            return items
        }
    }
}

module.exports = IOSFunctions