/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/web-module-curator
 * License: MIT, see file 'LICENSE'
 */

const path = require('path')
const fs = require('fs')

module.exports = class Modrator {

    /**
     * Create the Modrator
     * @param projectRoot Your project root, mostly `__dirname`
     * @param props Configuration properties
     */
    constructor(projectRoot = __dirname, props = {}) {
        this.projectRoot = projectRoot
        this.props = {
            nodeModulesPath: path.resolve(__dirname, '../../'), // path to `node_modules`
            webModulesFolder: "web_modules", // library folder where the module sources are linked/copied to
            mode: "copy" // set to "symlink" to symlink sources instead of copying
        }
        Object.assign(this.props, props)
        if (!fs.existsSync(this.props.webModulesFolder)) {
            console.log("mkdir", this.props.webModulesFolder)
            fs.mkdirSync(this.props.webModulesFolder)
        }
    }

    /**
     * Add the modules of a project to the library
     * @param projectName Name of the project
     * @param projectSourceRoot The source root inside the module folder
     * @param fileOrFolder The module source folder or file inside the 'projectSourceRoot'
     */
    addProject(projectName, projectSourceRoot = "src", fileOrFolder = projectName) {
        let type = "dir"
        if (fileOrFolder.endsWith(".js")) {
            type = "file"
        }
        try {
            const fromAbsolute = this.props.nodeModulesPath + "/" + projectName + "/" + projectSourceRoot + "/" + fileOrFolder
            if (!fs.existsSync(fromAbsolute)) {
                console.error("Not found: " + fromAbsolute)
            }
            const fromRelative = path.relative(this.projectRoot + "/" + this.props.webModulesFolder, fromAbsolute)
            const toRelative = "./" + this.props.webModulesFolder + "/" + fileOrFolder
            console.log("Adding", fromRelative, "=>", toRelative, "(" + type + ")")
            if (fs.existsSync(toRelative)) {
                this.deleteSync(toRelative)
            }
            if (this.props.mode === "copy") {
                this.copySync(fromAbsolute, toRelative)
            } else if (this.props.mode === "symlink") {
                fs.symlinkSync(fromRelative, toRelative, type)
            } else {
                console.error("Unknown mode", this.props.mode)
            }
        } catch (e) {
            console.error(e.message)
        }
    }

    /**
     * Recursive copy a folder or file
     * @param source
     * @param destination
     */
    copySync(source, destination) {
        const exists = fs.existsSync(source)
        const stats = exists && fs.statSync(source)
        if (stats.isDirectory()) {
            fs.mkdirSync(destination)
            fs.readdirSync(source).forEach((childItemName) => {
                this.copySync(path.join(source, childItemName), path.join(destination, childItemName))
            })
        } else {
            fs.copyFileSync(source, destination)
        }
    }

    /**
     * Recursive delete a folder or file
     * @param path
     */
    deleteSync(path) {
        const exists = fs.existsSync(path)
        const stats = exists && fs.lstatSync(path)
        if (stats.isDirectory() && !stats.isSymbolicLink()) {
            fs.readdirSync(path).forEach((file) => {
                var curPath = path + "/" + file
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteSync(curPath)
                } else {
                    fs.unlinkSync(curPath)
                }
            })
            fs.rmdirSync(path)
        } else {
            fs.unlinkSync(path)
        }
    }

}