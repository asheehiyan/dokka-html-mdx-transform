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
    const displayed_sidebar = core.getInput("displayed_sidebar") || null
    const remove_jazzy_footer = core.getInput("remove_jazzy_footer") || "false"

    const docFunctions = platform == "android" ? new AndroidFunctions(src, dest, folder, output_path_prefix, displayed_sidebar) : new IOSFunctions(src, dest, folder, output_path_prefix, displayed_sidebar, remove_jazzy_footer)
    

    const moduleCategories = []
    for (module of modules) {
        const [packageHierarchy, packageMap] = docFunctions.generateModule(module)
        const categories = docFunctions.generateCategoriesRec(packageHierarchy, packageMap, "", "")
        moduleCategories.push({
            type: "category",
            label: module,
            items: categories
        })
    }

    fs.outputFileSync(path.join(dest, folder, "sidebar.json"), JSON.stringify(moduleCategories))

} catch (error) {
    core.setFailed(error.message)
}