const path = require('path');
const fs = require('fs-extra');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { DocFunctions } = require("./docs");

class AndroidFunctions extends DocFunctions {
    constructor(src, dest, folder, output_path_prefix) {
        super(src, dest, folder, output_path_prefix);
    }

    transformFile(file) {
        const content = fs.readFileSync(file)
        const dom = new JSDOM(content).window.document
        const mainContent = dom.getElementById("content")
        const breadcrums = mainContent.querySelector(".breadcrumbs")
        const name = breadcrums.querySelector(":last-child").textContent
        mainContent.removeChild(breadcrums)
        const cover = mainContent.querySelector(".cover")
        const coverHeader = cover.querySelector(".cover")
        cover.removeChild(coverHeader)
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
            id: this.output_path_prefix + path.join(this.folder, path.relative(this.src, path.dirname(file)), withoutEnding).replace(/\\/g, "/"),
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
                if (subdir == "index.html") {
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

module.exports = AndroidFunctions