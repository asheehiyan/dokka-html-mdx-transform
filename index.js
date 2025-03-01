const path = require('path');
const fs = require('fs-extra');
const core = require('@actions/core');
const AndroidFunctions = require("./android");
const IOSFunctions = require("./ios");

try {
    const src = core.getInput("src")
    const dest = core.getInput("dest")
    const folder = core.getInput("folder")
    const modules = core.getMultilineInput("modules")
    const platform = core.getInput("platform") || "android"
    const output_path_prefix = core.getInput("output_path_prefix") || ""

    const docFunctions = platform == "android" ? new AndroidFunctions(src, dest, folder) : new IOSFunctions(src, dest, folder)
    

    const moduleCategories = []
    for (module of modules) {
        const [packageHierarchy, packageMap] = docFunctions.generateModule(module)
        const categories = docFunctions.generateCategoriesRec(packageHierarchy, packageMap, "", "")
        moduleCategories.push({
            type: "category",
            label: module,
            items: categories,
            link: {
                type: "generated-index",
                title: module,
                slug: path.join(folder, module).replace(/\\/g, "/")
            }
        })
    }

    fs.outputFileSync(path.join(dest, folder, "sidebar.json"), JSON.stringify(moduleCategories))

} catch (error) {
    core.setFailed(error.message)
}